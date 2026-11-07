/**
 * 마크다운 본문 → 검색 결과·공유 카드용 요약문.
 * 마크다운 기호와 HTML 태그(iframe 등)를 걷어내고 공백을 정리한 뒤 max자로 자른다.
 */
export function toExcerpt(markdown: string | null | undefined, max = 150): string {
  if (!markdown) return ''
  const text = markdown
    .replace(/```[\s\S]*?```/g, ' ') // 코드 블록
    .replace(/<!--[\s\S]*?-->/g, ' ') // HTML 주석
    .replace(/<(script|style|iframe)[\s\S]*?<\/\1>/gi, ' ') // 내용째 지울 태그
    .replace(/<[^>]+>/g, ' ') // 나머지 HTML 태그는 태그만 제거
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // 이미지
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // 링크 → 텍스트
    .replace(/\[\^[^\]]*\]/g, '') // 각주 참조
    .replace(/^\s{0,3}(#{1,6}|>+|[-*+]|\d+[.)])\s+/gm, '') // 제목·인용·목록 기호
    .replace(/^\s*([-*_]\s*){3,}$/gm, ' ') // 구분선
    .replace(/^\s*\|?(\s*:?-+:?\s*\|)+\s*$/gm, ' ') // 표 구분 줄
    .replace(/\|/g, ' ') // 표 칸
    .replace(/(\*\*|__|~~|==|\*|`)/g, '') // 강조·코드 기호 (단일 _는 단어 속 밑줄일 수 있어 둔다)
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const space = cut.lastIndexOf(' ')
  // 단어 중간에서 끊기지 않게 하되, 너무 많이 잘리면 그냥 자른다
  return `${(space > max * 0.7 ? cut.slice(0, space) : cut).trimEnd()}…`
}
