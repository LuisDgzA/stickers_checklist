'use client'

import { useEffect, useState } from 'react'
import { syncOfflineQueue } from '@/lib/stickers'

type SyncState = 'idle' | 'syncing' | 'done'

export function OfflineBanner() {
  const [online, setOnline] = useState(true)
  const [syncState, setSyncState] = useState<SyncState>('idle')

  useEffect(() => {
    setOnline(navigator.onLine)

    const handleOnline = async () => {
      setOnline(true)
      setSyncState('syncing')
      try {
        const count = await syncOfflineQueue()
        if (count > 0) {
          setSyncState('done')
          setTimeout(() => setSyncState('idle'), 3000)
        } else {
          setSyncState('idle')
        }
      } catch {
        setSyncState('idle')
      }
    }

    const handleOffline = () => {
      setOnline(false)
      setSyncState('idle')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (online && syncState === 'idle') return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 18px',
        borderRadius: '9999px',
        fontSize: '13px',
        fontWeight: 600,
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        whiteSpace: 'nowrap',
        backgroundColor: !online ? '#d41830' : syncState === 'syncing' ? '#c47a00' : '#009e90',
        color: '#ffffff',
        transition: 'background-color 0.3s',
      }}
    >
      {!online && (
        <>          
          Sin conexión — los cambios se guardarán al reconectar
        </>
      )}
      {online && syncState === 'syncing' && (
        <>
          <span style={{ fontSize: '15px', animation: 'spin 1s linear infinite' }}>↻</span>
          Sincronizando cambios...
        </>
      )}
      {online && syncState === 'done' && (
        <>
          <span style={{ fontSize: '15px' }}>✓</span>
          Cambios guardados
        </>
      )}
    </div>
  )
}
