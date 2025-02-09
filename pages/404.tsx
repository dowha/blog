import { useRouter } from 'next/router'
import { supabase } from '@/supabase'

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
    <article className="w-full pl-0 pt-6 mobile:pt-0 mobile:pl-6 sm:pl-10 md:pl-14">
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
      <div className="mt-6 flex items-center gap-2">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1 text-xs px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-md"
        >
          🏠 처음으로
        </button>
        <button
          onClick={handleLuckyClick}
          className="flex items-center gap-1 text-xs px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-md"
        >
          🍀 I Feel Lucky!
        </button>
      </div>
    </article>
  )
}
