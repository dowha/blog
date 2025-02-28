import { useRouter } from 'next/router'
import { supabase } from '@/supabase'
import Head from 'next/head'

export default function Custom404() {
  const router = useRouter()
  const handleLuckyClick = async () => {
    try {
      const { data: posts, error } = await supabase
        .from('posts')
        .select('slug')
        .eq('status', 'public')
        .eq('is_external', false)

      if (error) throw error
      if (!posts || posts.length === 0) {
        alert('게시물이 없습니다.')
        return
      }

      const randomPost = posts[Math.floor(Math.random() * posts.length)]
      window.location.href = `/posts/${randomPost.slug}`
    } catch (err) {
      console.error('랜덤 포스트 이동 실패:', err)
    }
  }

  return (
    <>
      <Head>
        <title>404 Not Found | Dowha Blog</title>
        <meta
          name="description"
          content="요청하신 페이지를 찾을 수 없습니다."
        />
        <meta name="robots" content="noindex, nofollow" />
        <meta property="og:title" content="페이지를 찾을 수 없습니다" />
        <meta
          property="og:description"
          content="요청하신 페이지가 존재하지 않습니다."
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:image"
          content="https://blog.dowha.kim/default-og-image.png"
        />
        <meta property="og:url" content="https://blog.dowha.kim/404" />
        <link rel="canonical" href="https://blog.dowha.kim/404" />
      </Head>
      <article className="page-container">
        <h1 className="text-xl font-bold">404 Not Found</h1>
        <div className="mt-6 w-full mx-auto aspect-video">
          <iframe
            className="w-full h-full rounded-lg shadow-lg"
            src="https://www.youtube.com/embed/08DjMT-qR9g"
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
        <p className="mt-4">
          길을 잃으셨군요. 하지만 걱정 마세요. 저도 가끔 길을 잃곤 합니다.
          <br />
          좌측(모바일에서는 상단)의 메뉴를 통해 바른 길을 찾아주세요.
        </p>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/')} className="default-button">
            🏠 처음으로
          </button>
          <button onClick={handleLuckyClick} className="default-button">
            <span>🍀</span>
            <span className="hidden sm:inline">발길 닿는 대로</span>
          </button>
        </div>
      </article>
    </>
  )
}
