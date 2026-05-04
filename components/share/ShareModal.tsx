'use client'

import { useState, useCallback } from 'react'
import QRCode from 'react-qr-code'
import { Modal } from '@/components/ui/Modal'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  shareUrl: string
}

export function ShareModal({ isOpen, onClose, shareUrl }: ShareModalProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const el = document.createElement('input')
      el.value = shareUrl
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [shareUrl])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Compartir colección">
      <div className="space-y-5">
        <p className="text-sm leading-6 text-(--muted)">
          Comparte este enlace con otro usuario para comparar colecciones e identificar posibles intercambios.
        </p>

        <div className="rounded-3xl border border-(--border) bg-(--surface-soft) p-4">
          <div className="mx-auto flex w-fit rounded-2xl bg-white p-4 shadow-inner">
            <QRCode value={shareUrl} size={180} />
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-(--border) bg-(--surface-soft) p-3">
          <span className="flex-1 break-all font-mono text-xs text-(--muted)">{shareUrl}</span>
        </div>

        <button
          onClick={handleCopy}
          className={`w-full rounded-2xl py-3 font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus) ${
            copied
              ? 'bg-(--accent) text-(--bg)'
              : 'bg-(--primary) text-white shadow-lg shadow-(--primary)/20 hover:bg-(--primary-hover)'
          }`}
        >
          {copied ? 'Enlace copiado' : 'Copiar enlace'}
        </button>
      </div>
    </Modal>
  )
}
