import Image from 'next/image'
import LangBadge from '@/components/LangBadge'

interface Book {
  id: string
  title: string
  author: string
  publisher: string
  publicationYear: number
  genre: string
  thumbnail?: string | null
  isReading?: boolean
  content?: string | null
  lang?: string
  volumes?: string | null
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
        <div className="relative h-24 w-16 flex-shrink-0 overflow-hidden rounded bg-gray-200 flex items-center justify-center">
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
          {/* 읽는 중 표시: 표지 정중앙 */}
          {book.isReading && (
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded bg-gray-900/70 px-1.5 py-px text-[11px] font-medium leading-4 text-white backdrop-blur-sm">
              읽는 중
            </span>
          )}
        </div>

        {/* 책 정보 */}
        <div className="flex flex-1 flex-col justify-between text-left overflow-hidden ">
          <div>
            <h2
              className={`flex items-center leading-tight text-foreground text-md font-semibold ${
                book.isReading ? '' : 'group-hover:text-brand'
              }`}
            >
              <span className="truncate">{book.title}</span>
              {book.volumes && (
                <span className="ml-0.5 shrink-0 text-sm font-normal text-gray-400">({book.volumes})</span>
              )}
              {/* 리뷰 언어 표시라 리뷰가 있는 책에만 */}
              {book.content && <LangBadge lang={book.lang} />}
            </h2>
            <span className="mt-1 text-sm text-gray-500 block">
              {book.author}
            </span>
            <span className="mt-0.5 text-sm text-gray-400 block">
              {book.publisher}
              <span className="tabular-nums">
                ({book.publicationYear})
              </span>
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
