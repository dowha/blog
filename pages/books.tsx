import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/supabase'
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

// 읽는 중인 책 먼저, 그다음 최근 등록순
async function fetchBooks(): Promise<{ books: Book[]; genres: string[] }> {
  const { data, error } = await supabase
    .from('books')
    .select('id, title, author, publisher, publication_year, genre, slug, thumbnail, content, is_reading, created_at, lang, volumes')
  if (error || !data) {
    console.error('books fetch 오류:', error)
    return { books: [], genres: [] }
  }
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
          initialGenre = decodeURIComponent(hash.replace('#', ''))
        } catch (e) {
          console.error('Hash decoding failed:', e)
        }
      }

      setSelectedGenre(initialGenre)

      if (initialGenre === '전체') {
        setFilteredBooks(books)
      } else {
        setFilteredBooks(books.filter((book) => book.genre === initialGenre))
      }
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
      setFilteredBooks(books)
    } else {
      // 장르 선택 시 URL에 해시 추가 (예: #소설)
      router.push(`/books#${genre}`, undefined, { shallow: true })
      setFilteredBooks(books.filter((book) => book.genre === genre))
    }
  }, [books, router])

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + LOAD_COUNT)
  }

  const descriptionText = introToText(intro)

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
          selectedGenre={selectedGenre}
          onChange={handleFilterChange}
        />

        <>
            <div className="mt-8 grid grid-cols-1 gap-2 md:grid-cols-2">
              {filteredBooks.slice(0, visibleCount).map((book) =>
                book.hasContent ? (
                  <Link
                    key={book.id}
                    href={`/books/${book.slug}`}
                    className="block no-underline"
                  >
                    <BookCard book={book} className="hover:bg-gray-100" />
                  </Link>
                ) : (
                  <div key={book.id} className="block no-underline">
                    <BookCard
                      book={book}
                      className="cursor-wait bg-amber-50 no-group"
                    />
                  </div>
                )
              )}
            </div>

            <LoadMoreButton
              loadMore={handleLoadMore}
              hasMore={visibleCount < filteredBooks.length}
            />
        </>
      </article>
    </>
  )
}
