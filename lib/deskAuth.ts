import type { NextApiRequest } from 'next'
import { createClient } from '@supabase/supabase-js'
import { OWNER_EMAIL } from '@/components/desk/useOwner'

/**
 * /desk용 API 라우트의 소유자 검증.
 * anon 키 + 요청의 사용자 액세스 토큰으로 신원만 확인한다(서비스 롤 키는 쓰지 않음).
 * 실패 시 응답에 쓸 에러 메시지를, 성공 시 null을 돌려준다.
 */
export async function verifyOwner(req: NextApiRequest): Promise<string | null> {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (!token) return '로그인이 필요합니다.'
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
  const { data, error } = await supabase.auth.getUser(token)
  if (error || data.user?.email !== OWNER_EMAIL) return '접근 권한이 없습니다.'
  return null
}
