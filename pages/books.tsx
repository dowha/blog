import { supabase } from '@/supabase'
import { useState } from 'react'
import Link from 'next/link'
import Seo from '@/components/Seo'
import Image from 'next/image'
import { LoadMoreButton } from '@/components/ActionButtons'

interface Book {
  id: string
  category: string
  title: string
  description: string
  slug: string
  link: string
  thumbnail: string
  content: string
  created_at: string
}

export async function getStaticProps() {
  const LIMIT = 10
  const { data: books, error } = await supabase
    .from('books')
    .select('id, category, title, description, slug, link, thumbnail, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching books:', error)
    return { props: { initialBooks: [] }, revalidate: 60 }
  }

  return {
    props: { initialBooks: books.slice(0, LIMIT), allBooks: books },
    revalidate: 60,
  }
}

export default function BooksPage({
  initialBooks,
  allBooks,
}: {
  initialBooks: Book[]
  allBooks: Book[]
}) {
  const [books, setBooks] = useState<Book[]>(initialBooks)
  const [offset, setOffset] = useState(initialBooks.length)
  const [hoveredBook, setHoveredBook] = useState<string | null>(null)
  const LIMIT = 10

  const loadMoreBooks = () => {
    const newOffset = offset + LIMIT
    setBooks(allBooks.slice(0, newOffset))
    setOffset(newOffset)
  }

  const currentYear = new Date().getFullYear()

  const groupedBooks = books.reduce((acc, book) => {
    const year = new Date(book.created_at).getFullYear()
    if (!acc[year]) acc[year] = []
    acc[year].push(book)
    return acc
  }, {} as Record<number, Book[]>)

  const descriptionText = `책 리뷰와 독서 기록 목록입니다.`

  return (
    <>
      <Seo title="Books" description={descriptionText} />
      <article className="post-list page-container">
        <h1 className="text-xl font-bold">
          Books
          <a href="/api/books/rss" target="_blank" rel="noopener">
            <Image src="/rss.svg" alt="RSS" width={16} height={16} className="inline-block ml-1" />
          </a>
        </h1>

        {Object.entries(groupedBooks)
          .sort(([a], [b]) => parseInt(b) - parseInt(a))
          .map(([year, books]) => (
            <section key={year} className="mt-6">
              <h2 className="font-semibold font-mono text-gray-600">
                {Number(year) === currentYear ? '' : year}
              </h2>
              <div className="mt-2 space-y-2 relative">
                {books.map((book) => (
                  <div
                    key={book.slug}
                    className="flex items-start justify-between relative"
                    onMouseEnter={() => setHoveredBook(book.thumbnail)}
                    onMouseLeave={() => setHoveredBook(null)}
                  >
                    <Link href={`/books/${book.slug}`} className="flex items-center">
                      <h3 className="full-title group">{book.title}</h3>
                    </Link>
                    <div className="pl-1 py-0.5 sm:py-0">
                      <span className="text-xs sm:text-sm text-gray-500 font-mono whitespace-nowrap">
                        {new Date(book.created_at)
                          .toLocaleDateString('ko-KR', {
                            month: '2-digit',
                            day: '2-digit',
                          })
                          .replace(/\s/g, '')}
                      </span>
                    </div>
                  </div>
                ))}

                {/* 마우스를 올리면 썸네일 이미지 표시 */}
                {hoveredBook && (
                  <div className="absolute right-0 top-0 transform translate-x-8 -translate-y-1/2 pointer-events-none">
                    <Image
                      src={hoveredBook}
                      alt="Book Cover"
                      className="w-32 h-auto rounded-lg shadow-lg"
                    />
                  </div>
                )}
              </div>
            </section>
          ))}

        {/* 더 보기 버튼 */}
        <LoadMoreButton loadMore={loadMoreBooks} hasMore={offset < allBooks.length} />
      </article>
    </>
  )
}
