import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { toast } from 'sonner'
import { supabase } from '@/supabase'
import { useOwner, loginWithGoogle, logout } from '@/components/desk/useOwner'
import ConfirmDialog from '@/components/desk/ConfirmDialog'
import { BTN_SECONDARY, BTN_SMALL } from '@/components/desk/ui'
import { formatKstDate } from '@/lib/date'
import { notifyChanged, pagesFor, type ContentKind } from '@/lib/indexnow'
import { SECTIONS, INTROS_LABEL, type Section } from '@/components/desk/sections'

type Row = {
  id: string
  title: string
  slug: string | null
  is_published?: boolean
  is_external?: boolean
  is_reading?: boolean // books 전용
  short_id?: number // shorts 전용
  content?: string // shorts는 제목이 없어 본문을 대신 보여준다
  updated_at?: string | null // books·shorts엔 없음(트리거 미존재)
  created_at?: string // series엔 없음
}


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
  shorts: [
    { key: 'all', label: '전체' },
    { key: 'draft', label: '초안' },
    { key: 'published', label: '발행' },
  ],
  series: [
    { key: 'all', label: '전체' },
    { key: 'draft', label: '초안' },
    { key: 'published', label: '발행' },
  ],
}

const NOUN: Record<Section, string> = {
  posts: '글',
  records: '기록',
  books: '책',
  shorts: 'Shorts',
  series: '시리즈',
}
// 조사가 달라 문장은 따로 둔다.
const EMPTY_MESSAGE: Record<Section, string> = {
  posts: '글이 없습니다.',
  records: '기록이 없습니다.',
  books: '책이 없습니다.',
  shorts: 'Shorts가 없습니다.',
  series: '시리즈가 없습니다.',
}
const DEFAULT_FILTER = (s: Section): Filter => (s === 'books' ? 'reading' : 'draft')

// 에디터는 type 파라미터로 대상 테이블을 구분한다.
const TYPE_QUERY = (s: Section) =>
  s === 'records'
    ? { type: 'record' }
    : s === 'books'
      ? { type: 'book' }
      : s === 'shorts'
        ? { type: 'short' }
        : s === 'series'
          ? { type: 'series' }
          : {}

