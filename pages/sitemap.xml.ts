import type { GetServerSideProps } from 'next'
import { supabase } from '@/supabase'

/**
 * 동적 사이트맵. /desk에서 발행한 글이 배포 없이 바로 포함되도록 요청 시 DB에서 만든다.
 * CDN에 1시간 캐시하고, 만료 후에도 하루 동안은 이전 본을 주면서 백그라운드로 갱신한다.
 */
const SITE = 'https://blog.dowha.kim'

type Entry = { loc: string; lastmod?: string | null; priority: number }

const STATIC_PAGES: Entry[] = [
  { loc: '/', priority: 1.0 },
  { loc: '/writings', priority: 0.7 },
  { loc: '/books', priority: 0.7 },
  { loc: '/records', priority: 0.7 },
  { loc: '/series', priority: 0.7 },
  { loc: '/shorts', priority: 0.7 },
]

const escapeXml = (s: string) =>
  s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]!)

const toXml = (entries: Entry[]) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries
    .map(({ loc, lastmod, priority }) =>
      [
        '<url>',
        `<loc>${escapeXml(SITE + (loc === '/' ? '' : loc))}</loc>`,
        lastmod ? `<lastmod>${new Date(lastmod).toISOString()}</lastmod>` : '',
        '<changefreq>weekly</changefreq>',
        `<priority>${priority.toFixed(1)}</priority>`,
        '</url>',
      ].join('')
    )
    .join('\n')}\n</urlset>\n`

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  // 공개 페이지가 실제로 존재하는 항목만 넣는다(각 상세 페이지의 공개 조건과 동일).
  const [posts, books, series] = await Promise.all([
    supabase
      .from('posts')
      .select('slug, created_at, updated_at')
      .eq('is_published', true)
      .eq('is_external', false)
      .not('slug', 'is', null)
      .order('created_at', { ascending: false }),
    // books는 리뷰(content)가 있어야 상세 페이지가 열린다.
    supabase
      .from('books')
      .select('slug, created_at')
      .not('content', 'is', null)
      .not('slug', 'is', null)
      .order('created_at', { ascending: false }),
    supabase.from('series').select('slug').eq('is_published', true).not('slug', 'is', null),
  ])

  const error = posts.error || books.error || series.error
  if (error) {
    // 빈 사이트맵을 캐시하면 색인에서 빠질 수 있으므로 에러로 응답하고 캐시하지 않는다.
    console.error('sitemap 오류:', error.message)
    res.statusCode = 500
    res.setHeader('Cache-Control', 'no-store')
    res.end()
    return { props: {} }
  }

  const entries: Entry[] = [
    ...STATIC_PAGES,
    ...(posts.data ?? []).map((p) => ({
      loc: `/posts/${encodeURIComponent(p.slug as string)}`,
      lastmod: (p.updated_at as string | null) ?? (p.created_at as string),
      priority: 0.5,
    })),
    ...(books.data ?? []).map((b) => ({
      loc: `/books/${encodeURIComponent(b.slug as string)}`,
      lastmod: b.created_at as string,
      priority: 0.5,
    })),
    ...(series.data ?? []).map((s) => ({
      loc: `/series/${encodeURIComponent(s.slug as string)}`,
      priority: 0.7,
    })),
  ]

  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
  res.end(toXml(entries))
  return { props: {} }
}

// 응답은 getServerSideProps에서 직접 쓰므로 렌더링할 내용이 없다.
export default function Sitemap() {
  return null
}
