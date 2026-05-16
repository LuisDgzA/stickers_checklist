import { AdSlot } from '@/components/ads/AdSlot'
import { AlbumCard } from './AlbumCard'
import type { CollectionProgress } from '@/types/album'
import type { Collection } from '@/types/album'
import type { ReactNode } from 'react'

export interface AlbumGridItem {
  collection: Collection
  progress?: CollectionProgress
  href?: string
  cardTutorialTarget?: string
  openTutorialTarget?: string
  shareTutorialTarget?: string
  emphasizeOpenAction?: boolean
  showShareButton?: boolean
  fakeShareButton?: boolean
}

interface AlbumGridProps {
  items: AlbumGridItem[]
  userId: string | null
  withSponsoredCard?: boolean
  leadingContent?: ReactNode
}

export function AlbumGrid({ items, userId, withSponsoredCard = false, leadingContent }: AlbumGridProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {leadingContent}
      {items.map((item, index) => (
        <AlbumCard
          key={item.collection.id}
          collection={item.collection}
          progress={item.progress}
          userId={userId}
          featured={index === 0 && items.length > 2}
          href={item.href}
          cardTutorialTarget={item.cardTutorialTarget}
          openTutorialTarget={item.openTutorialTarget}
          shareTutorialTarget={item.shareTutorialTarget}
          emphasizeOpenAction={item.emphasizeOpenAction}
          showShareButton={item.showShareButton}
          fakeShareButton={item.fakeShareButton}
        />
      ))}
      {withSponsoredCard && <AdSlot variant="card" title="Completa tu colección más rápido" description="Espacio reservado para sobres, tiendas, protectores o experiencias premium para coleccionistas." />}
    </div>
  )
}
