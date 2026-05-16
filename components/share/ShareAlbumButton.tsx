'use client'

import { useCallback, useRef, useState } from 'react'
import { getOrCreateShareLink, getShareUrl } from '@/lib/share'
import { ShareModal } from './ShareModal'

interface ShareAlbumButtonProps {
  userId: string | null
  collectionId: string
  className?: string
}

export function ShareAlbumButton({ userId, collectionId, className = '' }: ShareAlbumButtonProps) {
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showLoginHint, setShowLoginHint] = useState(false)
  const justClosedRef = useRef(false)

  const handleClose = useCallback(() => {
    justClosedRef.current = true
    setIsOpen(false)
    setTimeout(() => { justClosedRef.current = false }, 400)
  }, [])

  const handleShare = useCallback(async () => {
    if (justClosedRef.current) return
    if (!userId) {
      setShowLoginHint(true)
      return
    }

    setIsLoading(true)
    try {
      const link = await getOrCreateShareLink(userId, collectionId)
      setShareUrl(getShareUrl(link.token))
      setIsOpen(true)
    } catch {
      alert('Error al generar el enlace. Intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }, [collectionId, userId])

  return (
    <>
      <button
        type="button"
        onClick={handleShare}
        disabled={isLoading}
        className={`inline-flex items-center justify-center gap-2 rounded-2xl border border-(--border) bg-(--surface-soft) px-4 py-2.5 text-sm font-semibold text-(--text) transition hover:border-(--accent)/40 hover:bg-(--surface-hover) disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus) ${className}`}
      >
        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342A3 3 0 109 12m-.316 1.342l6.632 3.316m-6.632-6l6.632-3.316M18 8a3 3 0 100-6 3 3 0 000 6zm0 14a3 3 0 100-6 3 3 0 000 6z" />
        </svg>
        {isLoading ? 'Generando...' : 'Compartir'}
      </button>

      {shareUrl && (
        <ShareModal
          isOpen={isOpen}
          onClose={handleClose}
          shareUrl={shareUrl}
        />
      )}

      {showLoginHint && (
        <div className="fixed inset-0 z-50 grid place-items-center px-4">
          <button
            type="button"
            aria-label="Cerrar"
            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
            onClick={() => setShowLoginHint(false)}
          />
          <div className="relative w-full max-w-sm rounded-3xl border border-(--border) bg-(--surface) p-5 text-(--text) shadow-2xl">
            <h2 className="text-xl font-bold leading-tight">Comparte desde tu cuenta</h2>
            <p className="mt-2 text-sm leading-6 text-(--muted)">
              Puedes explorar el Hub sin registrarte. Para crear un enlace público y QR necesitas iniciar sesión.
            </p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowLoginHint(false)}
                className="rounded-2xl px-4 py-2.5 text-sm font-semibold text-(--muted) transition hover:bg-(--surface-hover) hover:text-(--text) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus)"
              >
                Seguir explorando
              </button>
              <a
                href="/login"
                className="inline-flex items-center justify-center rounded-2xl bg-(--primary) px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-(--primary-hover) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus)"
              >
                Iniciar sesión
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
