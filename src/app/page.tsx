'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function AuthPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('gabut_user')
    if (stored) {
      router.push('/dashboard')
    } else {
      setCheckingAuth(false)
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (nickname.length < 3) {
        setError('Nickname minimal 3 karakter')
        setLoading(false)
        return
      }
      if (password.length < 6) {
        setError('Password minimal 6 karakter')
        setLoading(false)
        return
      }

      if (isLogin) {
        const { data, error: err } = await supabase
          .from('users')
          .select('*')
          .eq('nickname', nickname)
          .eq('password', password)
          .single()

        if (err || !data) {
          setError('Nickname atau password salah')
          setLoading(false)
          return
        }

        await supabase.from('users').update({ online: true }).eq('id', data.id)
        localStorage.setItem('gabut_user', JSON.stringify(data))
        router.push('/dashboard')
      } else {
        const { data: existing } = await supabase
          .from('users')
          .select('id')
          .eq('nickname', nickname)
          .single()

        if (existing) {
          setError('Nickname sudah digunakan')
          setLoading(false)
          return
        }

        const { data, error: err } = await supabase
          .from('users')
          .insert({
            nickname,
            password,
            wins: 0,
            losses: 0,
            online: true,
          })
          .select()
          .single()

        if (err || !data) {
          setError('Gagal mendaftar. Coba lagi.')
          setLoading(false)
          return
        }

        localStorage.setItem('gabut_user', JSON.stringify(data))
        router.push('/dashboard')
      }
    } catch {
      setError('Terjadi kesalahan. Coba lagi.')
    }

    setLoading(false)
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-6xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            GABUT
          </h1>
          <p className="text-gray-400 mt-2 text-lg">Game Bareng Untuk Teman</p>
        </div>

        <div className="bg-gray-900/80 backdrop-blur-xl border-2 border-gray-700/50 rounded-3xl p-8 shadow-2xl">
          <div className="flex mb-6 bg-gray-800 rounded-xl p-1">
            <button
              onClick={() => { setIsLogin(true); setError('') }}
              className={`flex-1 py-2.5 rounded-lg font-semibold transition-all ${isLogin ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
              Login
            </button>
            <button
              onClick={() => { setIsLogin(false); setError('') }}
              className={`flex-1 py-2.5 rounded-lg font-semibold transition-all ${!isLogin ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nickname"
              placeholder="Masukkan nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
            />
            <Input
              label="Password"
              type="password"
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
            />

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full" size="lg">
              {isLogin ? 'Masuk' : 'Daftar'}
            </Button>
          </form>
        </div>

        <p className="text-center text-gray-500 mt-6 text-sm">
          Main catur, bilyard, & remi bareng teman!
        </p>
      </div>
    </div>
  )
}
