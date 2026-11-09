import Head from 'next/head'

/** 인용구 글꼴(Gowun Dodum). 인용구가 있는 페이지에서만 불러온다 (첫 페이지·목록은 받지 않음) */
const QUOTE_FONT_URL = 'https://fonts.googleapis.com/css2?family=Gowun+Dodum&display=swap'

/** 마크다운에 인용구(> 문장 또는 <blockquote>)가 있는지 */
export const hasBlockquote = (md: string | null | undefined) =>
  !!md && (/^ {0,3}>/m.test(md) || /<blockquote[\s>]/i.test(md))

export default function QuoteFont() {
  // key로 한 페이지에 여러 번 써도 한 번만 들어간다
  return (
    <Head>
      <link key="quote-font-preconnect" rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link key="quote-font" rel="stylesheet" href={QUOTE_FONT_URL} />
    </Head>
  )
}
