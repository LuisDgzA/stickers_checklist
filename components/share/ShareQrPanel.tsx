'use client'

import { useCallback, useState } from 'react'
import QRCode from 'react-qr-code'

interface ShareQrPanelProps {
  shareUrl: string
}

export function ShareQrPanel({ shareUrl }: ShareQrPanelProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
    } catch {
      const el = document.createElement('input')
      el.value = shareUrl
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [shareUrl])

  return (
    <div className="rounded-3xl border border-(--border) bg-(--surface) p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="w-fit rounded-2xl bg-white p-3 shadow-inner">
          <QRCode value={shareUrl} size={112} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold tracking-tight text-(--text)">Comparte este álbum</h2>
          <p className="mt-1 text-sm leading-6 text-(--muted)">
            Cualquier persona con el enlace puede verlo en modo público y solo lectura.
          </p>
          <div className="mt-3 rounded-2xl border border-(--border) bg-(--surface-soft) p-3 font-mono text-xs text-(--muted)">
            <span className="break-all">{shareUrl}</span>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="mt-3 rounded-2xl bg-(--primary) px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-(--primary)/20 transition hover:bg-(--primary-hover) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus)"
          >
            {copied ? 'Enlace copiado' : 'Copiar enlace'}
          </button>
        </div>
      </div>
    </div>
  )
}
