import { useState } from 'react'
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
      className="bg-white p-4 rounded-lg mt-6 cursor-pointer"
      style={{
        backgroundColor: `${post.theme_color}4D`,
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <span className="text-md font-semibold">
        <a href={`/series/${post.series_slug}`}>{post.series_name}</a></span><span>
        {posts.length > 1 && (
          <span className="text-sm font-mono">
            ({posts.findIndex((p) => p.slug === post.slug) + 1}/{posts.length}
            )
          </span>
        )}
      </span>
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
                <span className="font-mono">{index + 1}</span>{'.'}&nbsp;
                {p.title}
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
    description?: string
    theme_color: string
  }
  posts: { title: string; slug: string }[]
}) {
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
