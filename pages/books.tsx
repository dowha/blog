import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/supabase'
import BookCard from '@/components/ReadingCard'
import GenreFilter from '@/components/GenreFilter'
import Seo from '@/components/Seo'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Image from 'next/image'
import { LoadMoreButton } from '@/components/ActionButtons'
import LoadingSpinner from '@/components/LoadingSpinner' // ✅ 추가

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
  content?: string | null
}

export default function BooksPage() {
  const router = useRouter()
  const [books, setBooks] = useState<Book[]>([])
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([])
  const [selectedGenre, setSelectedGenre] = useState('전체')
  const [isLoading, setIsLoading] = useState(true) // ✅ 로딩 상태 추가

  const [visibleCount, setVisibleCount] = useState(8) // ✅ 추가
  const LOAD_COUNT = 8 // ✅ 추가

  useEffect(() => {
    async function fetchBooks() {
      setIsLoading(true) // ✅ 로딩 시작
      const { data, error } = await supabase
        .from('books')
        .select(
          'id, title, author, publisher, publication_year, genre, slug, thumbnail, content, is_reading, created_at'
        )

      if (error) {
      } else {
        const formattedData = data.map((book) => ({
          ...book,
          publicationYear: book.publication_year,
          isReading: book.is_reading,
        }))

        const sortedData = formattedData.sort((a, b) => {
          if (a.isReading === b.isReading) {
            return (
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
            )
          }
          return b.isReading - a.isReading
        })

        setBooks(sortedData)
      }
      setIsLoading(false) // ✅ 로딩 종료
    }

    fetchBooks()
  }, [])

  // ✅ books 데이터가 로드된 후 URL hash 리스너 설정
  useEffect(() => {
    if (books.length === 0) return

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
    setVisibleCount(LOAD_COUNT) // ✅ 필터 변경 시 초기화
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
    setVisibleCount((prev) => prev + LOAD_COUNT) // ✅ "더 보기" 버튼 기능
  }

  const descriptionText = `책 읽기는 제게 큰 즐거움이자 평생을 함께하고 싶은 친구입니다.`

  return (
    <>
      <Seo title="Books" description={descriptionText} />
      <article className="book-list page-container">
        <h1 className="text-xl font-bold flex items-center">
          Books
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
        <p className="mt-4 text-keepall">{descriptionText}</p>

        <GenreFilter
          selectedGenre={selectedGenre}
          onChange={handleFilterChange}
        />

        {isLoading ? (
          <LoadingSpinner /> // ✅ 로딩 중일 때
        ) : (
          <>
            <div className="mt-8 grid grid-cols-1 gap-2 md:grid-cols-2">
              {filteredBooks.slice(0, visibleCount).map((book) =>
                book.content ? (
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
        )}
      </article>
    </>
  )
}
