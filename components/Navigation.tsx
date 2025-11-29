import { useRouter } from 'next/router'
import Link from 'next/link'

export function Navigation() {
  const router = useRouter()
  const currentPath = router.pathname

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
      className="w-full p-6 text-gray-500 lg:w-64 lg:mr-6 mb-6 lg:mb-0"
      aria-label="메뉴"
    >
      <div className="space-y-2">
        <ul className="lowercase flex flex-wrap gap-2 sm:gap-4 justify-center w-full text-sm lg:text-base lg:block lg:gap-0 lg:space-y-2 lg:text-right lg:top-6">
          {menuItems.map((item) => {
            const isActive =
              currentPath === item.path ||
              (item.related && currentPath.startsWith(item.related))
            return (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={`hover:text-[#0a85d1] ${isActive ? 'font-semibold text-gray-800' : ''
                    }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.name}
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
