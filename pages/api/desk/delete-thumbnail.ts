import type { NextApiRequest, NextApiResponse } from 'next'
import { verifyOwner } from '@/lib/deskAuth'
import { supabase } from '@/supabase'
import { deleteThumbnail, thumbnailKeyFromUrl } from '@/lib/storage'

type Result = { deleted: boolean; reason?: string } | { error: string }

/**
 * /desk에서 책을 삭제한 뒤 그 책의 표지를 버킷에서 지운다.
 * 책 행을 먼저 지운 다음 호출하며, 다른 책이 같은 표지를 쓰고 있으면 남겨 둔다.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse<Result>) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'POST만 허용됩니다.' })
  }

  const authError = await verifyOwner(req)
  if (authError) return res.status(401).json({ error: authError })

  const url = (req.body ?? {}).url
  if (typeof url !== 'string' || !url.trim()) return res.status(400).json({ error: 'url이 필요합니다.' })

  try {
    const key = thumbnailKeyFromUrl(url.trim())
    if (!key) return res.status(200).json({ deleted: false, reason: '업로드한 표지가 아님' })

    // books는 공개 읽기라 anon 클라이언트로 공유 여부를 확인할 수 있다
    const { count, error } = await supabase
      .from('books')
      .select('id', { count: 'exact', head: true })
      .eq('thumbnail', url.trim())
    if (error) throw new Error(error.message)
    if (count) return res.status(200).json({ deleted: false, reason: '다른 책이 사용 중' })

    await deleteThumbnail(key)
    return res.status(200).json({ deleted: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : '표지 삭제에 실패했습니다.'
    console.error('delete-thumbnail 오류:', message)
    return res.status(500).json({ error: message })
  }
}
