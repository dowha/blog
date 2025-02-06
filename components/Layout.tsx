import { Navigation } from "@/components/Navigation"
import type React from "react"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row">
      <Navigation />
      <main className="relative flex-1 max-w-2xl min-w-[672px] p-6 md:p-0">{children}</main>
    </div>
  )
}

