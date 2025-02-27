import { useState, useEffect } from 'react'
import { supabase } from '@/supabase'
import { GetStaticProps, GetStaticPaths } from 'next'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import Copyright from '@/components/Copyright'
import Seo from '@/components/Seo'

function SeriesPosts({
  post,
  posts = [],
}: {
  post: {
    title: string
    subtitle?: string
    content: string
    created_at: string
    series_name?: string
    series_slug?: string
    slug: string
    description?: string
    theme_color: string
  }
  posts?: { title: string; slug: string }[]
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className="p-4 rounded-lg mt-6 cursor-pointer"
      style={{
        backgroundColor: `${post.theme_color}4D`,
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex justify-between items-center">
        {/* series name과 페이지 번호를 하나의 그룹으로 묶음 */}
        <div className="flex items-center">
          <span className="text-md font-semibold">
            <a href={`/series/${post.series_slug}`}>{post.series_name}</a>
          </span>
          {posts.length > 1 && (
            <span className="text-sm font-mono ml-2">
              ({posts.findIndex((p) => p.slug === post.slug) + 1}/{posts.length}
              )
            </span>
          )}
        </div>
        {/* svg 아이콘은 오른쪽 끝에 위치 */}
        <svg
          className={`h-4 w-4 transform transition-transform duration-200 ${
            expanded ? 'rotate-180' : ''
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 12a1 1 0 01-.707-.293l-5-5a1 1 0 111.414-1.414L10 9.586l4.293-4.293a1 1 0 111.414 1.414l-5 5A1 1 0 0110 12z"
            clipRule="evenodd"
          />
        </svg>
      </div>

      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          p: ({ ...props }) => <p {...props} className="text-sm mt-2" />,
        }}
      >
        {post.description}
      </ReactMarkdown>

      {!expanded ? (
        <span></span>
      ) : (
        <div className="border-t border-gray-300 mt-2 pt-2 text-sm">
          {posts.map((p, index) => (
            <div key={p.slug} className="flex items-start">
              <a
                href={`/posts/${p.slug}`}
                className={p.slug === post.slug ? 'font-semibold' : ''}
              >
                <span className="font-mono">{index + 1}</span>
                {'.'}&nbsp;{p.title}
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function PostPage({
  post,
  posts,
}: {
  post: {
    title: string
    subtitle?: string
    content: string
    created_at: string
    series_name?: string
    series_slug?: string
    slug: string
    id: string // ✅ UUID 타입
    description?: string
    theme_color: string
  }
  posts: { title: string; slug: string }[]
}) {
  const [claps, setClaps] = useState(0)

  useEffect(() => {
    if (!post?.id) return

    async function fetchClaps() {
      if (!post?.id) {
        return
      }

      const { count, error } = await supabase
        .from('post_likes')
        .select('*', { count: 'exact' }) // ✅ 정확한 COUNT 조회
        .eq('post_id', post.id)

      if (error) {
        return
      }

      setClaps(count ?? 0)
    }

    fetchClaps() // ✅ 무한 루프 방지
  }, [post.id]) // ✅ post.id가 변경될 때 실행

  async function handleClap() {
    if (!post?.id) return

    const { error } = await supabase
      .from('post_likes')
      .insert([{ post_id: post.id }]) // ✅ Supabase가 직접 제한 관리

    if (error) {
      alert('박수를 너무 빠르게 눌렀습니다. 잠시 후 다시 시도하세요.')
      return
    }

    setClaps((prev) => prev + 1)
  }

  if (!post) return <p>Post not found.</p>

  const handleCopy = async () => {
    try {
      const shareUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}/posts/${post.slug}?type=share`
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

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
          <SeriesPosts post={post} posts={posts || []} />
        )}
        <div className="flex items-center gap-2 mt-4">
          <button onClick={handleScrollToTop} className="default-button">
            ⬆️ 처음으로
          </button>
          <button onClick={handleClap} className="default-button">
            👏 응원하기({claps})
          </button>
          <button onClick={handleCopy} className="default-button">
            🔗 공유하기
          </button>
          <button onClick={handleLuckyClick} className="default-button">
            {"🍀 I'm Feeling Lucky!"}
          </button>
        </div>
      </article>
      <Copyright />
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const { data: posts } = await supabase
    .from('posts')
    .select('slug')
    .eq('status', 'public')
    .eq('is_external', false)

  const paths = posts?.map((post) => ({ params: { slug: post.slug } })) || []
  return { paths, fallback: 'blocking' }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  if (!params?.slug || typeof params.slug !== 'string') {
    return { notFound: true }
  }

  const { data: post } = await supabase
    .from('posts')
    .select('*, series:series_id (series_name, slug, description, theme_color)')
    .eq('slug', params.slug)
    .eq('status', 'public')
    .eq('is_external', false)
    .single()

  if (!post) {
    return { notFound: true }
  }

  let posts: { title: string; slug: string }[] = []
  let series = null
  if (post.series) {
    series = {
      series_name: post.series.series_name,
      series_slug: post.series.slug,
      description: post.series.description,
      theme_color: post.series.theme_color,
    }
  }
  if (post.series_id) {
    const { data: seriesPosts } = await supabase
      .from('posts')
      .select('title, slug')
      .eq('series_id', post.series_id)
      .eq('status', 'public')

    posts = seriesPosts || []
  }

  return {
    props: { post: { ...post, ...series }, posts },
    revalidate: 60,
  }
}
