import { useState, useEffect } from 'react'
import { supabase } from '@/supabase'
import BookCard from '@/components/ReadingCard'
import GenreFilter from '@/components/GenreFilter'
import Seo from '@/components/Seo'
import Link from 'next/link'
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
  content?: string | null
}

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([])
  const [selectedGenre, setSelectedGenre] = useState('전체')

  const [visibleCount, setVisibleCount] = useState(8) // ✅ 추가
  const LOAD_COUNT = 8 // ✅ 추가

  useEffect(() => {
    async function fetchBooks() {
      const { data, error } = await supabase
        .from('books')
        .select(
          'id, title, author, publisher, publication_year, genre, slug, thumbnail, content, is_reading, created_at'
        )

      if (error) {
        console.error('❌ Error fetching books:', error)
      } else {
        console.log('📚 Books data:', data)

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
        setFilteredBooks(sortedData)
      }
    }

    fetchBooks()
  }, [])

  const handleFilterChange = (genre: string) => {
    setSelectedGenre(genre)
    setVisibleCount(LOAD_COUNT) // ✅ 필터 변경 시 초기화
    if (genre === '전체') {
      setFilteredBooks(books)
    } else {
      setFilteredBooks(books.filter((book) => book.genre === genre))
    }
  }

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + LOAD_COUNT) // ✅ "더 보기" 버튼 기능
  }

  const descriptionText = `책 읽기는 제게 큰 즐거움이자 평생을 함께하고 싶은 친구입니다.`

  return (
    <>
      <Seo title="Books" description="{descriptionText}" />
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
      </article>
    </>
  )
}
