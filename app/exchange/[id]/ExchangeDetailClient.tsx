'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { acceptExchange, rejectExchange, cancelExchange } from '@/app/actions/exchange'
import { NotificationBell } from '@/components/ui/NotificationBell'
import type { ExchangeStatus, StickerWithQuantity, Country } from '@/types/album'
import Link from 'next/link'

interface ExchangeDetailClientProps {
  exchangeId: string
  status: ExchangeStatus
  isOwner: boolean
  requesterName: string
  ownerName: string
  ownerGives: StickerWithQuantity[]
  requesterGives: StickerWithQuantity[]
  unavailableOwnerGives: string[]
  unavailableRequesterGives: string[]
  countries: Country[]
  shareToken: string
}

export function ExchangeDetailClient({
  exchangeId,
  status,
  isOwner,
  requesterName,
  ownerName,
  ownerGives,
  requesterGives,
  unavailableOwnerGives,
  unavailableRequesterGives,
  countries,
  shareToken,
}: ExchangeDetailClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [action, setAction] = useState<'accept' | 'reject' | 'cancel' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const countryMap = new Map(countries.map(c => [c.id, c]))
  const unavailableOwnerSet = new Set(unavailableOwnerGives)
  const unavailableRequesterSet = new Set(unavailableRequesterGives)
  const hasConflict = unavailableOwnerGives.length > 0 || unavailableRequesterGives.length > 0

  function groupByCountry(stickers: StickerWithQuantity[]) {
    const grouped = new Map<string, StickerWithQuantity[]>()
    for (const s of stickers) {
      const key = s.country_id ?? 'other'
      const arr = grouped.get(key) ?? []
      arr.push(s)
      grouped.set(key, arr)
    }
    return grouped
  }

  function handleAction(type: 'accept' | 'reject' | 'cancel') {
    setError(null)
    setAction(type)
    startTransition(async () => {
      try {
        if (type === 'accept') await acceptExchange(exchangeId)
        else if (type === 'reject') await rejectExchange(exchangeId)
        else await cancelExchange(exchangeId)
        setDone(true)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Ocurrió un error')
        setAction(null)
        router.refresh()
      }
    })
  }

  const statusLabel: Record<ExchangeStatus, { text: string; color: string }> = {
    pending:   { text: 'Pendiente',  color: 'text-amber-400 bg-amber-900/20 border-amber-500/30' },
    accepted:  { text: 'Aceptado',   color: 'text-green-400 bg-green-900/20 border-green-500/30' },
    rejected:  { text: 'Rechazado',  color: 'text-red-400 bg-red-900/20 border-red-500/30' },
    cancelled: { text: 'Cancelado',  color: 'text-slate-400 bg-slate-900/20 border-slate-500/30' },
  }

  const { text: statusText, color: statusColor } = statusLabel[status]

  return (
    <div className="min-h-screen bg-(--bg) text-(--text)">
      <nav className="sticky top-0 z-20 border-b border-(--border) bg-(--bg)/85 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-(--muted) hover:text-(--text) transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-base font-semibold">Propuesta de intercambio</h1>
          </div>
          <NotificationBell />
        </div>
      </nav>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        {/* Estado */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm text-(--muted)">
              {isOwner
                ? <><span className="font-semibold text-(--text)">{requesterName}</span> quiere intercambiar contigo</>
                : <>Propuesta enviada a <span className="font-semibold text-(--text)">{ownerName}</span></>}
            </p>
          </div>
          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusColor}`}>
            {statusText}
          </span>
        </div>

        {status === 'pending' && hasConflict && !done && (
          <div className="rounded-2xl border border-red-500/30 bg-red-900/20 p-4 space-y-1">
            <p className="text-sm font-semibold text-red-300">
              {isOwner
                ? 'Este intercambio ya no se puede completar'
                : 'Algunas estampas ya no están disponibles'}
            </p>
            <p className="text-xs text-red-300/70">
              {isOwner
                ? unavailableOwnerGives.length > 0
                  ? 'Algunas estampas que ibas a dar ya fueron intercambiadas con alguien más.'
                  : 'La otra persona ya no tiene suficientes repetidas de algunas estampas.'
                : unavailableRequesterGives.length > 0
                  ? 'Algunas estampas que ibas a dar ya no las tienes como repetidas.'
                  : 'La otra persona ya no tiene suficientes repetidas de algunas estampas.'}
            </p>
          </div>
        )}

        {done && status === 'pending' && (
          <div className="rounded-2xl border border-green-500/30 bg-green-900/20 p-4 text-sm text-green-300">
            {action === 'accept' ? '¡Intercambio realizado! Los álbumes de ambos han sido actualizados.' :
             action === 'reject' ? 'Propuesta rechazada.' : 'Propuesta cancelada.'}
          </div>
        )}

        {/* Lo que recibirá el solicitante (ownerGives) */}
        <StickerBlock
          title={isOwner
            ? `Tú le darías a ${requesterName} (${ownerGives.length})`
            : `Recibirías de ${ownerName} (${ownerGives.length})`}
          stickers={ownerGives}
          grouped={groupByCountry(ownerGives)}
          countryMap={countryMap}
          badgeColor="bg-green-900/50 text-green-300 border-green-500/30"
          unavailableIds={unavailableOwnerSet}
          emptyMessage="Sin estampas seleccionadas."
        />

        {/* Lo que dará el solicitante (requesterGives) */}
        <StickerBlock
          title={isOwner
            ? `${requesterName} te daría (${requesterGives.length})`
            : `Tú le darías a ${ownerName} (${requesterGives.length})`}
          stickers={requesterGives}
          grouped={groupByCountry(requesterGives)}
          countryMap={countryMap}
          badgeColor="bg-amber-900/50 text-amber-300 border-amber-500/30"
          unavailableIds={unavailableRequesterSet}
          emptyMessage="Sin estampas seleccionadas."
        />

        {/* Acciones */}
        {status === 'pending' && !done && (
          <div className="space-y-3">
            {error && <p className="text-sm text-red-400">{error}</p>}
            {isOwner ? (
              <div className="flex gap-3">
                <button
                  onClick={() => handleAction('accept')}
                  disabled={isPending || hasConflict}
                  title={hasConflict ? 'No se puede aceptar: algunas estampas ya no están disponibles' : undefined}
                  className="flex-1 rounded-2xl bg-(--accent) px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isPending && action === 'accept' ? 'Procesando...' : 'Aceptar intercambio'}
                </button>
                <button
                  onClick={() => handleAction('reject')}
                  disabled={isPending}
                  className="flex-1 rounded-2xl border border-(--border) bg-(--surface) px-4 py-3 text-sm font-semibold text-(--text) transition hover:border-red-500/50 hover:text-red-400 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isPending && action === 'reject' ? 'Rechazando...' : 'Rechazar'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleAction('cancel')}
                disabled={isPending}
                className="w-full rounded-2xl border border-(--border) bg-(--surface) px-4 py-3 text-sm font-semibold text-(--text) transition hover:border-red-500/50 hover:text-red-400 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isPending ? 'Cancelando...' : 'Cancelar propuesta'}
              </button>
            )}
          </div>
        )}

        {status === 'pending' && (
          <p className="text-xs text-center text-(--muted)">
            ¿Quieres modificar la selección?{' '}
            <Link href={`/share/${shareToken}#intercambios`} className="text-(--accent) hover:underline">
              Volver al álbum
            </Link>
          </p>
        )}
      </main>
    </div>
  )
}

