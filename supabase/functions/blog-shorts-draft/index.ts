// Discord 슬래시 명령 → blog 초안 저장 (DO-94).
//   /short [text]  → shorts 초안. text를 비우면 여러 줄 입력 창(모달)을 띄운다.
//   /draft text    → /short와 같다 (예전 명령, 호환용)
//   /post          → 입력 창(모달)에서 제목·본문을 받아 posts 초안
// Discord 개발자 포털의 Interactions Endpoint URL이 이 함수 주소라 함수 이름은 그대로 둔다.
// verify_jwt=false로 배포한다 (Discord는 JWT를 보내지 않고, 대신 Ed25519 서명을 검증한다).
// 명령 등록은 같은 폴더의 register-commands.sh로 한다.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nacl from "https://esm.sh/tweetnacl@1.0.3";

// 모달 안의 입력 칸. 예전 방식(type 1 행 안의 type 4)과 새 방식(type 18 Label 안의 component) 모두 받는다.
type ModalField = {
  type: number;
  custom_id?: string;
  value?: string;
  component?: ModalField;
  components?: ModalField[];
};

type DiscordInteraction = {
  type: number; // 1 = PING, 2 = APPLICATION_COMMAND, 5 = MODAL_SUBMIT
  data?: {
    name?: string; // 슬래시 명령 이름
    options?: Array<{ name: string; value: string }>;
    custom_id?: string; // 모달 ID
    components?: ModalField[];
  };
  member?: { user?: { id: string } }; // 서버 채널에서 보낸 경우
  user?: { id: string }; // DM에서 보낸 경우
};

// 명령을 쓸 수 있는 사람 (blog 주인의 Discord 사용자 ID, 비밀값 아님)
const OWNER_ID = "903841582971756544";
const DESK = "https://blog.dowha.kim/desk/edit";
const SHORT_MAX = 280;
const TITLE_MAX = 200;
const BODY_MAX = 4000; // Discord 모달 입력 칸 한도

const MODAL_SHORT = "short_draft";
const MODAL_POST = "post_draft";

function codepointLen(str: string) {
  return Array.from(str).length;
}

// 표기 규칙: 둥근 따옴표는 곧은 따옴표로 (/desk 저장과 같게)
function normalizeQuotes(s: string) {
  return s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
}

function hexToUint8(hex: string) {
  const clean = hex.trim();
  const m = clean.match(/.{1,2}/g);
  if (!m) return new Uint8Array();
  return new Uint8Array(m.map((b) => parseInt(b, 16)));
}

