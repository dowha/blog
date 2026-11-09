import { useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'

const MESSAGE = '저장하지 않은 내용이 있습니다. 나갈까요?'

/**
 * 저장 안 한 변경이 있을 때 페이지를 떠나기 전에 묻는다 (/desk 편집 화면용)
 * - 새로고침·탭 닫기·주소 직접 이동: 브라우저 기본 경고
 * - 사이트 안 이동(Link·router.push): 확인창, 취소하면 이동을 멈춘다
 * - 같은 화면에서 주소만 바꾸는 shallow 이동(저장 후 id 붙이기)은 묻지 않는다
 * 반환값: 삭제 직후처럼 묻지 않고 떠나야 할 때 이동 전에 호출한다
 */
export function useLeaveGuard(dirty: boolean) {
  const router = useRouter()
  const dirtyRef = useRef(dirty)
  const allowed = useRef(false)

  useEffect(() => {
    dirtyRef.current = dirty
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => {
      if (!allowed.current) e.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  useEffect(() => {
    const onStart = (url: string, { shallow }: { shallow: boolean }) => {
      if (shallow || allowed.current || !dirtyRef.current) return
      if (window.confirm(MESSAGE)) return
      router.events.emit('routeChangeError', new Error('cancelled'), url, { shallow })
      // pages router는 이동을 멈추는 공식 API가 없어 이벤트에서 예외를 던지는 방식을 쓴다
      throw 'leave cancelled'
    }
    router.events.on('routeChangeStart', onStart)
    return () => router.events.off('routeChangeStart', onStart)
  }, [router.events])

  return useCallback(() => {
    allowed.current = true
  }, [])
}
