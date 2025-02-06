import Link from 'next/link'

export function Navigation() {
  return (
    <nav className="w-full p-6 md:w-64 md:mr-6 mb-6 md:mb-0">
      <div className="space-y-2">
        <ul className="lowercase flex flex-wrap gap-4 md:block md:gap-0 md:space-y-2 md:text-right md:sticky md:top-6">
          <li>
            <Link href="/" className="hover:text-neutral-950">
              home
            </Link>
          </li>
          <li>
            <Link href="/writing" className="hover:text-neutral-950">
              writing
            </Link>
          </li>
          <li>
            <Link href="/records" className="hover:text-neutral-950">
              records
            </Link>
          </li>
          <div className="relative hidden md:flex justify-end py-4 my-4">
            <div className="absolute right-0 w-16 border-t border-neutral-200"></div>
          </div>
          <li className="md:text-right">
            <a
              href="https://dowha.kim"
              className="group inline-flex items-center hover:text-neutral-950"
              target="_blank"
              rel="noopener noreferrer"
            >
              about
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ml-1 h-4 w-4"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          </li>
        </ul>
      </div>
    </nav>
  )
}
