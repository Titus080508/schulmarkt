import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import DeleteButton from '@/components/DeleteButton'
import Footer from '@/components/Footer'
import SoldButton from '@/components/SoldButton'
import CategoryIcon from '@/components/CategoryIcon'

const categoryLabel: Record<string, string> = {
  calculator: 'Taschenrechner',
  lfs_shirt: 'LFS Sportshirt',
  clothing: 'Klamotten',
  notebook: 'Schulhefte',
  lecture: 'Lektüren',
  supplies: 'Schulzubehör',
  other: 'Sonstiges'
}
const categoryBg: Record<string, string> = {
  calculator: '#edf2ff', lfs_shirt: '#fdf0f7', clothing: '#fdf0f7',
  notebook: '#f0fdf4', lecture: '#f0fdf4', supplies: '#fdf8f0', other: '#f7f5f0'
}

export default async function MyPostsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()

  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('seller_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  const active = posts?.filter(p => p.status === 'active') || []
  const sold   = posts?.filter(p => p.status === 'sold') || []

  const cardStyle = (status: string) => ({
    background: status === 'sold' ? 'var(--bg-page)' : 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    overflow: 'hidden',
    opacity: status === 'sold' ? 0.7 : 1
  })

  return (
    <>
      <Navbar username={profile?.display_name || profile?.username} />
      <main style={{ background: 'var(--bg-page)', minHeight: '100vh', padding: '24px 20px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 500, color: '#1a3a6e', marginBottom: '4px' }}>Meine Inserate</h1>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{active.length} aktiv · {sold.length} verkauft</p>
            </div>
            <Link href="/create"
              style={{ background: '#1a3a6e', color: '#fff', fontSize: '13px', fontWeight: 500, borderRadius: '4px', padding: '10px 18px', textDecoration: 'none' }}>
              + Neues Inserat
            </Link>
          </div>

          {active.length === 0 && sold.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-faint)' }}>
              <p style={{ fontSize: '14px', marginBottom: '12px' }}>Du hast noch keine Inserate erstellt.</p>
              <Link href="/create"
                style={{ background: '#1a3a6e', color: '#fff', fontSize: '13px', fontWeight: 500, borderRadius: '4px', padding: '10px 18px', textDecoration: 'none' }}>
                Erstes Inserat erstellen
              </Link>
            </div>
          )}

          {active.length > 0 && (
            <>
              <p style={{ fontSize: '11px', fontWeight: 500, color: '#1a3a6e', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Aktive Inserate</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px', marginBottom: '32px' }}>
                {active.map((post, i) => (
                  <div key={post.id} className="card-modern fade-in-up" style={{ ...cardStyle(post.status), animationDelay: `${Math.min(i, 12) * 60}ms` }}>
                    <div className="thumb-modern" style={{ aspectRatio: '4/3', background: categoryBg[post.category] || '#f7f5f0', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      {post.image_url
                        ? <img src={post.image_url} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <CategoryIcon category={post.category} size={32} color="#b8c4d4" />
                      }
                      <span style={{ position: 'absolute', top: '8px', left: '8px', fontSize: '10px', fontWeight: 500, padding: '2px 8px', borderRadius: '3px', background: '#e8eef8', color: '#1a3a6e' }}>
                        {categoryLabel[post.category]}
                      </span>
                    </div>
                    <div style={{ padding: '12px' }}>
                      <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{post.title}</p>
                      <p style={{ fontSize: '15px', fontWeight: post.price === 0 ? 600 : 500, color: post.price === 0 ? '#1a6e3a' : '#1a3a6e', marginBottom: '10px' }}>
                        {post.price === 0 ? 'Zu verschenken 🎁' : `${post.price.toFixed(2)} €`}
                      </p>
                      <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                        <Link href={`/post/${post.id}`}
                          style={{ flex: 1, background: 'var(--bg-page)', border: '1px solid var(--border-input)', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 500, borderRadius: '4px', padding: '7px', textDecoration: 'none', textAlign: 'center' }}>
                          Ansehen
                        </Link>
                        <Link href={`/post/${post.id}/edit`}
                          style={{ flex: 1, background: '#eef2f8', border: '1px solid #c8d4e8', color: '#1a3a6e', fontSize: '12px', fontWeight: 500, borderRadius: '4px', padding: '7px', textDecoration: 'none', textAlign: 'center' }}>
                          Bearbeiten
                        </Link>
                        <DeleteButton postId={post.id} />
                      </div>
                      <SoldButton postId={post.id} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {sold.length > 0 && (
            <>
              <p style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Verkaufte Inserate</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                {sold.map((post, i) => (
                  <div key={post.id} className="fade-in-up" style={{ ...cardStyle(post.status), animationDelay: `${Math.min(i, 12) * 60}ms` }}>
                    <div style={{ aspectRatio: '4/3', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      {post.image_url
                        ? <img src={post.image_url} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(50%)' }} />
                        : <CategoryIcon category={post.category} size={32} color="#ccc" />
                      }
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ background: '#1a6e3a', color: '#fff', fontSize: '12px', fontWeight: 500, padding: '4px 12px', borderRadius: '999px' }}>Verkauft</span>
                      </div>
                    </div>
                    <div style={{ padding: '12px' }}>
                      <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{post.title}</p>
                      <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-faint)' }}>{post.price === 0 ? 'Verschenkt' : `${post.price.toFixed(2)} €`}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}