function StickerBlock({
  title, stickers, grouped, countryMap, badgeColor, unavailableIds, emptyMessage,
}: {
  title: string
  stickers: StickerWithQuantity[]
  grouped: Map<string, StickerWithQuantity[]>
  countryMap: Map<string, Country>
  badgeColor: string
  unavailableIds: Set<string>
  emptyMessage: string
}) {
  return (
    <div className="rounded-3xl border border-(--border) bg-(--surface) p-5 space-y-4">
      <h2 className="font-semibold text-(--text)">{title}</h2>
      {stickers.length === 0 ? (
        <p className="text-sm text-(--muted)">{emptyMessage}</p>
      ) : (
        Array.from(grouped.entries()).map(([countryId, items]) => {
          const country = countryMap.get(countryId)
          return (
            <div key={countryId}>
              <p className="text-sm font-medium text-(--text) mb-2">{country?.name ?? 'Sección especial'}</p>
              <div className="flex flex-wrap gap-2">
                {items.map(s => {
                  const unavailable = unavailableIds.has(s.id)
                  return (
                    <span
                      key={s.id}
                      title={unavailable ? 'Ya no disponible como repetida' : undefined}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-mono border ${
                        unavailable
                          ? 'bg-red-900/40 text-red-400 border-red-500/40 line-through opacity-70'
                          : badgeColor
                      }`}
                    >
                      {s.code}
                    </span>
                  )
                })}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
