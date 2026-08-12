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
    options: { redirectTo: `${window.location.origin}/admin` },
  })

export const logout = () => supabase.auth.signOut()
