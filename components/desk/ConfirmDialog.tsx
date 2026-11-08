import { useEffect, useRef, useState } from 'react'

type Props = {
  open: boolean
  message: string
  confirmLabel?: string
  busyLabel?: string
  busy?: boolean
  /** 지정하면 이 글자를 그대로 입력해야 확인 버튼이 눌린다 (삭제 등 되돌릴 수 없는 작업) */
  requireText?: string
  /** 확인 버튼을 위험 색(주황)으로 */
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * /desk 전용 확인 다이얼로그.
 * 목록에서 클릭 한 번으로 발행/읽기 상태가 즉시 바뀌던 것을 한 단계 막는 용도.
 */
export default function ConfirmDialog({
  open,
  message,
  confirmLabel = '확인',
  busyLabel = '변경 중…',
  busy = false,
  requireText,
  danger = false,
  onConfirm,
  onCancel,
}: Props) {
  const confirmRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [typed, setTyped] = useState('')
  const locked = !!requireText && typed.trim() !== requireText

  // 열릴 때만 입력을 비우고 포커스를 준다 (부모가 다시 그려져도 입력이 지워지지 않게 분리)
  useEffect(() => {
    if (!open) return
    setTyped('')
    if (requireText) inputRef.current?.focus()
    else confirmRef.current?.focus()
  }, [open, requireText])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, busy, onCancel])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4"
      onClick={() => !busy && onCancel()}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-xs rounded-lg border border-gray-200 bg-white p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="whitespace-pre-line text-sm leading-6 text-gray-700">{message}</p>
        {requireText && (
          <label className="mt-4 block text-[11px] text-gray-500">
            확인을 위해 &lsquo;{requireText}&rsquo;를 입력하세요.
            <input
              ref={inputRef}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !locked && !busy) onConfirm()
              }}
              disabled={busy}
              placeholder={requireText}
              className="mt-1.5 w-full rounded border border-gray-200 px-2 py-1.5 text-sm text-gray-800 outline-none placeholder:text-gray-300 focus:border-gray-400"
            />
          </label>
        )}
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={busy}
            className="rounded-md px-3 py-2 text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-50"
          >
            취소
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            disabled={busy || locked}
            className={`default-button !mt-0 !text-white disabled:cursor-not-allowed disabled:opacity-40 ${
              danger ? '!bg-[#c8481c] hover:!bg-[#a93c17]' : '!bg-gray-800 hover:!bg-gray-700'
            }`}
          >
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
