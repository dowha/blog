import Head from 'next/head'

export const SITE_URL = 'https://blog.dowha.kim'

// 사이트 공통 작성자·발행처 정보
export const AUTHOR = {
  '@type': 'Person',
  name: 'Dowha Kim',
  alternateName: '김도화',
  url: 'https://dowha.kim',
} as const

/**
 * 구조화 데이터(JSON-LD). 검색엔진이 글의 종류·작성일·작성자를 정확히 이해하도록 돕는다.
 * 본문 텍스트가 섞이므로 '<'를 이스케이프해 </script>로 태그를 닫는 주입을 막는다.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify({ '@context': 'https://schema.org', ...data }).replace(/</g, '\\u003c')
  return (
    <Head>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
    </Head>
  )
}
