import { supabase } from '@/supabase'
import RSS from 'rss'
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // ✅ Supabase에서 `is_published = true` && `is_external = false` 인 `posts` 데이터 가져오기
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('title, slug, created_at, content')
    .eq('is_published', true) // ✅ 공개된 글만
    .eq('is_external', false) // ✅ 외부 글 제외
    .order('created_at', { ascending: false }) // ✅ 최신순 정렬
    .limit(5) // ✅ 최신 5개만 가져오기

  // ✅ Supabase에서 `content`가 `null`이 아닌 `books` 데이터 가져오기
  const { data: books, error: booksError } = await supabase
    .from('books')
    .select('title, slug, created_at, content')
    .not('content', 'is', null) // ✅ 내용이 있는 책만 가져오기
    .order('created_at', { ascending: false }) // ✅ 최신순 정렬
    .limit(5) // ✅ 최신 5개만 가져오기

  if (postsError || booksError) {
    return res.status(500).json({ error: 'Failed to fetch RSS data' })
  }

  // ✅ RSS 피드 생성
  const feed = new RSS({
    title: "Dowha's Blog RSS Feed",
    description: 'Latest blog posts and book reviews',
    site_url: 'https://blog.dowha.kim',
    feed_url: 'https://blog.dowha.kim/api/rss',
    language: 'ko', // ✅ 한국어 설정
  })

  // ✅ `posts` + `books` 데이터를 합쳐서 최신순 정렬
  const allItems = [...(posts || []), ...(books || [])].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  allItems.forEach((item) => {
    const isPost = (posts || []).some((post) => post.slug === item.slug) // ✅ 해당 `slug`가 posts에 존재하는지 확인
    feed.item({
      title: item.title,
      description: item.content ? item.content.slice(0, 100) + '...' : '',
      url: `https://blog.dowha.kim/${isPost ? 'posts' : 'books'}/${item.slug}`, // ✅ posts인지 books인지 정확히 구분
      date: item.created_at,
    })
  })

  // ✅ 한글 인코딩 문제 해결 (UTF-8 명확히 설정)
  res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8')
  res.status(200).send(feed.xml())
}
