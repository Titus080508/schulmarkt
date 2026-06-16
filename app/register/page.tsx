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
        background: '#1a3a6e',
        backgroundImage: 'url(https://www.lfs-koeln.de/wp-content/uploads/2023/04/bienenvoelker2.jpg)',
        backgroundSize: 'cover', backgroundPosition: 'center',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,25,60,0.85)' }} />
        <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 500, color: '#fff', marginBottom: '8px' }}>LFS Köln</div>
            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '24px' }}>Erzb. Liebfrauenschule Köln</div>
            <div style={{ fontSize: '20px', fontWeight: 500, color: '#f0c040' }}>Ausschließlich für Schüler der LFS Köln</div>
          </div>
        </div>
      </div>

      <div className="mobile-only" style={{
        display: 'none',
        background: '#1a3a6e',
        backgroundImage: 'url(https://www.lfs-koeln.de/wp-content/uploads/2023/04/bienenvoelker2.jpg)',
        backgroundSize: 'cover', backgroundPosition: 'center',
        padding: '32px 20px', textAlign: 'center', position: 'relative'
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,25,60,0.85)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '24px', fontWeight: 500, color: '#fff', marginBottom: '4px' }}>LFS Köln</div>
          <div style={{ fontSize: '14px', fontWeight: 500, color: '#f0c040' }}>Ausschließlich für Schüler der LFS Köln</div>
        </div>
      </div>

      <div style={{
        marginLeft: 'auto', width: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#f7f5f0', padding: '40px 20px', minHeight: '100vh'
      }}>
        <div className="desktop-only" style={{ width: '55%' }} />
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 500, color: '#1a3a6e', marginBottom: '6px' }}>Account erstellen</h1>
          <p style={{ fontSize: '13px', color: '#888', marginBottom: '28px' }}>Wähle einen Benutzernamen und Passwort</p>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', color: '#444', display: 'block', marginBottom: '6px', fontWeight: 500 }}>Benutzername</label>
            <input type="text" value={username}
              onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
              style={{ width: '100%', background: '#fff', border: '1px solid #ddd', borderRadius: '6px', padding: '12px 14px', color: '#1a2040', fontSize: '16px', outline: 'none', boxSizing: 'border-box' }}
              placeholder="max.mustermann" />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', color: '#444', display: 'block', marginBottom: '6px', fontWeight: 500 }}>Passwort</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRegister()}
              style={{ width: '100%', background: '#fff', border: '1px solid #ddd', borderRadius: '6px', padding: '12px 14px', color: '#1a2040', fontSize: '16px', outline: 'none', boxSizing: 'border-box' }}
              placeholder="Mindestens 6 Zeichen" />
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '10px 14px', fontSize: '13px', color: '#b91c1c', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <button onClick={handleRegister} disabled={loading}
            style={{ width: '100%', background: loading ? '#7a9ab8' : '#1a3a6e', color: '#fff', fontSize: '15px', fontWeight: 500, border: 'none', borderRadius: '6px', padding: '14px', cursor: 'pointer' }}>
            {loading ? 'Wird erstellt...' : 'Registrieren'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '13px', color: '#888', marginTop: '16px' }}>
            Bereits registriert?{' '}
            <Link href="/login" style={{ color: '#1a3a6e', textDecoration: 'none', fontWeight: 500 }}>Anmelden</Link>
          </p>
        </div>
      </div>
    </div>
  )
}