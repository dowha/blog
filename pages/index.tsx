import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/supabase'
import Seo from '@/components/Seo'

// post_likes 테이블에서 post_id만 가져올 때의 타입 정의
type PostLike = {
  post_id: string // Supabase에서 post_id가 uuid라면 string 타입으로 간주
}

async function fetchMostLikedPost() {
  console.log('Fetching most liked post...')

  // 1. post_likes 테이블에서 post_id만 전부 가져오기
  const { data: allLikes, error: likesError } = await supabase
    .from('post_likes')
    .select('post_id')

  if (likesError) {
    console.error('Error fetching post_likes:', likesError)
    return null
  }

  if (!allLikes || allLikes.length === 0) {
    console.log('No liked posts found.')
    return null
  }

  // 2. JS에서 post_id 개수 집계
  // reduce 콜백의 매개변수 like에 PostLike 타입, acc에 Record<string, number> 타입 지정
  const postCountMap = allLikes.reduce(
    (acc: Record<string, number>, like: PostLike) => {
      acc[like.post_id] = (acc[like.post_id] || 0) + 1
      return acc
    },
    {}
  )

  let mostLikedPostId: string | null = null
  let maxCount = 0

  // 가장 많이 좋아요된 post_id 찾기
  for (const [id, count] of Object.entries(postCountMap)) {
    if (count > maxCount) {
      mostLikedPostId = id
      maxCount = count
    }
  }

  if (!mostLikedPostId) {
    console.log('No valid post ID found.')
    return null
  }

  // 3. 해당 post_id의 posts 정보 가져오기
  const { data: postData, error: postError } = await supabase
    .from('posts')
    .select('title, slug')
    .eq('id', mostLikedPostId)
    .single()

  if (postError) {
    console.error('Error fetching post details:', postError)
    return null
  }

  return postData
}

export default function Home() {
  const [mostLikedPost, setMostLikedPost] = useState<{
    title: string
    slug: string
  } | null>(null)

  useEffect(() => {
    async function getMostLikedPost() {
      const post = await fetchMostLikedPost()
      if (post) {
        setMostLikedPost(post)
      }
    }

    getMostLikedPost()
  }, [])

  return (
    <>
      <Seo />
      <article className="page-container">
        <h1 className="text-xl font-bold">{"Dowha's Blog"}</h1>
        <p className="mt-4 index-contents text-keepall">
          이것저것 쓰고 싶은 글을 씁니다. 부담감을 줄이고{' '}
          <strong>꾸준하게</strong> 쓰는 것이 목표입니다.
          <br className="hidden md:block" />
          질문이나 피드백, 협업 제안 등은{' '}
          <a
            href="https://letterbird.co/hello-7bc2f9f1"
            target="_blank"
            rel="noopener"
          >
            메일 폼
          </a>
          을 통해서 연락해 주세요.{' '}
        </p>

        {/* 가장 좋아요 많은 글 표시 */}
        {mostLikedPost && (
          <div className="mt-6 bg-gray-100 py-2 px-3 rounded-lg">
            <p className="font-semibold mt-0">👏 가장 응원받은 글</p>
            <ul>
              <li>
                <Link
                  href={`/posts/${mostLikedPost.slug}`}
                  className="block text-sm"
                >
                  {mostLikedPost.title}
                </Link>
              </li>
            </ul>
          </div>
        )}
      </article>
    </>
  )
}
