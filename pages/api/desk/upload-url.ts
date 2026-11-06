import type { NextApiRequest, NextApiResponse } from 'next'
import { verifyOwner } from '@/lib/deskAuth'
import { createThumbnailUpload } from '@/lib/storage'
import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_BYTES, type SignedUpload } from '@/lib/upload'

type Body = { filename?: unknown; slug?: unknown; contentType?: unknown; size?: unknown }

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

  const authError = await verifyOwner(req)
  if (authError) return res.status(401).json({ error: authError })

  const { filename, slug, contentType, size } = (req.body ?? {}) as Body
  if (typeof slug !== 'string' || !slug.trim()) {
    return res.status(400).json({ error: 'slug가 필요합니다.' })
  }
  if (typeof filename !== 'string' || !filename.trim()) {
    return res.status(400).json({ error: '파일명이 필요합니다.' })
  }
  if (typeof contentType !== 'string' || !ALLOWED_IMAGE_TYPES[contentType]) {
    return res.status(400).json({ error: 'jpg·png·webp·avif 이미지만 올릴 수 있습니다.' })
  }
  if (typeof size !== 'number' || !Number.isFinite(size) || size <= 0 || size > MAX_UPLOAD_BYTES) {
    return res.status(400).json({ error: '이미지 크기는 5MB 이하여야 합니다.' })
  }

  try {
    return res.status(200).json(await createThumbnailUpload({ filename, slug, contentType }))
  } catch (e) {
    const message = e instanceof Error ? e.message : '서명 발급에 실패했습니다.'
    console.error('upload-url 오류:', message)
    return res.status(500).json({ error: message })
  }
}
