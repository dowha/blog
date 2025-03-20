// components/ActionButtons.tsx
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/supabase'
import Button from './Button'

export const HomeButton = () => {
  const router = useRouter()

  return <Button onClick={() => router.push('/')} icon="🏠" label="처음으로" />
}

export const ScrollToTopButton = () => {
  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  return <Button onClick={handleScrollToTop} icon="⬆️" label="처음으로" />
}

export const LoadMoreButton = ({
  loadMore,
  hasMore,
}: {
  loadMore: () => void
  hasMore: boolean
}) => {
  return hasMore ? (
    <Button onClick={loadMore} icon="➕" label="더 보기" />
  ) : (
    <ScrollToTopButton />
  )
}

export const LuckyPostButton = () => {
  const handleLuckyClick = async () => {
    try {
      // posts와 books에서 slug 가져오기
      const { data: posts, error: postError } = await supabase
        .from('posts')
        .select('slug')
        .eq('status', 'public')
        .eq('is_external', false)

      const { data: books, error: bookError } = await supabase
        .from('books')
        .select('slug')
        .not('content', 'is', null)

      if (postError || bookError) {
        throw postError || bookError
      }

      const allContent = [
        ...(posts?.map((post) => ({
          slug: `/posts/${post.slug}`,
          type: 'post',
        })) || []),
        ...(books?.map((book) => ({
          slug: `/books/${book.slug}`,
          type: 'book',
        })) || []),
      ]

      if (allContent.length === 0) {
        alert('게시물이 없습니다.')
        return
      }

      const randomContent =
        allContent[Math.floor(Math.random() * allContent.length)]
      window.location.href = randomContent.slug
    } catch (err) {
      console.error('랜덤 콘텐츠 이동 실패:', err)
    }
  }

  return <Button onClick={handleLuckyClick} icon="🍀" label="발길 닿는 대로" />
}

export const CopyLinkButton = ({
  slug,
  isRecordPage = false,
  isBookPage = false,
}: {
  slug: string
  isRecordPage?: boolean
  isBookPage?: boolean
}) => {
  const handleCopy = async () => {
    try {
      const shareUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}${
              isBookPage
                ? `/books/${slug}?type=share`
                : isRecordPage
                ? `/records#${slug}?type=share`
                : `/posts/${slug}?type=share`
            }`
          : ''

      await navigator.clipboard.writeText(shareUrl)
      alert('공유 링크가 복사되었습니다.')
    } catch (err) {
      console.error('URL 복사 실패:', err)
    }
  }

  return <Button onClick={handleCopy} icon="🔗" label="공유하기" />
}

export const ClapButton = ({
  postId,
  bookId,
}: {
  postId?: string
  bookId?: string
}) => {
  const [claps, setClaps] = useState(0)

  useEffect(() => {
    if (!postId && !bookId) return // postId, bookId 둘 다 없으면 API 요청 X

    async function fetchClaps() {
      let query = supabase.from('content_likes').select('', { count: 'exact' }) // count만 가져옴

      if (postId) {
        query = query.eq('post_id', postId)
      } else if (bookId) {
        query = query.eq('book_id', bookId)
      }

      const { count, error } = await query

      if (!error) {
        setClaps(count ?? 0)
      }
    }

    fetchClaps()
  }, [postId, bookId])

  const handleClap = async () => {
    if (!postId && !bookId) return

    setClaps((prev) => prev + 1) // UI 즉시 업데이트

    const { error } = await supabase.from('content_likes').insert([
      {
        post_id: postId || null,
        book_id: bookId || null,
      },
    ])

    if (error) {
      alert('응원 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.')
      setClaps((prev) => prev - 1) // 실패 시 롤백
    }
  }

  return (
    <Button
      onClick={handleClap}
      icon="👏"
      label={claps > 0 ? `응원하기 (${claps})` : '첫 번째로 응원하기!'}
      showNumberOnlyOnMobile={true}
    />
  )
}
