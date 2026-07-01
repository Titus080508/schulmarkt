'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleRegister() {
    if (!username || !password) { setError('Bitte alle Felder ausfüllen'); return }
    if (password.length < 6) { setError('Passwort muss mindestens 6 Zeichen haben'); return }
    setLoading(true); setError('')

    const { data: existing } = await supabase
      .from('profiles').select('id').eq('username', username).single()
    if (existing) { setError('Benutzername bereits vergeben'); setLoading(false); return }

    const fakeEmail = `${username}@schulmarkt.de`
    const { error: signUpError } = await supabase.auth.signUp({
      email: fakeEmail, password,
      options: { data: { username } }
    })

    if (signUpError) { setError(signUpError.message); setLoading(false); return }
    router.push('/dashboard')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="desktop-only" style={{
        position: 'fixed', left: 0, top: 0, bottom: 0, width: '55%',
        background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 55%, var(--color-accent) 100%)',
      }}>
        <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
          <div style={{ textAlign: 'center' }}>
            <img src="https://www.lfs-koeln.de/wp-content/uploads/2019/01/cropped-logo-wei%C3%9F-gro%C3%9F-1-192x192.png" alt="LFS Logo" style={{ height: '64px', width: 'auto', marginBottom: '16px', filter: 'brightness(0) invert(1)' }} />
            <div style={{ fontSize: '14px', color: 'rgba(var(--color-bg-rgb),0.6)', marginBottom: '24px' }}>Erzb. Liebfrauenschule Köln</div>
            <div style={{ fontSize: '20px', fontWeight: 500, color: 'var(--text-on-dark)' }}>Ausschließlich für Schüler der LFS Köln</div>
          </div>
        </div>
      </div>

      <div className="mobile-only" style={{
        display: 'none',
        background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 55%, var(--color-accent) 100%)',
        padding: '32px 20px', textAlign: 'center', position: 'relative'
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <img src="https://www.lfs-koeln.de/wp-content/uploads/2019/01/cropped-logo-wei%C3%9F-gro%C3%9F-1-192x192.png" alt="LFS Logo" style={{ height: '44px', width: 'auto', marginBottom: '8px', filter: 'brightness(0) invert(1)' }} />
          <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-on-dark)' }}>Ausschließlich für Schüler der LFS Köln</div>
        </div>
      </div>

      <div style={{
        marginLeft: 'auto', width: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-page)', padding: '40px 20px', minHeight: '100vh'
      }}>
        <div className="desktop-only" style={{ width: '55%' }} />
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 500, color: 'var(--color-primary)', marginBottom: '6px' }}>Account erstellen</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '28px' }}>Wähle einen Benutzernamen und Passwort</p>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', color: 'var(--text-primary)', display: 'block', marginBottom: '6px', fontWeight: 500 }}>Benutzername</label>
            <input type="text" value={username}
              onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))} className="input-modern"
              style={{ width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border-input)', borderRadius: '6px', padding: '12px 14px', color: 'var(--text-primary)', fontSize: '16px', outline: 'none', boxSizing: 'border-box' }}
              placeholder="z.B. 26kut" />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', color: 'var(--text-primary)', display: 'block', marginBottom: '6px', fontWeight: 500 }}>Passwort</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRegister()} className="input-modern"
              style={{ width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border-input)', borderRadius: '6px', padding: '12px 14px', color: 'var(--text-primary)', fontSize: '16px', outline: 'none', boxSizing: 'border-box' }}
              placeholder="Mindestens 6 Zeichen" />
          </div>

          {error && (
            <div className="fade-in-up" style={{ background: 'var(--state-danger-bg)', border: '1px solid var(--state-danger-border)', borderRadius: '6px', padding: '10px 14px', fontSize: '13px', color: 'var(--state-danger)', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <button onClick={handleRegister} disabled={loading} className="btn-modern"
            style={{ width: '100%', background: loading ? 'var(--state-disabled)' : 'var(--color-primary)', color: 'var(--text-on-dark)', fontSize: '15px', fontWeight: 500, border: 'none', borderRadius: '6px', padding: '14px', cursor: 'pointer' }}>
            {loading ? 'Wird erstellt...' : 'Registrieren'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', marginTop: '16px' }}>
            Bereits registriert?{' '}
            <Link href="/login" className="link-modern" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}>Anmelden</Link>
          </p>
        </div>
      </div>
    </div>
  )
}