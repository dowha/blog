/**
 * 영어로 쓴 글·리뷰 표시 (posts.lang, books.lang)
 * 외부 글 출처 칩(제목 앞, 회색 바탕)과 헷갈리지 않게 제목 뒤에 테두리만 둔다.
 * hello 카드에는 표시하지 않는다 (2026-11-08 결정).
 */
export default function LangBadge({
  lang,
  size = 'sm',
  className = '',
}: {
  lang?: string | null
  size?: 'sm' | 'md'
  className?: string
}) {
  if (lang !== 'en') return null
  // sm: 목록·제목 인라인용, md: 본문 h1 옆(글자 크기에 맞춰 키움)
  const sizeCls = size === 'md' ? 'px-[4px] text-[11px] leading-[16px]' : 'px-[3px] text-[9px] leading-[13px]'
  return (
    <span
      title="영어로 쓴 글"
      className={`ml-1 inline-block shrink-0 rounded-[3px] border border-gray-300 align-middle font-medium tracking-wide text-gray-500 ${sizeCls} ${className}`}
    >
      EN
    </span>
  )
}
