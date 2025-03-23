import { useRouter } from 'next/router'
import Link from 'next/link'

export function Navigation() {
  const router = useRouter()
  const currentPath = router.pathname

  return (
    <nav className="w-full p-6 text-gray-500 lg:w-64 lg:mr-6 mb-6 lg:mb-0">
      <div className="space-y-2">
        <ul className="lowercase flex flex-wrap gap-4 justify-center w-full lg:block lg:gap-0 lg:space-y-2 lg:text-right lg:top-6">
          {[
            { name: 'home', path: '/' },
            { name: 'writings', path: '/writings', related: '/posts/' }, // 📌 related 추가
            { name: 'series', path: '/series', related: '/series/' },
            { name: 'books', path: '/books', related: '/books/' },
            { name: 'records', path: '/records' },
          ].map((item) => (
            <li key={item.path}>
              <Link
                href={item.path}
                className={`hover:text-[#0a85d1] ${
                  currentPath === item.path ||
                  (item.related && currentPath.startsWith(item.related))
                    ? 'font-semibold text-gray-800'
                    : ''
                }`}
              >
                {item.name}
              </Link>
            </li>
          ))}
          <li className="relative hidden lg:flex justify-end py-4 my-4">
            <div className="absolute right-0 w-16 border-t border-gray-200"></div>
          </li>
          <li>
            <a
              href="https://dowha.kim"
              className="group inline-flex items-center hover:text-[#0a85d1]"
              target="_blank"
              rel="noopener"
            >
              <span className="hidden lg:inline">about</span>
            </a>
          </li>
        </ul>
      </div>
    </nav>
  )
}
