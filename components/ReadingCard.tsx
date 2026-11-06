import Image from 'next/image'

interface Book {
  id: string
  title: string
  author: string
  publisher: string
  publicationYear: number
  genre: string
  thumbnail?: string | null
  isReading?: boolean
}

interface BookCardProps {
  book: Book
  className?: string
}
export default function BookCard({ book, className }: BookCardProps) {
  return (
    <div
      className={`relative border h-full p-3 rounded-lg w-full bg-card border-gray-200 group ${className || ''}`}
    >
      <div className="flex gap-3">
        {/* 썸네일 */}
        <div className="h-24 w-16 flex-shrink-0 overflow-hidden rounded bg-gray-200 flex items-center justify-center">
          {book.thumbnail ? (
            <Image
              src={book.thumbnail}
              alt={`${book.title} 표지`}
              width={64}
              height={96}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-xs text-gray-500"></span>
          )}
        </div>

        {/* 책 정보 */}
        <div className="flex flex-1 flex-col justify-between text-left overflow-hidden ">
          <div>
            <h2
              className={`leading-tight text-foreground text-md font-semibold truncate ${
                book.isReading ? '' : 'group-hover:text-[#0a85d1]'
              }`}
            >
              {book.title}
            </h2>
            <span className="mt-1 text-sm text-gray-500 block">
              {book.author}
            </span>
            <span className="mt-0.5 text-sm text-gray-400 block">
              {book.publisher}
              <span className="text-xs font-mono">
                ({book.publicationYear})
              </span>
            </span>
            <span className="mb-1 flex items-center gap-1.5 text-xs text-gray-600">
              #{book.genre}
              {book.isReading && (
                <span className="rounded bg-amber-100 px-1.5 py-px text-[11px] font-medium leading-4 text-amber-800">
                  읽는 중
                </span>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
