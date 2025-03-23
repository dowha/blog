import { useState } from 'react'
import { supabase } from '@/supabase'
import { GetStaticProps, GetStaticPaths } from 'next'
import MarkdownContent from '@/components/MarkdownContent'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Copyright from '@/components/Copyright'
import Seo from '@/components/Seo'
import {
  ScrollToTopButton,
  LuckyPostButton,
  CopyLinkButton,
  ClapButton,
} from '@/components/ActionButtons'

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
    updated_at: string
  }
  posts?: { title: string; slug: string; subtitle?: string }[]
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
            <a href={`/series/${post.series_slug}`} className="no-underline">
              {post.series_name}
            </a>
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
        components={{
          p: ({ children }) => (
            <p className="text-sm mt-2 series-list">{children}</p>
          ),
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
                className={`no-underline ${
                  p.slug === post.slug ? 'font-semibold' : ''
                }`}
              >
                <span className="font-mono">{index + 1}</span>
                {'.'}&nbsp;{p.title}
                {p.subtitle && ': ' + p.subtitle}
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
  prevPost,
  nextPost,
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
    updated_at: string
  }
  posts: { title: string; slug: string }[]
  prevPost: { slug: string; title: string } | null
  nextPost: { slug: string; title: string } | null
}) {
  if (!post) return <p>Post not found.</p>

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
            .replace(/\s/g, '')}{' '}
          {post.updated_at && (
            <>
              <span className="text-xs">
                {'🔄'}&thinsp;{'Last updated: '}
                {new Date(post.updated_at)
                  .toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                  })
                  .replace(/\s/g, '')}
              </span>
            </>
          )}
        </p>
        <div className="flex justify-between mt-8 text-sm">
          {prevPost ? (
            <a
              href={`/posts/${prevPost.slug}`}
              className="group hover:underline"
            >
              <span>←</span>
              <span className="hidden sm:inline opacity-0 transition-opacity duration-300 ease-in group-hover:opacity-100">
                {prevPost.title}
              </span>
            </a>
          ) : (
            <span className="group cursor-not-allowed">
              <span className="text-gray-400">←</span>
              <span className="hidden sm:inline opacity-0 transition-opacity duration-300 ease-in group-hover:opacity-100 text-gray-400">
                이전 글 없음
              </span>
            </span>
          )}
          {nextPost ? (
            <a
              href={`/posts/${nextPost.slug}`}
              className="group hover:underline"
            >
              <span className="hidden sm:inline opacity-0 transition-opacity duration-300 ease-in group-hover:opacity-100">
                {nextPost.title}
              </span>
              <span>→</span>
            </a>
          ) : (
            <span className="group cursor-not-allowed">
              <span className="hidden sm:inline opacity-0 transition-opacity duration-300 ease-in group-hover:opacity-100 text-gray-400">
                다음 글 없음
              </span>
              <span className="text-gray-400">→</span>
            </span>
          )}
        </div>

        <MarkdownContent content={post.content} />

        {post.series_name && post.series_slug && (
          <SeriesPosts post={post} posts={[...posts]} />
        )}
        <div className="flex items-center gap-2 mt-4">
          <ScrollToTopButton />
          <LuckyPostButton />
          <CopyLinkButton slug={post.slug} />
          <ClapButton postId={post.id} />
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
      .select('title, slug, subtitle')
      .eq('series_id', post.series_id)
      .eq('status', 'public')

    posts = seriesPosts || []
  }

  const { data: prevPostData } = await supabase
    .from('posts')
    .select('slug, title')
    .eq('status', 'public')
    .eq('is_external', false)
    .lt('created_at', post.created_at)
    .order('created_at', { ascending: false })
    .limit(1)

  // 다음 글 가져오기
  const { data: nextPostData } = await supabase
    .from('posts')
    .select('slug, title')
    .eq('status', 'public')
    .eq('is_external', false)
    .gt('created_at', post.created_at)
    .order('created_at', { ascending: true })
    .limit(1)

  return {
    props: {
      post: { ...post, ...series },
      posts,
      prevPost: prevPostData && prevPostData[0] ? prevPostData[0] : null,
      nextPost: nextPostData && nextPostData[0] ? nextPostData[0] : null,
    },
    revalidate: 60,
  }
}
