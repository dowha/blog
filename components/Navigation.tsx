import { useRouter } from 'next/router'
import Link from 'next/link'

export function Navigation() {
  const router = useRouter()
  const currentPath = router.pathname

  return (
    <nav className="w-full p-6 text-gray-500 md:w-64 md:mr-6 mb-6 md:mb-0">
      <div className="space-y-2">
        <ul className="lowercase flex flex-wrap gap-4 md:block md:gap-0 md:space-y-2 md:text-right md:sticky md:top-6">
          {[
            { name: 'home', path: '/' },
            { name: 'series', path: '/series', related: '/series/' },
            { name: 'writings', path: '/writings', related: '/posts/' }, // 📌 related 추가
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
          <div className="relative hidden md:flex justify-end py-4 my-4">
            <div className="absolute right-0 w-16 border-t border-gray-200"></div>
          </div>
          <li className="md:text-right">
            <a
              href="https://dowha.kim"
              className="group inline-flex items-center hover:text-[#0a85d1]"
              target="_blank"
              rel="noopener"
            >
              about
            </a>
          </li>
        </ul>
      </div>
    </nav>
  )
}
