import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/supabase'
import { throwOnError } from '@/lib/staticFetch'
import type { GetStaticProps } from 'next'
import { fetchPageIntro, introToText } from '@/lib/pageIntro'
import BookCard from '@/components/ReadingCard'
import GenreFilter from '@/components/GenreFilter'
import Seo from '@/components/Seo'
import { useDeskShortcut } from '@/components/desk/useDeskShortcut'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Image from 'next/image'
import { LoadMoreButton } from '@/components/ActionButtons'

interface Book {
  id: string
  title: string
  author: string
  publisher: string
  publicationYear: number
  genre: string
  thumbnail?: string
  isReading?: boolean
  slug: string
  /** 감상(상세 페이지)이 있는지 */
  hasContent: boolean
  lang?: string
  volumes?: string | null
}

type Props = { intro: string; books: Book[]; genres: string[] }

// 장르가 아닌 탭. 여기서만 읽는 중인 책을 표지 카드로 펼쳐 보인다
const READING_TAB = '읽는 중'
// 주소에는 띄어쓰기 없이 (#읽는%20중 대신 #읽는중)
const READING_HASH = '읽는중'
const tabToHash = (tab: string) => (tab === READING_TAB ? READING_HASH : tab)
const hashToTab = (hash: string) => (hash === READING_HASH || hash === READING_TAB ? READING_TAB : hash)

function filterBooks(books: Book[], tab: string) {
  if (tab === '전체') return books
  if (tab === READING_TAB) return books.filter((b) => b.isReading)
  return books.filter((b) => b.genre === tab)
}

// [전체]·장르 탭 위쪽의 읽는 중인 책: 표지 없이 한 줄([읽는 중] 제목 · 작가)로 낮게.
// 누르면 [읽는 중] 탭으로 간다
function ReadingChip({ book, onClick }: { book: Book; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-w-0 items-center gap-2 rounded-lg border border-gray-200 bg-amber-50 px-3 py-2 text-left cursor-pointer hover:bg-amber-100"
    >
      {/* EN 표시(LangBadge)와 같은 테두리 배지 모양, 색은 읽는 중 카드의 노란 계열에 맞춘다 */}
      <span className="shrink-0 rounded-[3px] border border-amber-300 px-[4px] text-[11px] font-medium leading-[16px] text-amber-700">
        읽는 중
      </span>
      {/* 긴 제목은 말줄임 (라벨·작가는 줄이지 않는다) */}
      <span className="truncate text-sm font-semibold leading-tight text-foreground">
        {book.title}
        {book.volumes && <span className="ml-0.5 font-normal text-gray-400">({book.volumes})</span>}
      </span>
      <span className="shrink-0 text-xs text-gray-500">{book.author}</span>
    </button>
  )
}

// 읽는 중인 책 먼저, 그다음 최근 등록순
async function fetchBooks(): Promise<{ books: Book[]; genres: string[] }> {
  const { data, error } = await supabase
    .from('books')
    .select('id, title, author, publisher, publication_year, genre, slug, thumbnail, content, is_reading, created_at, lang, volumes')
  throwOnError(error, 'books 목록')
  if (!data) return { books: [], genres: [] }
  // 장르 버튼 순서는 예전처럼 DB에서 읽은 순서대로
  const genres = Array.from(new Set(data.map((b) => b.genre).filter(Boolean)))
  const books = [...data]
    .sort((a, b) =>
      !!a.is_reading === !!b.is_reading
        ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        : a.is_reading ? -1 : 1
    )
    // 감상문 전문은 상세 페이지에서만 쓰므로 목록에는 있는지만 넘긴다
    .map((b) => ({
      id: b.id,
      title: b.title,
      author: b.author,
      publisher: b.publisher,
      publicationYear: b.publication_year,
      genre: b.genre,
      thumbnail: b.thumbnail,
      isReading: !!b.is_reading,
      slug: b.slug,
      hasContent: !!b.content?.trim(),
      lang: b.lang,
      volumes: b.volumes,
    }))
  return { books, genres }
}

// 책 목록까지 서버에서 넣어 60초마다 다시 만든다 (/desk 저장·삭제 시에는 즉시)
export const getStaticProps: GetStaticProps<Props> = async () => {
  const [intro, { books, genres }] = await Promise.all([fetchPageIntro('books'), fetchBooks()])
  return { props: { intro, books, genres }, revalidate: 60 }
}

