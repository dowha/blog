import { supabase } from '@/supabase'

/**
 * 목록 페이지 상단 소개 문구. Supabase `page_intros`에서 관리하고 /desk에서 편집한다.
 * 본문은 HTML(굵게·링크 등)이며, 검색 설명(meta description)에는 태그를 뺀 텍스트를 쓴다.
 * writings는 화면에 보이지 않고 검색 설명으로만 쓰인다.
 */
export type IntroPage = 'home' | 'writings' | 'series' | 'books' | 'records' | 'shorts'

export const INTRO_PAGES: { key: IntroPage; label: string; path: string; visible: boolean }[] = [
  { key: 'home', label: 'Home', path: '/', visible: true },
  { key: 'writings', label: 'Writings', path: '/writings', visible: false },
  { key: 'series', label: 'Series', path: '/series', visible: true },
  { key: 'books', label: 'Books', path: '/books', visible: true },
  { key: 'records', label: 'Records', path: '/records', visible: true },
  { key: 'shorts', label: 'Shorts', path: '/shorts', visible: true },
]

// DB를 못 읽을 때 쓰는 기본 문구 (이전에 코드에 있던 문구)
const FALLBACK: Record<IntroPage, string> = {
  home:
    '이것저것 쓰고 싶은 글을 씁니다. 부담감을 줄이고 <strong>꾸준하게</strong> 쓰는 것이 목표입니다. <br class="hidden md:block" />질문이나 피드백, 협업 제안 등은 <a href="https://letterbird.co/hello-dowha" target="_blank" rel="noopener">메일 폼</a>을 통해서 연락 주세요.',
  writings: '글 목록입니다.',
  series:
    '특별히 엮어둔 글 목록입니다. 의도적으로 한 주제 아래 쓴 글들도, 쓰고 보니 우연히 묶인 글들도 있습니다. 부디 재밌게 읽어주세요.',
  books: '책 읽기는 제게 큰 즐거움이자 평생을 함께하고 싶은 친구입니다.',
  records:
    '별도의 글로 쓰기에는 애매한 기록을 모아둡니다. 주로 개인적인 어떤 목록과 그에 대한 짧은 소회를 담은 메모 따위입니다.',
  shorts: '280자 이내의 짧은 생각, 메모, 인용문 등을 씁니다. 언젠가 더 긴 글이 되기도 하겠죠.',
}

/** getStaticProps에서 호출. 실패해도 기본 문구를 돌려줘 빈칸이 생기지 않게 한다. */
export async function fetchPageIntro(page: IntroPage): Promise<string> {
  const { data, error } = await supabase.from('page_intros').select('body').eq('page', page).maybeSingle()
  if (error) console.error(`page_intros(${page}) 조회 실패:`, error.message)
  return data?.body?.trim() || FALLBACK[page]
}

/** 검색 설명용: HTML 태그를 지우고 공백을 정리한다 */
export const introToText = (html: string) =>
  html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
