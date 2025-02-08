import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import Layout from '@/components/Layout'
import Head from 'next/head'
import { useRouter } from 'next/router'

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter()

  // 기본 타이틀
  let pageTitle = "Dowha's Blog"

  // 경로에 따라 타이틀 설정
  if (router.pathname === '/writings') pageTitle = "Writings | Dowha's Blog"
  else if (router.pathname === '/records') pageTitle = "Records | Dowha's Blog"
  else if (router.pathname === '/series') pageTitle = "Series | Dowha's Blog"

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={"이것저것 쓰고 싶은 글들을 씁니다."} />
      </Head>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </>
  )
}
