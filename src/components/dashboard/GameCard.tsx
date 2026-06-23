'use client'

import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'

interface GameCardProps {
  title: string
  description: string
  players: string
  gradient: string
  icon: string
  href: string
}

export default function GameCard({ title, description, players, gradient, icon, href }: GameCardProps) {
  const router = useRouter()

  return (
    <div className={`relative overflow-hidden rounded-2xl border-2 border-gray-700/50 bg-gray-900/80 backdrop-blur-xl group hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-10 group-hover:opacity-20 transition-opacity`} />
      <div className="relative p-6">
        <div className="text-5xl mb-4">{icon}</div>
        <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400 mb-1">{description}</p>
        <p className="text-sm text-purple-400 mb-4">{players}</p>
        <div className="flex gap-2">
          <Button onClick={() => router.push(`${href}?mode=bot`)} variant="secondary" size="sm">
            VS Bot
          </Button>
          <Button onClick={() => router.push(`${href}?mode=online`)} size="sm">
            VS Teman
          </Button>
        </div>
      </div>
    </div>
  )
}
