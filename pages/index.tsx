import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/supabase'
import Seo from '@/components/Seo'
import LoadingSpinner from '@/components/LoadingSpinner' // ✅ 추가

// 가장 최신 콘텐츠 가져오기
async function fetchLatestSingleContent() {
  const { data: latestPost, error: postError } = await supabase
    .from('posts')
    .select('title, slug, created_at')
    .eq('is_published', true)
    .eq('is_external', false)
    .order('created_at', { ascending: false })
    .limit(1)

  if (postError) console.error('최신 포스트 fetch 오류:', postError)

  const { data: latestBook, error: bookError } = await supabase
    .from('books')
    .select('title, slug, created_at')
    .not('content', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)

  if (bookError) console.error('최신 도서 fetch 오류:', bookError)

  const post = latestPost?.[0] ?? null
  const book = latestBook?.[0] ?? null

  if (!post && !book) return null
  if (!post)
    return book ? { title: book.title, slug: `/books/${book.slug}` } : null
  if (!book)
    return post ? { title: post.title, slug: `/posts/${post.slug}` } : null

  return new Date(post.created_at) > new Date(book.created_at)
    ? { title: post.title, slug: `/posts/${post.slug}` }
    : { title: book.title, slug: `/books/${book.slug}` }
}

// 현재 읽고 있는 책 가져오기
async function fetchCurrentlyReadingBooks() {
  const { data, error } = await supabase
    .from('books')
    .select('title, author, slug')
    .eq('is_reading', true)
    .order('created_at', { ascending: false })

  if (error) console.error('현재 읽는 책 fetch 오류:', error)
  return error ? [] : data || []
}

// 가장 많이 좋아요 받은 콘텐츠 가져오기
async function fetchMostLikedContent(): Promise<
  { title: string; slug: string; type: 'post' | 'book' }[]
> {
  const { data: allLikes, error: likesError } = await supabase
    .from('content_likes')
    .select('post_id, book_id')

  if (likesError || !allLikes || allLikes.length === 0) {
    if (likesError) console.error('콘텐츠 좋아요 fetch 오류:', likesError)
    return []
  }

  const contentCountMap: Record<
    string,
    { count: number; type: 'post' | 'book' }
  > = {}
  for (const like of allLikes) {
    const id = like.post_id || like.book_id
    if (!id) continue

    const type: 'post' | 'book' = like.post_id ? 'post' : 'book'
    if (!contentCountMap[id]) {
      contentCountMap[id] = { count: 0, type }
    }
    contentCountMap[id].count += 1
  }

  let mostLikedContentIds: { id: string; type: 'post' | 'book' }[] = []
  let maxCount = 0

  for (const [id, { count, type }] of Object.entries(contentCountMap)) {
    if (count > maxCount) {
      mostLikedContentIds = [{ id, type }]
      maxCount = count
    } else if (count === maxCount) {
      mostLikedContentIds.push({ id, type })
    }
  }

  if (mostLikedContentIds.length === 0) {
    return []
  }

  const postIds = mostLikedContentIds
    .filter((item) => item.type === 'post')
    .map((item) => item.id)
  const bookIds = mostLikedContentIds
    .filter((item) => item.type === 'book')
    .map((item) => item.id)

  const { data: postData } = await supabase
    .from('posts')
    .select('title, slug')
    .in('id', postIds)

  const { data: bookData } = await supabase
    .from('books')
    .select('title, slug')
    .in('id', bookIds)

  return [
    ...(postData || []).map((post) => ({
      title: post.title,
      slug: `/posts/${post.slug}`,
      type: 'post' as const, // ✅ 'post' 타입 고정
    })),
    ...(bookData || []).map((book) => ({
      title: book.title,
      slug: `/books/${book.slug}`,
      type: 'book' as const, // ✅ 'book' 타입 고정
    })),
  ]
}

export default function Home() {
  const [latestContent, setLatestContent] = useState<{
    title: string
    slug: string
  } | null>(null)
  const [mostLikedContent, setMostLikedContent] = useState<
    { title: string; slug: string; type: 'post' | 'book' }[]
  >([])

  const [currentlyReading, setCurrentlyReading] = useState<
    { title: string; author: string; slug: string }[]
  >([])

  const [isLoading, setIsLoading] = useState(true) // ✅ 로딩 상태 추가

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true) // ✅ 로딩 시작

      const [latest, mostLiked, books] = await Promise.all([
        fetchLatestSingleContent(),
        fetchMostLikedContent(),
        fetchCurrentlyReadingBooks(),
      ])

      if (latest) setLatestContent(latest)
      setMostLikedContent(mostLiked) // ✅ mostLiked는 항상 배열이므로 그대로 사용 가능
      setCurrentlyReading(books)

      setIsLoading(false) // ✅ 로딩 끝
    }

    fetchData()
  }, [])

  return (
    <>
      <Seo />
      <article className="page-container">
        <h1 className="text-xl font-bold">{"Dowha's Blog"}</h1>
        <p className="mt-4 index-contents text-keepall">
          이것저것 쓰고 싶은 글을 씁니다. 부담감을 줄이고{' '}
          <strong>꾸준하게</strong> 쓰는 것이 목표입니다.{' '}
          <br className="hidden md:block" />
          질문이나 피드백, 협업 제안 등은{' '}
          <a
            href="https://letterbird.co/hello-dowha"
            target="_blank"
            rel="noopener"
          >
            메일 폼
          </a>
          을 통해서 연락 주세요.
        </p>
        {isLoading ? (
          <LoadingSpinner /> // ✅ 로딩 중일 때
        ) : (
          <>
            {latestContent && (
              <div className="mt-6 bg-gray-100 py-2 px-3 rounded-lg">
                <h2 className="font-semibold mt-0">
                  <span className="mr-1">🌱</span> 최근에 쓴 글
                </h2>
                <ul>
                  <li>
                    <Link href={latestContent.slug} className="block text-sm">
                      {latestContent.title}
                    </Link>
                  </li>
                </ul>
              </div>
            )}

            {mostLikedContent.length > 0 && (
              <div className="mt-6 bg-gray-100 py-2 px-3 rounded-lg">
                <h2 className="font-semibold mt-0">
                  <span className="mr-1">👏</span> 가장 응원받은 콘텐츠
                </h2>
                <ul>
                  {mostLikedContent.map((content) => (
                    <li key={content.slug}>
                      <Link href={content.slug} className="block text-sm">
                        {content.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {currentlyReading.length > 0 && (
              <div className="mt-6 bg-gray-100 py-2 px-3 rounded-lg">
                <h2 className="font-semibold mt-0">
                  <span className="mr-1">📖</span> 요즘 읽고 있는 책
                </h2>
                <ul>
                  {currentlyReading.map((book) => (
                    <li key={book.slug}>
                      <Link href={`/books`} className="block text-sm">
                        {'"'}
                        {book.title}
                        {'"'}, {book.author}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </article>
    </>
  )
}
