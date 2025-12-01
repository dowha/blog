// components/ActionButtons.tsx
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/supabase'
import Button from './Button'
import { toast } from 'sonner'

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
      const { data: posts, error: postError } = await supabase
        .from('posts')
        .select('slug')
        .eq('is_published', true)
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
        toast.error('공개된 콘텐츠가 없습니다.')
        return
      }

      const randomContent =
        allContent[Math.floor(Math.random() * allContent.length)]

      sessionStorage.setItem('showLuckyToast', 'true')
      window.location.href = randomContent.slug
    } catch {
      toast.error(
        '데이터를 불러오는 데 실패했습니다. 잠시 후 다시 시도해주세요.'
      )
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
          ? `${window.location.origin}${isBookPage
            ? `/books/${slug}?type=share`
            : isRecordPage
              ? `/records#${slug}?type=share`
              : `/posts/${slug}?type=share`
          }`
          : ''

      await navigator.clipboard.writeText(shareUrl)
      toast.success('공유 링크가 복사되었습니다.')
    } catch {
      toast.error('링크 복사에 실패했습니다.')
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
    if (!postId && !bookId) return

    async function fetchClaps() {
      let query = supabase.from('content_likes').select('', { count: 'exact' })

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

  const getOrCreateAnonymousId = () => {
    let anonId = localStorage.getItem('anonymous_id')
    if (!anonId) {
      anonId = crypto.randomUUID()
      localStorage.setItem('anonymous_id', anonId)
    }
    return anonId
  }

  const handleClap = async () => {
    if (!postId && !bookId) return

    setClaps((prev) => prev + 1)

    const userAgent = navigator.userAgent || null
    const referrerNow = document.referrer || null

    if (
      referrerNow &&
      !referrerNow.includes(window.location.hostname) &&
      !sessionStorage.getItem('initial_referrer')
    ) {
      sessionStorage.setItem('initial_referrer', referrerNow)
    }

    const initialReferrer =
      sessionStorage.getItem('initial_referrer') || referrerNow
    const anonymousId = getOrCreateAnonymousId()

    const { error } = await supabase.from('content_likes').insert([
      {
        post_id: postId || null,
        book_id: bookId || null,
        user_agent: userAgent,
        referrer: initialReferrer,
        anonymous_id: anonymousId,
      },
    ])

    if (error) {
      toast.warning('과분한 응원 감사합니다. 잠시 쉬었다가 또 응원해 주세요.')
      setClaps((prev) => prev - 1)
    } else {
      toast.info('응원 감사합니다!')
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
