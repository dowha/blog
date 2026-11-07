// components/LoadingSpinner.tsx
// 두 사이트 공통 로딩 표시: 글자 없이 회색 원만 돈다 (dowha.kim과 동일)
function LoadingSpinner() {
  return (
    <div role="status" aria-label="Loading" className="flex items-center justify-center min-h-[300px]">
      <div className="w-6 h-6 rounded-full border-2 border-gray-300 border-t-transparent animate-spin" />
    </div>
  )
}

export default LoadingSpinner
