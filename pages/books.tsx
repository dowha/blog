import { useState, useEffect } from 'react'
import { supabase } from '@/supabase'
import BookCard from '@/components/ReadingCard'
import GenreFilter from '@/components/GenreFilter'
import Seo from '@/components/Seo'
import Link from 'next/link'

interface Book {
  id: string
  title: string
  author: string
  publisher: string
  publicationYear: number
  genre: string
  thumbnail?: string
  slug: string
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
          'id, title, author, publisher, publication_year, genre, slug, link, thumbnail, content'
        )
        .order('created_at', { ascending: false }) // ✅ 최신순 정렬

      if (error) {
        console.error('❌ Error fetching books:', error)
      } else {
        console.log('📚 Books data:', data) // ✅ 데이터 확인

        // ✅ TypeScript에서 `publication_year`를 `publicationYear`로 변환
        const formattedData = data.map((book) => ({
          ...book,
          publicationYear: book.publication_year, // 필드명 변환
        }))

        setBooks(formattedData)
        setFilteredBooks(formattedData)
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
        <h1 className="text-xl font-bold">Books</h1>
        <p className="mt-4 text-keepall">{descriptionText}</p>
        <GenreFilter
          selectedGenre={selectedGenre}
          onChange={handleFilterChange}
        />

        <div className="mt-8 grid grid-cols-1 gap-2 md:grid-cols-2">
          {filteredBooks.map((book) => (
            <Link
              key={book.id}
              href={`/books/${book.slug}`}
              className="block no-underline"
            >
              <BookCard key={book.id} book={book} />
            </Link>
          ))}
        </div>
      </article>
    </>
  )
}
