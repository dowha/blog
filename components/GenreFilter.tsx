'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/supabase'

export default function GenreFilter({
  selectedGenre,
  onChange,
}: {
  selectedGenre: string
  onChange: (genre: string) => void
}) {
  const [genres, setGenres] = useState<string[]>(['전체'])
  useEffect(() => {
    async function fetchGenres() {
      const { data, error } = await supabase.from('books').select('genre')

      if (error) {
        console.error('Error fetching genres:', error)
      } else {
        // 중복 제거 후 배열로 저장
        const uniqueGenres = Array.from(new Set(data.map((book) => book.genre)))
        setGenres(['전체', ...uniqueGenres])
      }
    }
    fetchGenres()
  }, [])

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
