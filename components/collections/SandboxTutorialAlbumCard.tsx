'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AlbumCard } from './AlbumCard'
import { calcCollectionProgress } from '@/lib/progress'
import { demoCollection, demoCountries, getDemoStickers } from '@/lib/demo-album'
import { HUB_HOME_TUTORIAL_ACTIVE_EVENT, HUB_HOME_TUTORIAL_UPDATED_EVENT } from '@/lib/hub-home-tutorial'

interface SandboxTutorialAlbumCardProps {
  userId?: string | null
  initialVisible?: boolean
}

export function SandboxTutorialAlbumCard({ userId = null, initialVisible = false }: SandboxTutorialAlbumCardProps) {
  const [visible, setVisible] = useState(initialVisible)
  const tutorialActiveRef = useRef(initialVisible)
  const progress = useMemo(() => calcCollectionProgress(getDemoStickers(), demoCountries), [])

  useEffect(() => {
    let cancelled = false

    function syncVisibility() {
      const isReturningToHomeTutorial = window.location.search.includes('onboarding=home')
      if (tutorialActiveRef.current || isReturningToHomeTutorial) {
        if (!cancelled) setVisible(true)
        return
      }
      if (!cancelled) setVisible(false)
    }

    syncVisibility()
    const hideTutorialCard = () => {
      tutorialActiveRef.current = false
      if (!cancelled) setVisible(false)
    }

    const handleTutorialActive = (event: Event) => {
      const active = event instanceof CustomEvent ? Boolean(event.detail?.active) : false
      tutorialActiveRef.current = active
      if (active) {
        setVisible(true)
        return
      }
      hideTutorialCard()
    }

    window.addEventListener(HUB_HOME_TUTORIAL_UPDATED_EVENT, hideTutorialCard)
    window.addEventListener(HUB_HOME_TUTORIAL_ACTIVE_EVENT, handleTutorialActive)
    window.addEventListener('storage', syncVisibility)

    return () => {
      cancelled = true
      window.removeEventListener(HUB_HOME_TUTORIAL_UPDATED_EVENT, hideTutorialCard)
      window.removeEventListener(HUB_HOME_TUTORIAL_ACTIVE_EVENT, handleTutorialActive)
      window.removeEventListener('storage', syncVisibility)
    }
  }, [userId])

  if (!visible) return null

  return (
    <AlbumCard
      collection={demoCollection}
      progress={progress}
      userId={userId}
      href="/album/demo?onboarding=album"
      cardTutorialTarget="sandbox-album-card"
      openTutorialTarget="sandbox-album-open"
      shareTutorialTarget="sandbox-album-share"
      showShareButton={true}
      fakeShareButton
    />
  )
}
