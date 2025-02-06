import { supabase } from '@/supabase'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { GetStaticProps, GetStaticPaths } from 'next'

type Post = {
  title: string
  content: string
  created_at: string
}

export default function PostPage({ post }: { post: Post | null }) {
  if (!post) return <p>Post not found.</p>

  return (
    <article className="pl-0 pt-6 mobile:pt-0 mobile:pl-6 sm:pl-10 md:pl-14">
      <h1 className="text-xl font-bold">{post.title}</h1>
      <p className="text-sm text-neutral-400 mb-4">
        {new Date(post.created_at)
          .toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          })
          .replace(/\. /g, '/')
          .replace(/\.$/, '')}
      </p>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
    </article>
  )
}

// ✅ 1. 동적 경로 정의
export const getStaticPaths: GetStaticPaths = async () => {
  const { data: posts } = await supabase
    .from('posts')
    .select('slug')
    .eq('status', 'public')

  const paths =
    posts?.map((post) => ({
      params: { slug: post.slug },
    })) || []

  return { paths, fallback: 'blocking' }
}

// ✅ 2. 개별 포스트 데이터 가져오기
export const getStaticProps: GetStaticProps = async ({ params }) => {
  if (!params?.slug || typeof params.slug !== 'string') {
    return { notFound: true }
  }

  const { data: post } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', params.slug)
    .eq('status', 'public')
    .single()

  if (!post) {
    return { notFound: true }
  }

  return {
    props: { post },
    revalidate: 60, // ISR (60초마다 새로운 데이터 반영)
  }
}
