import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import Layout from '@/components/Layout'
import Head from 'next/head'
import Script from 'next/script'
import { useEffect } from 'react'
import { useRouter } from 'next/router'

// GTM ID 환경 변수
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || ''

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter()

  // 기본 타이틀
  let pageTitle = "Dowha's Blog"

  // 경로에 따라 타이틀 설정
  if (router.pathname === '/writings') pageTitle = "Writings | Dowha's Blog"
  else if (router.pathname === '/records') pageTitle = "Records | Dowha's Blog"
  else if (router.pathname === '/series') pageTitle = "Series | Dowha's Blog"

  // 페이지 변경 시 GA4 페이지뷰 이벤트 전송
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      window.dataLayer = window.dataLayer || []
      window.dataLayer.push({
        event: 'pageview',
        page: url,
      })
    }

    router.events.on('routeChangeComplete', handleRouteChange)
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router.events])

  return (
    <>
      {/* Google Tag Manager Script */}
      <Script
        id="gtm-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id=${GTM_ID}';f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer');
          `,
        }}
      />

      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content="이것저것 쓰고 싶은 글들을 씁니다." />
      </Head>

      <Layout>
        <Component {...pageProps} />
      </Layout>
    </>
  )
}
