import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/supabase'

// 관리자(글 작성) 권한을 가진 소유자 이메일.
// 실제 보안은 Supabase RLS(posts 쓰기 = 이 이메일)에서 강제하고, 여기선 UI 노출만 제어한다.
export const OWNER_EMAIL = 'mail@dowha.kim'

export function useOwner() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  return { user, loading, isOwner: user?.email === OWNER_EMAIL }
}

export const loginWithGoogle = () =>
  supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/desk` },
  })

export async function logout() {
  // local: 이 브라우저의 이 사이트 세션만 끊는다.
  // 기본값(global)은 같은 계정의 모든 세션을 끊어 dowha.kim /wave까지 로그아웃시킨다.
  const { error } = await supabase.auth.signOut({ scope: 'local' })
  if (error) {
    // 서버에 이미 없는 세션이면(session_not_found) auth-js가 저장된 세션을 지우지 않아
    // 로그아웃이 안 되는 것처럼 보인다 → 직접 지운다
    Object.keys(localStorage)
      .filter((k) => k.startsWith('sb-') && k.includes('-auth-token'))
      .forEach((k) => localStorage.removeItem(k))
  }
  // 로그아웃하면 사이트 첫 화면으로 돌아간다
  window.location.href = '/'
}
