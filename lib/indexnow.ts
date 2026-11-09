import { supabase } from '@/supabase'

/**
 * IndexNow: 글이 바뀌면 Bing·네이버·Yandex 등에 즉시 알린다(구글은 미지원).
 * 키는 public/<KEY>.txt로 공개되는 값이라 비밀이 아니다. (2025-02 Bing 등록 시 만든 키)
 */
export const SITE_HOST = 'blog.dowha.kim'
export const INDEXNOW_KEY = '5daab144cbb341179607410c6d43ac4a'

// 알림 대상이 될 수 있는 경로. 공개 페이지만 허용한다.
export const isNotifiablePath = (p: string) =>
  /^\/(writings|books|records|series|shorts)?$/.test(p) ||
  /^\/(posts|books|series)\/[^/?#]+$/.test(p)

export type ContentKind = 'post' | 'external' | 'book' | 'series' | 'short' | 'record'

/**
 * 콘텐츠가 바뀌었을 때 다시 만들어야 할 공개 페이지.
 * 홈은 최근 글·최근에 읽은 책·읽는 중인 책·요즘 하는 생각을 보여 주므로 글·책·Shorts가 바뀌면 함께 갱신한다.
 * slugs: 바뀐 상세 페이지 주소(주소를 바꾼 경우 예전 주소도 넣는다)
 */
export function pagesFor(kind: ContentKind, slugs: (string | null | undefined)[] = []) {
  const detail = (base: string) =>
    Array.from(new Set(slugs.filter((s): s is string => !!s))).map((s) => `/${base}/${encodeURIComponent(s)}`)
  switch (kind) {
    case 'post':
      return [...detail('posts'), '/writings', '/']
    case 'external':
      return ['/writings', '/']
    case 'book':
      return [...detail('books'), '/books', '/']
    case 'series':
      return [...detail('series'), '/series']
    case 'short':
      return ['/shorts', '/']
    case 'record':
      return ['/records']
  }
}

/**
 * 에디터에서 저장·삭제 직후 호출. 페이지를 즉시 재생성하고 IndexNow에 알린다.
 * 저장 흐름을 막지 않도록 실패해도 예외를 던지지 않는다.
 */
export async function notifyChanged(paths: string[]) {
  const unique = Array.from(new Set(paths.filter(isNotifiablePath)))
  if (!unique.length) return
  try {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) return
    const res = await fetch('/api/desk/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ paths: unique }),
    })
    if (!res.ok) console.warn('IndexNow 알림 실패:', res.status, await res.text())
  } catch (e) {
    console.warn('IndexNow 알림 실패:', e)
  }
}
