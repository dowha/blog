import Link from 'next/link'
import { checkStyle } from '@/lib/styleCheck'

type Field = { label: string; text: string; headline?: boolean }

/** 편집 중인 글의 표기 규칙 위반 후보를 보여준다. 저장은 막지 않는다 */
export default function StyleHints({ fields }: { fields: Field[] }) {
  // 정규식 몇 개라 입력할 때마다 다시 계산해도 충분히 가볍다
  const issues = fields.flatMap((f) =>
    checkStyle(f.text, { headline: f.headline }).map((i) => ({ ...i, field: f.label }))
  )

  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-[11px] text-gray-500">
      <div className="flex items-center justify-between">
        <span className={issues.length ? 'font-medium text-[#c8481c]' : ''}>
          {issues.length ? `표기 확인 ${issues.length}건` : '표기 확인: 이상 없음'}
        </span>
        <Link href="/style-guide" target="_blank" className="text-gray-400 hover:text-gray-700">
          표기 규칙 ↗
        </Link>
      </div>
      {issues.length > 0 && (
        <ul className="mt-2 space-y-2.5 !pl-0">
          {issues.map((i, idx) => (
            <li key={idx} className="!mb-0 list-none">
              <span className="text-gray-800">{i.excerpt}</span>
              {/* 대부분 본문이라 본문이 아닐 때만 칸 이름을 붙인다 (맞춤법 확인과 동일) */}
              {i.field !== '본문' && <span className="ml-1.5 text-gray-400">{i.field}</span>}
              <span className="block text-gray-400">
                [{i.rule}] {i.message}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
