import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOwnerNickname } from '@/lib/profile.server'
import { NotificationBell } from '@/components/ui/NotificationBell'
import type { ExchangeRequest, ExchangeStatus } from '@/types/album'
import Link from 'next/link'

export default async function ExchangesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawRequests } = await (supabase as any)
    .from('exchange_requests')
    .select('*')
    .or(`owner_id.eq.${user.id},requester_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  const requests = (rawRequests ?? []) as ExchangeRequest[]

  const otherUserIds = [...new Set(
    requests.map(r => r.owner_id === user.id ? r.requester_id : r.owner_id)
  )]
  const collectionIds = [...new Set(requests.map(r => r.collection_id))]

  const [nicknameResults, collectionsResult] = await Promise.all([
    Promise.all(otherUserIds.map(async id => ({ id, nick: await getOwnerNickname(id) }))),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('collections').select('id, name').in('id', collectionIds.length > 0 ? collectionIds : ['00000000-0000-0000-0000-000000000000']),
  ])

  const nicknameMap = new Map<string, string | null>(nicknameResults.map(r => [r.id, r.nick]))
  const collectionMap = new Map<string, string>(
    (collectionsResult.data ?? []).map((c: { id: string; name: string }) => [c.id, c.name])
  )

  const pending = requests.filter(r => r.status === 'pending')
  const past = requests.filter(r => r.status !== 'pending')

  const statusLabel: Record<ExchangeStatus, string> = {
    pending:   'Pendiente',
    accepted:  'Aceptado',
    rejected:  'Rechazado',
    cancelled: 'Cancelado',
  }

  const statusColor: Record<ExchangeStatus, string> = {
    pending:   'text-amber-400 bg-amber-900/20 border-amber-500/30',
    accepted:  'text-green-400 bg-green-900/20 border-green-500/30',
    rejected:  'text-red-400 bg-red-900/20 border-red-500/30',
    cancelled: 'text-slate-400 bg-slate-900/20 border-slate-500/30',
  }

  function ExchangeRow({ request }: { request: ExchangeRequest }) {
    const isOwner = request.owner_id === user!.id
    const otherId = isOwner ? request.requester_id : request.owner_id
    const otherNickname = nicknameMap.get(otherId)
    const otherName = otherNickname ? `@${otherNickname}` : 'Usuario'
    const collectionName = collectionMap.get(request.collection_id) ?? 'Colección'
    const role = isOwner ? 'Recibida de' : 'Enviada a'
    const count = isOwner
      ? `Recibirías ${request.owner_gives.length} · darías ${request.requester_gives.length}`
      : `Recibirías ${request.requester_gives.length} · darías ${request.owner_gives.length}`

    return (
      <Link
        href={`/exchange/${request.id}`}
        className="flex items-center justify-between gap-4 rounded-2xl border border-(--border) bg-(--surface) p-4 transition hover:border-(--accent)/40 hover:bg-(--surface-soft)"
      >
        <div className="min-w-0">
          <p className="text-xs font-semibold text-(--accent) truncate mb-0.5">{collectionName}</p>
          <p className="text-sm font-medium text-(--text) truncate">
            <span className="text-(--muted)">{role} </span>{otherName}
          </p>
          <p className="mt-0.5 text-xs text-(--muted)">{count} estampas</p>
        </div>
        <span className={`shrink-0 inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusColor[request.status]}`}>
          {statusLabel[request.status]}
        </span>
      </Link>
    )
  }

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
            <h1 className="text-base font-semibold">Mis intercambios</h1>
          </div>
          <NotificationBell />
        </div>
      </nav>

      <main className="mx-auto max-w-3xl space-y-8 px-4 py-8">
        {requests.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-(--border) bg-(--surface) p-8 text-center">
            <p className="text-(--muted) text-sm">No tienes propuestas de intercambio todavía.</p>
            <Link href="/" className="mt-4 inline-block rounded-2xl bg-(--primary) px-5 py-2.5 text-sm font-semibold text-white">
              Explorar colecciones
            </Link>
          </div>
        ) : (
          <>
            {pending.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-lg font-bold text-(--text)">
                  Pendientes
                  <span className="ml-2 inline-flex size-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-black">{pending.length}</span>
                </h2>
                {pending.map(r => <ExchangeRow key={r.id} request={r} />)}
              </section>
            )}
            {past.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-lg font-bold text-(--text)">Historial</h2>
                {past.map(r => <ExchangeRow key={r.id} request={r} />)}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  )
}
