'use client'

import { Navigation } from '@/components/Navigation'
import type React from 'react'
import Footer from '@/components/Footer'
import { useEffect } from 'react'
import { toast } from 'sonner'

export default function Layout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('showLuckyToast') === 'true') {
      toast.success('짜잔!')
      sessionStorage.removeItem('showLuckyToast')
    }
  }, [])

  return (
    <div>
      <div className="flex flex-col lg:flex-row">
        <Navigation />
        <main className="relative w-full max-w-2xl md:min-w-[672px] p-6 md:p-0">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  )
}
