import Link from 'next/link'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { ShareAlbumButton } from '@/components/share/ShareAlbumButton'
import type { Collection, CollectionProgress } from '@/types/album'

interface AlbumCardProps {
  collection: Collection
  progress?: CollectionProgress
  userId?: string | null
  featured?: boolean
  href?: string
  cardTutorialTarget?: string
  openTutorialTarget?: string
  shareTutorialTarget?: string
  emphasizeOpenAction?: boolean
  showShareButton?: boolean
  fakeShareButton?: boolean
}

export function AlbumCard({
  collection,
  progress,
  userId = null,
  featured = false,
  href,
  cardTutorialTarget,
  openTutorialTarget,
  shareTutorialTarget,
  emphasizeOpenAction = false,
  showShareButton = true,
  fakeShareButton = false,
}: AlbumCardProps) {
  const percentage = progress?.percentage ?? 0
  const hasProgress = Boolean(progress)
  const albumHref = href ?? `/album/${collection.slug}`

  return (
    <article
      data-tutorial={cardTutorialTarget}
      className={`group relative flex h-full overflow-hidden rounded-3xl border border-(--border) bg-(--surface) shadow-sm transition duration-300 hover:-translate-y-1 hover:border-(--accent)/50 hover:shadow-2xl hover:shadow-(--accent)/10 ${featured ? 'min-h-[360px] sm:col-span-2 lg:col-span-2' : 'min-h-[300px]'
        }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,var(--hero-glow),transparent_34%),linear-gradient(135deg,var(--surface),var(--surface-strong))]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-50 dark:via-white/20" />

      <div className="relative flex w-full flex-col p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full border border-(--accent)/30 bg-(--accent)/10 px-3 py-1 text-xs font-semibold text-(--accent)">
            {percentage === 100 ? 'Completado' : percentage > 0 ? 'En progreso' : 'Disponible'}
          </span>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-white/20 bg-(--surface-soft) shadow-inner">
          <div className={`${featured ? 'aspect-[16/9]' : 'aspect-[4/3]'} relative`}>
            {collection.cover_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={collection.cover_image_url}
                alt=""
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,var(--primary),var(--accent))]">
                {collection.emojis ? (
                  <span className="select-none text-7xl drop-shadow-lg" aria-hidden="true">{collection.emojis}</span>
                ) : (
                  <svg className="size-16 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 4h12v7a6 6 0 11-12 0V4z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 21h8M12 17v4M18 6h2a2 2 0 010 4h-2M6 6H4a2 2 0 000 4h2" />
                  </svg>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-auto pt-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className={`${featured ? 'text-2xl' : 'text-xl'} font-bold tracking-tight text-(--text)`}>
                {collection.name}
              </h3>
              {collection.description && (
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-(--muted)">
                  {collection.description}
                </p>
              )}
            </div>
            <div className="rounded-2xl border border-(--border) bg-(--surface-soft) px-3 py-2 text-right">
              <div className="text-lg font-bold text-(--accent)">{percentage}%</div>
              <div className="text-[10px] font-medium text-(--muted)">avance</div>
            </div>
          </div>

          <div className="mt-5">
            <ProgressBar percentage={percentage} />
            <div className="mt-2 flex items-center justify-between text-xs text-(--muted)">
              <span>{hasProgress ? `${progress?.obtained}/${progress?.total} elementos` : 'Inicia tu checklist'}</span>
              <span>{progress?.duplicates ? `${progress.duplicates} repetidos` : 'QR listo'}</span>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2 border-t border-(--border) pt-4 sm:flex-row">
            <Link
              href={albumHref}
              data-tutorial={openTutorialTarget}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-(--text) px-4 py-2.5 text-sm font-semibold text-(--bg) transition hover:translate-x-0.5 data-[tour-active-target=true]:ring-2 data-[tour-active-target=true]:ring-(--accent) data-[tour-active-target=true]:ring-offset-2 data-[tour-active-target=true]:ring-offset-(--surface) data-[tour-active-target=true]:motion-safe:animate-pulse focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus) ${emphasizeOpenAction ? 'ring-2 ring-(--accent) ring-offset-2 ring-offset-(--surface) motion-safe:animate-pulse' : ''
                }`}
            >
              Ver álbum
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m-6-6l6 6-6 6" />
              </svg>
            </Link>
            {fakeShareButton && (
              <button
                type="button"
                data-tutorial={shareTutorialTarget}
                onClick={event => event.preventDefault()}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-(--border) bg-(--surface-soft) px-4 py-2.5 text-sm font-semibold text-(--text) transition hover:border-(--accent)/40 hover:bg-(--surface-hover) data-[tour-active-target=true]:ring-2 data-[tour-active-target=true]:ring-(--accent) data-[tour-active-target=true]:ring-offset-2 data-[tour-active-target=true]:ring-offset-(--surface) data-[tour-active-target=true]:motion-safe:animate-pulse focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus) sm:flex-1"
              >
                <svg className="size-4 text-(--accent)" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342A3 3 0 109 12m-.316 1.342 6.632 3.316m-6.632-6 6.632-3.316M18 8a3 3 0 100-6 3 3 0 000 6zm0 14a3 3 0 100-6 3 3 0 000 6z" />
                </svg>
                Compartir
              </button>
            )}
            {!fakeShareButton && showShareButton && <ShareAlbumButton userId={userId} collectionId={collection.id} className="sm:flex-1" />}
          </div>
        </div>
      </div>
    </article>
  )
}
