import { supabase } from '@/supabase'
import { GetStaticProps } from 'next'
import Link from 'next/link'
import Seo from '@/components/Seo'

type SeriesRecord = {
  series_name: string
  slug: string
  theme_color: string // 추가된 컬럼
  emoji: string // 추가된 컬럼
}

type Props = {
  series: SeriesRecord[]
}

const descriptionText = `특별히 엮어둔 글 목록입니다. 의도적으로 한 주제 아래 쓴 글들도, 쓰고 보니 우연히 묶인 글들도 있습니다. 부디 재밌게 읽어주세요.`

export default function SeriesPage({ series }: Props) {
  return (
    <>
      <Seo title="Series" description="{descriptionText}" />
      <article className="series-list page-container">
        <h1 className="text-xl font-bold">Series</h1>
        <p className="mt-4 text-keepall">{descriptionText}</p>
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
              <h2 className="pl-2 pr-4 relative z-10">
                <span className="mr-1">{item.emoji}</span>{item.series_name}
              </h2>

              {/* 오른쪽 화살표 (기본적으로 숨겨져 있다가 hover 시 표시) */}
              <span className="absolute right-4 opacity-0 group-hover:opacity-100 transition duration-300">
                →
              </span>
            </Link>
          ))}
        </div>
      </article>
    </>
  )
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const { data: series, error } = await supabase
    .from('series')
    .select('series_name, slug, theme_color, emoji') // 새로운 컬럼 포함
    .eq('status', 'public')

  if (error || !series) {
    return { props: { series: [] } }
  }

  return {
    props: { series },
    revalidate: 60,
  }
}
