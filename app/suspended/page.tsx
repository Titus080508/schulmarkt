'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

export default function SuspendedPage() {
  const [reason, setReason] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const stored = sessionStorage.getItem('suspended_reason')
    if (stored) setReason(stored)
    supabase.auth.signOut()
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ maxWidth: '420px', background: 'var(--bg-card)', border: '1px solid var(--state-danger-border)', borderRadius: '10px', padding: '32px', textAlign: 'center' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>🚫</div>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--state-danger)', marginBottom: '8px' }}>Account gesperrt</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: reason ? '12px' : '20px' }}>
          Dein Account wurde von einem Administrator gesperrt. Bei Fragen wende dich bitte an die Schulleitung.
        </p>
        {reason && (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', background: 'var(--bg-page)', borderRadius: '6px', padding: '10px 14px', marginBottom: '20px' }}>
            Grund: {reason}
          </p>
        )}
        <Link href="/login" style={{ display: 'inline-block', background: 'var(--color-primary)', color: 'var(--text-on-dark)', fontSize: '14px', fontWeight: 500, borderRadius: '6px', padding: '11px 24px', textDecoration: 'none' }}>
          Zur Anmeldung
        </Link>
      </div>
    </div>
  )
}
