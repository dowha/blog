import Link from "next/link"

export function Navigation() {
  return (
    <nav className="fixed left-0 top-0 h-screen w-16 sm:w-24 md:w-32 lg:w-48 p-6 md:p-10 flex flex-col items-end text-neutral-400">
      <div className="space-y-2 text-right">

          <Link href="/" className="block hover:text-neutral-950">home</Link>

          <Link href="/writing" className="block hover:text-neutral-950">writing</Link>

          <Link href="/records" className="block hover:text-neutral-950">records</Link>

        <div className="relative hidden md:block py-4 my-4">
          <div className="absolute left-0 w-16 border-t border-neutral-200"></div>
        </div>

          <a href="https://dowha.kim" className="group inline-flex items-center hover:text-neutral-950" target="_blank" rel="noopener noreferrer">
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
          </div>
    </nav>
  );
}
