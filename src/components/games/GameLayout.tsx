'use client'

import { useRouter } from 'next/navigation'

interface GameLayoutProps {
  title: string
  children: React.ReactNode
}

export default function GameLayout({ title, children }: GameLayoutProps) {
  const router = useRouter()

  return (
    <div className="h-screen flex flex-col bg-gray-950">
      <header className="bg-gray-900/90 border-b border-gray-700 px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            GABUT
          </h1>
          <span className="text-gray-500">|</span>
          <span className="text-white font-semibold">{title}</span>
        </div>
      </header>
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  )
}
