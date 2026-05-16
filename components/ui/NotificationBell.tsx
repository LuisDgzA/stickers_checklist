'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export function NotificationBell() {
  const [count, setCount] = useState(0)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any
    let channelRef: ReturnType<typeof supabase.channel> | null = null

    async function fetchCount(userId: string) {
      const { count: pending } = await sb
        .from('exchange_requests')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', userId)
        .eq('status', 'pending')
      setCount(pending ?? 0)
    }

    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setIsLoggedIn(true)
      await fetchCount(user.id)

      channelRef = supabase
        .channel(`exchange-notif-${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'exchange_requests', filter: `owner_id=eq.${user.id}` },
          () => fetchCount(user.id)
        )
        .subscribe()
    }

    init()
    return () => { if (channelRef) supabase.removeChannel(channelRef) }
  }, [])

  if (!isLoggedIn) return null

  return (
    <Link
      href="/exchanges"
      aria-label={count > 0 ? `${count} intercambio${count !== 1 ? 's' : ''} pendiente${count !== 1 ? 's' : ''}` : 'Mis intercambios'}
      className={`relative flex size-10 items-center justify-center rounded-xl border transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus) ${
        count > 0
          ? 'border-amber-500/40 bg-amber-900/20 text-amber-300'
          : 'border-(--border) bg-(--surface) text-(--muted) hover:border-(--accent)/50 hover:text-(--text)'
      }`}
    >
      <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-amber-400 text-[9px] font-bold text-black">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  )
}
