import { supabase } from '@/supabase'
import RSS from 'rss'
import { NextApiRequest, NextApiResponse } from 'next'
import { toExcerpt } from '@/lib/excerpt'

const SITE = 'https://blog.dowha.kim'
const FEED_SIZE = 20
const EXCERPT_LENGTH = 300

// 요약은 HTML로 들어가므로 본문 텍스트의 특수문자를 이스케이프한다
const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 공개된 내부 글(외부 글 제외)
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('title, slug, created_at, content')
    .eq('is_published', true)
    .eq('is_external', false)
    .order('created_at', { ascending: false })
    .limit(FEED_SIZE)

  // 감상이 있는 책만
  const { data: books, error: booksError } = await supabase
    .from('books')
    .select('title, volumes, slug, created_at, content')
    .not('content', 'is', null)
    .order('created_at', { ascending: false })
    .limit(FEED_SIZE)

  if (postsError || booksError) {
    res.setHeader('Cache-Control', 'no-store')
    return res.status(500).json({ error: 'Failed to fetch RSS data' })
  }

  const feed = new RSS({
    title: "Dowha's Blog",
    description: '김도화의 블로그입니다. 이것저것 쓰고 싶은 글을 씁니다.',
    site_url: SITE,
    // 아이콘을 명시하지 않으면 일부 리더가 상위 도메인(dowha.kim)의 파란 파비콘을 가져간다
    image_url: `${SITE}/apple-touch-icon.png`,
    feed_url: `${SITE}/api/rss`,
    language: 'ko',
  })

  // 글과 책을 합쳐 최신순으로 FEED_SIZE개
  const allItems = [
    ...(posts || []).map((p) => ({ ...p, path: 'posts' })),
    // 책은 권수가 있으면 제목 뒤에 붙인다: 듄(1~6권)
    ...(books || []).map(({ volumes, ...b }) => ({
      ...b,
      title: volumes ? `${b.title}(${volumes})` : b.title,
      path: 'books',
    })),
  ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, FEED_SIZE)

  allItems.forEach((item) => {
    const url = `${SITE}/${item.path}/${item.slug}`
    // 구독 앱에서도 글의 앞부분을 읽고, 전체는 블로그에서 보도록 링크를 붙인다
    const excerpt = escapeHtml(toExcerpt(item.content || '', EXCERPT_LENGTH))
    feed.item({
      title: item.title,
      description: `<p>${excerpt}</p><p><a href="${url}">계속 읽기 →</a></p>`,
      url,
      guid: url,
      date: item.created_at,
    })
  })

  res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8')
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
  res.status(200).send(feed.xml())
}
