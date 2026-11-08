/**
 * 영어로 쓴 글·리뷰 표시 (posts.lang, books.lang)
 * 외부 글 출처 칩(제목 앞, 회색 바탕)과 헷갈리지 않게 제목 뒤에 테두리만 둔다.
 * ⚠️ hello/components/blog-highlights.tsx에도 같은 모양을 쓴다.
 */
export default function LangBadge({ lang, className = '' }: { lang?: string | null; className?: string }) {
  if (lang !== 'en') return null
  return (
    <span
      title="영어로 쓴 글"
      className={`ml-1.5 inline-block shrink-0 rounded border border-gray-300 px-1 align-middle text-[10px] font-medium leading-4 tracking-wide text-gray-500 ${className}`}
    >
      EN
    </span>
  )
}