export default function BooksPage({ intro, books, genres }: Props) {
  // 소유자 로그인 시 제목 더블클릭으로 /desk 진입
  const deskShortcut = useDeskShortcut('books')
  const router = useRouter()
  // 장르 필터는 주소의 #장르를 따른다. 첫 HTML에는 전체 목록을 그린다
  const [filteredBooks, setFilteredBooks] = useState<Book[]>(books)
  const [selectedGenre, setSelectedGenre] = useState('전체')

  const [visibleCount, setVisibleCount] = useState(8)
  const LOAD_COUNT = 8

  // 주소의 #장르로 필터 (첫 진입·뒤로가기)
  useEffect(() => {

    // URL 해시값을 읽어 필터 상태 업데이트 함수
    const handleHashChange = () => {
      const hash = window.location.hash
      let initialGenre = '전체'

      if (hash) {
        try {
          // 한글 해시 깨짐 방지를 위한 디코딩 (# 제거 후 디코딩)
          initialGenre = hashToTab(decodeURIComponent(hash.replace('#', '')))
        } catch (e) {
          console.error('Hash decoding failed:', e)
        }
      }

      setSelectedGenre(initialGenre)
      setFilteredBooks(filterBooks(books, initialGenre))
    }

    // 초기 실행
    handleHashChange()

    // 뒤로가기/앞으로가기 등 URL 변경 감지
    window.addEventListener('hashchange', handleHashChange)
    window.addEventListener('popstate', handleHashChange)

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
      window.removeEventListener('popstate', handleHashChange)
    }
  }, [books])



  const handleFilterChange = useCallback((genre: string) => {
    setSelectedGenre(genre)
    setVisibleCount(LOAD_COUNT) // 필터 변경 시 초기화
    if (genre === '전체') {
      // '전체'일 때는 해시 제거 (replace 사용하여 URL 깔끔하게 유지)
      router.replace('/books', undefined, { shallow: true })
    } else {
      // 탭 선택 시 URL에 해시 추가 (예: #소설, #읽는 중)
      router.push(`/books#${tabToHash(genre)}`, undefined, { shallow: true })
    }
    setFilteredBooks(filterBooks(books, genre))
  }, [books, router])

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + LOAD_COUNT)
  }

  const descriptionText = introToText(intro)

  // [읽는 중] 탭이 아니면 읽는 중인 책을 위에 낮은 카드로 모으고, 아래 카드 목록은 다 읽은 책만
  const onReadingTab = selectedGenre === READING_TAB
  const readingChips = onReadingTab ? [] : filteredBooks.filter((b) => b.isReading)
  const cardBooks = onReadingTab ? filteredBooks : filteredBooks.filter((b) => !b.isReading)

  // 첫 화면은 책 카드 8칸 분량. 위쪽 한 줄 카드 3줄 높이 ≈ 책 카드 1칸 높이로 보고 그만큼 책 카드를 뒤로 미룬다.
  // 모바일(1열)과 PC(2열)는 한 줄 카드 줄 수가 달라 따로 센다: 6권이면 모바일 6줄→2칸, PC 3줄→1줄(2칸)
  const mobileSkip = Math.ceil(readingChips.length / 3)
  const pcSkip = Math.ceil(Math.ceil(readingChips.length / 2) / 3) * 2
  const mobileShown = visibleCount - mobileSkip
  const pcShown = visibleCount - pcSkip
  const renderCount = Math.max(mobileShown, pcShown)
  // 한쪽 화면에서만 보일 카드는 다른 쪽에서 숨긴다
  const cardHideCls = (i: number) =>
    `${i >= mobileShown ? 'max-md:hidden' : ''} ${i >= pcShown ? 'md:hidden' : ''}`
  const hasReading = books.some((b) => b.isReading)

  return (
    <>
      <Seo title="Books" description={descriptionText} />
      <article className="book-list page-container">
        <h1 className="flex items-center">
          <span {...deskShortcut}>Books</span>
          <a
            href="/api/rss"
            target="_blank"
            rel="noopener"
            className="relative ml-1 w-4 h-4 inline-block"
          >
            <Image
              src="/rss.svg"
              alt="RSS"
              width={16}
              height={16}
              className="absolute inset-0 transition-opacity duration-300 hover:opacity-0"
            />
            <Image
              src="/rss-hover.svg"
              alt="RSS"
              width={16}
              height={16}
              className="absolute inset-0 opacity-0 transition-opacity duration-300 hover:opacity-100"
            />
          </a>
        </h1>
        <p className="mt-4 text-keepall" dangerouslySetInnerHTML={{ __html: intro }} />

        <GenreFilter
          genres={genres}
          extraTabs={hasReading ? [READING_TAB] : []}
          selectedGenre={selectedGenre}
          onChange={handleFilterChange}
        />

        <>
            {readingChips.length > 0 && (
              <div className="mt-8 grid grid-cols-1 gap-2 md:grid-cols-2" aria-label="읽는 중인 책">
                {readingChips.map((book) => (
                  <ReadingChip key={book.id} book={book} onClick={() => handleFilterChange(READING_TAB)} />
                ))}
              </div>
            )}

            <div className={`${readingChips.length > 0 ? 'mt-4' : 'mt-8'} grid grid-cols-1 gap-2 md:grid-cols-2`}>
              {/* 모바일 한 줄·PC 두 줄 기준으로 첫 화면에 보이는 앞의 4권만 표지를 바로 받는다 */}
              {cardBooks.slice(0, renderCount).map((book, i) =>
                book.hasContent ? (
                  <Link
                    key={book.id}
                    href={`/books/${book.slug}`}
                    className={`block no-underline ${cardHideCls(i)}`}
                  >
                    <BookCard book={book} priority={i < 4} className="hover:bg-gray-100" />
                  </Link>
                ) : (
                  <div key={book.id} className={`block no-underline ${cardHideCls(i)}`}>
                    {/* [읽는 중] 탭은 전부 읽는 중이라 노란 배경·표지 라벨을 빼고 그대로 보인다 */}
                    <BookCard
                      book={book}
                      priority={i < 4}
                      showReadingBadge={!onReadingTab}
                      className={onReadingTab ? 'cursor-wait no-group' : 'cursor-wait bg-amber-50 no-group'}
                    />
                  </div>
                )
              )}
            </div>

            <LoadMoreButton
              loadMore={handleLoadMore}
              hasMore={Math.min(mobileShown, pcShown) < cardBooks.length}
            />
        </>
      </article>
    </>
  )
}
