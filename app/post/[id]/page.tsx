import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import DeleteButton from '@/components/DeleteButton'
import ReportButton from '@/components/ReportButton'
import ImageGallery from '@/components/ImageGallery'
import SimilarPosts from '@/components/SimilarPosts'
import Footer from '@/components/Footer'
import SoldButton from '@/components/SoldButton'
import FavoriteButton from '@/components/FavoriteButton'
import { CATEGORY_TAG_STYLE, categoryPlaceholderBg } from '@/utils/categoryStyle'

const categoryLabel: Record<string, string> = {
  calculator: 'Taschenrechner',
  lfs_shirt: 'LFS Sportshirt',
  clothing: 'Klamotten',
  notebook: 'Schulhefte',
  lecture: 'Lektüren',
  supplies: 'Schulzubehör',
  other: 'Sonstiges'
}
const extrasLabel: Record<string, string> = {
  akkuKap: 'Akkukapazität',
  zustand: 'Zustand',
  gravur: 'Gravur',
  calcCase: 'Case',
  zubehoer: 'Zubehör',
  kaufjahr: 'Kaufjahr',
  geschlecht: 'Geschlecht',
  groesse: 'Größe',
  shirtZustand: 'Zustand',
  kleidungTyp: 'Art',
  kleidungGroesse: 'Größe',
  kleidungZustand: 'Zustand',
  kleidungFarbe: 'Farbe',
  heftFach: 'Fach',
  heftZustand: 'Zustand',
  heftBeschrieben: 'Beschrieben',
  lektuereTitel: 'Buchtitel',
  lektuereFach: 'Fach',
  lektuerenZustand: 'Zustand',
  lektuereBeschrieben: 'Markiert',
  zubehoerTyp: 'Art',
  zubehoerZustand: 'Zustand'
}

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: post } = await supabase
    .from('posts').select('*, profiles(id, username, display_name)').eq('id', id).single()
  if (!post || post.deleted_at) redirect('/dashboard')

  const { data: extraImages } = await supabase
    .from('post_images').select('*').eq('post_id', id).order('position')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()

  const { data: favorite } = await supabase
    .from('favorites').select('post_id').eq('user_id', user.id).eq('post_id', id).maybeSingle()

  const isOwn = post.seller_id === user.id
  const isAdmin = !!profile?.is_admin
  const sellerDisplayName = post.profiles?.display_name || post.profiles?.username
  const extras = post.extras ? JSON.parse(post.extras) : {}
  const extrasEntries = Object.entries(extras).filter(([_, v]) => v)
  const conditionEntry = extrasEntries.find(([key]) => extrasLabel[key] === 'Zustand')

  const extraUrls = extraImages?.map(i => i.url) || []
  const allImages = extraUrls.length > 0
    ? extraUrls
    : post.image_url ? [post.image_url] : []

  const catStyle = Object.fromEntries(
    CATEGORY_TAG_STYLE.split(';').filter(Boolean).map(s => s.split(':'))
  )

  return (
    <>
      <Navbar username={profile?.display_name || profile?.username} />
      <main style={{ background: 'var(--bg-page)', minHeight: '100vh', padding: '16px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <Link href="/dashboard" className="link-modern" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--color-primary)', textDecoration: 'none', marginBottom: '16px' }}>
            ← Zurück
          </Link>

          <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
            <div className="fade-in-up">
              <ImageGallery images={allImages} fallbackBg={categoryPlaceholderBg(post.category)} fallbackCategory={post.category} />
            </div>

            <div className="fade-in-up" style={{ animationDelay: '90ms', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                {post.price === 0
                  ? <p style={{ fontSize: '34px', fontWeight: 700, color: 'var(--state-success)', lineHeight: 1, margin: 0 }}>Zu verschenken 🎁</p>
                  : <p style={{ fontSize: '36px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, margin: 0 }}>{post.price.toFixed(2)} €</p>
                }
                <FavoriteButton postId={id} userId={user.id} initialFavorite={!!favorite} />
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {conditionEntry && (
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--state-success)', background: 'var(--state-success-bg)', border: '1px solid var(--state-success-border)', padding: '5px 12px', borderRadius: '999px' }}>
                    ✓ {conditionEntry[1] as string}
                  </span>
                )}
                <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', background: 'var(--border-light)', padding: '5px 12px', borderRadius: '999px', ...catStyle }}>
                  {categoryLabel[post.category]}
                </span>
              </div>

              <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2, margin: 0 }}>{post.title}</h1>

              <p style={{ fontSize: '12px', color: 'var(--text-faint)', margin: 0 }}>
                Eingestellt am {new Date(post.created_at).toLocaleDateString('de-DE')} um {new Date(post.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
              </p>

              {post.description && (
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{post.description}</p>
              )}

              <div className="card-modern" style={{ background: 'var(--bg-page)', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="avatar-modern" style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 700, color: 'var(--color-primary)', flexShrink: 0 }}>
                  {sellerDisplayName?.[0]?.toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {sellerDisplayName}{isOwn && <span style={{ fontWeight: 500, color: 'var(--text-faint)' }}> (Du)</span>}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>@{post.profiles?.username}</p>
                </div>
              </div>

              {extrasEntries.length > 0 && (
                <div style={{ borderTop: '1px solid var(--border-color)' }}>
                  {extrasEntries.map(([key, value]) => (
                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{extrasLabel[key] || key}</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{value as string}</span>
                    </div>
                  ))}
                </div>
              )}

              {!isOwn && (
                <Link href={`/chat/${post.profiles?.id}?post=${post.id}`} className="btn-modern"
                  style={{ background: 'var(--color-primary)', color: 'var(--text-on-dark)', fontSize: '14px', fontWeight: 700, borderRadius: '8px', padding: '13px', textDecoration: 'none', textAlign: 'center' }}>
                  Nachricht senden
                </Link>
              )}
              {!isOwn && <ReportButton postId={id} />}
              {isOwn && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Link href={`/post/${id}/edit`} className="btn-modern"
                    style={{ flex: 1, background: 'var(--border-light)', border: '1px solid var(--border-color)', color: 'var(--color-primary)', fontSize: '13px', fontWeight: 500, borderRadius: '6px', padding: '10px', textDecoration: 'none', textAlign: 'center' }}>
                    Bearbeiten
                  </Link>
                  <DeleteButton postId={id} />
                </div>
              )}
              {isOwn && post.status === 'active' && (
                <SoldButton postId={id} />
              )}
              {!isOwn && isAdmin && (
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--state-danger)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                    Admin-Aktion
                  </p>
                  <DeleteButton postId={id} />
                </div>
              )}
            </div>
          </div>
          <SimilarPosts postId={id} category={post.category} />
        </div>
      </main>
      <Footer />
    </>
  )
}