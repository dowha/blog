import { supabase } from '@/supabase'
import { GetStaticProps } from 'next'
import Link from 'next/link'

type SeriesRecord = {
  series_name: string
  slug: string
  theme_color: string // 추가된 컬럼
}

type Props = {
  series: SeriesRecord[]
}

export default function SeriesPage({ series }: Props) {
  return (
    <article className="w-full pl-0 pt-6 pb-12 mobile:pt-0 mobile:pl-6 sm:pl-10 md:pl-14">
      <h1 className="text-xl font-bold">Series</h1>
      <p className="mt-4 text-keepall">특별히 묶은 글들.</p>
      <div className="mt-6 border-t border-gray-300">
        {series.map((item) => (
          <Link
            key={item.slug}
            href={`/series/${item.slug}`}
            className="relative flex items-center justify-between border-b border-gray-300 py-2 font-semibold hover:text-black no-underline transition duration-300 group"
          >
            {/* Hover 시 배경색을 적용할 오버레이 */}
            <span
              className="absolute inset-0 transition duration-300 opacity-0 group-hover:opacity-100"
              style={{
                backgroundColor: item.theme_color || 'transparent',
              }}
            ></span>

            {/* 시리즈 이름 */}
            <h2 className="pl-2 pr-4 relative z-10">{item.series_name}</h2>

            {/* 오른쪽 화살표 (기본적으로 숨겨져 있다가 hover 시 표시) */}
            <span className="absolute right-4 opacity-0 group-hover:opacity-100 transition duration-300">
              →
            </span>
          </Link>
        ))}
      </div>
    </article>
  )
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const { data: series, error } = await supabase
    .from('series')
    .select('series_name, slug, theme_color') // 새로운 컬럼 포함
    .eq('status', 'public')

  if (error || !series) {
    return { props: { series: [] } }
  }

  return {
    props: { series },
    revalidate: 60,
  }
}
