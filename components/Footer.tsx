import { useRouter } from 'next/router'

export default function Footer() {
  const router = useRouter()
  return (
    <footer className="w-full fixed border-t border-gray-200 bottom-0 left-0 right-0 h-8 flex items-center justify-center bg-white bg-opacity-50 backdrop-blur print-hide">
      <div className="max-w-md mx-auto text-center text-xs text-gray-500">
        {/* ©를 더블클릭하면 /desk(관리자)로 진입하는 숨은 링크 */}
        <span onDoubleClick={() => router.push('/desk')} className="select-none">
          ©
        </span>{' '}
        2026{' '}
        <a
          href="https://dowha.kim"
          target="_blank"
          rel="noopener"
          className="hover:text-[#0a85d1]"
        >
          Dowha Kim
        </a>
      </div>
    </footer>
  )
}
