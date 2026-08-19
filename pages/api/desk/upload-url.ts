import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { OWNER_EMAIL } from '@/components/desk/useOwner'
import { createThumbnailUpload } from '@/lib/storage'
import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_BYTES, type SignedUpload } from '@/lib/upload'

type Body = { slug?: unknown; contentType?: unknown; size?: unknown }

/**
 * /desk 에디터용 표지 업로드 서명 발급.
 * 이 엔드포인트가 열려 있으면 누구나 버킷에 쓸 수 있으므로 소유자 검증이 필수다.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SignedUpload | { error: string }>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'POST만 허용됩니다.' })
  }

  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (!token) return res.status(401).json({ error: '로그인이 필요합니다.' })

  // anon 키 + 사용자 액세스 토큰으로 신원만 확인한다(서비스 롤 키는 쓰지 않음).
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
  const { data, error } = await supabase.auth.getUser(token)
  if (error || data.user?.email !== OWNER_EMAIL) {
    return res.status(401).json({ error: '접근 권한이 없습니다.' })
  }

  const { slug, contentType, size } = (req.body ?? {}) as Body
  if (typeof slug !== 'string' || !slug.trim()) {
    return res.status(400).json({ error: 'slug가 필요합니다.' })
  }
  if (typeof contentType !== 'string' || !ALLOWED_IMAGE_TYPES[contentType]) {
    return res.status(400).json({ error: 'jpg·png·webp·avif 이미지만 올릴 수 있습니다.' })
  }
  if (typeof size !== 'number' || !Number.isFinite(size) || size <= 0 || size > MAX_UPLOAD_BYTES) {
    return res.status(400).json({ error: '이미지 크기는 5MB 이하여야 합니다.' })
  }

  try {
    return res.status(200).json(await createThumbnailUpload({ slug, contentType }))
  } catch (e) {
    const message = e instanceof Error ? e.message : '서명 발급에 실패했습니다.'
    console.error('upload-url 오류:', message)
    return res.status(500).json({ error: message })
  }
}