function json200(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function reply(content: string, ephemeral = false) {
  // flags 64 = 보낸 사람에게만 보이는 응답
  return json200({ type: 4, data: { content, ...(ephemeral ? { flags: 64 } : {}) } });
}

function pong() {
  // Discord Endpoint URL 검증용: 정확히 이 바디가 필요
  return new Response('{"type":1}', {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function textInput(
  id: string,
  label: string,
  style: 1 | 2, // 1 = 한 줄, 2 = 여러 줄
  maxLength: number,
  required: boolean,
) {
  return {
    type: 1,
    components: [
      { type: 4, custom_id: id, label, style, max_length: maxLength, required },
    ],
  };
}

function modal(customId: string, title: string, rows: unknown[]) {
  return json200({ type: 9, data: { custom_id: customId, title, components: rows } });
}

// 모달 제출값에서 custom_id별 입력값을 모은다
function modalValues(fields: ModalField[] = []) {
  const out: Record<string, string> = {};
  const walk = (list: ModalField[]) => {
    for (const f of list) {
      if (f.custom_id && typeof f.value === "string") out[f.custom_id] = f.value;
      if (f.component) walk([f.component]);
      if (f.components) walk(f.components);
    }
  };
  walk(fields);
  return out;
}

async function verifyDiscord(req: Request, rawBody: string) {
  const signature = req.headers.get("x-signature-ed25519") ?? "";
  const timestamp = req.headers.get("x-signature-timestamp") ?? "";
  const publicKey = (Deno.env.get("DISCORD_PUBLIC_KEY") ?? "").trim();

  if (!signature || !timestamp || !publicKey) return false;

  const msg = new TextEncoder().encode(timestamp + rawBody);
  return nacl.sign.detached.verify(
    msg,
    hexToUint8(signature),
    hexToUint8(publicKey),
  );
}

function db() {
  const supabaseUrl = (Deno.env.get("SUPABASE_URL") ?? "").trim();
  const serviceRoleKey = (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "").trim();
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey);
}

async function saveShort(raw: string) {
  const text = normalizeQuotes(raw.trim());
  if (!text) return reply("내용이 비어 있어요.");
  if (codepointLen(text) > SHORT_MAX) {
    return reply(`${SHORT_MAX}자를 넘었어요. 줄여서 다시 보내 주세요.`);
  }
  const supabase = db();
  if (!supabase) return reply("서버 설정 누락(SUPABASE_URL/서비스키).");

  const { data, error } = await supabase
    .from("shorts")
    .insert({ content: text, is_published: false })
    .select("id")
    .single();
  if (error) {
    console.log("db error shorts", error.code);
    return reply("Shorts 저장 실패. (테이블/제약조건/컬럼 확인)");
  }
  return reply(`✍️ Shorts 초안 저장 완료\n${DESK}?type=short&id=${data.id}`);
}

async function savePost(rawTitle: string, rawBody: string) {
  const title = normalizeQuotes(rawTitle.trim());
  const content = normalizeQuotes(rawBody.trim());
  if (!title) return reply("제목이 비어 있어요.");
  const supabase = db();
  if (!supabase) return reply("서버 설정 누락(SUPABASE_URL/서비스키).");

  // slug는 비워 둔다(null 허용, UNIQUE). 발행 전에 /desk에서 채운다.
  const { data, error } = await supabase
    .from("posts")
    .insert({ title, content, is_published: false, is_external: false })
    .select("id")
    .single();
  if (error) {
    console.log("db error posts", error.code);
    return reply("글 저장 실패. (테이블/제약조건/컬럼 확인)");
  }
  return reply(`📝 글 초안 저장 완료: ${title}\n${DESK}?id=${data.id}`);
}

Deno.serve(async (req) => {
  // 브라우저 확인용
  if (req.method === "GET") return new Response("ok", { status: 200 });
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  // 요청 원문에는 초안 내용·사용자 정보·interaction 토큰이 있어 로그에 남기지 않는다
  const rawBody = await req.text();

  // 1) Discord 서명 검증
  if (!(await verifyDiscord(req, rawBody))) {
    console.log("sig invalid");
    return new Response("Invalid signature", { status: 401 });
  }

  // 2) Payload 파싱
  let payload: DiscordInteraction;
  try {
    payload = JSON.parse(rawBody) as DiscordInteraction;
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  const name = payload.data?.name ?? payload.data?.custom_id ?? "";
  console.log("interaction", payload.type, name);

  // 3) PING -> PONG
  if (payload.type === 1) return pong();

  // 4) 서명은 Discord에서 온 요청임만 보장하므로, 보낸 사람이 주인인지 따로 확인한다
  const invokerId = payload.member?.user?.id ?? payload.user?.id;
  if (invokerId !== OWNER_ID) {
    console.log("forbidden invoker");
    return reply("권한이 없습니다.", true);
  }

  // 5) 슬래시 명령
  if (payload.type === 2) {
    const text = payload.data?.options?.find((o) => o.name === "text")?.value ?? "";

    if (name === "short" || name === "draft") {
      if (text.trim()) return saveShort(text);
      return modal(MODAL_SHORT, "Shorts 초안", [
        textInput("text", "내용", 2, SHORT_MAX, true),
      ]);
    }

    if (name === "post") {
      return modal(MODAL_POST, "글 초안", [
        textInput("title", "제목", 1, TITLE_MAX, true),
        textInput("body", "본문 (마크다운)", 2, BODY_MAX, false),
      ]);
    }
  }

  // 6) 모달 제출
  if (payload.type === 5) {
    const v = modalValues(payload.data?.components);
    if (name === MODAL_SHORT) return saveShort(v.text ?? "");
    if (name === MODAL_POST) return savePost(v.title ?? "", v.body ?? "");
  }

  return reply("지원하지 않는 요청입니다.", true);
});
