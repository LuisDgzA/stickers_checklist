'use client'

/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { markHubHomeTutorialAsSeen } from '@/lib/hub-home-tutorial'
import { TourProvider, useTour } from '@/components/tour/TourProvider'
import type { TourStep } from '@/components/tour/types'

type AlbumMode = 'authenticated' | 'preview' | 'sandbox'

const stepsByMode: Record<AlbumMode, TourStep[]> = {
  authenticated: [
    {
      id: 'album-progress',
      title: 'Tu colección de trabajo',
      description: 'Aquí sí se guarda tu progreso. Cada cambio actualiza tu checklist y puede desbloquear avances o logros según la colección.',
      highlightSelector: '[data-album-tour="stats"]',
      placement: 'auto',
    },
    {
      id: 'album-tools',
      title: 'Filtra y navega',
      description: 'Usa búsqueda, filtros y grupos para encontrar rápido lo pendiente, lo completo o lo repetido.',
      highlightSelector: '[data-album-tour="tools"]',
      placement: 'auto',
    },
    {
      id: 'album-stickers',
      title: 'Marca tus elementos',
      description: 'Toca una tarjeta para sumar cantidad. Usa el botón menos para corregir o quitar un repetido.',
      highlightSelector: '[data-album-tour="stickers"]',
      placement: 'auto',
    },
    {
      id: 'album-share',
      title: 'Comparte tu avance',
      description: 'El botón Compartir genera un enlace público con QR para mostrar tu progreso y tus repetidos.',
      highlightSelector: '[data-album-tour="share"]',
      placement: 'auto',
    },
  ],
  preview: [
    {
      id: 'album-preview',
      title: 'Preview sin cuenta',
      description: 'Puedes explorar una colección sin iniciar sesión. La navegación está abierta para que entiendas cómo funciona.',
      highlightSelector: '[data-album-tour="mode-banner"]',
      placement: 'auto',
    },
    {
      id: 'album-preview-tools',
      title: 'Prueba la navegación',
      description: 'Busca, filtra y cambia de grupo igual que lo harías con una cuenta.',
      highlightSelector: '[data-album-tour="tools"]',
      placement: 'auto',
    },
    {
      id: 'album-preview-auth',
      title: 'Acciones protegidas',
      description: 'Guardar cantidades, compartir y crear enlaces públicos requieren sesión porque modifican datos privados.',
      highlightSelector: '[data-album-tour="auth-action"]',
      placement: 'auto',
    },
    {
      id: 'album-preview-demo',
      title: 'Demo interactivo',
      description: 'Si quieres tocar tarjetas sin cuenta, abre la colección de práctica. Ahí puedes probar la interacción sin afectar datos reales.',
      highlightSelector: '[data-album-tour="stickers"]',
      actionHref: '/album/demo?onboarding=album',
      actionLabel: 'Abrir práctica',
      placement: 'auto',
    },
  ],
  sandbox: [
    {
      id: 'sandbox-start',
      title: 'Bienvenido a tu colección',
      description: 'Este espacio de práctica muestra la lógica general que se repite en cualquier colección del Hub.',
      highlightSelector: '[data-album-tour="mode-banner"]',
      placement: 'auto',
    },
    {
      id: 'sandbox-progress',
      title: 'Lee tu avance',
      description: 'La barra superior resume el progreso general, pendientes, repetidos y lo que ya está completo en la colección.',
      highlightSelector: '[data-album-tour="stats"]',
      placement: 'auto',
    },
    {
      id: 'sandbox-filters',
      title: 'Filtra la colección',
      description: 'Usa estos filtros para ver todo, pendientes, completos, repetidos o especiales. La lógica es la misma en cualquier colección real.',
      highlightSelector: '[data-album-tour="filters"]',
      placement: 'auto',
    },
    {
      id: 'sandbox-groups',
      title: 'Navega por grupos',
      description: 'Cuando una colección tiene grupos, puedes cambiar de grupo para enfocarte en una parte específica del contenido.',
      highlightSelector: '[data-album-tour="groups"]',
      placement: 'auto',
    },
    {
      id: 'sandbox-country',
      title: 'Revisa una sección',
      description: 'Cada bloque agrupa elementos relacionados y muestra su progreso. Puedes abrirlo o cerrarlo para mantener la vista ordenada.',
      highlightSelector: '[data-album-tour="demo-country-card"]',
      placement: 'auto',
    },
    {
      id: 'sandbox-items',
      title: 'Marca tus elementos',
      description: 'Toca una tarjeta una vez por cada elemento que ya tienes. Cada toque suma una unidad; si llegas a más de una, la tarjeta se marca como repetida.',
      highlightSelector: '[data-album-tour="demo-sticker-card"]',
      placement: 'auto',
    },
    {
      id: 'sandbox-repeated',
      title: 'Corrige repetidos',
      description: 'Los repetidos se muestran como una etiqueta en la esquina superior derecha de la tarjeta. El número indica cuántas unidades extra tienes.',
      highlightSelector: '[data-album-tour="demo-sticker-card-repeated-badge"]',
      placement: 'auto',
    },
    {
      id: 'sandbox-remove-repeated',
      title: 'Quita unidades una por una',
      description: 'Usa el botón menos de la esquina superior izquierda para restar unidades. Cada clic quita una unidad; cuando queda solo una, deja de mostrarse como repetido.',
      highlightSelector: '[data-album-tour="demo-sticker-card-repeated-decrement"]',
      placement: 'auto',
    },
    {
      id: 'sandbox-share',
      title: 'Comparte tu avance',
      description: 'El botón Compartir crea un enlace público con QR para que otras personas vean tu progreso y tus repetidos disponibles para intercambio.',
      highlightSelector: '[data-album-tour="share"]',
      placement: 'auto',
    },
    {
      id: 'sandbox-reopen',
      title: 'Vuelve cuando quieras',
      description: 'Desde el menú puedes abrir Ver tutorial cuando quieras para repetir este recorrido sin afectar tus colecciones.',
      highlightSelector: '[data-album-tour="album-menu-button"], [data-album-tour="album-tour-button"]',
      placement: 'auto',
    },
    {
      id: 'sandbox-account',
      title: 'Guarda y comparte desde tu cuenta',
      description: 'Al finalizar puedes seguir interactuando con esta colección de práctica. Para conservar progreso real, inicia sesión y abre una colección de tu biblioteca.',
      highlightSelector: '[data-album-tour="mode-banner"]',
      placement: 'auto',
    },
  ],
}

