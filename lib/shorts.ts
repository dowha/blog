/**
 * shorts 길이 계산 규칙.
 *
 * DB에 이미 CHECK 제약이 걸려 있다:
 *   CHECK (get_pure_text_length(content) <= 280)
 * 아래 함수는 그 plpgsql 함수의 JS 이식본으로, 에디터에서 실시간 카운터를
 * 보여주기 위한 것이다. 최종 방어선은 어디까지나 DB CHECK이며, 규칙이 바뀌면
 * 양쪽을 함께 고쳐야 한다.
 */

export const SHORTS_MAX_LENGTH = 280

export function pureTextLength(content: string): number {
  const clean = content
    .replace(/!\[.*?\]\(.*?\)/g, '') // 이미지: 통째로 제거
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // 링크: 표시 텍스트만 남김
    .replace(/[*_~`#]/g, '') // 강조·코드·헤딩 기호 제거
    .trim()

  // PG char_length는 코드포인트를 세므로 이모지가 1자다.
  // JS의 .length는 UTF-16 단위라 2로 세니 스프레드로 코드포인트를 센다.
  return [...clean].length
}
