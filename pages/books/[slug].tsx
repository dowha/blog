import { supabase } from '@/supabase'
import { GetStaticProps, GetStaticPaths } from 'next'
import MarkdownContent from '@/components/MarkdownContent'
import Seo from '@/components/Seo'
import Copyright from '@/components/Copyright'
import {
  ScrollToTopButton,
  CopyLinkButton,
  LuckyPostButton,
  ClapButton,
} from '@/components/ActionButtons'
import Image from 'next/image'
import Link from 'next/link'
import { toExcerpt } from '@/lib/excerpt'
import JsonLd, { AUTHOR, SITE_URL } from '@/components/JsonLd'

interface Book {
  id: string
  title: string
  author: string
  publisher: string
  publicationYear: number
  genre: string
  slug: string
  created_at: string
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
      <Seo title={book.title} description={toExcerpt(book.content)} />
      <JsonLd
        data={{
          // 책 리뷰 글: 리뷰 대상(Book)과 작성자·작성일을 함께 표시
          '@type': 'Review',
          name: book.title,
          reviewBody: toExcerpt(book.content, 300),
          datePublished: new Date(book.created_at).toISOString(),
          url: `${SITE_URL}/books/${book.slug}`,
          inLanguage: 'ko-KR',
          author: AUTHOR,
          itemReviewed: {
            '@type': 'Book',
            name: book.title,
            author: { '@type': 'Person', name: book.author },
            ...(book.publisher ? { publisher: { '@type': 'Organization', name: book.publisher } } : {}),
            ...(book.publicationYear ? { datePublished: String(book.publicationYear) } : {}),
            ...(book.genre ? { genre: book.genre } : {}),
            ...(book.thumbnail ? { image: book.thumbnail } : {}),
          },
        }}
      />
      <article className="single-book page-container">
        <h1 className="font-bold">{book.title}</h1>
        <p className="text-sm text-gray-500 mb-4">
          {book.author}
          {book.publisher ? `, ${book.publisher}` : ''}
          <span className="tabular-nums">({book.publicationYear})</span>
          {book.genre && (
            <>
              <span className="mx-1.5 text-gray-300" aria-hidden="true">|</span>
              <Link href={{ pathname: '/books', hash: book.genre }} className="inline">
                #{book.genre}
              </Link>
            </>
          )}
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
              width={128}
              height={192}
              quality={100}
              className="absolute w-32 h-48 sm:w-32 sm:h-48 object-cover"
            />
          </div>
        )}

        {book.content ? (
          <MarkdownContent content={book.content} endmark />
        ) : (
          <p className="text-gray-500">읽는 중.</p>
        )}

        <div className="flex items-center gap-2 mt-4">
          <ScrollToTopButton />
          <LuckyPostButton />
          <CopyLinkButton slug={book.slug} isBookPage />
          <ClapButton bookId={book.id} />
        </div>
      </article>
      <Copyright />
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const { data: books } = await supabase.from('books').select('slug, content')

  // content가 null이 아닌 책만 경로로 추가
  const paths =
    books
      ?.filter((book) => book.content) // content가 존재하는 책만 포함
      .map((book) => ({ params: { slug: book.slug } })) || []

  return { paths, fallback: 'blocking' }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  if (!params?.slug || typeof params.slug !== 'string') {
    return { notFound: true }
  }

  const { data: book } = await supabase
    .from('books')
    .select(
      'id, title, author, publisher, publication_year, genre, slug, thumbnail, content, created_at'
    )
    .eq('slug', params.slug)
    .single()

  if (!book || !book.content) {
    return { notFound: true }
  }

  const { data: prevBookData } = await supabase
    .from('books')
    .select('slug, title, created_at')
    .lt('created_at', book.created_at)
    .not('content', 'is', null) // content가 null이 아닌 책만 선택
    .order('created_at', { ascending: false })
    .limit(1)

  const { data: nextBookData } = await supabase
    .from('books')
    .select('slug, title, created_at')
    .gt('created_at', book.created_at)
    .not('content', 'is', null) // content가 null이 아닌 책만 선택
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
