import Head from 'next/head'
import { useRouter } from 'next/router'

type SeoProps = {
  title?: string
  description?: string
  image?: string
  url?: string
  type?: "website" | "article"  // ✅ 타입을 직접 지정할 수 있도록 추가
}

export default function Seo({
  title,
  description = "이것저것 쓰고 싶은 글을 씁니다.",
  image = "https://blog.dowha.kim/default-og-image.png",
  url,
  type, // ✅ 수동 설정 가능
}: SeoProps) {
  const siteTitle = "Dowha's Blog"
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle

  const router = useRouter()
  const currentUrl = `https://dowha.kim${router.asPath}`

  // ✅ 기본적으로 website, 특정 경로에서는 article로 자동 설정
  const ogType = type || (router.pathname.startsWith("/posts/") ? "article" : "website")

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url || currentUrl} />
      <meta property="og:type" content={ogType} /> {/* ✅ 동적 설정 */}

      {/* Twitter Card */}
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:card" content="summary_large_image" />
    </Head>
  )
}