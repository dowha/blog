import { useState } from 'react'
import { supabase } from '@/supabase'
import type { SpellField, SpellIssue, SpellResult } from '@/lib/spellcheck'

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; issues: SpellIssue[]; snapshot: string }
  | { status: 'error'; message: string }

/** 버튼을 누를 때만 바른 API로 맞춤법을 검사한다 (유료라 자동 호출하지 않음). 본문은 고치지 않고 안내만 한다 */
export default function SpellCheck({ fields }: { fields: SpellField[] }) {
  const [state, setState] = useState<State>({ status: 'idle' })
  const targets = fields.filter((f) => f.text.trim())
  const snapshot = JSON.stringify(targets)
  const stale = state.status === 'done' && state.snapshot !== snapshot

  const run = async () => {
    setState({ status: 'loading' })
    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token) throw new Error('세션이 만료되었습니다. 다시 로그인하세요.')

      const res = await fetch('/api/desk/spellcheck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fields: targets }),
      })
      const body = (await res.json()) as SpellResult
      if ('error' in body) throw new Error(body.error)
      setState({ status: 'done', issues: body.issues, snapshot })
    } catch (e) {
      setState({ status: 'error', message: e instanceof Error ? e.message : '맞춤법 검사에 실패했습니다.' })
    }
  }

  const summary =
    state.status === 'loading'
      ? '맞춤법 확인 중…'
      : state.status === 'error'
        ? `맞춤법 확인 실패: ${state.message}`
        : state.status === 'done'
          ? state.issues.length
            ? `맞춤법 확인 ${state.issues.length}건${stale ? ' (수정됨, 다시 검사 필요)' : ''}`
            : `맞춤법 확인: 이상 없음${stale ? ' (수정됨, 다시 검사 필요)' : ''}`
          : '맞춤법 확인'

  const warn = state.status === 'error' || (state.status === 'done' && state.issues.length > 0)

  return (
    <div className="mt-2 rounded border border-gray-100 bg-gray-50 px-3 py-2 text-[11px] text-gray-500">
      <div className="flex items-center justify-between">
        {/* 색은 /desk 공통 체계: 경고 주황 #c8481c, 제안 파랑 #006fd6 */}
        <span className={warn ? 'font-medium text-[#c8481c]' : ''}>{summary}</span>
        <button
          type="button"
          onClick={run}
          disabled={state.status === 'loading' || targets.length === 0}
          // 옆의 '표기 규칙 ↗' 링크와 같은 크기로, 테두리만 얇게 둘러 버튼임을 표시
          className="rounded border border-gray-200 px-1.5 leading-[1.6] text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {state.status === 'loading' ? '검사 중…' : state.status === 'done' ? '다시 검사' : '검사'}
        </button>
      </div>
      {state.status === 'done' && state.issues.length > 0 && (
        <ul className={`mt-2 space-y-2.5 !pl-0 ${stale ? 'opacity-50' : ''}`}>
          {state.issues.map((i, idx) => (
            <li key={idx} className="!mb-0 list-none">
              <span className="text-gray-800">{i.origin}</span>
              {' → '}
              <span className="font-medium text-[#006fd6]">{i.revised}</span>
              {/* 대부분 본문이라 본문이 아닐 때만 칸 이름을 붙인다 */}
              {i.field !== '본문' && <span className="ml-1.5 text-gray-400">{i.field}</span>}
              <span className="block text-gray-400">
                [{i.category}]{i.comment ? ` ${i.comment}` : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
