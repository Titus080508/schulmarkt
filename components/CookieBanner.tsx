'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('cookie_notice_seen')) setVisible(true)
  }, [])

  function dismiss() {
    localStorage.setItem('cookie_notice_seen', '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
      background: '#1a3a6e', color: '#fff', padding: '16px 20px',
      display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '16px',
      boxShadow: '0 -4px 16px rgba(0,0,0,0.15)'
    }}>
      <p style={{ fontSize: '13px', margin: 0, maxWidth: '600px', lineHeight: 1.6 }}>
        Diese Seite verwendet ausschließlich technisch notwendige Cookies für die Anmeldung.
        Weitere Infos in der{' '}
        <Link href="/datenschutz" style={{ color: '#f0c040', textDecoration: 'underline' }}>Datenschutzerklärung</Link>.
      </p>
      <button onClick={dismiss} style={{
        background: '#f0c040', color: '#1a3a6e', border: 'none', borderRadius: '6px',
        padding: '9px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', flexShrink: 0
      }}>
        Verstanden
      </button>
    </div>
  )
}