export default function DeskHome() {
  const router = useRouter()
  const { user, loading, isOwner } = useOwner()
  const [section, setSection] = useState<Section>('posts')
  const [rows, setRows] = useState<Row[]>([])
  const [filter, setFilter] = useState<Filter>('draft')
  const [fetching, setFetching] = useState(false)
  // 상태 전환은 확인 다이얼로그를 한 번 거친다.
  const [pending, setPending] = useState<Row | null>(null)
  const [applying, setApplying] = useState(false)

  const isPosts = section === 'posts'
  const isBooks = section === 'books'
  const isShorts = section === 'shorts'
  const isSeries = section === 'series'
  const noun = NOUN[section]

  // ?tab=…      에디터에서 돌아올 섹션 복원
  // ?filter=all  공개 페이지 제목에서 들어온 경우엔 초안/읽는 중 대신 전체를 연다
  useEffect(() => {
    if (!router.isReady) return
    const tab = router.query.tab
    const next: Section | null =
      tab === 'records' || tab === 'books' || tab === 'shorts' || tab === 'series' ? tab : null
    if (next) setSection(next)
    setFilter(router.query.filter === 'all' ? 'all' : DEFAULT_FILTER(next ?? 'posts'))
  }, [router.isReady, router.query.tab, router.query.filter])

  const load = async () => {
    setFetching(true)
    const cols = isPosts
      ? 'id,title,slug,is_published,is_external,updated_at,created_at'
      : isBooks
        ? 'id,title,slug,is_reading,created_at'
        : isShorts
          ? 'id,short_id,content,is_published,created_at'
          : isSeries
            ? 'id,title:series_name,slug,is_published' // series엔 created_at이 없다
            : 'id,title,slug,is_published,updated_at,created_at'
    const { data, error } = await supabase
      .from(section)
      .select(cols)
      .order(isSeries ? 'series_name' : 'created_at', { ascending: isSeries })
    setFetching(false)
    // 실패를 '없습니다'로 오해하지 않도록 알린다
    if (error) return toast.error('목록을 불러오지 못했습니다: ' + error.message)
    setRows((data as unknown as Row[]) ?? [])
  }

  useEffect(() => {
    if (isOwner) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner, section])

  const changeSection = (s: Section) => {
    setSection(s)
    setFilter(DEFAULT_FILTER(s))
    setPending(null) // 열려 있던 확인창이 다른 테이블에 적용되지 않도록
  }

  const toggleKind = (p: Row): ContentKind =>
    isPosts ? (p.is_external ? 'external' : 'post') : (({ records: 'record', books: 'book', shorts: 'short', series: 'series' }) as const)[section as Exclude<Section, 'posts'>]

  // posts/records는 발행 여부, books는 읽기 여부를 토글한다.
  const applyToggle = async () => {
    if (!pending) return
    const col = isBooks ? 'is_reading' : 'is_published'
    const next = !(isBooks ? pending.is_reading : pending.is_published)
    setApplying(true)
    // updated_at은 DB 트리거(moddatetime)가 자동 갱신
    const { error } = await supabase
      .from(section)
      .update({ [col]: next })
      .eq('id', pending.id)
    setApplying(false)
    if (error) {
      toast.error('변경 실패: ' + error.message)
      return
    }
    setRows((prev) => prev.map((x) => (x.id === pending.id ? { ...x, [col]: next } : x)))
    // 발행 여부·읽는 중 표시가 바뀌면 목록·상세·홈을 바로 다시 만든다
    notifyChanged(pagesFor(toggleKind(pending), [pending.slug]))
    setPending(null)
  }

  // 확인 문구는 '바뀔 상태' 기준으로 만든다.
  const confirmMessage = (p: Row) => {
    // Shorts는 본문 전체가 제목 자리에 오므로 앞부분만 보여준다
    const full = rowTitle(p)
    const title = full.length > 40 ? `${full.slice(0, 40)}…` : full
    if (isBooks) return `'${title}'을(를) ${p.is_reading ? '읽음' : '읽는 중'}으로 변경할까요?`
    return p.is_published
      ? `'${title}'을(를) 초안으로 되돌릴까요?`
      : `'${title}'을(를) 발행할까요?`
  }

  const shown = rows.filter((p) => {
    if (filter === 'all') return true
    if (isBooks) return filter === 'reading' ? !!p.is_reading : !p.is_reading
    if (filter === 'external') return !!p.is_external
    if (filter === 'draft') return !p.is_external && !p.is_published
    return !p.is_external && p.is_published // 발행(내부)
  })
  // 날짜는 공개 사이트와 같은 'YYYY.MM.DD.' (한국 시간)
  const fmt = (s: string | null | undefined) => (s ? formatKstDate(s) : '-')

  // shorts는 title·slug가 없어 본문 발췌와 #short_id로 대신한다.
  const rowTitle = (p: Row) =>
    isShorts
      ? (p.content ?? '').replace(/\s+/g, ' ').trim() || '(내용 없음)'
      : p.title || '(제목 없음)'
  const rowMeta = (p: Row) => (isShorts ? `#${p.short_id ?? '-'}` : p.slug || '—')
  // series엔 날짜 컬럼이 없어 slug만 보여준다.
  // 목록 정렬 기준(created_at)과 맞춰 생성일을 표시한다(없으면 수정일로 대체)
  const rowSub = (p: Row) => {
    if (isSeries) return rowMeta(p)
    return `${rowMeta(p)}, ${fmt(p.created_at || p.updated_at)}`
  }

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
            <button onClick={loginWithGoogle} className={BTN_SECONDARY}>
              🔐 관리자 로그인
            </button>
          </div>
        ) : !isOwner ? (
          <div className="flex flex-col items-start gap-2 py-16">
            <p className="text-sm text-gray-600">접근 권한이 없는 계정입니다. ({user.email})</p>
            <button onClick={logout} className="text-xs text-gray-400 hover:text-gray-700">
              로그아웃
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <h1 className="!mb-0 text-gray-800">
                {/* 제목을 누르면 /desk를 새로 불러온다 (Link는 화면 전환만 해서 일반 a 사용) */}
                {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                <a href="/desk" className="no-underline hover:text-inherit hover:opacity-80">
                  Desk
                </a>
                {/* 로그아웃은 제목 옆 *로 숨긴다 */}
                <button
                  onClick={logout}
                  title="로그아웃"
                  aria-label="로그아웃"
                  className="ml-1 align-super text-sm text-gray-300 hover:text-gray-700"
                >
                  *
                </button>
              </h1>
              <div className="flex items-center gap-3">
                <Link href="/style-guide" target="_blank" className="text-xs text-gray-400 hover:text-gray-700">
                  표기 규칙 ↗
                </Link>
                <button onClick={() => router.push(editHref())} className={BTN_SECONDARY}>
                  + 새 {noun}
                </button>
              </div>
            </div>

            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
              <select
                value={section}
                onChange={(e) =>
                  // 소개 문구는 별도 페이지라 이동한다
                  e.target.value === 'intros'
                    ? router.push('/desk/intros')
                    : changeSection(e.target.value as Section)
                }
                className="rounded-md border border-gray-200 px-2.5 py-[5px] text-xs text-gray-700 outline-none focus:border-gray-400"
                aria-label="섹션 선택"
              >
                {SECTIONS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
                <option disabled>──────</option>
                <option value="intros">{INTROS_LABEL}</option>
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
                // books: 읽는 중(회색) / 읽음(파랑), 그 외: 초안(회색) / 발행됨(파랑) — 편집 화면 배지와 같은 색
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
                        <span className="truncate text-sm text-gray-800">{rowTitle(p)}</span>
                        {p.is_external && (
                          <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] leading-none text-gray-500">
                            외부
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 truncate text-[11px] text-gray-400">
                        {rowSub(p)}
                      </div>
                    </div>
                    <button
                      onClick={() => setPending(p)}
                      className={`shrink-0 text-[11px] font-medium hover:underline ${
                        active ? 'text-brand-dark' : 'text-gray-500'
                      }`}
                      title={isBooks ? '클릭하여 읽는 중/읽음 전환' : '클릭하여 발행/초안 전환'}
                    >
                      {stateLabel}
                    </button>
                    <button
                      onClick={() => router.push(editHref(p.id))}
                      className={BTN_SMALL}
                    >
                      수정
                    </button>
                  </li>
                )
              })}
              {!fetching && shown.length === 0 && (
                <li className="border-b border-gray-100 py-8 text-center text-xs text-gray-400">
                  {EMPTY_MESSAGE[section]}
                </li>
              )}
            </ul>

            <ConfirmDialog
              open={!!pending}
              message={pending ? confirmMessage(pending) : ''}
              confirmLabel="변경"
              busy={applying}
              onConfirm={applyToggle}
              onCancel={() => setPending(null)}
            />
          </>
        )}
      </div>
    </>
  )
}
