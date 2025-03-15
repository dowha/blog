import { supabase } from '@/supabase'
import { GetStaticProps, GetStaticPaths } from 'next'
import MarkdownContent from '@/components/MarkdownContent'
import Seo from '@/components/Seo'
import Copyright from '@/components/Copyright'
import { ScrollToTopButton, CopyLinkButton } from '@/components/ActionButtons'
import Image from 'next/image'

interface Book {
  id: string
  title: string
  author: string
  publisher: string
  publicationYear: number
  genre: string
  slug: string
  created_at: string
  link?: string
  thumbnail?: string
  content?: string
}

export default function BookDetailPage({
  book,
  prevBook,
  nextBook,
}: {
  book: Book
  prevBook: Book | null
  nextBook: Book | null
}) {
  if (!book) return <p>Book not found.</p>

  return (
    <>
      <Seo title={book.title} description={book.content?.slice(0, 150) || ''} />
      <article className="single-book page-container">
        <h1 className="text-xl font-bold">{book.title}</h1>
        <p className="text-sm text-gray-500 mb-4">
          {book.author}, {book.publisher}
          <span className="text-sm font-mono">({book.publicationYear})</span>
        </p>
        <div className="flex justify-between mt-8 text-sm">
          {prevBook ? (
            <a
              href={`/books/${prevBook.slug}`}
              className="group hover:underline"
            >
              <span>←</span>
              <span className="hidden sm:inline opacity-0 transition-opacity duration-300 ease-in group-hover:opacity-100">
                {prevBook.title}
              </span>
            </a>
          ) : (
            <span className="group cursor-not-allowed">
              <span className="text-gray-400">←</span>
              <span className="hidden sm:inline opacity-0 transition-opacity duration-300 ease-in group-hover:opacity-100 text-gray-400">
                이전 책 없음
              </span>
            </span>
          )}
          {nextBook ? (
            <a
              href={`/books/${nextBook.slug}`}
              className="group hover:underline"
            >
              <span className="hidden sm:inline opacity-0 transition-opacity duration-300 ease-in group-hover:opacity-100">
                {nextBook.title}
              </span>
              <span>→</span>
            </a>
          ) : (
            <span className="group cursor-not-allowed">
              <span className="hidden sm:inline opacity-0 transition-opacity duration-300 ease-in group-hover:opacity-100 text-gray-400">
                다음 책 없음
              </span>
              <span className="text-gray-400">→</span>
            </span>
          )}
        </div>

        {book.thumbnail && (
          <div className="w-full h-64 bg-gray-100 flex items-center justify-center rounded-lg mt-6 mb-4 relative">
            <Image
              src={book.thumbnail}
              alt={book.title}
              width={64}
              height={96}
              className="absolute w-16 h-24 sm:w-32 sm:h-48 object-cover"
            />
          </div>
        )}

        {book.content ? (
          <MarkdownContent content={book.content} />
        ) : (
          <p className="text-gray-500">현재 읽고 있는 중.</p>
        )}
        <p className="text-xs text-gray-500 px-1 py-0.5 inline-block">
          #{book.genre}
        </p>

        <div className="flex items-center gap-2 mt-4">
          <ScrollToTopButton />
          <CopyLinkButton slug={book.slug} isBookPage />{' '}
        </div>
      </article>
      <Copyright />
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const { data: books } = await supabase.from('books').select('slug')
  const paths = books?.map((book) => ({ params: { slug: book.slug } })) || []
  return { paths, fallback: 'blocking' }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  if (!params?.slug || typeof params.slug !== 'string') {
    return { notFound: true }
  }

  const { data: book } = await supabase
    .from('books')
    .select(
      'id, title, author, publisher, publication_year, genre, slug, link, thumbnail, content, created_at'
    )
    .eq('slug', params.slug)
    .single()

  if (!book) {
    return { notFound: true }
  }

  const { data: prevBookData } = await supabase
    .from('books')
    .select('slug, title, created_at')
    .lt('created_at', book.created_at)
    .order('created_at', { ascending: false })
    .limit(1)

  const { data: nextBookData } = await supabase
    .from('books')
    .select('slug, title, created_at')
    .gt('created_at', book.created_at)
    .order('created_at', { ascending: true })
    .limit(1)

  return {
    props: {
      book: { ...book, publicationYear: Number(book.publication_year) },
      prevBook: prevBookData && prevBookData[0] ? prevBookData[0] : null,
      nextBook: nextBookData && nextBookData[0] ? nextBookData[0] : null,
    },
    revalidate: 60,
  }
}
