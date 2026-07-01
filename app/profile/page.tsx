'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import Footer from '@/components/Footer'
import CategoryIcon from '@/components/CategoryIcon'
import { CATEGORY_BG } from '@/utils/categoryStyle'

const categoryLabel: Record<string, string> = {
  calculator: 'Taschenrechner', lfs_shirt: 'LFS Sportshirt', clothing: 'Klamotten',
  notebook: 'Schulhefte', lecture: 'Lektüren', supplies: 'Schulzubehör', other: 'Sonstiges'
}
const roleLabel: Record<string, string> = { owner: 'Owner', moderator: 'Moderator' }
const roleColor: Record<string, string> = { owner: 'var(--state-danger)', moderator: 'var(--color-primary)' }

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [stats, setStats] = useState<any>(null)
  const [recentPosts, setRecentPosts] = useState<any[]>([])
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

      const { data: myPosts } = await supabase
        .from('posts').select('price, category, status').eq('seller_id', user.id).is('deleted_at', null)
      const { count: favoriteCount } = await supabase
        .from('favorites').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
      const { data: latest } = await supabase
        .from('posts').select('id, title, price, image_url, category, status')
        .eq('seller_id', user.id).is('deleted_at', null)
        .order('created_at', { ascending: false }).limit(4)
      setRecentPosts(latest || [])

      const active = myPosts?.filter(p => p.status === 'active') || []
      const sold = myPosts?.filter(p => p.status === 'sold') || []
      const totalEarned = sold.reduce((sum, p) => sum + p.price, 0)

      const categoryCounts: Record<string, number> = {}
      myPosts?.forEach(p => { categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1 })
      const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null

      setStats({
        total: myPosts?.length || 0,
        active: active.length,
        sold: sold.length,
        totalEarned,
        favoriteCount: favoriteCount || 0,
        topCategory
      })

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
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--text-muted)' }}>Wird geladen...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', display: 'flex', flexDirection: 'column' }}>
      <Navbar username={profile?.display_name || profile?.username} />
      <main style={{ flex: 1, maxWidth: '700px', margin: '0 auto', width: '100%', padding: '24px 20px' }}>
        <Link href="/dashboard" className="link-modern" style={{ fontSize: '13px', color: 'var(--color-primary)', textDecoration: 'none', marginBottom: '16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          ← Zurück
        </Link>

        <h1 style={{ fontSize: '21px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px', marginTop: '12px' }}>Mein Profil</h1>

        <div className="fade-in-up card-modern" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '24px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div className="avatar-modern" style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 700, color: 'var(--text-on-dark)', flexShrink: 0 }}>
              {(displayName || profile?.username)?.[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <p style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{displayName || profile?.username}</p>
                {profile?.role && roleLabel[profile.role] && (
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-on-dark)', background: roleColor[profile.role], padding: '2px 8px', borderRadius: '999px' }}>
                    {roleLabel[profile.role]}
                  </span>
                )}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-faint)', margin: '2px 0 0' }}>@{profile?.username}</p>
              {profile?.created_at && (
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                  Mitglied seit {new Date(profile.created_at).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginTop: '20px' }}>
            <Link href="/create" className="nav-menu-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: 'var(--bg-page)', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
              + Inserieren
            </Link>
            <Link href="/my-posts" className="nav-menu-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: 'var(--bg-page)', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
              Meine Inserate
            </Link>
            <Link href="/favorites" className="nav-menu-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: 'var(--bg-page)', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
              Favoriten
            </Link>
            {profile?.is_admin && (
              <Link href="/admin" className="nav-menu-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: 'var(--bg-page)', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: 600, color: 'var(--color-primary)' }}>
                Admin-Bereich
              </Link>
            )}
          </div>
        </div>

        <div className="fade-in-up" style={{ animationDelay: '40ms', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>

          <div>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 500 }}>Anzeigename</label>
            <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} maxLength={30}
              style={{ width: '100%', background: 'var(--bg-page)', border: '1px solid var(--border-input)', borderRadius: '6px', padding: '11px 14px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              placeholder="Dein Anzeigename" />
            <p style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '6px' }}>
              Wird anderen Nutzern angezeigt. ({displayName.length}/30)
            </p>
          </div>

          <div>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 500 }}>Benutzername</label>
            <input type="text" value={profile?.username || ''} disabled
              style={{ width: '100%', background: 'var(--border-light)', border: '1px solid var(--border-input)', borderRadius: '6px', padding: '11px 14px', color: 'var(--text-faint)', fontSize: '14px', outline: 'none', boxSizing: 'border-box', cursor: 'not-allowed' }} />
            <p style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '6px' }}>
              Kommt vom Schulaccount und kann nicht geändert werden.
            </p>
          </div>

          {error && (
            <div style={{ background: 'var(--state-danger-bg)', border: '1px solid var(--state-danger-border)', borderRadius: '6px', padding: '10px 14px', fontSize: '13px', color: 'var(--state-danger)' }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ background: 'var(--state-success-bg)', border: '1px solid var(--state-success-border)', borderRadius: '6px', padding: '10px 14px', fontSize: '13px', color: 'var(--state-success)' }}>
              Anzeigename gespeichert!
            </div>
          )}

          <button onClick={handleSave} disabled={loading}
            style={{ background: loading ? 'var(--state-disabled)' : 'var(--color-primary)', color: 'var(--text-on-dark)', fontSize: '14px', fontWeight: 500, border: 'none', borderRadius: '6px', padding: '12px', cursor: 'pointer' }}>
            {loading ? 'Wird gespeichert...' : 'Speichern'}
          </button>
        </div>

        {stats && (
          <div className="fade-in-up" style={{ animationDelay: '80ms', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '24px', marginBottom: '20px' }}>
            <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>Meine Statistiken</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '12px', marginBottom: stats.topCategory ? '16px' : 0 }}>
              {[
                { num: stats.total, label: 'Inserate gesamt' },
                { num: stats.active, label: 'Aktiv' },
                { num: stats.sold, label: 'Verkauft' },
                { num: `${stats.totalEarned.toFixed(2)} €`, label: 'Verdient' },
                { num: stats.favoriteCount, label: 'Favoriten' },
              ].map((s, i) => (
                <div key={s.label} className="stat-card-modern" style={{ animationDelay: `${i * 50}ms`, textAlign: 'center', background: 'var(--bg-page)', borderRadius: '8px', padding: '14px 10px' }}>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-primary)' }}>{s.num}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {stats.topCategory && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--border-light)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px 16px' }}>
                <CategoryIcon category={stats.topCategory} size={22} color="var(--color-primary)" />
                <p style={{ fontSize: '13px', color: 'var(--text-primary)', margin: 0 }}>
                  Deine meistgenutzte Kategorie: <strong>{categoryLabel[stats.topCategory] || stats.topCategory}</strong>
                </p>
              </div>
            )}
          </div>
        )}

        {recentPosts.length > 0 && (
          <div className="fade-in-up" style={{ animationDelay: '120ms', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Deine neuesten Inserate</p>
              <Link href="/my-posts" className="link-modern" style={{ fontSize: '12px', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}>Alle ansehen</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
              {recentPosts.map(post => (
                <Link key={post.id} href={`/post/${post.id}`} className="post-card-modern"
                  style={{ textDecoration: 'none', background: 'var(--bg-page)', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', display: 'block' }}>
                  <div className="post-image-modern" style={{ aspectRatio: '4/3', background: CATEGORY_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    {post.image_url
                      ? <img src={post.image_url} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <CategoryIcon category={post.category} size={28} color="var(--text-faint)" />
                    }
                    {post.status === 'sold' && (
                      <span style={{ position: 'absolute', top: '6px', right: '6px', background: 'var(--state-success)', color: 'var(--text-on-dark)', fontSize: '9px', fontWeight: 600, padding: '2px 7px', borderRadius: '999px' }}>Verkauft</span>
                    )}
                  </div>
                  <div style={{ padding: '8px 10px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.title}</p>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: post.price === 0 ? 'var(--state-success)' : 'var(--color-primary)', margin: '2px 0 0' }}>
                      {post.price === 0 ? 'Verschenkt' : `${post.price.toFixed(2)} €`}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}