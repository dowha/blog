import { Navigation } from '@/components/Navigation'
import type React from 'react'
import Footer from '@/components/Footer'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="flex flex-col md:flex-row">
        <Navigation />
        <main className="relative w-full max-w-2xl md:min-w-[672px] p-6 md:p-0">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  )
}
