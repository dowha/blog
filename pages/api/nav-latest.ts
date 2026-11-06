import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/supabase'

const SECTIONS = ['writings', 'books', 'records', 'shorts'] as const
export type LatestSection = (typeof SECTIONS)[number]

/**
 * 메뉴 'N' 표시용: 새 게시물(records는 최신 수정)이 가장 최근인 섹션.
 * CDN에 10분 캐시해 방문자 수와 관계없이 DB 조회를 10분에 한 번 이하로 줄인다.
 */
export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse<{ section: LatestSection | null }>
) {
  const { data, error } = await supabase.rpc('latest_section')

  if (error) {
    res.setHeader('Cache-Control', 'no-store')
    return res.status(500).json({ section: null })
  }

  const section = SECTIONS.includes(data) ? (data as LatestSection) : null
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=3600')
  res.status(200).json({ section })
}
