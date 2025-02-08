import { supabase } from '@/supabase'
import Link from 'next/link'
import { useState, useEffect } from 'react'

type Post = {
  title: string
  slug: string
  created_at: string
  is_external: boolean
  external_url?: string
  source_name?: string
}

export default function WritingPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [visiblePosts, setVisiblePosts] = useState<Post[]>([])
  const [offset, setOffset] = useState(0)
  const LIMIT = 10

  useEffect(() => {
    async function fetchPosts() {
      const { data, error } = await supabase
        .from('posts')
        .select(
          'title, created_at, slug, is_external, external_url, source_name'
        )
        .eq('status', 'public')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching posts:', error)
        return
      }

      setPosts(data)
      setVisiblePosts(data.slice(0, LIMIT))
    }

    fetchPosts()
  }, [])

  const loadMorePosts = () => {
    const newOffset = offset + LIMIT
    setVisiblePosts(posts.slice(0, newOffset + LIMIT))
    setOffset(newOffset)
  }

  const currentYear = new Date().getFullYear() // 올해 연도 가져오기

  const groupedPosts = visiblePosts.reduce((acc, post) => {
    const year = new Date(post.created_at).getFullYear()

    if (!acc[year]) acc[year] = []
    acc[year].push(post)

    return acc
  }, {} as Record<number, Post[]>)

  return (
    <article className="w-full pl-0 pt-6 pb-12 mobile:pt-0 mobile:pl-6 sm:pl-10 md:pl-14">
      <h1 className="text-xl font-bold">Writing</h1>
      {Object.entries(groupedPosts)
        .sort(([a], [b]) => parseInt(b) - parseInt(a)) // 최신 연도 우선 정렬
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
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2"
                    >
                      {post.source_name && (
                        <div className="relative group">
                          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md cursor-help">
                            {post.source_name.charAt(0)}
                          </span>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:flex items-center justify-center bg-gray-800 text-white text-xs rounded py-1 px-2 w-max max-w-xs">
                            원문 링크: {post.source_name}
                          </div>
                        </div>
                      )}
                      <h3>{post.title}</h3>
                    </a>
                  ) : (
                    <Link
                      href={`/posts/${post.slug}`}
                      className="flex items-center"
                    >
                      <h3>{post.title}</h3>
                    </Link>
                  )}
                  <div className="py-0.5 sm:py-0">
                    <span className="text-xs sm:text-sm text-gray-500 font-mono whitespace-nowrap">
                      {new Date(post.created_at).toLocaleDateString('en-US', {
                        month: '2-digit',
                        day: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

      {/* 더 보기 버튼 */}
      {visiblePosts.length < posts.length && (
        <button
          onClick={loadMorePosts}
          className="text-xs mt-6 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-md"
        >
          더 보기
        </button>
      )}
    </article>
  )
}
