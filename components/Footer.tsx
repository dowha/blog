export default function Footer() {
  return (
    <footer className="w-full fixed border-t border-gray-200 bottom-0 left-0 right-0 h-8 flex items-center justify-center bg-white bg-opacity-50 backdrop-blur print-hide">
      <div className="max-w-md mx-auto text-center text-xs text-gray-500">
        © 2026{' '}
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
