import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

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

    // ✅ 최초 외부 referrer만 sessionStorage에 저장
    if (
      referrerNow &&
      !referrerNow.includes(window.location.hostname) &&
      !sessionStorage.getItem('initial_referrer')
    ) {
      sessionStorage.setItem('initial_referrer', referrerNow)
    }

    const initialReferrer = sessionStorage.getItem('initial_referrer') || referrerNow
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
      alert('응원 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.')
      setClaps((prev) => prev - 1)
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
