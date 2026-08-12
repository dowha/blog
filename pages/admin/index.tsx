import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '@/supabase'
import { useOwner, loginWithGoogle, logout } from '@/components/admin/useOwner'

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

type Filter = 'all' | 'published' | 'draft'

export default function AdminHome() {
  const { user, loading, isOwner } = useOwner()
  const [posts, setPosts] = useState<PostRow[]>([])
  const [filter, setFilter] = useState<Filter>('all')
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

  const shown = posts.filter((p) =>
    filter === 'all' ? true : filter === 'published' ? p.is_published : !p.is_published,
  )
  const fmt = (s: string | null) => (s ? s.slice(0, 10) : '-')

  return (
    <>
      <Head>
        <title>Admin — 글 관리</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className="mx-auto w-full max-w-3xl px-4 py-8">
        {loading ? (
          <p className="text-sm text-gray-400">확인 중…</p>
        ) : !user ? (
          <div className="flex flex-col items-center gap-4 py-20">
            <h1 className="text-lg font-semibold">글 관리자</h1>
            <button
              onClick={loginWithGoogle}
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium hover:bg-gray-50"
            >
              Google로 로그인
            </button>
          </div>
        ) : !isOwner ? (
          <div className="flex flex-col items-center gap-3 py-20">
            <p className="text-sm text-gray-600">
              접근 권한이 없는 계정입니다. ({user.email})
            </p>
            <button onClick={logout} className="text-sm text-gray-500 underline">
              로그아웃
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-lg font-semibold">글 관리</h1>
              <div className="flex items-center gap-3 text-sm">
                <Link
                  href="/admin/edit"
                  className="rounded-lg bg-gray-900 px-3 py-1.5 font-medium text-white hover:bg-gray-700"
                >
                  + 새 글
                </Link>
                <button onClick={logout} className="text-gray-500 hover:underline">
                  로그아웃
                </button>
              </div>
            </div>

            <div className="mb-4 flex gap-1 text-sm">
              {(['all', 'published', 'draft'] as Filter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-md px-3 py-1 ${
                    filter === f ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {f === 'all' ? '전체' : f === 'published' ? '발행' : '초안'}
                </button>
              ))}
              <span className="ml-auto self-center text-xs text-gray-400">
                {fetching ? '불러오는 중…' : `${shown.length}개`}
              </span>
            </div>

            <ul className="divide-y divide-gray-100 border-y border-gray-100">
              {shown.map((p) => (
                <li key={p.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">{p.title || '(제목 없음)'}</span>
                      {p.is_external && (
                        <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
                          외부
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-gray-400">
                      {p.slug || '—'} · {fmt(p.updated_at || p.created_at)}
                    </div>
                  </div>
                  <button
                    onClick={() => togglePublish(p)}
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                      p.is_published
                        ? 'bg-green-50 text-green-700 hover:bg-green-100'
                        : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                    }`}
                    title="클릭하여 발행/초안 전환"
                  >
                    {p.is_published ? '발행됨' : '초안'}
                  </button>
                  {!p.is_external && (
                    <Link
                      href={{ pathname: '/admin/edit', query: { id: p.id } }}
                      className="shrink-0 text-xs text-gray-500 hover:underline"
                    >
                      수정
                    </Link>
                  )}
                </li>
              ))}
              {!fetching && shown.length === 0 && (
                <li className="py-8 text-center text-sm text-gray-400">글이 없습니다.</li>
              )}
            </ul>
          </>
        )}
      </div>
    </>
  )
}
