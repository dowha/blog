'use client'

/**
 * 날짜 선택기 (라이브러리 없이 만든 작은 팝오버 달력)
 * - DateTimePicker: 날짜 + 시각. 값은 datetime-local 형식 'YYYY-MM-DDTHH:mm' 또는 ''
 * - MonthPicker: 연월. 값은 'YYYY-MM'
 * ⚠️ hello/components/ui/date-picker.tsx와 같은 내용을 유지한다. 한쪽을 고치면 다른 쪽도 고칠 것.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react'

const pad = (n: number) => String(n).padStart(2, '0')
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const HOURS = Array.from({ length: 24 }, (_, i) => i)
const MINUTES = Array.from({ length: 60 }, (_, i) => i)

// 사이트 색 체계: 선택은 파랑, 나머지는 회색
const SELECTED = 'bg-[#006fd6] text-white hover:bg-[#006fd6]'
const NAV_BTN = 'flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-700'
const TEXT_BTN = 'rounded px-1.5 py-0.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800'

const DEFAULT_TRIGGER =
  'inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] text-gray-700 outline-none transition-colors hover:border-gray-400 focus-visible:border-gray-400'

type Parts = { y: number; m: number; d: number; hh: number; mm: number }

/** 'YYYY-MM-DDTHH:mm' → 숫자 묶음 (m은 1~12) */
function parseDateTime(v: string): Parts | null {
  const r = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(v)
  return r ? { y: +r[1], m: +r[2], d: +r[3], hh: +r[4], mm: +r[5] } : null
}
const formatDateTime = ({ y, m, d, hh, mm }: Parts) => `${y}-${pad(m)}-${pad(d)}T${pad(hh)}:${pad(mm)}`
const nowParts = (): Parts => {
  const n = new Date()
  return { y: n.getFullYear(), m: n.getMonth() + 1, d: n.getDate(), hh: n.getHours(), mm: n.getMinutes() }
}

/** 트리거 버튼 + 바깥 클릭·Esc로 닫히는 팝오버 */
function Popover({
  label,
  placeholder,
  title,
  triggerClassName,
  children,
}: {
  label: string
  placeholder?: string
  title?: string
  triggerClassName?: string
  children: (close: () => void) => ReactNode
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      triggerRef.current?.focus()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const close = () => {
    setOpen(false)
    triggerRef.current?.focus()
  }

  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        ref={triggerRef}
        type="button"
        title={title}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={triggerClassName ?? DEFAULT_TRIGGER}
      >
        <span className={`tabular-nums ${label ? '' : 'text-gray-400'}`}>{label || placeholder || '선택'}</span>
        <span aria-hidden className="text-[0.8em] text-gray-400">
          ▾
        </span>
      </button>
      {open && (
        <div
          role="dialog"
          className="absolute left-0 top-full z-50 mt-1 w-60 rounded-lg border border-gray-200 bg-white p-3 text-xs text-gray-700 shadow-lg"
        >
          {children(close)}
        </div>
      )}
    </div>
  )
}

/** 날짜 + 시각 선택. allowEmpty면 '비우기' 버튼을 보여준다 */
export function DateTimePicker({
  value,
  onChange,
  placeholder,
  title,
  allowEmpty,
  triggerClassName,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  title?: string
  allowEmpty?: boolean
  triggerClassName?: string
}) {
  const parts = parseDateTime(value)
  const label = parts ? `${parts.y}. ${parts.m}. ${parts.d}. ${pad(parts.hh)}:${pad(parts.mm)}` : ''

  return (
    <Popover label={label} placeholder={placeholder} title={title} triggerClassName={triggerClassName}>
      {(close) => <DateTimePanel parts={parts} onChange={onChange} allowEmpty={allowEmpty} close={close} />}
    </Popover>
  )
}

