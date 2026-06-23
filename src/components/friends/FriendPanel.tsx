'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useGameStore, User, Friend } from '@/store/gameStore'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'

export default function FriendPanel() {
  const { user, friends, setFriends } = useGameStore()
  const [showAdd, setShowAdd] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [searching, setSearching] = useState(false)

  const loadFriends = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('friends')
      .select('*, friend:users!friends_friend_id_fkey(*)')
      .eq('user_id', user.id)
      .eq('status', 'accepted')

    const { data: data2 } = await supabase
      .from('friends')
      .select('*, friend:users!friends_user_id_fkey(*)')
      .eq('friend_id', user.id)
      .eq('status', 'accepted')

    const all: Friend[] = [
      ...(data || []).map((f: Record<string, unknown>) => ({ ...f, friend: f.friend } as Friend)),
      ...(data2 || []).map((f: Record<string, unknown>) => ({
        ...f,
        friend_id: f.user_id,
        user_id: f.friend_id,
        friend: f.friend,
      } as Friend)),
    ]
    setFriends(all)
  }, [user, setFriends])

  useEffect(() => {
    loadFriends()
    if (!user) return
    const channel = supabase
      .channel('friends-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friends' }, () => {
        loadFriends()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user, loadFriends])

  const searchUsers = async () => {
    if (!searchQuery.trim() || !user) return
    setSearching(true)
    const { data } = await supabase
      .from('users')
      .select('*')
      .ilike('nickname', `%${searchQuery}%`)
      .neq('id', user.id)
      .limit(10)
    setSearchResults(data || [])
    setSearching(false)
  }

  const addFriend = async (friendId: string) => {
    if (!user) return
    await supabase.from('friends').insert({
      user_id: user.id,
      friend_id: friendId,
      status: 'accepted',
    })
    loadFriends()
    setShowAdd(false)
    setSearchQuery('')
    setSearchResults([])
  }

  return (
    <div className="bg-gray-900/80 border-2 border-gray-700/50 rounded-2xl p-4 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Teman ({friends.length})
        </h3>
        <button
          onClick={() => setShowAdd(true)}
          className="w-8 h-8 bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center justify-center transition-colors"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {friends.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">Belum ada teman. Tambahkan sekarang!</p>
        ) : (
          friends.map((f) => (
            <div key={f.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-800 transition-colors">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  {f.friend?.nickname?.[0]?.toUpperCase() || '?'}
                </div>
                <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-gray-900 ${f.friend?.online ? 'bg-green-500' : 'bg-gray-500'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{f.friend?.nickname}</p>
                <p className="text-gray-400 text-xs">{f.friend?.online ? 'Online' : 'Offline'}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={showAdd} onClose={() => { setShowAdd(false); setSearchResults([]) }} title="Tambah Teman">
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Cari nickname..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
            />
            <Button onClick={searchUsers} loading={searching} size="sm">Cari</Button>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {searchResults.map((u) => (
              <div key={u.id} className="flex items-center gap-3 p-3 bg-gray-800 rounded-xl">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  {u.nickname[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">{u.nickname}</p>
                  <p className="text-gray-400 text-xs">W:{u.wins} L:{u.losses}</p>
                </div>
                <Button size="sm" onClick={() => addFriend(u.id)}>Tambah</Button>
              </div>
            ))}
            {searchResults.length === 0 && searchQuery && !searching && (
              <p className="text-gray-500 text-sm text-center py-2">Tidak ditemukan</p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}
