// Supabase Edge Function - Discord Notification
// content_likes AFTER INSERT 트리거(blog-content-like-bot)가 부른다. verify_jwt=true로 배포한다.
// 요청 본문은 신뢰하지 않는다: anon 키로도 호출할 수 있으므로 record.id만 받아
// DB에서 실제 박수 기록을 확인하고, notified_at으로 기록당 한 번만 알림을 보낸다.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const DISCORD_WEBHOOK_URL = Deno.env.get('DISCORD_WEBHOOK_URL')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

// 이 시간보다 오래된 기록은 알림 대상이 아니다(재전송 방지)
const MAX_AGE_MS = 5 * 60 * 1000

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  try {
    const payload = await req.json()
    const id = payload?.record?.id
    if (payload?.type !== 'INSERT' || typeof id !== 'string') {
      return new Response('Ignored', { status: 200 })
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!)

    // 0. [검증] 실제 존재하는 최근 기록이고 아직 알림 전인 경우에만 표시하고 진행 (원자적)
    const { data: record } = await supabase
      .from('content_likes')
      .update({ notified_at: new Date().toISOString() })
      .eq('id', id)
      .is('notified_at', null)
      .gt('created_at', new Date(Date.now() - MAX_AGE_MS).toISOString())
      .select('id, post_id, book_id, anonymous_id, user_agent, referrer, created_at')
      .maybeSingle()

    if (!record) {
      return new Response('Ignored', { status: 200 })
    }

    // 1. [조회] 게시글/책 제목 가져오기
    let title = '제목을 찾을 수 없음'
    let contentTypeKor = '알 수 없음'

    if (record.post_id) {
      contentTypeKor = 'Writings'
      const { data } = await supabase.from('posts').select('title').eq('id', record.post_id).single()
      if (data) title = data.title
    } else if (record.book_id) {
      contentTypeKor = 'Books'
      const { data } = await supabase.from('books').select('title').eq('id', record.book_id).single()
      if (data) title = data.title
    }

    // 2. [조회] 첫 응원 여부 확인 (익명 ID가 있을 때만)
    let isFirstTime = false;
    let visitCount = 0;

    if (record.anonymous_id) {
      const { count, error } = await supabase
        .from('content_likes')
        .select('*', { count: 'exact', head: true })
        .eq('anonymous_id', record.anonymous_id)

      if (!error && count !== null) {
        visitCount = count;
        if (count === 1) isFirstTime = true;
      }
    }

    // 3. 한국 시간(KST) 'YYYY-MM-DD HH:mm:ss'
    // ko-KR 형식('2026. 11. 6.')은 디스코드가 번호 목록으로 해석해 줄바꿈되므로 쓰지 않는다
    const kstTime = new Date(record.created_at).toLocaleString('sv-SE', {
      timeZone: 'Asia/Seoul',
      hour12: false,
    }) + ' (KST)';

    // 4. User Agent 파싱
    const ua = record.user_agent || '';
    let parsedUA = '정보 없음';
    if (ua) {
      let os = '기타 OS';
      if (ua.includes('iPhone')) os = 'iPhone';
      else if (ua.includes('iPad')) os = 'iPad';
      else if (ua.includes('Macintosh')) os = 'Mac';
      else if (ua.includes('Windows')) os = 'Windows';
      else if (ua.includes('Android')) os = 'Android';

      let browser = '기타 브라우저';
      if (ua.includes('Instagram')) browser = 'Instagram';
      else if (ua.includes('Kakaotalk')) browser = 'Kakaotalk';
      else if (ua.includes('Chrome') || ua.includes('CriOS')) browser = 'Chrome';
      else if (ua.includes('Safari')) browser = 'Safari';

      parsedUA = `${os} - ${browser}`;
    }

    const referrer = record.referrer || "직접 접속 / 알 수 없음"

    // 5. 디스코드 메시지 구성
    const TARGET_USER_ID = "903841582971756544"; // 알림을 받을 사용자 ID

    let discordTitle = `**${contentTypeKor}** 콘텐츠에 독자의 응원이 도착했습니다.`;
    let mentionMessage = `새로운 응원이 도착했습니다! <@${TARGET_USER_ID}>`;

    if (isFirstTime) {
      discordTitle = `🎉 **${contentTypeKor}** 콘텐츠에 **새로운 독자**가 첫 응원을 보냈습니다!`;
      mentionMessage = `**첫 독자**의 응원입니다! 확인해보세요 <@${TARGET_USER_ID}>`;
    } else if (visitCount > 0) {
      discordTitle += ` (누적 ${visitCount}번째)`;
    }

    const discordBody = {
      username: "ContentLikeBot",
      avatar_url: "https://em-content.zobj.net/source/apple/391/clapping-hands_1f44f.png",
      content: mentionMessage,
      // 멘션은 지정한 사용자만 허용 (referrer 등에 섞인 @everyone 방지)
      allowed_mentions: { users: [TARGET_USER_ID] },
      embeds: [
        {
          title: discordTitle,
          color: 16119260,
          fields: [
            { name: "콘텐츠 제목", value: title, inline: false },
            { name: "응원 시간", value: kstTime, inline: false },
            { name: "유입 경로", value: referrer.slice(0, 1000), inline: true },
            { name: "익명 ID (Anonymous)", value: `\`${record.anonymous_id || '없음'}\``, inline: true },
            { name: "접속 환경", value: parsedUA, inline: false }
          ]
        }
      ]
    }

    // 6. 전송
    if (DISCORD_WEBHOOK_URL) {
      await fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discordBody),
      })
    }

    return new Response("Success", { status: 200 })

  } catch (error) {
    return new Response(`Error: ${error.message}`, { status: 500 })
  }
})
