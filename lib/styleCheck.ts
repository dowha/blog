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
    rule: '작품명 부호',
    message: '작품명은 부등호(< >)가 아니라 《 》(책·영화·앨범 등)나 〈 〉(편·곡·글 등)로 씁니다. 예: 《퇴마록》, 〈봄날〉',
    // HTML 태그는 미리 걷어내므로 남은 <…>·<<…>>는 작품명 부호를 잘못 쓴 것
    // 꺾쇠 바로 안쪽에 공백이 있으면 부등호(a < b)로 보고 넘어간다
    pattern: /<<?(?=\S)[^<>\n]*\S>>?/,
  },
  {
    rule: '인용 끝 온점',
    message: '큰따옴표 인용 끝의 온점은 생략하거나 따옴표 안에 찍습니다. 예: "나는 행복했다" / "나는 행복했다."',
    pattern: /"[^"\n]+"\./,
  },
  {
    rule: '줄임표',
    message: '말줄임표는 … 한 글자로 씁니다. 인용 생략 (...)이나 원문·원제의 줄임표면 무시하세요.',
    // 한글 바로 뒤의 온점 세 개만 본다 (영문 인용의 ...와 (...)는 제외)
    pattern: /[가-힣]\.\.\.(?![.)])/,
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
    rule: '범위 ~ 띄움',
    message: '국문 기간·범위의 물결표는 앞뒤를 붙입니다. 예: 1~4권, 2015~16년, 2023.12~현재',
    pattern: /\d(?:\s+~\s*|\s*~\s+)(?:\d|현재)/,
  },
  {
    rule: '범위 하이픈',
    message: '국문 기간·범위는 물결표(~)로 씁니다. 예: 1~4권, 2015~2017년. 시즌은 2024/25. 원제·곡명이면 무시하세요.',
    // 숫자-숫자 뒤에 단위가 붙은 것만 본다 (날짜 2026-11-08, BWV 846-869 등 제외)
    pattern: /(?<![\d.\-–])\d+\s*[-–]\s*\d+\s?(?:권|화|년|월|일|회|부|편|장|쪽|시즌)/,
  },
  {
    rule: '강조 겹침',
    message: "볼드와 작은따옴표를 함께 쓰지 않습니다. 예: **'업데이트 노트' 읽기** → '업데이트 노트' 읽기",
    pattern: /\*\*[^*\n]*'[^'\n]+'[^*\n]*\*\*/,
  },
  {
    rule: '인용 생략 부호',
    message: '인용문 중간을 생략할 때는 (...)로 씁니다. (…) 아님',
    pattern: /\(…\)/,
  },
  {
    rule: '문장 끝 줄임표',
    message: '문장 끝 줄임표는 … 뒤에 온점을 찍습니다. 예: 일주일이 참 길다….',
    pattern: /[가-힣]\.{4,}/,
  },
  {
    rule: '공동 저자 3명 이상',
    message: '세 명 이상이면 마지막 저자 앞에만 & 를 씁니다. 예: Hans Rosling, Ola Rosling & Anna Rosling Rönnlund',
    pattern: / & [^&\n]+ & /,
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
    .replace(/<!--.*?-->/g, '')
    // HTML 태그는 소문자 태그명만 (<책제목>·<Title> 같은 잘못 쓴 작품명 부호는 남겨서 점검)
    .replace(/<\/?[a-z][a-z0-9-]*(?:\s[^<>]*)?\/?>/g, '')
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
