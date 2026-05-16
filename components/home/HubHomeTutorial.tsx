'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { markHubHomeTutorialAsSeen, setHubHomeTutorialActive } from '@/lib/hub-home-tutorial'
import { TourProvider, useTour } from '@/components/tour/TourProvider'
import type { TourStep } from '@/components/tour/types'

export const HUB_HOME_STEPS_BEFORE_SANDBOX = 4
export const HUB_FULL_TUTORIAL_STEPS = HUB_HOME_STEPS_BEFORE_SANDBOX + 11

export const hubHomeTutorialSteps: TourStep[] = [
  {
    id: 'hub-welcome',
    title: 'Bienvenido a completalo.app',
    description: 'Desde aquí puedes administrar tus colecciones, revisar progreso y abrir cualquier contenido disponible.',
    highlightSelector: '[data-tutorial="hub-hero"]',
    placement: 'auto',
  },
  /* {
    id: 'hub-achievements',
    title: 'Logros',
    description: 'La sección Logros muestra avances desbloqueados y pendientes.',
    highlightSelector: '[data-tutorial="achievements-link"], [data-tutorial="login-entry"]',
    placement: 'auto',
  },
  {
    id: 'hub-profile',
    title: 'Perfil',
    description: 'En Perfil puedes administrar tu nombre y nickname.',
    highlightSelector: '[data-tutorial="profile-link"], [data-tutorial="login-entry"]',
    placement: 'auto',
  }, */
  {
    id: 'hub-library',
    title: 'Biblioteca de álbumes',
    description: 'Aquí aparecen las colecciones disponibles. Durante el tutorial verás una colección demo para practicar sin iniciar sesión.',
    highlightSelector: '[data-tutorial="album-library"]',
    placement: 'auto',
  },
  {
    id: 'hub-share-album',
    title: 'Comparte tu avance',
    description: 'En cada colección podrás generar un enlace público con QR para mostrar tu progreso y tus repetidos disponibles. En esta tarjeta solo lo señalamos como parte del recorrido.',
    highlightSelector: '[data-tutorial="sandbox-album-share"]',
    placement: 'auto',
  },
  {
    id: 'hub-open-album',
    title: 'Abre la colección demo',
    description: 'Pulsa Ver álbum en la tarjeta demo, o usa Abrir demo, para continuar el tutorial dentro de un espacio de práctica.',
    highlightSelector: '[data-tutorial="sandbox-album-open"]',
    actionHref: '/album/demo?onboarding=album',
    actionLabel: 'Abrir demo',
    placement: 'auto',
  }
]

interface HubHomeTutorialControllerProps {
  userId?: string | null
  initialSeen?: boolean | null
}

export function HubHomeTutorialController({ userId, initialSeen = null }: HubHomeTutorialControllerProps) {
  const finish = useCallback(async () => {
    await markHubHomeTutorialAsSeen(userId)
    setHubHomeTutorialActive(false)
  }, [userId])
  const close = useCallback(async () => {
    await markHubHomeTutorialAsSeen(userId)
    setHubHomeTutorialActive(false)
  }, [userId])

  return (
    <TourProvider tourId="hub-home" steps={hubHomeTutorialSteps} onFinish={finish} onClose={close} totalSteps={HUB_FULL_TUTORIAL_STEPS}>
      <HubHomeTutorialLauncher userId={userId} initialSeen={initialSeen} />
    </TourProvider>
  )
}

function HubHomeTutorialLauncher({ userId, initialSeen }: HubHomeTutorialControllerProps) {
  const { start } = useTour()
  const searchParams = useSearchParams()
  const autoOpenChecked = useRef(false)

  useEffect(() => {
    if (autoOpenChecked.current) return
    autoOpenChecked.current = true

    if (searchParams.get('onboarding') === 'home') {
      const requestedStep = Number(searchParams.get('step') ?? hubHomeTutorialSteps.length - 1)
      const stepIndex = Number.isFinite(requestedStep)
        ? Math.min(Math.max(requestedStep, 0), hubHomeTutorialSteps.length - 1)
        : hubHomeTutorialSteps.length - 1
      setHubHomeTutorialActive(true)
      start({ manual: true, index: stepIndex })
      return
    }
  }, [initialSeen, searchParams, start, userId])

  return (
    <>
      <button
        type="button"
        data-tutorial="tutorial-button"
        onClick={() => {
          setHubHomeTutorialActive(true)
          start({ manual: true })
        }}
        className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-2xl border border-(--border) bg-(--surface) px-3 text-sm font-semibold text-(--text) shadow-sm transition hover:border-(--accent)/40 hover:bg-(--surface-hover) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus) sm:px-4"
      >
        <svg className="size-4 text-(--accent)" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.25 9a3.75 3.75 0 117.07 1.75c-.72.96-2.07 1.28-2.07 2.75M12 17h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Ver tutorial
      </button>
    </>
  )
}
