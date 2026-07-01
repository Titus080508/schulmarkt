'use client'
import { useEffect, useState } from 'react'

export default function AnnouncementBanner({ announcements }: { announcements: any[] }) {
  const [dismissed, setDismissed] = useState<string[]>([])

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('dismissed_announcements') || '[]')
    setDismissed(stored)
  }, [])

  function dismiss(id: string) {
    const next = [...dismissed, id]
    setDismissed(next)
    localStorage.setItem('dismissed_announcements', JSON.stringify(next))
  }

  const visible = announcements.filter(a => !dismissed.includes(a.id))
  if (visible.length === 0) return null

  return (
    <div style={{ maxWidth: '1100px', margin: '16px auto 0', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {visible.map(a => (
        <div key={a.id} className="fade-in-up" style={{ background: 'var(--border-light)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <span style={{ fontSize: '18px', flexShrink: 0 }}>📣</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>{a.title}</p>
            <p style={{ fontSize: '13px', color: 'var(--color-primary)', margin: '3px 0 0', lineHeight: 1.5 }}>{a.message}</p>
          </div>
          <button onClick={() => dismiss(a.id)}
            style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '16px', cursor: 'pointer', flexShrink: 0, lineHeight: 1, padding: '2px' }}
            aria-label="Schließen">
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
