import { useRouter } from 'next/router'
import Head from 'next/head'

type SeoProps = {
  title?: string
  description?: string
  image?: string
  url?: string
  type?: 'website' | 'article'
}

export default function Seo({
  title,
  description = '김도화의 블로그입니다. 이것저것 쓰고 싶은 글을 씁니다.',
  image = 'https://blog.dowha.kim/default-og-image.png',
  url,
  type,
}: SeoProps) {
  const siteTitle = "Dowha's Blog"
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle

  const router = useRouter()
  const currentUrl = `https://blog.dowha.kim${router.asPath}`
  const is404 = router.pathname === '/404'

  const ogType =
    type || (router.pathname.startsWith('/posts/') ? 'article' : 'website')

  if (is404) {
    return null
  }

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url || currentUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url || currentUrl} />
      <meta property="og:type" content={ogType} />

      {/* Twitter Card */}
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:card" content="summary_large_image" />
    </Head>
  )
}