function DateTimePanel({
  parts,
  onChange,
  allowEmpty,
  close,
}: {
  parts: Parts | null
  onChange: (v: string) => void
  allowEmpty?: boolean
  close: () => void
}) {
  const base = parts ?? nowParts()
  // 보고 있는 달 (선택값과 별개로 넘길 수 있다)
  const [view, setView] = useState({ y: base.y, m: base.m })
  const today = nowParts()

  const firstWeekday = new Date(view.y, view.m - 1, 1).getDay()
  const daysInMonth = new Date(view.y, view.m, 0).getDate()
  const cells: (number | null)[] = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const moveMonth = (delta: number) =>
    setView(({ y, m }) => {
      const t = new Date(y, m - 1 + delta, 1)
      return { y: t.getFullYear(), m: t.getMonth() + 1 }
    })

  // 날짜만 고르면 시각은 기존 값(없으면 현재 시각)을 유지한다
  const pickDay = (d: number) => onChange(formatDateTime({ ...base, y: view.y, m: view.m, d }))
  const setTime = (patch: Partial<Pick<Parts, 'hh' | 'mm'>>) => onChange(formatDateTime({ ...base, ...patch }))

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => moveMonth(-1)} className={NAV_BTN} aria-label="이전 달">
          ‹
        </button>
        <span className="font-medium text-gray-800">
          {view.y}년 {view.m}월
        </span>
        <button type="button" onClick={() => moveMonth(1)} className={NAV_BTN} aria-label="다음 달">
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center">
        {WEEKDAYS.map((w) => (
          <span key={w} className="py-1 text-[10px] text-gray-400">
            {w}
          </span>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <span key={`b${i}`} />
          const selected = !!parts && parts.y === view.y && parts.m === view.m && parts.d === d
          const isToday = today.y === view.y && today.m === view.m && today.d === d
          return (
            <button
              key={d}
              type="button"
              onClick={() => pickDay(d)}
              aria-pressed={selected}
              aria-label={`${view.y}년 ${view.m}월 ${d}일`}
              className={`h-7 rounded tabular-nums ${
                selected ? SELECTED : isToday ? 'font-semibold text-[#006fd6] hover:bg-gray-100' : 'hover:bg-gray-100'
              }`}
            >
              {d}
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-1.5 border-t border-gray-100 pt-2">
        <span className="text-gray-400">시각</span>
        <select
          value={base.hh}
          onChange={(e) => setTime({ hh: +e.target.value })}
          aria-label="시"
          className="rounded-md border border-gray-200 px-1 py-0.5 tabular-nums outline-none focus:border-gray-400"
        >
          {HOURS.map((h) => (
            <option key={h} value={h}>
              {pad(h)}
            </option>
          ))}
        </select>
        <span className="text-gray-400">:</span>
        <select
          value={base.mm}
          onChange={(e) => setTime({ mm: +e.target.value })}
          aria-label="분"
          className="rounded-md border border-gray-200 px-1 py-0.5 tabular-nums outline-none focus:border-gray-400"
        >
          {MINUTES.map((m) => (
            <option key={m} value={m}>
              {pad(m)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            const n = nowParts()
            setView({ y: n.y, m: n.m })
            onChange(formatDateTime(n))
          }}
          className={TEXT_BTN}
        >
          지금
        </button>
        <div className="flex gap-1">
          {allowEmpty && (
            <button
              type="button"
              onClick={() => {
                onChange('')
                close()
              }}
              className={TEXT_BTN}
            >
              비우기
            </button>
          )}
          <button type="button" onClick={close} className={TEXT_BTN}>
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}

/** 연월 선택. 값은 'YYYY-MM' */
export function MonthPicker({
  value,
  onChange,
  title,
  triggerClassName,
}: {
  value: string
  onChange: (v: string) => void
  title?: string
  triggerClassName?: string
}) {
  const r = /^(\d{4})-(\d{2})/.exec(value)
  const sel = r ? { y: +r[1], m: +r[2] } : null
  const label = sel ? `${sel.y}. ${pad(sel.m)}` : ''

  return (
    <Popover label={label} title={title} triggerClassName={triggerClassName}>
      {(close) => <MonthPanel sel={sel} onChange={onChange} close={close} />}
    </Popover>
  )
}

function MonthPanel({
  sel,
  onChange,
  close,
}: {
  sel: { y: number; m: number } | null
  onChange: (v: string) => void
  close: () => void
}) {
  const now = new Date()
  const [year, setYear] = useState(sel?.y ?? now.getFullYear())

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => setYear((y) => y - 1)} className={NAV_BTN} aria-label="이전 해">
          ‹
        </button>
        <span className="font-medium tabular-nums text-gray-800">{year}년</span>
        <button type="button" onClick={() => setYear((y) => y + 1)} className={NAV_BTN} aria-label="다음 해">
          ›
        </button>
      </div>
      <div className="grid grid-cols-4 gap-1">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
          const selected = sel?.y === year && sel.m === m
          const isNow = now.getFullYear() === year && now.getMonth() + 1 === m
          return (
            <button
              key={m}
              type="button"
              onClick={() => {
                onChange(`${year}-${pad(m)}`)
                close()
              }}
              aria-pressed={selected}
              className={`rounded py-1.5 ${
                selected ? SELECTED : isNow ? 'font-semibold text-[#006fd6] hover:bg-gray-100' : 'hover:bg-gray-100'
              }`}
            >
              {m}월
            </button>
          )
        })}
      </div>
    </div>
  )
}
