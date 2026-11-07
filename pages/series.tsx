import { supabase } from '@/supabase'
import { fetchPageIntro, introToText } from '@/lib/pageIntro'
import { GetStaticProps } from 'next'
import Link from 'next/link'
import Seo from '@/components/Seo'
import { useDeskShortcut } from '@/components/desk/useDeskShortcut'

type SeriesRecord = {
  series_name: string
  slug: string
  theme_color: string // 추가된 컬럼
  emoji: string // 추가된 컬럼
}

type Props = {
  series: SeriesRecord[]
  intro: string
}

export default function SeriesPage({ series, intro }: Props) {
  // 소유자 로그인 시 제목 더블클릭으로 /desk 진입
  const deskShortcut = useDeskShortcut('series')
  return (
    <>
      <Seo title="Series" description={introToText(intro)} />
      <article className="series-list page-container">
        <h1 className="font-bold" {...deskShortcut}>
          Series
        </h1>
        <p className="mt-4 text-keepall" dangerouslySetInnerHTML={{ __html: intro }} />
        {series.length > 0 && (
          <div className="mt-6 border-t border-gray-300">
            {series.map((item) => (
              <Link
                key={item.slug}
                href={`/series/${item.slug}`}
                className="relative flex items-center justify-between border-b border-gray-300 py-2 font-semibold no-underline transition duration-300 group"
              >
                {/* Hover 시 배경색을 적용할 오버레이 */}
                <span
                  className="absolute inset-0 transition duration-300 opacity-0 group-hover:opacity-100"
                  style={{
                    backgroundColor: item.theme_color || 'transparent',
                  }}
                ></span>

                {/* 시리즈 이름 */}
                <h2 className="pl-2 pr-4 relative z-10 group-hover:text-gray-800">
                  <span className="mr-1">{item.emoji}</span>{item.series_name}
                </h2>

                {/* 오른쪽 화살표 (기본적으로 숨겨져 있다가 hover 시 표시) */}
                <span className="absolute group-hover:text-gray-800 right-4 opacity-0 group-hover:opacity-100 transition duration-300">
                  →
                </span>
              </Link>
            ))}
          </div>
        )}
      </article>
    </>
  )
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const intro = await fetchPageIntro('series')
  const { data: series, error } = await supabase
    .from('series')
    .select('series_name, slug, theme_color, emoji') // 새로운 컬럼 포함
    .eq('is_published', true)
    // series엔 created_at이 없어 이름순으로 고정한다(정렬이 없으면 순서가 보장되지 않음)
    .order('series_name', { ascending: true })

  if (error || !series) {
    return { props: { series: [], intro }, revalidate: 60 }
  }

  return {
    props: { series, intro },
    revalidate: 60,
  }
}
