'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { validateNicknameFormat, checkNicknameAvailable } from '@/lib/profile'

type NicknameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [nicknameStatus, setNicknameStatus] = useState<NicknameStatus>('idle')
  const [nicknameError, setNicknameError] = useState<string | null>(null)
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (mode !== 'signup' || nickname === '') {
      setNicknameStatus('idle')
      setNicknameError(null)
      return
    }

    const formatError = validateNicknameFormat(nickname)
    if (formatError) {
      setNicknameStatus('invalid')
      setNicknameError(formatError)
      return
    }

    setNicknameStatus('checking')
    setNicknameError(null)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const available = await checkNicknameAvailable(nickname)
      setNicknameStatus(available ? 'available' : 'taken')
      if (!available) setNicknameError('Este nickname ya está en uso')
    }, 500)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [nickname, mode])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setMessage({ text: 'Correo o contraseña incorrectos.', type: 'error' })
      } else {
        router.push('/')
        router.refresh()
      }
    } else {
      if (nicknameStatus !== 'available') {
        setMessage({ text: 'Elige un nickname válido y disponible.', type: 'error' })
        setLoading(false)
        return
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nickname: nickname.toLowerCase() } },
      })

      if (error) {
        setMessage({ text: error.message, type: 'error' })
      } else {
        setMessage({ text: 'Revisa tu correo para confirmar tu cuenta.', type: 'success' })
      }
    }

    setLoading(false)
  }

  const nicknameIcon: Record<NicknameStatus, React.ReactNode> = {
    idle: null,
    checking: <span className="animate-spin text-(--muted) text-sm leading-none">⟳</span>,
    available: <span className="text-green-500 text-sm font-bold">✓</span>,
    taken: <span className="text-(--primary) text-sm font-bold">✗</span>,
    invalid: <span className="text-(--primary) text-sm font-bold">✗</span>,
  }

  return (
    <div className="min-h-screen bg-(--bg) flex items-center justify-center px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-(--accent) mb-2 uppercase tracking-widest">Album Checklist</h1>
          <p className="text-(--muted)">Registra tu colección de estampas</p>
        </div>
        <div className="bg-(--surface) rounded-2xl border border-(--border) p-8">
          <h2 className="text-xl font-semibold mb-6 text-center uppercase tracking-wide text-(--text)">
            {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              suppressHydrationWarning
              className="w-full bg-(--bg) border border-(--border) rounded-lg px-4 py-3 text-(--text) placeholder-(--muted) focus:outline-none focus:border-(--accent) transition-colors"
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              suppressHydrationWarning
              className="w-full bg-(--bg) border border-(--border) rounded-lg px-4 py-3 text-(--text) placeholder-(--muted) focus:outline-none focus:border-(--accent) transition-colors"
            />

            {mode === 'signup' && (
              <div className="space-y-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Nickname (ej. ivory_27)"
                    value={nickname}
                    onChange={e => setNickname(e.target.value)}
                    required
                    maxLength={20}
                    suppressHydrationWarning
                    className={`w-full bg-(--bg) border rounded-lg px-4 py-3 pr-10 text-(--text) placeholder-(--muted) focus:outline-none transition-colors ${
                      nicknameStatus === 'available'
                        ? 'border-green-500 focus:border-green-400'
                        : nicknameStatus === 'taken' || nicknameStatus === 'invalid'
                        ? 'border-(--primary) focus:border-(--primary)'
                        : 'border-(--border) focus:border-(--accent)'
                    }`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    {nicknameIcon[nicknameStatus]}
                  </span>
                </div>
                {nicknameStatus === 'available' && (
                  <p className="text-xs text-green-500 pl-1">¡Nickname disponible!</p>
                )}
                {nicknameError && (
                  <p className="text-xs text-(--primary) pl-1">{nicknameError}</p>
                )}
                {nicknameStatus === 'idle' && (
                  <p className="text-xs text-(--muted) pl-1">3–20 caracteres, solo letras, números y _</p>
                )}
              </div>
            )}

            {message && (
              <p className={`text-sm text-center ${message.type === 'error' ? 'text-(--primary)' : 'text-(--accent)'}`}>
                {message.text}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || (mode === 'signup' && nicknameStatus !== 'available')}
              className="w-full bg-(--primary) hover:bg-(--primary-hover) disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-colors uppercase tracking-wide"
            >
              {loading ? 'Cargando...' : mode === 'login' ? 'Entrar' : 'Registrarme'}
            </button>
          </form>

          <p className="text-center text-sm text-(--muted) mt-5">
            {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login')
                setMessage(null)
                setNickname('')
                setNicknameStatus('idle')
              }}
              className="text-(--accent) hover:text-(--accent-hover) transition-colors font-medium"
            >
              {mode === 'login' ? 'Crear cuenta' : 'Iniciar sesión'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
