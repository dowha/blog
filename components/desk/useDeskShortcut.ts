import { useRouter } from 'next/router'
import type { HTMLAttributes } from 'react'

// /desk 목록의 섹션과 1:1로 대응한다.
export type DeskSection = 'posts' | 'series' | 'books' | 'records' | 'shorts'

/**
 * 공개 페이지 제목에 붙이는 숨은 관리자 단축키.
 * 제목을 더블클릭하면 해당 섹션이 선택된 /desk로 이동한다.
 * hello의 아바타 더블클릭(→ /wave)과 같은 방식으로, 로그인 여부는 여기서 보지 않는다.
 * 로그아웃 상태면 /desk가 로그인 화면을 보여 주고, 권한은 /desk 소유자 확인 + DB RLS가 지킨다.
 *
 * 반환값을 제목 엘리먼트에 그대로 spread 한다. className은 넘기지 않으므로
 * 페이지가 가진 클래스와 충돌하지 않는다.
 */
export function useDeskShortcut(section: DeskSection): HTMLAttributes<HTMLElement> {
  const router = useRouter()

  return {
    onDoubleClick: () => {
      // filter=all: 제목에서 들어왔을 땐 초안/읽는 중이 아니라 전체를 보여준다
      router.push({
        pathname: '/desk',
        query: section === 'posts' ? { filter: 'all' } : { tab: section, filter: 'all' },
      })
    },
  }
}
