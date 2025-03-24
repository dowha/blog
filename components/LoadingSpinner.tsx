// components/LoadingSpinner.tsx
import React from 'react'

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[300px] bg-white/20 backdrop-blur-sm rounded-md">
      <div className="text-center">
        <div className="inline-block">
          <div className="w-8 h-8 rounded-full border-4 border-gray-400 border-t-transparent animate-spin" />
        </div>
        <p className="mt-2 text-sm text-gray-500 font-medium">Loading...</p>
      </div>
    </div>
  )
}

export default LoadingSpinner
