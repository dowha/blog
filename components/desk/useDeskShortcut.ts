import { useRouter } from 'next/router'
import type { HTMLAttributes } from 'react'

// /desk 목록의 섹션과 1:1로 대응한다.
export type DeskSection = 'posts' | 'series' | 'books' | 'records' | 'shorts'

/**
 * 공개 페이지 제목에 붙이는 숨은 관리자 단축키.
 * 소유자로 로그인한 상태에서 제목을 더블클릭하면 해당 섹션이 선택된 /desk로 이동하고,
 * 그 외에는 아무 일도 일어나지 않는다.
 *
 * 세션 확인에 필요한 supabase 클라이언트는 더블클릭 시점에 동적으로 불러온다.
 * 훅에서 바로 import하면 관리자 전용 기능 때문에 모든 방문자가 인증 코드를
 * 초기 번들로 내려받게 된다(공개 페이지 First Load JS +50kB).
 *
 * 반환값을 제목 엘리먼트에 그대로 spread 한다. className은 넘기지 않으므로
 * 페이지가 가진 클래스와 충돌하지 않는다.
 */
export function useDeskShortcut(section: DeskSection): HTMLAttributes<HTMLElement> {
  const router = useRouter()

  return {
    onDoubleClick: async () => {
      const [{ supabase }, { OWNER_EMAIL }] = await Promise.all([
        import('@/supabase'),
        import('@/components/desk/useOwner'),
      ])
      const { data } = await supabase.auth.getSession()
      if (data.session?.user?.email !== OWNER_EMAIL) return

      // filter=all: 제목에서 들어왔을 땐 초안/읽는 중이 아니라 전체를 보여준다
      router.push({
        pathname: '/desk',
        query: section === 'posts' ? { filter: 'all' } : { tab: section, filter: 'all' },
      })
    },
  }
}
