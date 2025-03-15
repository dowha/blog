import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/supabase'
import Seo from '@/components/Seo'

// post_likes 테이블에서 post_id만 가져올 때의 타입 정의
type PostLike = {
  post_id: string // Supabase에서 post_id가 uuid라면 string 타입으로 간주
}

async function fetchMostLikedPosts() {
  // 1. post_likes 테이블에서 post_id만 전부 가져오기
  const { data: allLikes, error: likesError } = await supabase
    .from('post_likes')
    .select('post_id')

  if (likesError || !allLikes || allLikes.length === 0) {
    return null
  }

  // 2. JS에서 post_id 개수 집계
  const postCountMap = allLikes.reduce(
    (acc: Record<string, number>, like: PostLike) => {
      acc[like.post_id] = (acc[like.post_id] || 0) + 1
      return acc
    },
    {}
  )

  let mostLikedPostIds: string[] = []
  let maxCount = 0

  for (const [id, count] of Object.entries(postCountMap)) {
    if (count > maxCount) {
      mostLikedPostIds = [id] // 새로운 최댓값이면 초기화
      maxCount = count
    } else if (count === maxCount) {
      mostLikedPostIds.push(id) // 같은 개수면 추가
    }
  }

  if (mostLikedPostIds.length === 0) {
    return null
  }

  // 3. 해당 post_id의 posts 정보 가져오기
  const { data: postData, error: postError } = await supabase
    .from('posts')
    .select('title, slug')
    .in('id', mostLikedPostIds) // 🔥 `.eq()` 대신 `.in()` 사용
    .order('id', { ascending: true }) // 정렬 추가 (필요에 따라 변경 가능)

  if (postError || !postData || postData.length === 0) {
    return null
  }

  return postData // 여러 개의 데이터를 반환하도록 수정
}

export default function Home() {
  const [mostLikedPosts, setMostLikedPosts] = useState<
    { title: string; slug: string }[] | null
  >(null)

  useEffect(() => {
    async function getMostLikedPosts() {
      const posts = await fetchMostLikedPosts()
      if (posts) {
        setMostLikedPosts(posts)
      }
    }

    getMostLikedPosts()
  }, [])

  return (
    <>
      <Seo />
      <article className="page-container">
        <h1 className="text-xl font-bold">{"Dowha's Blog"}</h1>
        <p className="mt-4 index-contents text-keepall">
          이것저것 쓰고 싶은 글을 씁니다. 부담감을 줄이고{' '}
          <strong>꾸준하게</strong> 쓰는 것이 목표입니다.{' '}
          <br className="hidden md:block" />
          질문이나 피드백, 협업 제안 등은{' '}
          <a
            href="https://letterbird.co/hello-dowha"
            target="_blank"
            rel="noopener"
          >
            메일 폼
          </a>
          을 통해서 연락해 주세요.
        </p>

        {/* 가장 좋아요 많은 글 표시 */}
        {mostLikedPosts && mostLikedPosts.length > 0 && (
          <div className="mt-6 bg-gray-100 py-2 px-3 rounded-lg">
            <p className="font-semibold mt-0"><span className="mr-1">👏</span>가장 응원받은 글</p>
            <ul>
              {mostLikedPosts.map((post) => (
                <li key={post.slug}>
                  <Link href={`/posts/${post.slug}`} className="block text-sm">
                    {post.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </article>
    </>
  )
}
