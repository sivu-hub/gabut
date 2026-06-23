'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import GameLayout from '@/components/games/GameLayout'
import ChessGame3D from '@/components/games/chess/ChessGame3D'

function ChessContent() {
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode') || 'bot'

  return (
    <GameLayout title="Catur">
      <ChessGame3D isBot={mode === 'bot'} />
    </GameLayout>
  )
}

export default function ChessPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-gray-950 flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full" /></div>}>
      <ChessContent />
    </Suspense>
  )
}
