import { useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { supabase } from '@/supabase'
import { useOwner, loginWithGoogle, logout } from '@/components/desk/useOwner'

type PostRow = {
  id: string
  title: string
  slug: string | null
  subtitle: string | null
  is_published: boolean
  is_external: boolean
  updated_at: string | null
  created_at: string
}

type Filter = 'all' | 'draft' | 'published' | 'external'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'draft', label: '초안' },
  { key: 'published', label: '발행' },
  { key: 'external', label: '외부' },
]

export default function DeskHome() {
  const router = useRouter()
  const { user, loading, isOwner } = useOwner()
  const [posts, setPosts] = useState<PostRow[]>([])
  const [filter, setFilter] = useState<Filter>('draft')
  const [fetching, setFetching] = useState(false)

  const load = async () => {
    setFetching(true)
    const { data } = await supabase
      .from('posts')
      .select('id,title,slug,subtitle,is_published,is_external,updated_at,created_at')
      .order('created_at', { ascending: false })
    setPosts(data ?? [])
    setFetching(false)
  }

  useEffect(() => {
    if (isOwner) load()
  }, [isOwner])

  const togglePublish = async (p: PostRow) => {
    const next = !p.is_published
    const { error } = await supabase
      .from('posts')
      .update({ is_published: next, updated_at: new Date().toISOString() })
      .eq('id', p.id)
    if (!error) setPosts((prev) => prev.map((x) => (x.id === p.id ? { ...x, is_published: next } : x)))
  }

  const shown = posts.filter((p) => {
    if (filter === 'all') return true
    if (filter === 'external') return p.is_external
    if (filter === 'draft') return !p.is_external && !p.is_published
    return !p.is_external && p.is_published // 발행(내부)
  })
  const fmt = (s: string | null) => (s ? s.slice(0, 10) : '-')

  return (
    <>
      <Head>
        <title>Desk — 글 관리</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className="w-full">
        {loading ? (
          <p className="text-xs text-gray-400">확인 중…</p>
        ) : !user ? (
          <div className="flex justify-center py-24">
            <button onClick={loginWithGoogle} className="default-button">
              🔐 관리자 로그인
            </button>
          </div>
        ) : !isOwner ? (
          <div className="flex flex-col items-start gap-2 py-16">
            <p className="text-sm text-gray-600">접근 권한이 없는 계정입니다. ({user.email})</p>
            <button onClick={logout} className="text-xs text-gray-400 hover:text-gray-600">
              로그아웃
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <h1 className="!mb-0 text-gray-800">글 관리</h1>
              <div className="flex items-center gap-3">
                <button onClick={() => router.push('/desk/edit')} className="default-button !mt-0">
                  <span>✏️</span>
                  <span>새 글</span>
                </button>
                <button onClick={logout} className="text-xs text-gray-400 hover:text-gray-600">
                  로그아웃
                </button>
              </div>
            </div>

            <div className="mb-3 flex items-center gap-1 text-xs">
              {FILTERS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`rounded-md px-2.5 py-1 ${
                    filter === key
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {label}
                </button>
              ))}
              <span className="ml-auto text-gray-400">
                {fetching ? '불러오는 중…' : `${shown.length}개`}
              </span>
            </div>

            <ul className="border-t border-gray-100">
              {shown.map((p) => (
                <li key={p.id} className="flex items-center gap-3 border-b border-gray-100 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm text-gray-800">
                        {p.title || '(제목 없음)'}
                      </span>
                      {p.is_external && (
                        <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-400">
                          외부
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 truncate text-[11px] text-gray-400">
                      {p.slug || '—'} · {fmt(p.updated_at || p.created_at)}
                    </div>
                  </div>
                  <button
                    onClick={() => togglePublish(p)}
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] ${
                      p.is_published
                        ? 'bg-green-50 text-green-700 hover:bg-green-100'
                        : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                    }`}
                    title="클릭하여 발행/초안 전환"
                  >
                    {p.is_published ? '발행됨' : '초안'}
                  </button>
                  {!p.is_external && (
                    <button
                      onClick={() => router.push({ pathname: '/desk/edit', query: { id: p.id } })}
                      className="shrink-0 text-xs text-gray-400 hover:text-gray-700"
                    >
                      수정
                    </button>
                  )}
                </li>
              ))}
              {!fetching && shown.length === 0 && (
                <li className="border-b border-gray-100 py-8 text-center text-xs text-gray-400">
                  글이 없습니다.
                </li>
              )}
            </ul>
          </>
        )}
      </div>
    </>
  )
}
