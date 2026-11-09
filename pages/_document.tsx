import { Html, Head, Main, NextScript, type DocumentProps } from 'next/document'

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID

// 영어로 쓴 글·리뷰 페이지는 <html lang="en"> (posts.lang, books.lang). 나머지는 한국어
function pageLang(props: DocumentProps): string {
  const pageProps = props.__NEXT_DATA__?.props?.pageProps
  return pageProps?.post?.lang === 'en' || pageProps?.book?.lang === 'en' ? 'en' : 'ko'
}

export default function Document(props: DocumentProps) {
  return (
    <Html lang={pageLang(props)}>
      <Head>
        {/* 글꼴: CSS @import 대신 head에서 바로 요청하고, 글꼴 파일을 받을 CDN에 미리 연결한다 (dowha.kim과 동일) */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
        {/* Viewport 설정 (iPhone의 notch 대응) */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        {/* Safari에서 상태 바 색상 설정 */}
        {/* tailwind page 색과 같은 값 */}
        <meta name="theme-color" content="#FCFCFC" />
        {/* PWA 설정 (전체 화면 표시) */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        {/* Favicon */}
        {/* SVG를 우선 쓰고(고해상도에서도 선명), 지원하지 않는 브라우저는 ico로 대체 */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link
          rel="icon"
          type="image/png"
          sizes="192x192"
          href="/android-chrome-192x192.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="512x512"
          href="/android-chrome-512x512.png"
        />
        <link rel="alternate" type="application/rss+xml" title="Dowha's Blog" href="/api/rss" />
      </Head>
      <body>
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
