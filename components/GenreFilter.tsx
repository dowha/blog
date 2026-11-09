/** 장르 목록은 책 목록과 함께 서버(pages/books.tsx getStaticProps)에서 받는다 */
export default function GenreFilter({
  genres: bookGenres,
  selectedGenre,
  onChange,
}: {
  genres: string[]
  selectedGenre: string
  onChange: (genre: string) => void
}) {
  const genres = ['전체', ...bookGenres]

  // ✅ 버튼 클릭 시 onChange만 호출 (URL 변경은 부모 컴포넌트에서 처리)
  const handleGenreChange = (genre: string) => {
    onChange(genre)
  }

  return (
    <div className="space-y-2 mt-6">
      <div className="flex flex-wrap gap-2">
        {genres.map((genre) => (
          <button
            key={genre}
            className={`px-2 py-1 text-xs rounded-md cursor-pointer ${selectedGenre === genre
              ? 'bg-gray-800 text-white'
              : 'border border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            onClick={() => handleGenreChange(genre)}
          >
            {genre === '전체' ? genre : `${genre}`}
          </button>
        ))}
      </div>
    </div>
  )
}
