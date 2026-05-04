import { AdSlot } from '@/components/ads/AdSlot'
import { AlbumCard } from './AlbumCard'
import type { CollectionProgress } from '@/types/album'
import type { Collection } from '@/types/album'

export interface AlbumGridItem {
  collection: Collection
  progress?: CollectionProgress
}

interface AlbumGridProps {
  items: AlbumGridItem[]
  userId: string | null
  withSponsoredCard?: boolean
}

export function AlbumGrid({ items, userId, withSponsoredCard = false }: AlbumGridProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, index) => (
        <AlbumCard
          key={item.collection.id}
          collection={item.collection}
          progress={item.progress}
          userId={userId}
          featured={index === 0 && items.length > 2}
        />
      ))}
      {withSponsoredCard && <AdSlot variant="card" title="Completa tu colección más rápido" description="Espacio reservado para sobres, tiendas, protectores o experiencias premium para coleccionistas." />}
    </div>
  )
}
