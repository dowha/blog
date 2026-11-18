// Discord /draft 슬래시 명령 → shorts 초안 저장.
// Discord 개발자 포털의 Interactions Endpoint URL이 이 함수 주소다.
// verify_jwt=false로 배포한다 (Discord는 JWT를 보내지 않고, 대신 Ed25519 서명을 검증한다).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nacl from "https://esm.sh/tweetnacl@1.0.3";

type DiscordInteraction = {
  type: number; // 1 = PING, 2 = APPLICATION_COMMAND
  data?: {
    name?: string;
    options?: Array<{ name: string; value: string }>;
  };
  member?: { user?: { id: string } }; // 서버 채널에서 보낸 경우
  user?: { id: string }; // DM에서 보낸 경우
};

// /draft를 쓸 수 있는 사람 (blog 주인의 Discord 사용자 ID, 비밀값 아님)
const OWNER_ID = "903841582971756544";

function codepointLen(str: string) {
  return Array.from(str).length;
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

function pong() {
  // Discord Endpoint URL 검증용: 정확히 이 바디가 필요
  return new Response('{"type":1}', {
    status: 200,
    headers: { "content-type": "application/json" },
  });
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
    hexToUint8(publicKey)
  );
}

Deno.serve(async (req) => {
  // 브라우저 확인용
  if (req.method === "GET") return new Response("ok", { status: 200 });
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  // 요청 원문에는 초안 내용·사용자 정보·interaction 토큰이 있어 로그에 남기지 않는다
  const rawBody = await req.text();

  // ✅ 1) Discord 서명 검증 (Endpoint 저장 단계에서도 이게 필요할 수 있음)
  const ok = await verifyDiscord(req, rawBody);
  if (!ok) {
    console.log("sig invalid");
    return new Response("Invalid signature", { status: 401 });
  }

  // ✅ 2) Payload 파싱
  let payload: DiscordInteraction;
  try {
    payload = JSON.parse(rawBody) as DiscordInteraction;
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  console.log("interaction", payload.type, payload.data?.name ?? "");

  // ✅ 3) PING -> PONG
  if (payload.type === 1) {
    return pong();
  }

  // ✅ 4) Slash Command: /draft (option: text)
  if (payload.type === 2 && payload.data?.name === "draft") {
    // 서명은 Discord에서 온 요청임만 보장하므로, 보낸 사람이 주인인지 따로 확인한다
    const invokerId = payload.member?.user?.id ?? payload.user?.id;
    if (invokerId !== OWNER_ID) {
      console.log("forbidden invoker");
      // flags 64 = 보낸 사람에게만 보이는 응답
      return json200({ type: 4, data: { content: "권한이 없습니다.", flags: 64 } });
    }

    const text =
      (payload.data?.options?.find((o) => o.name === "text")?.value ?? "").trim();

    if (!text) {
      return json200({ type: 4, data: { content: "내용이 비어있어요." } });
    }

    if (codepointLen(text) > 280) {
      return json200({
        type: 4,
        data: { content: "280자를 초과했어요. 줄여서 다시 보내주세요." },
      });
    }

    const supabaseUrl = (Deno.env.get("SUPABASE_URL") ?? "").trim();
    const serviceRoleKey = (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "").trim();
    if (!supabaseUrl || !serviceRoleKey) {
      return json200({
        type: 4,
        data: { content: "서버 설정 누락(SUPABASE_URL/서비스키)." },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data, error } = await supabase
      .from("shorts")
      .insert({ content: text, is_published: false })
      .select("id")
      .single();

    if (error) {
      console.log("db error", error);
      return json200({
        type: 4,
        data: { content: "저장 실패. (테이블/제약조건/RLS/컬럼 확인)" },
      });
    }

    return json200({
      type: 4,
      data: { content: `✍️ 초고 저장 완료\n- id: ${data.id}` },
    });
  }

  return json200({ type: 4, data: { content: "지원하지 않는 요청입니다." } });
});
