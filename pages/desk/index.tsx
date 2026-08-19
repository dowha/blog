import { useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { supabase } from '@/supabase'
import { useOwner, loginWithGoogle, logout } from '@/components/desk/useOwner'

type Row = {
  id: string
  title: string
  slug: string | null
  is_published?: boolean
  is_external?: boolean
  is_reading?: boolean // books 전용
  updated_at?: string | null // books엔 없음(트리거 미존재)
  created_at: string
}

// 섹션 = 대상 테이블. label은 nav 메뉴 명칭에 맞춤.
type Section = 'posts' | 'records' | 'books'
const SECTIONS: { key: Section; label: string }[] = [
  { key: 'posts', label: 'Writings' },
  { key: 'records', label: 'Records' },
  { key: 'books', label: 'Books' },
]

// books는 발행 개념 대신 읽기 상태(is_reading)를 쓴다.
type Filter = 'all' | 'draft' | 'published' | 'external' | 'reading' | 'read'
const FILTERS: Record<Section, { key: Filter; label: string }[]> = {
  posts: [
    { key: 'all', label: '전체' },
    { key: 'draft', label: '초안' },
    { key: 'published', label: '발행' },
    { key: 'external', label: '외부' },
  ],
  // records엔 외부(is_external) 개념이 없음
  records: [
    { key: 'all', label: '전체' },
    { key: 'draft', label: '초안' },
    { key: 'published', label: '발행' },
  ],
  books: [
    { key: 'all', label: '전체' },
    { key: 'reading', label: '읽는 중' },
    { key: 'read', label: '읽음' },
  ],
}

const NOUN: Record<Section, string> = { posts: '글', records: '기록', books: '책' }
const DEFAULT_FILTER = (s: Section): Filter => (s === 'books' ? 'all' : 'draft')

// 에디터는 type 파라미터로 대상 테이블을 구분한다.
const TYPE_QUERY = (s: Section) =>
  s === 'records' ? { type: 'record' } : s === 'books' ? { type: 'book' } : {}

export default function DeskHome() {
  const router = useRouter()
  const { user, loading, isOwner } = useOwner()
  const [section, setSection] = useState<Section>('posts')
  const [rows, setRows] = useState<Row[]>([])
  const [filter, setFilter] = useState<Filter>('draft')
  const [fetching, setFetching] = useState(false)

  const isPosts = section === 'posts'
  const isBooks = section === 'books'
  const noun = NOUN[section]

  // 에디터 진입 시 돌아올 섹션 복원 (?tab=records | ?tab=books)
  useEffect(() => {
    if (!router.isReady) return
    const tab = router.query.tab
    if (tab === 'records' || tab === 'books') {
      setSection(tab)
      setFilter(DEFAULT_FILTER(tab))
    }
  }, [router.isReady, router.query.tab])

  const load = async () => {
    setFetching(true)
    const cols = isPosts
      ? 'id,title,slug,is_published,is_external,updated_at,created_at'
      : isBooks
        ? 'id,title,slug,is_reading,created_at'
        : 'id,title,slug,is_published,updated_at,created_at'
    const { data } = await supabase
      .from(section)
      .select(cols)
      .order('created_at', { ascending: false })
    setRows((data as unknown as Row[]) ?? [])
    setFetching(false)
  }

  useEffect(() => {
    if (isOwner) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner, section])

  const changeSection = (s: Section) => {
    setSection(s)
    setFilter(DEFAULT_FILTER(s))
  }

  // posts/records는 발행 여부, books는 읽기 여부를 토글한다.
  const toggleState = async (p: Row) => {
    const col = isBooks ? 'is_reading' : 'is_published'
    const next = !(isBooks ? p.is_reading : p.is_published)
    // updated_at은 DB 트리거(moddatetime)가 자동 갱신
    const { error } = await supabase
      .from(section)
      .update({ [col]: next })
      .eq('id', p.id)
    if (!error) setRows((prev) => prev.map((x) => (x.id === p.id ? { ...x, [col]: next } : x)))
  }

  const shown = rows.filter((p) => {
    if (filter === 'all') return true
    if (isBooks) return filter === 'reading' ? !!p.is_reading : !p.is_reading
    if (filter === 'external') return !!p.is_external
    if (filter === 'draft') return !p.is_external && !p.is_published
    return !p.is_external && p.is_published // 발행(내부)
  })
  const fmt = (s: string | null | undefined) => (s ? s.slice(0, 10) : '-')

  const editHref = (id?: string) => ({
    pathname: '/desk/edit',
    query: { ...TYPE_QUERY(section), ...(id ? { id } : {}) },
  })

  return (
    <>
      <Head>
        <title>{"Desk | Dowha's Blog"}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className="page-container">
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
              <h1 className="!mb-0 text-gray-800">Desk</h1>
              <div className="flex items-center gap-3">
                <button onClick={() => router.push(editHref())} className="default-button !mt-0">
                  <span>✏️</span>
                  <span>{`새 ${noun}`}</span>
                </button>
                <button onClick={logout} className="text-xs text-gray-400 hover:text-gray-600">
                  로그아웃
                </button>
              </div>
            </div>

            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
              <select
                value={section}
                onChange={(e) => changeSection(e.target.value as Section)}
                className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-700 outline-none focus:border-gray-400"
                aria-label="섹션 선택"
              >
                {SECTIONS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
              <span className="mx-1 h-4 w-px bg-gray-200" />
              {FILTERS[section].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`rounded-md px-2.5 py-1 ${
                    filter === key ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-100'
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
              {shown.map((p) => {
                // books: 읽는 중(amber) / 읽음(green), 그 외: 초안(amber) / 발행됨(green)
                const active = isBooks ? !p.is_reading : !!p.is_published
                const stateLabel = isBooks
                  ? p.is_reading
                    ? '읽는 중'
                    : '읽음'
                  : p.is_published
                    ? '발행됨'
                    : '초안'
                return (
                  <li key={p.id} className="flex items-center gap-3 border-b border-gray-100 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm text-gray-800">
                          {p.title || '(제목 없음)'}
                        </span>
                        {p.is_external && (
                          <span className="shrink-0 text-[11px] font-medium leading-none text-sky-600">
                            외부
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 truncate text-[11px] text-gray-400">
                        {p.slug || '—'} · {fmt(p.updated_at || p.created_at)}
                      </div>
                    </div>
                    <button
                      onClick={() => toggleState(p)}
                      className={`shrink-0 text-[11px] font-medium hover:underline ${
                        active ? 'text-green-600' : 'text-amber-600'
                      }`}
                      title={isBooks ? '클릭하여 읽는 중/읽음 전환' : '클릭하여 발행/초안 전환'}
                    >
                      {stateLabel}
                    </button>
                    {(!isPosts || !p.is_external) && (
                      <button
                        onClick={() => router.push(editHref(p.id))}
                        className="shrink-0 text-xs text-gray-400 hover:text-gray-700"
                      >
                        수정
                      </button>
                    )}
                  </li>
                )
              })}
              {!fetching && shown.length === 0 && (
                <li className="border-b border-gray-100 py-8 text-center text-xs text-gray-400">
                  {`${noun}이 없습니다.`}
                </li>
              )}
            </ul>
          </>
        )}
      </div>
    </>
  )
}
