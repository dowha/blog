import Link from "next/link"
import Image from 'next/image'

interface ReadingCardProps {
  category: string
  title: string
  description: string
  slug: string
  thumbnail: string
}

export function ReadingCard({ category, title, description, slug, thumbnail }: ReadingCardProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="border-t border-gray-200 pt-4 flex-grow">
        <div className="uppercase text-xs font-semibold tracking-wide mb-2">{category}</div>
        <h2 className="text-xl font-bold mb-2 line-clamp-2">{title}</h2>
        <p className="text-gray-600 text-sm mb-4 h-12 line-clamp-2">{description}</p>
      </div>
      <Link href={`/books/${slug}`} className="block mt-auto">
        <div className="rounded-lg overflow-hidden bg-gray-100 aspect-[16/9]">
          <Image src={thumbnail} alt={title} className="w-full h-full object-cover" />
        </div>
      </Link>
    </div>
  )
}
