import { supabase } from '@/supabase'
import { GetStaticProps, GetStaticPaths } from 'next'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import Seo from '@/components/Seo'
import Copyright from '@/components/Copyright'
import { ScrollToTopButton, CopyLinkButton } from '@/components/ActionButtons'
import Image from 'next/image'

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

export default function BookDetailPage({ book }: { book: Book }) {
  if (!book) return <p>Book not found.</p>

  return (
    <>
      <Seo
        title={book.title}
        description={book.description || book.content.slice(0, 150)}
      />
      <article className="single-post page-container">
        <h1 className="text-xl font-bold">{book.title}</h1>
        <p className="text-sm text-gray-500 font-mono mb-4">
          {new Date(book.created_at).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          })}
        </p>

        {/* 썸네일 이미지 */}
        {book.thumbnail && (
          <Image
            src={book.thumbnail}
            alt={book.title}
            className="w-full rounded-lg mb-4"
          />
        )}

        {/* 본문 내용 Markdown 지원 */}
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
          {book.content}
        </ReactMarkdown>

        {/* 외부 링크 */}
        {book.link && (
          <a
            href={book.link}
            className="block mt-4"
            target="_blank"
            rel="noopener noreferrer"
          >
            더 보기
          </a>
        )}

        {/* 액션 버튼 */}
        <div className="flex items-center gap-2 mt-4">
          <ScrollToTopButton />
          <CopyLinkButton slug={book.slug} isRecordPage={false} />
        </div>
      </article>
      <Copyright />
    </>
  )
}

// ✅ 정적 경로 생성 (getStaticPaths)
export const getStaticPaths: GetStaticPaths = async () => {
  const { data: books } = await supabase.from('books').select('slug')

  const paths = books?.map((book) => ({ params: { slug: book.slug } })) || []
  return { paths, fallback: 'blocking' }
}

// ✅ 빌드 시 정적 페이지 생성 (getStaticProps)
export const getStaticProps: GetStaticProps = async ({ params }) => {
  if (!params?.slug || typeof params.slug !== 'string') {
    return { notFound: true }
  }

  const { data: book } = await supabase
    .from('books')
    .select(
      'id, category, title, description, slug, link, thumbnail, content, created_at'
    )
    .eq('slug', params.slug)
    .single()

  if (!book) {
    return { notFound: true }
  }

  return {
    props: { book },
    revalidate: 60, // 60초마다 페이지 재생성
  }
}
