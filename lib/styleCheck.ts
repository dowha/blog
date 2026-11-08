/**
 * 표기 규칙 자동 점검 (규칙 원본: docs/style-guide.md)
 *
 * 기계가 정확히 잡을 수 있는 것만 경고한다. 예외(창작자 원제 등)가 있는 규칙이라
 * 저장을 막지 않고, 둥근 따옴표만 저장할 때 자동으로 고친다.
 * ⚠️ hello/lib/styleCheck.ts와 같은 내용을 유지한다. 한쪽을 고치면 다른 쪽도 고칠 것.
 */

export type StyleIssue = {
  rule: string
  message: string
  /** 1부터 시작하는 줄 번호 */
  line: number
  excerpt: string
}

type Check = {
  rule: string
  message: string
  pattern: RegExp
  /** true면 헤드라인(제목·부제)에서만 점검 */
  headlineOnly?: boolean
}

const CURLY = /[‘’“”]/g

/** 둥근 따옴표를 곧은 따옴표로 바꾼다 (국문·영문 공통 규칙) */
export function normalizeQuotes(text: string): string {
  return text.replace(CURLY, (c) => (c === '‘' || c === '’' ? "'" : '"'))
}

// 영문 타이틀 케이스에서 소문자로 쓰는 짧은 단어
const MINOR_WORDS = 'A|An|The|And|But|Or|Nor|For|Of|On|In|At|To|By|With|From|As'

const CHECKS: Check[] = [
  {
    rule: '둥근 따옴표',
    message: '곧은 따옴표(\' ")만 씁니다. 저장할 때 자동으로 바뀝니다.',
    pattern: /[‘’“”]/,
  },
  {
    rule: '괄호 앞 띄움',
    message: '국문은 괄호를 앞말에 붙입니다. 예: 《퇴마록》(2025). 문장에 끼워 넣은 말이면 무시하세요.',
    // 작품명 부호 뒤 공백 + 괄호, 또는 한글 뒤 공백 + 영문·숫자로 시작하는 괄호
    pattern: /[》〉] \(|[가-힣] \((?=[A-Za-z0-9~])/,
  },
  {
    rule: '쌍점 형식',
    message: '쌍점은 앞에 붙이고 뒤를 띄웁니다. 예: 《제목: 부제》. 창작자가 정한 원제면 무시하세요.',
    pattern: /[《〈][^》〉\n]*(?: :|:(?=[^\s\d]))[^》〉\n]*[》〉]/,
  },
  {
    rule: '공동 저자',
    message: '공동 저자는 앞뒤를 띄운 & 로 묶습니다. 예: 류은가람 & 우새새',
    pattern: /[가-힣A-Za-z.]&[가-힣A-Za-z]/,
  },
  {
    rule: '이니셜',
    message: '이니셜은 마침표 뒤를 띄웁니다. 예: J. K. Rowling',
    pattern: /\b[A-Z]\.[A-Z]\.?\s?[A-Z][a-z]/,
  },
  {
    rule: '영문 제목 대소문자',
    message: `영문 제목에서 짧은 관사·전치사·접속사(${MINOR_WORDS.toLowerCase().replace(/\|/g, ', ')})는 첫 단어가 아니면 소문자로 씁니다.`,
    // 《 》 안 또는 *이탤릭* 안. 쌍점 뒤(부제의 첫 단어)는 대문자가 맞아서 제외
    pattern: new RegExp(`(?:《|\\*)[A-Z][^》*\\n]*?(?<!:) (?:${MINOR_WORDS}) [^》*\\n]*(?:》|\\*)`),
  },
  {
    rule: '목록 저자 앞 —',
    message: '목록은 저자 앞에 쉼표를 씁니다. 예: 《제목》(정보), 저자. —는 인용 출처에만 씁니다.',
    pattern: /^\s*[-*+] .*[》〉].*\s—\s/,
  },
  {
    rule: '헤드라인 《 》',
    message: "헤드라인에서는 작품명을 작은따옴표로 씁니다. 예: '퇴마록'(2025)을 보고",
    pattern: /[《》〈〉]/,
    headlineOnly: true,
  },
]

// 링크 주소·HTML 태그·코드는 점검 대상이 아니다 (쿼리스트링의 & 등 오탐 방지)
function stripNonText(line: string): string {
  return line
    .replace(/`[^`]*`/g, '')
    .replace(/\]\([^)]*\)/g, ']')
    .replace(/<[^>]+>/g, '')
    .replace(/https?:\/\/\S+/g, '')
}

/** 텍스트에서 표기 규칙 위반 후보를 찾는다. headline=true면 제목·부제 규칙도 본다 */
export function checkStyle(text: string, opts: { headline?: boolean } = {}): StyleIssue[] {
  if (!text) return []
  const issues: StyleIssue[] = []
  let inCodeBlock = false
  text.split('\n').forEach((raw, i) => {
    if (raw.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock
      return
    }
    if (inCodeBlock) return
    const line = stripNonText(raw)
    for (const c of CHECKS) {
      if (c.headlineOnly && !opts.headline) continue
      const m = line.match(c.pattern)
      if (!m) continue
      const at = m.index ?? 0
      issues.push({
        rule: c.rule,
        message: c.message,
        line: i + 1,
        excerpt: line.slice(Math.max(0, at - 12), at + m[0].length + 12).trim(),
      })
    }
  })
  return issues
}
