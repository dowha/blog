import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

// 최근 업데이트 섹션은 탭당 한 번만 받는다 (페이지 이동마다 재요청하지 않음)
let latestSectionPromise: Promise<string | null> | null = null
function getLatestSection() {
  latestSectionPromise ??= fetch('/api/nav-latest')
    .then((r) => (r.ok ? r.json() : { section: null }))
    .then((d: { section: string | null }) => d.section)
    .catch(() => null)
  return latestSectionPromise
}

export function Navigation() {
  const router = useRouter()
  const currentPath = router.pathname
  const [latestPath, setLatestPath] = useState<string | null>(null)

  useEffect(() => {
    // 'N' 표시는 PC(lg) 메뉴에서만 보이므로 모바일에서는 요청하지 않는다
    if (!window.matchMedia('(min-width: 1024px)').matches) return
    let alive = true
    getLatestSection().then((section) => {
      if (alive && section) setLatestPath(`/${section}`)
    })
    return () => {
      alive = false
    }
  }, [])

  const menuItems = [
    { name: 'home', path: '/' },
    { name: 'writings', path: '/writings', related: '/posts/' },
    { name: 'series', path: '/series', related: '/series/' },
    { name: 'books', path: '/books', related: '/books/' },
    { name: 'records', path: '/records' },
    { name: 'shorts', path: '/shorts' },
  ]

  return (
    <nav
      className="w-full p-6 text-gray-500 lg:w-64 lg:mr-6 lg:mb-0"
      aria-label="메뉴"
    >
      <div className="space-y-2">
        <ul className="lowercase flex flex-wrap gap-3 sm:gap-4 justify-center w-full text-sm lg:text-base lg:block lg:gap-2 lg:space-y-4 lg:text-right lg:top-6">
          {menuItems.map((item) => {
            const isActive =
              currentPath === item.path ||
              (item.related && currentPath.startsWith(item.related))
            return (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={`relative hover:text-[#0a85d1] ${isActive ? 'font-semibold text-gray-800' : ''
                    }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {isActive ? (
                    <>
                      <span className="lg:hidden relative top-px">⦁</span>
                      <span className="hidden lg:inline">{item.name}</span>
                    </>
                  ) : (
                    item.name
                  )}
                  {/* 새 게시물(records는 최신 수정)이 가장 최근인 섹션 표시. absolute라 오른쪽 정렬된 글자 위치를 밀지 않는다 */}
                  {latestPath === item.path && (
                    <span
                      className="absolute left-full top-1/2 ml-1 hidden h-3 w-3 -translate-y-1/2 items-center justify-center rounded-[3px] bg-red-500 text-[8px] font-bold normal-case leading-none text-white lg:inline-flex"
                      title="최근 업데이트"
                      aria-hidden="true"
                    >
                      N
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
          <li className="relative hidden lg:flex justify-end py-4 my-4">
            <div className="absolute right-0 w-16 border-t border-gray-200"></div>
          </li>
          <li>
            <a
              href="https://dowha.kim"
              className="group inline-flex items-center hover:text-[#0a85d1]"
              target="_blank"
              rel="noopener"
              aria-label="about"
            >
              <span className="hidden lg:inline">about</span>
            </a>
          </li>
        </ul>
      </div>
    </nav>
  )
}
