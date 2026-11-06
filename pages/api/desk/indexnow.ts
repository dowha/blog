import type { NextApiRequest, NextApiResponse } from 'next'
import { verifyOwner } from '@/lib/deskAuth'
import { INDEXNOW_KEY, SITE_HOST, isNotifiablePath } from '@/lib/indexnow'

type Result = { revalidated: string[]; failed: string[]; indexnow: number } | { error: string }

/**
 * /desk 저장 후 호출: 바뀐 공개 페이지를 즉시 재생성(on-demand ISR)하고 IndexNow로 알린다.
 * 재생성을 먼저 해야 검색엔진이 바로 와도 최신 내용을 받는다.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse<Result>) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'POST만 허용됩니다.' })
  }
  const authError = await verifyOwner(req)
  if (authError) return res.status(401).json({ error: authError })

  const raw = (req.body ?? {}).paths
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 20) {
    return res.status(400).json({ error: 'paths는 1~20개의 경로 배열이어야 합니다.' })
  }
  const paths = Array.from(new Set(raw.filter((p): p is string => typeof p === 'string' && isNotifiablePath(p))))
  if (!paths.length) return res.status(400).json({ error: '알림 가능한 경로가 없습니다.' })

  // 1) 재생성. 정적 생성 페이지가 아닌 경로(/shorts 등)나 비공개로 바뀐 글은 실패할 수 있어 개별로 처리한다.
  const revalidated: string[] = []
  const failed: string[] = []
  await Promise.all(
    paths.map(async (p) => {
      try {
        await res.revalidate(p)
        revalidated.push(p)
      } catch {
        failed.push(p)
      }
    })
  )

  // 2) IndexNow 알림. 200/202가 정상 접수.
  let status = 0
  try {
    const r = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: SITE_HOST,
        key: INDEXNOW_KEY,
        keyLocation: `https://${SITE_HOST}/${INDEXNOW_KEY}.txt`,
        urlList: paths.map((p) => `https://${SITE_HOST}${p === '/' ? '' : p}`),
      }),
    })
    status = r.status
    if (!r.ok) console.error('IndexNow 응답 오류:', r.status, await r.text())
  } catch (e) {
    console.error('IndexNow 요청 실패:', e instanceof Error ? e.message : e)
  }

  return res.status(200).json({ revalidated, failed, indexnow: status })
}
