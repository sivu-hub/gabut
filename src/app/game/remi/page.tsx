'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import GameLayout from '@/components/games/GameLayout'
import RemiGame3D from '@/components/games/remi/RemiGame3D'
import Button from '@/components/ui/Button'

function RemiContent() {
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode') || 'bot'
  const [playerCount, setPlayerCount] = useState<number | null>(null)

  if (!playerCount) {
    return (
      <GameLayout title="Kartu Remi">
        <div className="h-full flex items-center justify-center">
          <div className="bg-gray-900/80 border-2 border-gray-700/50 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-6">Pilih Jumlah Pemain</h2>
            <div className="flex gap-4">
              {[2, 3, 4].map(n => (
                <Button key={n} onClick={() => setPlayerCount(n)} size="lg">
                  {n} Pemain
                </Button>
              ))}
            </div>
          </div>
        </div>
      </GameLayout>
    )
  }

  return (
    <GameLayout title="Kartu Remi">
      <RemiGame3D isBot={mode === 'bot'} playerCount={playerCount} />
    </GameLayout>
  )
}

export default function RemiPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-gray-950 flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full" /></div>}>
      <RemiContent />
    </Suspense>
  )
}
