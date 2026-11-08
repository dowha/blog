import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { toast } from 'sonner'
import { supabase } from '@/supabase'
import { useOwner, loginWithGoogle } from '@/components/desk/useOwner'
import { INTRO_PAGES, introToText, type IntroPage } from '@/lib/pageIntro'
import { notifyChanged } from '@/lib/indexnow'
import { SECTIONS, INTROS_LABEL, deskViewHref, type DeskView } from '@/components/desk/sections'

type Row = { page: IntroPage; body: string; updated_at: string }

// 검색 결과에 잘리지 않고 보이는 설명 길이의 대략적인 기준
const DESC_HINT = 120

/** /desk 소개 문구 편집: 각 목록 페이지 상단 문구(HTML)와 검색 설명을 관리한다 */
export default function DeskIntros() {
  const router = useRouter()
  const { user, loading, isOwner } = useOwner()
  const [saved, setSaved] = useState<Record<IntroPage, Row> | null>(null)

  useEffect(() => {
    if (!isOwner) return
    supabase
      .from('page_intros')
      .select('page, body, updated_at')
      .then(({ data, error }) => {
        if (error) return toast.error('불러오기 실패: ' + error.message)
        setSaved(Object.fromEntries((data ?? []).map((r) => [r.page, r])) as Record<IntroPage, Row>)
      })
  }, [isOwner])

  return (
    <>
      <Head>
        <title>{"Intros | Desk | Dowha's Blog"}</title>
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
          <p className="py-16 text-sm text-gray-600">접근 권한이 없는 계정입니다. ({user.email})</p>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <h1 className="!mb-0 text-gray-800">{INTROS_LABEL}</h1>
              <Link href="/desk" className="text-xs text-gray-400 hover:text-gray-700">
                ← Desk
              </Link>
            </div>
            {/* /desk와 같은 드롭다운으로 다른 섹션으로 바로 이동 */}
            <select
              value="intros"
              onChange={(e) => router.push(deskViewHref(e.target.value as DeskView))}
              className="mb-4 rounded border border-gray-200 px-2 py-1 text-xs text-gray-700 outline-none focus:border-gray-400"
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
            {!saved ? (
              <p className="text-xs text-gray-400">불러오는 중…</p>
            ) : (
              <ul className="space-y-4 !pl-0">
                {INTRO_PAGES.map((p) =>
                  saved[p.key] ? (
                    <IntroItem
                      key={p.key}
                      meta={p}
                      row={saved[p.key]}
                      onSaved={(row) => setSaved((prev) => prev && { ...prev, [p.key]: row })}
                    />
                  ) : null
                )}
              </ul>
            )}
          </>
        )}
      </div>
    </>
  )
}

function IntroItem({
  meta,
  row,
  onSaved,
}: {
  meta: (typeof INTRO_PAGES)[number]
  row: Row
  onSaved: (row: Row) => void
}) {
  const [body, setBody] = useState(row.body)
  const [busy, setBusy] = useState(false)
  const dirty = body.trim() !== row.body
  const text = introToText(body)

  const save = async () => {
    if (!body.trim()) return toast.error('내용을 입력하세요.')
    setBusy(true)
    const { data, error } = await supabase
      .from('page_intros')
      .update({ body: body.trim() })
      .eq('page', meta.key)
      .select('page, body, updated_at')
      .single()
    setBusy(false)
    if (error) return toast.error('저장 실패: ' + error.message)
    onSaved(data as Row)
    setBody(data.body)
    toast.success(`${meta.label} 저장됨`)
    // 공개 페이지 즉시 재생성 + 검색엔진 알림
    notifyChanged([meta.path])
  }

  return (
    <li className="list-none space-y-2 rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-semibold text-gray-800">{meta.label}</span>
        <a href={meta.path} target="_blank" rel="noopener" className="text-xs text-gray-400">
          {meta.path}
        </a>
        {!meta.visible && (
          <span className="text-[11px] font-medium text-sky-600">화면 비노출 · 검색 설명 전용</span>
        )}
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={meta.key === 'home' ? 4 : 3}
        className="w-full resize-y rounded-md border border-gray-200 px-2.5 py-1.5 font-mono text-xs leading-relaxed text-gray-800 outline-none focus:border-gray-400"
      />
      {meta.visible && (
        // 실제 페이지와 같은 클래스로 미리보기 (home은 index-contents)
        <p
          className={`rounded-md bg-gray-50 px-3 py-2 text-keepall ${meta.key === 'home' ? 'index-contents' : ''}`}
          dangerouslySetInnerHTML={{ __html: body }}
        />
      )}
      <div className="flex items-center gap-3 text-[11px] text-gray-400">
        <span className={text.length > DESC_HINT ? 'text-amber-600' : ''}>
          검색 설명 {text.length}자{meta.key === 'home' ? ' (home 검색 설명은 별도 기본값 사용)' : ''}
        </span>
        <span>수정 {row.updated_at.slice(0, 16).replace('T', ' ')}</span>
        <button
          onClick={save}
          disabled={!dirty || busy}
          className="ml-auto rounded-md bg-gray-800 px-3 py-1.5 text-xs text-white disabled:opacity-30"
        >
          {busy ? '저장 중…' : '저장'}
        </button>
      </div>
    </li>
  )
}
