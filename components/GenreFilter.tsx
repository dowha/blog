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
      const { data, error } = await supabase
        .from('books')
        .select('genre, created_at') // ✅ created_at 추가
        .order('created_at', { ascending: false }) // ✅ 최신순 정렬

      if (error) {
        console.error('Error fetching genres:', error)
      } else {
        // 중복 제거 후 최신순 유지
        const uniqueGenres = Array.from(new Set(data.map((book) => book.genre)))
        setGenres(['전체', ...uniqueGenres])
      }
    }
    fetchGenres()
  }, [])

  return (
    <div className="space-y-2 mt-6">
      <div className="flex flex-wrap gap-2">
        {genres.map((genre) => (
          <button
            key={genre}
            className={`px-2 py-1 text-xs rounded-md cursor-pointer ${
              selectedGenre === genre
                ? 'bg-gray-800 text-white'
                : 'border border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => onChange(genre)}
          >
            {genre === '전체' ? genre : `#${genre}`}{' '}
            {/* "전체"에서는 # 없이 표시 */}
          </button>
        ))}
      </div>
    </div>
  )
}
