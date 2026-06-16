import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import DeleteButton from '@/components/DeleteButton'
import Footer from '@/components/Footer'

const categoryLabel: Record<string, string> = {
  calculator: 'Taschenrechner',
  shirt: 'Sportshirt',
  book: 'Schulbuch',
  other: 'Sonstiges'
}
const categoryEmoji: Record<string, string> = {
  calculator: '🔢', shirt: '👕', book: '📚', other: '📦'
}
const categoryBg: Record<string, string> = {
  calculator: '#edf2ff', shirt: '#fdf0f7', book: '#f0fdf4', other: '#fdf8f0'
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
    .order('created_at', { ascending: false })

  const active = posts?.filter(p => p.status === 'active') || []
  const sold   = posts?.filter(p => p.status === 'sold') || []

  const cardStyle = (status: string) => ({
    background: status === 'sold' ? '#f7f5f0' : '#fff',
    border: '1px solid #e0dcd4',
    borderRadius: '8px',
    overflow: 'hidden',
    opacity: status === 'sold' ? 0.7 : 1
  })

  return (
    <>
      <Navbar username={profile?.display_name || profile?.username} />
      <main style={{ background: '#f7f5f0', minHeight: '100vh', padding: '24px 20px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 500, color: '#1a3a6e', marginBottom: '4px' }}>Meine Inserate</h1>
              <p style={{ fontSize: '13px', color: '#888' }}>{active.length} aktiv · {sold.length} verkauft</p>
            </div>
            <Link href="/create"
              style={{ background: '#1a3a6e', color: '#fff', fontSize: '13px', fontWeight: 500, borderRadius: '4px', padding: '10px 18px', textDecoration: 'none' }}>
              + Neues Inserat
            </Link>
          </div>

          {active.length === 0 && sold.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#aaa' }}>
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
                {active.map(post => (
                  <div key={post.id} style={cardStyle(post.status)}>
                    <div style={{ aspectRatio: '4/3', background: categoryBg[post.category] || '#f7f5f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', position: 'relative' }}>
                      {post.image_url
                        ? <img src={post.image_url} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : categoryEmoji[post.category]
                      }
                      <span style={{ position: 'absolute', top: '8px', left: '8px', fontSize: '10px', fontWeight: 500, padding: '2px 8px', borderRadius: '3px', background: '#e8eef8', color: '#1a3a6e' }}>
                        {categoryLabel[post.category]}
                      </span>
                    </div>
                    <div style={{ padding: '12px' }}>
                      <p style={{ fontSize: '13px', fontWeight: 500, color: '#1a2040', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{post.title}</p>
                      <p style={{ fontSize: '15px', fontWeight: 500, color: '#1a3a6e', marginBottom: '10px' }}>{post.price.toFixed(2)} €</p>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <Link href={`/post/${post.id}`}
                          style={{ flex: 1, background: '#f7f5f0', border: '1px solid #ddd', color: '#666', fontSize: '12px', fontWeight: 500, borderRadius: '4px', padding: '7px', textDecoration: 'none', textAlign: 'center' }}>
                          Ansehen
                        </Link>
                        <Link href={`/post/${post.id}/edit`}
                          style={{ flex: 1, background: '#eef2f8', border: '1px solid #c8d4e8', color: '#1a3a6e', fontSize: '12px', fontWeight: 500, borderRadius: '4px', padding: '7px', textDecoration: 'none', textAlign: 'center' }}>
                          Bearbeiten
                        </Link>
                        <DeleteButton postId={post.id} />
                      </div>
                      <Link href={`/post/${post.id}/sold`}
                        style={{ display: 'block', textAlign: 'center', marginTop: '6px', background: '#f0fdf4', border: '1px solid #86efac', color: '#1a6e3a', fontSize: '12px', fontWeight: 500, borderRadius: '4px', padding: '7px', textDecoration: 'none' }}>
                        Als verkauft markieren
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {sold.length > 0 && (
            <>
              <p style={{ fontSize: '11px', fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Verkaufte Inserate</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                {sold.map(post => (
                  <div key={post.id} style={cardStyle(post.status)}>
                    <div style={{ aspectRatio: '4/3', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', position: 'relative' }}>
                      {post.image_url
                        ? <img src={post.image_url} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(50%)' }} />
                        : categoryEmoji[post.category]
                      }
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ background: '#1a6e3a', color: '#fff', fontSize: '12px', fontWeight: 500, padding: '4px 12px', borderRadius: '999px' }}>Verkauft</span>
                      </div>
                    </div>
                    <div style={{ padding: '12px' }}>
                      <p style={{ fontSize: '13px', fontWeight: 500, color: '#888', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{post.title}</p>
                      <p style={{ fontSize: '15px', fontWeight: 500, color: '#aaa' }}>{post.price.toFixed(2)} €</p>
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