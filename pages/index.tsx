import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/supabase'
import type { GetStaticProps } from 'next'
import { fetchPageIntro } from '@/lib/pageIntro'
import Seo from '@/components/Seo'
import LoadingSpinner from '@/components/LoadingSpinner' // ✅ 추가

type LinkItem = { title: string; slug: string }
type BookItem = { title: string; author: string; slug: string }

// 최근에 쓴 글(writings). 외부 글은 블로그 안에 페이지가 없어 제외
async function fetchLatestPost(): Promise<LinkItem | null> {
  const { data, error } = await supabase
    .from('posts')
    .select('title, slug')
    .eq('is_published', true)
    .eq('is_external', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) console.error('최신 글 fetch 오류:', error)
  return data ? { title: data.title, slug: `/posts/${data.slug}` } : null
}

// 최근에 읽은 책: 감상이 있고(상세 페이지 존재) 지금 읽는 중이 아닌 책
async function fetchLatestReadBook(): Promise<BookItem | null> {
  const { data, error } = await supabase
    .from('books')
    .select('title, author, slug')
    .not('content', 'is', null)
    .not('is_reading', 'is', true) // null도 '읽는 중 아님'으로 취급
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) console.error('최근 읽은 책 fetch 오류:', error)
  return data ? { ...data, slug: `/books/${data.slug}` } : null
}

// shorts는 굵게·기울임만 쓰므로 홈에서는 react-markdown(+36kB) 대신 간단히 변환한다
function renderEmphasis(text: string) {
  return text.split(/(==(?=\S)[^=\n]*?\S==|\*\*[^*\n]+\*\*|(?<!\w)__[^_\n]+__(?!\w)|\*[^*\n]+\*|(?<!\w)_[^_\n]+_(?!\w))/g).map((part, i) => {
    if (/^==.+==$/.test(part)) return <mark key={i}>{part.slice(2, -2)}</mark>
    if (/^(\*\*|__).+\1$/.test(part)) return <strong key={i}>{part.slice(2, -2)}</strong>
    if (/^([*_]).+\1$/.test(part)) return <em key={i}>{part.slice(1, -1)}</em>
    return part
  })
}

type ShortItem = { short_id: number; content: string }

// 요즘 생각: 공개된 최신 short 1개
async function fetchLatestShort(): Promise<ShortItem | null> {
  const { data, error } = await supabase
    .from('shorts')
    .select('short_id, content')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) console.error('최신 short fetch 오류:', error)
  return data ?? null
}

// 현재 읽고 있는 책 가져오기
async function fetchCurrentlyReadingBooks() {
  const { data, error } = await supabase
    .from('books')
    .select('title, author')
    .eq('is_reading', true)
    .order('created_at', { ascending: false })

  if (error) console.error('현재 읽는 책 fetch 오류:', error)
  return error ? [] : data || []
}

// 가장 많이 응원받은 콘텐츠(공동 1위 포함). 집계는 DB 함수 most_liked_content에서 처리
type LikedContent = { title: string; slug: string; type: 'post' | 'book' }

async function fetchMostLikedContent(): Promise<LikedContent[]> {
  const { data, error } = await supabase.rpc('most_liked_content')
  if (error) {
    console.error('인기 콘텐츠 fetch 오류:', error)
    return []
  }
  return (data ?? []) as LikedContent[]
}

type Props = { intro: string }

// 소개 문구만 서버에서 넣는다 (/desk 저장 시 즉시 재생성). 검색 설명은 Seo 기본값 유지
export const getStaticProps: GetStaticProps<Props> = async () => ({
  props: { intro: await fetchPageIntro('home') },
  revalidate: 60,
})

export default function Home({ intro }: Props) {
  const [latestShort, setLatestShort] = useState<ShortItem | null>(null)
  const [latestPost, setLatestPost] = useState<LinkItem | null>(null)
  const [latestBook, setLatestBook] = useState<BookItem | null>(null)
  const [mostLikedContent, setMostLikedContent] = useState<LikedContent[]>([])
  const [currentlyReading, setCurrentlyReading] = useState<Omit<BookItem, 'slug'>[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)

      const [short, post, book, mostLiked, reading] = await Promise.all([
        fetchLatestShort(),
        fetchLatestPost(),
        fetchLatestReadBook(),
        fetchMostLikedContent(),
        fetchCurrentlyReadingBooks(),
      ])

      setLatestShort(short)
      setLatestPost(post)
      setLatestBook(book)
      setMostLikedContent(mostLiked)
      setCurrentlyReading(reading)
      setIsLoading(false)
    }

    fetchData()
  }, [])

  return (
    <>
      <Seo />
      <article className="page-container">
        <h1 className="font-bold">{"Dowha's Blog"}</h1>
        <p
          className="mt-4 index-contents text-keepall"
          dangerouslySetInnerHTML={{ __html: intro }}
        />
        {isLoading ? (
          <LoadingSpinner /> // ✅ 로딩 중일 때
        ) : (
          <>
            {latestShort && (
              <div className="mt-6 bg-gray-100 py-2 px-3 rounded-lg">
                <h2 className="font-semibold mt-0">
                  <span className="mr-1">💭</span> 요즘 하는 생각
                </h2>
                <Link
                  href={`/shorts#${latestShort.short_id}`}
                  className="group/bubble relative mt-2 mb-2 ml-4 inline-block max-w-[85%] rounded-3xl bg-white px-4 py-2 text-sm leading-relaxed text-gray-600 no-underline whitespace-pre-wrap transition-colors hover:bg-gray-50"
                >
                  {renderEmphasis(latestShort.content)}
                  <span className="absolute -left-2 bottom-3 h-4 w-4 rounded-full bg-inherit" />
                  <span className="absolute -left-4 bottom-1 h-2 w-2 rounded-full bg-inherit" />
                </Link>
              </div>
            )}

            {latestPost && (
              <div className="mt-6 bg-gray-100 py-2 px-3 rounded-lg">
                <h2 className="font-semibold mt-0">
                  <span className="mr-1">🌱</span> 최근에 쓴 글
                </h2>
                <ul>
                  <li>
                    <Link href={latestPost.slug} className="block text-sm">
                      {latestPost.title}
                    </Link>
                  </li>
                </ul>
              </div>
            )}

            {latestBook && (
              <div className="mt-6 bg-gray-100 py-2 px-3 rounded-lg">
                <h2 className="font-semibold mt-0">
                  <span className="mr-1">📖</span> 최근에 읽은 책
                </h2>
                <ul>
                  <li>
                    <Link href={latestBook.slug} className="block text-sm">
                      《{latestBook.title}》, {latestBook.author}
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
                  <span className="mr-1">📚</span> 요즘 읽고 있는 책
                </h2>
                <ul>
                  {/* 읽는 중인 책은 상세 페이지가 없어 링크 없이 표시 */}
                  {currentlyReading.map((book) => (
                    <li key={`${book.title}-${book.author}`} className="text-sm">
                      《{book.title}》, {book.author}
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
