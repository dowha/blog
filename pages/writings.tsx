import { supabase } from '@/supabase'
import { useState } from 'react'
import Link from 'next/link'
import Seo from '@/components/Seo'
import Image from 'next/image'
import { LoadMoreButton } from '@/components/ActionButtons'

type Post = {
  title: string
  subtitle: string
  slug: string
  created_at: string
  is_external: boolean
  external_url?: string
  source_name?: string
}

export async function getStaticProps() {
  const LIMIT = 10
  const { data: posts, error } = await supabase
    .from('posts')
    .select(
      'title, subtitle, created_at, slug, is_external, external_url, source_name'
    )
    .eq('status', 'public')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching posts:', error)
    return { props: { initialPosts: [] }, revalidate: 60 }
  }

  return {
    props: { initialPosts: posts.slice(0, LIMIT), allPosts: posts },
    revalidate: 60,
  }
}

export default function WritingPage({
  initialPosts,
  allPosts,
}: {
  initialPosts: Post[]
  allPosts: Post[]
}) {
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [offset, setOffset] = useState(initialPosts.length)
  const LIMIT = 10

  const loadMorePosts = () => {
    const newOffset = offset + LIMIT
    setPosts(allPosts.slice(0, newOffset))
    setOffset(newOffset)
  }

  const currentYear = new Date().getFullYear()

  const groupedPosts = posts.reduce((acc, post) => {
    const year = new Date(post.created_at).getFullYear()
    if (!acc[year]) acc[year] = []
    acc[year].push(post)
    return acc
  }, {} as Record<number, Post[]>)

  const descriptionText = `글 목록입니다.`

  return (
    <>
      <Seo title="Writings" description={descriptionText} />
      <article className="post-list page-container">
        <h1 className="text-xl font-bold flex items-center">
          Writings
          <a
            href="/api/rss"
            target="_blank"
            rel="noopener"
            className="relative ml-1 w-4 h-4 inline-block"
          >
            {/* 기본 아이콘 */}
            <Image
              src="/rss.svg"
              alt="RSS"
              width={16}
              height={16}
              className="absolute inset-0 transition-opacity duration-300 hover:opacity-0"
            />
            {/* Hover 시 나타날 주황색 아이콘 */}
            <Image
              src="/rss-hover.svg" // ✅ 주황색 버전의 아이콘을 별도로 저장
              alt="RSS"
              width={16}
              height={16}
              className="absolute inset-0 opacity-0 transition-opacity duration-300 hover:opacity-100"
            />
          </a>
        </h1>

        {Object.entries(groupedPosts)
          .sort(([a], [b]) => parseInt(b) - parseInt(a))
          .map(([year, posts]) => (
            <section key={year} className="mt-6">
              <h2 className="font-semibold font-mono text-gray-600">
                {Number(year) === currentYear ? '' : year}
              </h2>
              <div className="mt-2 space-y-2">
                {posts.map((post) => (
                  <div
                    key={post.slug}
                    className="flex items-start justify-between"
                  >
                    {post.is_external && post.external_url ? (
                      <a
                        href={post.external_url}
                        target="_blank"
                        rel="noopener"
                        className="inline-flex items-start space-x-2 cursor-alias"
                      >
                        {post.source_name && (
                          <div className="relative group">
                            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md">
                              {post.source_name.charAt(0)}
                            </span>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:flex items-center justify-center bg-gray-800 text-white text-xs rounded py-1 px-2 w-max max-w-xs">
                              원문 링크: {post.source_name}
                            </div>
                          </div>
                        )}
                        <h2>{post.title}</h2>
                      </a>
                    ) : (
                      <Link
                        href={`/posts/${post.slug}`}
                        className="flex items-center"
                      >
                        <h2 className="full-title group">
                          {post.title}
                          {post.subtitle && (
                            <span className="subtitle relative text-sm">
                              {': '}
                              {post.subtitle}
                            </span>
                          )}
                        </h2>
                      </Link>
                    )}
                    <div className="pl-1 py-0.5 sm:py-0">
                      <span className="text-xs sm:text-sm text-gray-500 font-mono whitespace-nowrap">
                        {new Date(post.created_at)
                          .toLocaleDateString('ko-KR', {
                            month: '2-digit',
                            day: '2-digit',
                          })
                          .replace(/\s/g, '')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        {/* 더 보기 버튼 or 위로 가기 버튼 */}
        <LoadMoreButton
          loadMore={loadMorePosts}
          hasMore={offset < allPosts.length}
        />
      </article>
    </>
  )
}
