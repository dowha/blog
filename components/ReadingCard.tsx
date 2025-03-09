import Image from 'next/image'

interface Book {
  id: string
  title: string
  author: string
  publisher: string
  publicationYear: number
  genre: string
  thumbnail?: string | null
}

interface BookCardProps {
  book: Book
  className?: string
}
export default function BookCard({ book, className }: BookCardProps) {
  return (
    <div
      className={`border border-border h-full p-4 hover:bg-gray-100 rounded-lg w-full bg-card ${
        className || ''
      }`}
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
        <div className="flex flex-1 flex-col justify-between text-left">
          <div>
            <h3 className="leading-tight text-foreground text-base font-semibold truncate">
              {book.title}
            </h3>
            <span className="mt-1 text-sm text-gray-500 block">
              {book.author}
            </span>
            <span className="mt-0.5 text-sm text-gray-400 block">
              {book.publisher}({book.publicationYear})
            </span>
            <span className="text-xs text-gray-600 inline-block mb-1">
              #{book.genre}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
