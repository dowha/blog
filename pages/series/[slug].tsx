import { supabase } from '@/supabase'
import { GetStaticPaths, GetStaticProps } from 'next'
import Link from 'next/link'
import Seo from '@/components/Seo'
import MarkdownContent from '@/components/MarkdownContent'

type SeriesRecord = {
  id: string
  series_name: string
  slug: string
  theme_color: string
  description: string
  status: string
  emoji: string
}

type Post = {
  title: string
  subtitle: string
  slug: string
  created_at: string
}

type Props = {
  series: SeriesRecord
  posts: Post[]
}

export default function SeriesDetailPage({ series, posts }: Props) {
  return (
    <>
      <Seo
        title={series.series_name}
        description={series.description.slice(0, 150)}
      />
      <article className="series page-container">
        <h1 className="text-xl font-bold">{series.series_name}</h1>
        {series.description && (
          <div
            className="flex items-center py-2 px-3 rounded-lg"
            style={{
              backgroundColor: `${series.theme_color}4D`,
            }}
          >
            <span className="mr-1 self-start">{series.emoji}</span>
            {/* 이모지 아이콘 */}
            <div className="leading-relaxed text-keepall series-list">
              <MarkdownContent content={series.description} />
            </div>
          </div>
        )}

        <div className="mt-6 space-y-2">
          {posts.length > 0 ? (
            posts.map((post, index) => (
              <div key={post.slug} className="flex items-start justify-between">
                <Link
                  href={`/posts/${post.slug}`}
                  className="flex items-start hover:underline"
                >
                  <h2 className="full-title group">
                    <span className="font-mono">{index + 1}</span>
                    {'.'}&nbsp;{post.title}
                    {post.subtitle && (
                      <span className="subtitle relative text-sm">
                        {': '}
                        {post.subtitle}
                      </span>
                    )}
                  </h2>
                </Link>
                <div className="pl-1 py-0.5 sm:py-0">
                  <span className="text-xs sm:text-sm text-gray-500 font-mono whitespace-nowrap">
                    {new Date(post.created_at)
                      .toLocaleDateString('ko-KR', {
                        year: '2-digit',
                        month: '2-digit',
                        day: '2-digit',
                      })
                      .replace(/\s/g, '')}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p></p>
          )}
        </div>
      </article>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const { data: seriesData, error } = await supabase
    .from('series')
    .select('slug')
    .eq('status', 'public')

  if (error) {
    console.error('시리즈 슬러그를 가져오는 중 오류 발생:', error)
    return { paths: [], fallback: 'blocking' }
  }

  const paths =
    (seriesData || []).map((item: { slug: string }) => ({
      params: { slug: item.slug },
    })) || []

  return {
    paths,
    fallback: 'blocking',
  }
}

export const getStaticProps: GetStaticProps<Props> = async (context) => {
  const slug = context.params?.slug as string

  // public 상태에 맞는 시리즈 정보를 가져옵니다.
  const { data: seriesData, error: seriesError } = await supabase
    .from('series')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'public')
    .single()

  if (seriesError || !seriesData) {
    return { notFound: true }
  }

  // 시리즈 id와 is_external이 false인 게시물만 가져옵니다.
  const { data: postsData, error: postsError } = await supabase
    .from('posts')
    .select('title, subtitle, slug, created_at')
    .eq('series_id', seriesData.id)
    .eq('is_external', false)
    .order('created_at', { ascending: true })

  if (postsError) {
    console.error('시리즈 게시물을 가져오는 중 오류 발생:', postsError)
  }

  return {
    props: {
      series: seriesData,
      posts: postsData || [],
    },
    revalidate: 60,
  }
}
