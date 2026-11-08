/**
 * 영어로 쓴 글·리뷰 표시 (posts.lang, books.lang)
 * 외부 글 출처 칩(제목 앞, 회색 바탕)과 헷갈리지 않게 제목 뒤에 테두리만 둔다.
 * hello 카드에는 표시하지 않는다 (2026-11-08 결정).
 */
export default function LangBadge({ lang, className = '' }: { lang?: string | null; className?: string }) {
  if (lang !== 'en') return null
  return (
    <span
      title="영어로 쓴 글"
      className={`ml-1 inline-block shrink-0 rounded-[3px] border border-gray-300 px-[3px] align-middle text-[9px] font-medium leading-[13px] tracking-wide text-gray-500 ${className}`}
    >
      EN
    </span>
  )
}
