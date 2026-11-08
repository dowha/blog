// /desk 상단 드롭다운 항목. 섹션은 대상 테이블, 'intros'는 별도 페이지(/desk/intros)
export type Section = 'posts' | 'records' | 'books' | 'shorts' | 'series'
export type DeskView = Section | 'intros'

export const SECTIONS: { key: Section; label: string }[] = [
  { key: 'posts', label: 'Writings' },
  { key: 'series', label: 'Series' },
  { key: 'books', label: 'Books' },
  { key: 'records', label: 'Records' },
  { key: 'shorts', label: 'Shorts' },
]

export const INTROS_LABEL = '소개 문구'

/** 드롭다운에서 고른 항목의 주소. posts는 기본 섹션이라 tab 없이 연다 */
export const deskViewHref = (v: DeskView) =>
  v === 'intros' ? '/desk/intros' : v === 'posts' ? '/desk' : `/desk?tab=${v}`
