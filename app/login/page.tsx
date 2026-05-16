'use client'

/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect, useRef } from 'react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { ThemedLogo } from '@/components/ui/ThemedLogo'
import { validateNicknameFormat, checkNicknameAvailable } from '@/lib/profile'
import { sanitizeRedirectPath } from '@/lib/auth-redirect'
import Link from 'next/link'

type NicknameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [nickname, setNickname] = useState('')
  const [nicknameStatus, setNicknameStatus] = useState<NicknameStatus>('idle')
  const [nicknameError, setNicknameError] = useState<string | null>(null)
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null)
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
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!response.ok) {
        setMessage({ text: 'Correo o contraseña incorrectos.', type: 'error' })
      } else {
        const next = sanitizeRedirectPath(new URLSearchParams(window.location.search).get('next'))
        window.location.href = next
        return
      }
    } else {
      if (nicknameStatus !== 'available') {
        setMessage({ text: 'Elige un nickname válido y disponible.', type: 'error' })
        setLoading(false)
        return
      }

      const response = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, nickname: nickname.toLowerCase() }),
      })

      if (!response.ok) {
        setMessage({ text: 'No se pudo crear la cuenta. Revisa tus datos e intenta de nuevo.', type: 'error' })
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
    <div className="min-h-screen bg-(--bg) text-(--text)">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_15%_0%,var(--hero-glow),transparent_32%),radial-gradient(circle_at_90%_10%,var(--hero-glow-secondary),transparent_28%)]" />

      <nav className="px-4 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <Link href="/" className="flex min-w-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus)">
            <ThemedLogo />
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      <main className="flex min-h-[calc(100dvh-5rem)] items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          <div className="mb-7 text-center">
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-(--text) min-[380px]:text-4xl">
              {mode === 'login' ? 'Inicia sesión' : 'Crea tu cuenta'}
            </h1>
            <p className="mt-3 text-sm leading-6 text-(--muted) sm:text-base">
              Guarda tu progreso, comparte tu álbum y administra tus colecciones.
            </p>
          </div>
          <div className="rounded-3xl border border-(--border) bg-(--surface)/90 p-5 shadow-sm backdrop-blur sm:p-8">
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                suppressHydrationWarning
                className="w-full rounded-xl border border-(--border) bg-(--bg) px-4 py-3 text-(--text) placeholder-(--muted) transition-colors focus:border-(--accent) focus:outline-none focus:ring-2 focus:ring-(--focus)/30"
              />
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Contraseña"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  suppressHydrationWarning
                  className="w-full rounded-xl border border-(--border) bg-(--bg) px-4 py-3 pr-11 text-(--text) placeholder-(--muted) transition-colors focus:border-(--accent) focus:outline-none focus:ring-2 focus:ring-(--focus)/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-(--muted) transition-colors hover:text-(--text) focus-visible:outline-none"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>

              {mode === 'signup' && (
                <div className="space-y-1">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Nickname (ej. raul_jimenez_7)"
                      value={nickname}
                      onChange={e => setNickname(e.target.value)}
                      required
                      maxLength={20}
                      suppressHydrationWarning
                      className={`w-full rounded-xl border bg-(--bg) px-4 py-3 pr-10 text-(--text) placeholder-(--muted) transition-colors focus:outline-none focus:ring-2 focus:ring-(--focus)/30 ${
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
                    <p className="pl-1 text-xs text-green-500">¡Nickname disponible!</p>
                  )}
                  {nicknameError && (
                    <p className="pl-1 text-xs text-(--primary)">{nicknameError}</p>
                  )}
                  {nicknameStatus === 'idle' && (
                    <p className="pl-1 text-xs text-(--muted)">3-20 caracteres, solo letras, números y _</p>
                  )}
                </div>
              )}

              {message && (
                <p className={`text-center text-sm ${message.type === 'error' ? 'text-(--primary)' : 'text-(--accent)'}`}>
                  {message.text}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || (mode === 'signup' && nicknameStatus !== 'available')}
                className="w-full rounded-xl bg-(--primary) py-3 font-bold text-white transition-colors hover:bg-(--primary-hover) disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus)"
              >
                {loading ? 'Cargando...' : mode === 'login' ? 'Entrar' : 'Registrarme'}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-(--muted)">
              {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
              <button
                onClick={() => {
                  setMode(mode === 'login' ? 'signup' : 'login')
                  setMessage(null)
                  setNickname('')
                  setNicknameStatus('idle')
                }}
                className="font-medium text-(--accent) transition-colors hover:text-(--accent-hover) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus)"
              >
                {mode === 'login' ? 'Crear cuenta' : 'Iniciar sesión'}
              </button>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
