import { create } from 'zustand'

export interface User {
  id: string
  nickname: string
  avatar_url?: string
  wins: number
  losses: number
  online: boolean
}

export interface Friend {
  id: string
  user_id: string
  friend_id: string
  status: 'pending' | 'accepted' | 'rejected'
  friend?: User
}

export interface GameRoom {
  id: string
  game_type: 'chess' | 'billiards' | 'remi'
  host_id: string
  status: 'waiting' | 'playing' | 'finished'
  max_players: number
  players: string[]
}

interface GameState {
  user: User | null
  friends: Friend[]
  onlineFriends: User[]
  currentRoom: GameRoom | null
  setUser: (user: User | null) => void
  setFriends: (friends: Friend[]) => void
  setOnlineFriends: (friends: User[]) => void
  setCurrentRoom: (room: GameRoom | null) => void
}

export const useGameStore = create<GameState>((set) => ({
  user: null,
  friends: [],
  onlineFriends: [],
  currentRoom: null,
  setUser: (user) => set({ user }),
  setFriends: (friends) => set({ friends }),
  setOnlineFriends: (friends) => set({ onlineFriends: friends }),
  setCurrentRoom: (room) => set({ currentRoom: room }),
}))
