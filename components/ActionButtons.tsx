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

  return <Button onClick={handleLuckyClick} icon="🍀" label="발길 닿는 대로" />
}

export const CopyLinkButton = ({
  slug,
  isRecordPage = false,
}: {
  slug: string
  isRecordPage?: boolean
}) => {
  const handleCopy = async () => {
    try {
      const shareUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}${
              isRecordPage
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

export const ClapButton = ({ postId }: { postId: string }) => {
  const [claps, setClaps] = useState(0)

  useEffect(() => {
    if (!postId) return

    async function fetchClaps() {
      const { count, error } = await supabase
        .from('post_likes')
        .select('*', { count: 'exact' })
        .eq('post_id', postId)

      if (!error) {
        setClaps(count ?? 0)
      }
    }

    fetchClaps()
  }, [postId])

  const handleClap = async () => {
    if (!postId) return

    const { error } = await supabase
      .from('post_likes')
      .insert([{ post_id: postId }])

    if (error) {
      alert('과분한 응원 감사합니다. 잠시 쉬었다가 응원해 주세요.')
      return
    }

    setClaps((prev) => prev + 1)
  }

  return (
    <Button
      onClick={handleClap}
      icon="👏"
      label={claps > 0 ? `응원하기 (${claps})` : '첫 번째로 응원하기!'}
    />
  )
}
