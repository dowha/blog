import { useState, useEffect } from 'react'
import { supabase } from '@/supabase'
import BookCard from '@/components/ReadingCard'
import GenreFilter from '@/components/GenreFilter'
import Seo from '@/components/Seo'
import Link from 'next/link'
import Image from 'next/image'
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
        console.log('📚 Books data:', data) // ✅ 데이터 확인

        // ✅ TypeScript에서 필드명 변환
        const formattedData = data.map((book) => ({
          ...book,
          publicationYear: book.publication_year, // 필드명 변환
          isReading: book.is_reading, // 필드명 변환
        }))

        // ✅ 정렬 로직 추가
        const sortedData = formattedData.sort((a, b) => {
          if (a.isReading === b.isReading) {
            return (
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
            ) // 최신순
          }
          return b.isReading - a.isReading // true가 먼저 오도록 정렬
        })

        setBooks(sortedData)
        setFilteredBooks(sortedData)
      }
    }
    fetchBooks()
  }, [])

  const handleFilterChange = (genre: string) => {
    setSelectedGenre(genre)
    if (genre === '전체') {
      setFilteredBooks(books)
    } else {
      setFilteredBooks(books.filter((book) => book.genre === genre))
    }
  }
  const descriptionText = `책 읽기는 제게 큰 즐거움이자 평생을 함께 하고 싶은 친구입니다.`

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
            {/* 기본 아이콘 */}
            <Image
              src="/rss.svg"
              alt="RSS"
              width={16}
              height={16}
              className="absolute inset-0 transition-opacity duration-300 hover:opacity-0"
            />
            {/* Hover 시 나타날 주황색 아이콘 */}
            <Image
              src="/rss-hover.svg" // ✅ 주황색 버전의 아이콘을 별도로 저장
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
          {filteredBooks.map((book) =>
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
                  className="cursor-not-allowed bg-amber-50 no-group"
                />
              </div>
            )
          )}
        </div>
      </article>
    </>
  )
}
