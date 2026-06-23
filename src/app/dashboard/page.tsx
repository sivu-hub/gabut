'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useGameStore } from '@/store/gameStore'
import GameCard from '@/components/dashboard/GameCard'
import FriendPanel from '@/components/friends/FriendPanel'

export default function DashboardPage() {
  const router = useRouter()
  const { user, setUser } = useGameStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('gabut_user')
    if (!stored) {
      router.push('/')
      return
    }
    const parsed = JSON.parse(stored)
    setUser(parsed)
    setLoading(false)
  }, [router, setUser])

  const handleLogout = async () => {
    if (user) {
      await supabase.from('users').update({ online: false }).eq('id', user.id)
    }
    localStorage.removeItem('gabut_user')
    setUser(null)
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/3 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-black bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              GABUT
            </h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  {user?.nickname?.[0]?.toUpperCase()}
                </div>
                <div className="hidden sm:block">
                  <p className="text-white font-semibold text-sm">{user?.nickname}</p>
                  <p className="text-gray-400 text-xs">W:{user?.wins} | L:{user?.losses}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-red-400 transition-colors p-2"
                title="Logout"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Games */}
            <div className="lg:col-span-3">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Pilih Permainan
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <GameCard
                  title="Catur"
                  description="Permainan strategi klasik"
                  players="2 Pemain"
                  gradient="from-amber-500 to-orange-600"
                  icon="♟️"
                  href="/game/chess"
                />
                <GameCard
                  title="Bilyard"
                  description="8-ball pool seru"
                  players="2 Pemain"
                  gradient="from-green-500 to-emerald-600"
                  icon="🎱"
                  href="/game/billiards"
                />
                <GameCard
                  title="Kartu Remi"
                  description="Main remi bareng"
                  players="2-4 Pemain"
                  gradient="from-red-500 to-rose-600"
                  icon="🃏"
                  href="/game/remi"
                />
              </div>

              {/* Stats */}
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="bg-gray-900/80 border border-gray-700/50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-green-400">{user?.wins || 0}</p>
                  <p className="text-gray-400 text-sm">Menang</p>
                </div>
                <div className="bg-gray-900/80 border border-gray-700/50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-red-400">{user?.losses || 0}</p>
                  <p className="text-gray-400 text-sm">Kalah</p>
                </div>
                <div className="bg-gray-900/80 border border-gray-700/50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-purple-400">
                    {user?.wins && user.losses ? Math.round((user.wins / (user.wins + user.losses)) * 100) : 0}%
                  </p>
                  <p className="text-gray-400 text-sm">Winrate</p>
                </div>
              </div>
            </div>

            {/* Friends */}
            <div className="lg:col-span-1">
              <FriendPanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