const SANDBOX_HOME_STEP_OFFSET = 4

interface AlbumOnboardingControllerProps {
  mode: AlbumMode
  userId?: string | null
  collectionSlug: string
  autoOpen?: boolean
}

export function AlbumOnboardingController({ mode, userId, collectionSlug, autoOpen = false }: AlbumOnboardingControllerProps) {
  const continuesHomeTour = mode === 'sandbox' && autoOpen
  const stepNumberOffset = continuesHomeTour ? SANDBOX_HOME_STEP_OFFSET : 0
  const totalSteps = continuesHomeTour ? SANDBOX_HOME_STEP_OFFSET + stepsByMode.sandbox.length : undefined
  const finish = useCallback(async () => {
    await markHubHomeTutorialAsSeen(userId)
    return
  }, [userId])

  return (
    <TourProvider
      tourId={`album-${mode}-${collectionSlug}`}
      steps={stepsByMode[mode]}
      onFinish={finish}
      onClose={finish}
      stepNumberOffset={stepNumberOffset}
      totalSteps={totalSteps}
      previousHrefOnFirst={continuesHomeTour ? `/?onboarding=home&step=${SANDBOX_HOME_STEP_OFFSET - 1}` : undefined}
    >
      <AlbumTourLauncher autoOpen={autoOpen} />
    </TourProvider>
  )
}

function AlbumTourLauncher({ autoOpen }: { autoOpen: boolean }) {
  const { start } = useTour()
  const autoStarted = useRef(false)

  useEffect(() => {
    if (!autoOpen || autoStarted.current) return
    autoStarted.current = true
    start()
  }, [autoOpen, start])

  return (
    <button
      type="button"
      data-album-tour="album-tour-button"
      onClick={() => start({ manual: true })}
      className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-(--border) bg-(--surface) px-3 text-sm font-semibold text-(--text) transition hover:border-(--accent)/50 hover:bg-(--surface-hover) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus)"
    >
      <svg className="size-4 text-(--accent)" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.25 9a3.75 3.75 0 117.07 1.75c-.72.96-2.07 1.28-2.07 2.75M12 17h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Ver tutorial
    </button>
  )
}

export function AlbumContextTips({ mode, userId, collectionSlug }: { mode: AlbumMode; userId?: string | null; collectionSlug: string }) {
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setDismissed(window.localStorage.getItem(`album_context_tips_dismissed_${mode}`) === 'true')
  }, [mode])

  if (dismissed) return null

  const dismiss = () => {
    setDismissed(true)
    if (typeof window !== 'undefined') window.localStorage.setItem(`album_context_tips_dismissed_${mode}`, 'true')
  }

  const tips = mode === 'sandbox'
    ? [
      'Toca una tarjeta para simular progreso.',
      'Cambia filtros para ver pendientes y repetidos.',
      'Puedes practicar sin modificar una colección real.',
    ]
    : mode === 'preview'
      ? [
        'Puedes explorar una colección completa sin cuenta.',
        'Guardar cantidades y compartir están protegidos.',
        'Abre la colección de práctica si quieres tocar tarjetas.',
      ]
      : [
        'Toca una tarjeta una vez por cada elemento que ya tienes.',
        'Usa filtros y grupos para revisar pendientes, completos y repetidos.',
        'Comparte tu avance con QR cuando quieras mostrar tu colección.',
      ]

  return (
    <div className="rounded-3xl border border-(--border) bg-(--surface)/90 p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold text-(--text)">Tips rápidos</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {tips.map(tip => (
              <span key={tip} className="rounded-full border border-(--accent)/25 bg-(--accent)/10 px-3 py-1.5 text-xs font-semibold text-(--muted)">
                {tip}
              </span>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          {mode === 'preview' && (
            <Link href="/album/demo" className="rounded-2xl bg-(--primary) px-3 py-2 text-xs font-semibold text-white transition hover:bg-(--primary-hover)">
              Probar demo
            </Link>
          )}
          {!userId && mode === 'sandbox' && (
            <Link href={`/login?next=${encodeURIComponent(`/album/${collectionSlug}`)}`} className="rounded-2xl bg-(--primary) px-3 py-2 text-xs font-semibold text-white transition hover:bg-(--primary-hover)">
              Guardar real
            </Link>
          )}
          <button
            type="button"
            onClick={dismiss}
            className="rounded-2xl border border-(--border) bg-(--surface-soft) px-3 py-2 text-xs font-semibold text-(--muted) transition hover:bg-(--surface-hover) hover:text-(--text)"
          >
            Ocultar
          </button>
        </div>
      </div>
    </div>
  )
}
