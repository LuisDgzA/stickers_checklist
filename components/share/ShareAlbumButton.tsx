'use client'

import { useCallback, useState } from 'react'
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

  const handleShare = useCallback(async () => {
    if (!userId) {
      window.location.href = '/login'
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
          onClose={() => setIsOpen(false)}
          shareUrl={shareUrl}
        />
      )}
    </>
  )
}
