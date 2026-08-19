import { useEffect, useRef } from 'react'

type Props = {
  open: boolean
  message: string
  confirmLabel?: string
  busy?: boolean
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
  busy = false,
  onConfirm,
  onCancel,
}: Props) {
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    confirmRef.current?.focus()
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
        <p className="text-sm leading-6 text-gray-700">{message}</p>
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
            disabled={busy}
            className="default-button !mt-0 !bg-gray-800 !text-white hover:!bg-gray-700 disabled:opacity-50"
          >
            {busy ? '변경 중…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
