import { supabase } from '@/supabase'
import { GetStaticPaths, GetStaticProps } from 'next'
import Link from 'next/link'
import Head from 'next/head'

type SeriesRecord = {
  id: string
  series_name: string
  slug: string
  theme_color: string
  description: string
  status: string
}

type Post = {
  title: string
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
      <Head>
        <title>
          {series.series_name} | {"Dowha's Blog"}
        </title>
        <meta name="description" content={series.description.slice(0, 150)} />
      </Head>

      <article className="series w-full pl-0 pt-6 pb-16 mobile:pt-0 mobile:pl-6 sm:pl-10 md:pl-14">
        <h1 className="text-xl font-bold">{series.series_name}</h1>
        {series.description && (
          <div
            className="flex items-start py-2 px-3 rounded-lg"
            style={{
              backgroundColor: `${series.theme_color}4D`
            }}
          >
            <span className="mr-2">💬</span> {/* 이모지 아이콘 */}
            <div className="leading-relaxed">{series.description}</div>
          </div>
        )}

        <div className="mt-6 space-y-2">
          {posts.length > 0 ? (
            posts.map((post, index) => (
              <div
                key={post.slug}
                className="flex items-center justify-between"
              >
                <Link
                  href={`/posts/${post.slug}`}
                  className="flex items-center hover:underline hover:text-[theme_color]"
                >
                  {/* 인덱스 번호를 (1), (2) 형식으로 표기 */}({index + 1}
                  )&nbsp;{post.title}
                </Link>
                <span className="text-sm text-gray-500 font-mono whitespace-nowrap">
                  {new Date(post.created_at)
                    .toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                    })
                    .replace(/\. /g, '/')
                    .replace(/\.$/, '')}
                </span>
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
    console.error('Error fetching series slugs:', error)
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
    .select('title, slug, created_at')
    .eq('series_id', seriesData.id)
    .eq('is_external', false)
    .order('created_at', { ascending: true })

  if (postsError) {
    console.error('Error fetching series posts:', postsError)
  }

  return {
    props: {
      series: seriesData,
      posts: postsData || [],
    },
    revalidate: 60,
  }
}
