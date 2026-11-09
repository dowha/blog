/**
 * 맞춤법 확인(바른 API) 공용 타입·유틸. 서버 라우트와 /desk 화면이 같이 쓴다.
 */

/** title=true면 제목·부제로 보고 검사한다 (끝 문장부호 등을 문장처럼 따지지 않음) */
export type SpellField = { label: string; text: string; title?: boolean }

export type SpellIssue = {
  field: string
  origin: string
  revised: string
  category: string
  comment?: string
  /** 같은 지적이 여러 곳에서 나온 횟수 (2 이상일 때만) */
  count?: number
}

export type SpellResult = { issues: SpellIssue[] } | { error: string }

/** 한 번에 보내는 글자 수 상한 (긴 글이 통째로 과금되는 것 방지) */
export const SPELL_MAX_CHARS = 20000

// 바른 교정 카테고리 → 화면 표시용 이름
export const SPELL_CATEGORY_LABEL: Record<string, string> = {
  GRAMMER: '문법',
  WORD: '어휘',
  SPACING: '띄어쓰기',
  STANDARD: '표준어',
  TYPO: '오타',
  FOREIGN_WORD: '외래어',
  CONFUSABLE_WORDS: '혼동 단어',
  SENTENCE: '문장',
  CONFIRM: '확인 필요',
}

/**
 * 마크다운 문법을 걷어내고 맞춤법 검사에 보낼 글만 남긴다.
 * 줄 구조는 유지해서 문장 분리가 어긋나지 않게 한다.
 */
export function markdownToPlain(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, '') // 코드 블록
    .replace(/`[^`\n]*`/g, '') // 인라인 코드
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // 이미지
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // 링크는 글자만
    .replace(/<[^>]+>/g, '') // HTML 태그
    .replace(/https?:\/\/\S+/g, '') // 맨 URL
    .replace(/^\s{0,3}(#{1,6}|>+|[-*+]|\d+\.)\s+/gm, '') // 제목·인용·목록 기호
    .replace(/(\*\*|__|==|~~|\*|_)(?=\S)([^\n]*?\S)\1/g, '$2') // 강조 기호
    .replace(/^\s*([-*_]\s*){3,}$/gm, '') // 구분선
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
