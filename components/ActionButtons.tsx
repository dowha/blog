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

// 페이지가 화면 높이의 1.5배 이상인지 (DO-99).
// 모바일은 주소창이 접히고 펴질 때 innerHeight가 바뀌므로 clientHeight를 기준으로 삼는다.
// 첫 렌더(SSR)에서는 false로 두고, 높이를 확인한 뒤 바꾼다.
function useIsLongPage(ratio = 1.5) {
  const [isLong, setIsLong] = useState(false)
  useEffect(() => {
    const el = document.documentElement
    const check = () => setIsLong(el.scrollHeight >= el.clientHeight * ratio)
    check()
    // 더 보기·탭 변경·이미지 로딩으로 길이가 바뀌면 다시 확인
    const observer = new ResizeObserver(check)
    observer.observe(document.body)
    window.addEventListener('resize', check)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', check)
    }
  }, [ratio])
  return isLong
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 글·책 상세의 버튼 줄: 버튼 4개를 늘 같은 자리에 두려고 길이와 상관없이 보인다
export const ScrollToTopButton = () => {
  return <Button onClick={scrollToTop} icon="⬆️" label="맨 위로" />
}

// 목록 끝: 스크롤할 만큼 길 때만 보인다
const ListEndScrollToTop = () => {
  const isLong = useIsLongPage()
  return isLong ? <ScrollToTopButton /> : null
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
    <ListEndScrollToTop />
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
      // 민감 컬럼(user_agent 등)은 읽기 권한이 없으므로 id만 대상으로 개수만 센다
      let query = supabase.from('content_likes').select('id', { count: 'exact', head: true })

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

    // 대상 검증·속도 제한은 DB 함수(add_clap)가 처리하고 갱신된 박수 수를 돌려준다
    const { data, error } = await supabase.rpc('add_clap', {
      p_post_id: postId || null,
      p_book_id: bookId || null,
      p_anonymous_id: anonymousId,
      p_user_agent: userAgent,
      p_referrer: initialReferrer,
    })

    if (error) {
      toast('과분한 응원 감사합니다. 잠시 쉬었다가 또 응원해 주세요.')
      setClaps((prev) => prev - 1)
    } else {
      if (typeof data === 'number') setClaps(data)
      toast('응원 감사합니다!')
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
