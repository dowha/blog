import { supabase } from '@/supabase'
import { GetStaticProps, GetStaticPaths } from 'next'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw' // ✅ HTML 지원을 위해 추가
import Copyright from '@/components/Copyright'
import Seo from '@/components/Seo'
import router from 'next/router'

type Post = {
  title: string
  subtitle: string
  content: string
  created_at: string
  series_name?: string
  series_slug?: string
  slug?: string
}

export default function PostPage({ post }: { post: Post | null }) {
  if (!post) return <p>Post not found.</p>

  const handleCopy = async () => {
    try {
      const shareUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}${router.asPath}?type=share`
          : ''
      await navigator.clipboard.writeText(shareUrl)
      alert('공유 링크가 복사되었습니다.')
    } catch (err) {
      console.error('URL 복사 실패:', err)
    }
  }

  const handleLuckyClick = async () => {
    try {
      const { data: posts, error } = await supabase
        .from('posts')
        .select('slug')
        .eq('status', 'public')
        .eq('is_external', false)

      if (error) throw error
      if (!posts || posts.length === 0) {
        alert('게시물이 없습니다.')
        return
      }

      const randomPost = posts[Math.floor(Math.random() * posts.length)]
      window.location.href = `/posts/${randomPost.slug}`
    } catch (err) {
      console.error('랜덤 포스트 이동 실패:', err)
    }
  }

  return (
    <>
      <Seo title={post.title} description={post.content.slice(0, 150)} />
      <article className="single-post page-container">
        <h1 className="text-xl font-bold">{post.title}</h1>
        {post.subtitle && <h2 className="subtitle mt-0">{post.subtitle}</h2>}
       
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
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
          {post.content}
        </ReactMarkdown>
        {post.series_name && post.series_slug && (
          <span className="text-sm mt-6 text-gray-600 px-0 py-1 inline-block">
            from the{' '}
            <a href={`/series/${post.series_slug}`}>
              {"'"}
              {post.series_name}
              {"'"}
            </a>{' '}
            series
          </span>
        )}
        {/* 공유 버튼 추가 */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="default-button"
          >
            🔗 공유
          </button>
          <button
            onClick={handleLuckyClick}
            className="default-button"
          >
            {"🍀 I'm Feeling Lucky!"}
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
    .eq('is_external', false)

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
    .eq('is_external', false)
    .single()

  if (!post) {
    return { notFound: true }
  }

  let series_name = null
  let series_slug = null
  if (post.series_id) {
    const { data: series } = await supabase
      .from('series')
      .select('series_name, slug') // ✅ 'slug' 그대로 유지
      .eq('id', post.series_id)
      .single()

    if (series) {
      series_name = series.series_name
      series_slug = series.slug // ✅ JavaScript에서 직접 필드명을 변경
    }
  }

  return {
    props: { post: { ...post, series_name, series_slug } },
    revalidate: 60, // ISR (60초마다 새로운 데이터 반영)
  }
}
