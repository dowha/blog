import { supabase } from '@/supabase'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { GetStaticProps, GetStaticPaths } from 'next'
import Head from 'next/head'
import Copyright from '@/components/Copyright'

type Post = {
  title: string
  content: string
  created_at: string
}

export default function PostPage({ post }: { post: Post | null }) {
  if (!post) return <p>Post not found.</p>

  const handleCopy = async () => {
    try {
      const shareUrl = `${window.location.origin}${window.location.pathname}?type=share` // ✅ router 제거, window.location 사용
      await navigator.clipboard.writeText(shareUrl)
      alert('공유 링크가 복사되었습니다.')
    } catch (err) {
      console.error('URL 복사 실패:', err)
    }
  }

  return (
    <>
      <Head>
        <title>
          {post.title} | {"Dowha's Blog"}
        </title>
        <meta name="description" content={post.content.slice(0, 150)} />
      </Head>
      <article className="w-full pl-0 pt-6 pb-12 mobile:pt-0 mobile:pl-6 sm:pl-10 md:pl-14">
        <h1 className="text-xl font-bold">{post.title}</h1>
        <p className="text-sm text-gray-500 font-mono mb-4">
          {new Date(post.created_at)
            .toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
            })
            .replace(/\. /g, '/')
            .replace(/\.$/, '')}
        </p>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {post.content}
        </ReactMarkdown>

        {/* 공유 버튼 추가 */}
        <div className="mt-6">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-md"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              <circle cx="18" cy="5" r="3"></circle>
              <circle cx="6" cy="12" r="3"></circle>
              <circle cx="18" cy="19" r="3"></circle>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
            공유
          </button>
        </div>
      </article>
      <Copyright />
    </>
  )
}

// ✅ 1. 동적 경로 정의
export const getStaticPaths: GetStaticPaths = async () => {
  const { data: posts } = await supabase
    .from('posts')
    .select('slug')
    .eq('status', 'public')
    .eq('is_external', false) // 추가됨

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
    .eq('is_external', false) // 추가됨
    .single()

  if (!post) {
    return { notFound: true }
  }

  return {
    props: { post },
    revalidate: 60, // ISR (60초마다 새로운 데이터 반영)
  }
}
