import { Html, Head, Main, NextScript } from 'next/document'
import Footer from '@/components/Footer'

export default function Document() {
  return (
    <Html lang="ko">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Safari에서 상태 바 색상 설정 */}
        <meta name="theme-color" content="#FCFCFC" />
        {/* PWA 설정 (전체 화면 표시) */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />

        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </Head>
      <body className="flex min-h-screen antialiased">
        <Main />
        <NextScript />
        <Footer />
      </body>
    </Html>
  )
}
