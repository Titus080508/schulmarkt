'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import Footer from '@/components/Footer'

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase
        .from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)
      setDisplayName(data?.display_name || data?.username || '')
      setFetching(false)
    }
    load()
  }, [])

  async function handleSave() {
    if (!displayName.trim()) { setError('Anzeigename darf nicht leer sein'); return }
    if (displayName.length > 30) { setError('Maximal 30 Zeichen'); return }
    setLoading(true); setError(''); setSuccess(false)
    const { error: updateError } = await supabase
      .from('profiles').update({ display_name: displayName.trim() }).eq('id', profile.id)
    if (updateError) { setError(updateError.message); setLoading(false); return }
    setSuccess(true)
    setLoading(false)
    setTimeout(() => setSuccess(false), 3000)
  }

  if (fetching) return (
    <div style={{ minHeight: '100vh', background: '#f7f5f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#888' }}>Wird geladen...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f7f5f0', display: 'flex', flexDirection: 'column' }}>
      <Navbar username={profile?.display_name || profile?.username} />
      <main style={{ flex: 1, maxWidth: '540px', margin: '0 auto', width: '100%', padding: '24px 20px' }}>
        <Link href="/dashboard" style={{ fontSize: '13px', color: '#1a3a6e', textDecoration: 'none', marginBottom: '16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          ← Zurück
        </Link>

        <h1 style={{ fontSize: '20px', fontWeight: 500, color: '#1a3a6e', marginBottom: '20px', marginTop: '12px' }}>Mein Profil</h1>

        <div style={{ background: '#fff', border: '1px solid #e0dcd4', borderRadius: '10px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', paddingBottom: '16px', borderBottom: '1px solid #f0ece4' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#f0c040', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 500, color: '#1a3a6e' }}>
              {(displayName || profile?.username)?.[0]?.toUpperCase()}
            </div>
            <div>
              <p style={{ fontSize: '16px', fontWeight: 500, color: '#1a2040' }}>{displayName || profile?.username}</p>
              <p style={{ fontSize: '12px', color: '#aaa' }}>@{profile?.username}</p>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '13px', color: '#444', display: 'block', marginBottom: '6px', fontWeight: 500 }}>Anzeigename</label>
            <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} maxLength={30}
              style={{ width: '100%', background: '#f7f5f0', border: '1px solid #ddd', borderRadius: '6px', padding: '11px 14px', color: '#1a2040', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              placeholder="Dein Anzeigename" />
            <p style={{ fontSize: '11px', color: '#aaa', marginTop: '6px' }}>
              Wird anderen Nutzern angezeigt. ({displayName.length}/30)
            </p>
          </div>

          <div>
            <label style={{ fontSize: '13px', color: '#444', display: 'block', marginBottom: '6px', fontWeight: 500 }}>Benutzername</label>
            <input type="text" value={profile?.username || ''} disabled
              style={{ width: '100%', background: '#f0ece4', border: '1px solid #ddd', borderRadius: '6px', padding: '11px 14px', color: '#aaa', fontSize: '14px', outline: 'none', boxSizing: 'border-box', cursor: 'not-allowed' }} />
            <p style={{ fontSize: '11px', color: '#aaa', marginTop: '6px' }}>
              Kommt vom Schulaccount und kann nicht geändert werden.
            </p>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '10px 14px', fontSize: '13px', color: '#b91c1c' }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '6px', padding: '10px 14px', fontSize: '13px', color: '#1a6e3a' }}>
              Anzeigename gespeichert!
            </div>
          )}

          <button onClick={handleSave} disabled={loading}
            style={{ background: loading ? '#7a9ab8' : '#1a3a6e', color: '#fff', fontSize: '14px', fontWeight: 500, border: 'none', borderRadius: '6px', padding: '12px', cursor: 'pointer' }}>
            {loading ? 'Wird gespeichert...' : 'Speichern'}
          </button>
        </div>
      </main>
      <Footer />
    </div>
  )
}