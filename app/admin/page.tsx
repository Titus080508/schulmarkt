import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import RestorePostButton from '@/components/RestorePostButton'
import AdminPostsTable from '@/components/AdminPostsTable'
import AdminUsers from '@/components/AdminUsers'
import AdminReports from '@/components/AdminReports'
import AdminUserReports from '@/components/AdminUserReports'
import AdminMessageReports from '@/components/AdminMessageReports'
import AdminAnnouncements from '@/components/AdminAnnouncements'
import Footer from '@/components/Footer'

const categoryLabel: Record<string, string> = {
  calculator: 'Taschenrechner', lfs_shirt: 'LFS Sportshirt', clothing: 'Klamotten',
  notebook: 'Schulhefte', lecture: 'Lektüren', supplies: 'Schulzubehör', other: 'Sonstiges'
}

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/dashboard')
  const isOwner = profile.role === 'owner'

  const { data: posts } = await supabase
    .from('posts').select('*, profiles(username, display_name)').is('deleted_at', null).order('created_at', { ascending: false })

  const { data: deletedPosts } = isOwner
    ? await supabase
        .from('posts').select('*, profiles(username, display_name)')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false })
    : { data: [] }

  const { data: users } = await supabase
    .from('profiles').select('*').order('created_at', { ascending: false })

  const { data: blocks } = await supabase
    .from('blocks')
    .select('*, blocker:profiles!blocker_id(username, display_name), blocked:profiles!blocked_id(username, display_name)')
    .order('created_at', { ascending: false })

  const { data: announcements } = isOwner
    ? await supabase.from('announcements').select('*').order('created_at', { ascending: false })
    : { data: [] }

  const { data: reports } = await supabase
    .from('reports')
    .select('*, reporter:profiles!reporter_id(username, display_name), post:posts(id, title, profiles(id, username, display_name))')
    .eq('resolved', false)
    .order('created_at', { ascending: false })

  const { data: resolvedReports } = await supabase
    .from('reports')
    .select('*, reporter:profiles!reporter_id(username, display_name), post:posts(id, title)')
    .eq('resolved', true)
    .order('resolved_at', { ascending: false })

  const { data: userReports } = await supabase
    .from('user_reports')
    .select('*, reporter:profiles!reporter_id(username, display_name), reported:profiles!reported_id(username, display_name)')
    .eq('resolved', false)
    .order('created_at', { ascending: false })

  const { data: messageReports } = await supabase
    .from('message_reports')
    .select('*, reporter:profiles!reporter_id(username, display_name), reported:profiles!reported_id(username, display_name), message:messages(content)')
    .eq('resolved', false)
    .order('created_at', { ascending: false })

  const active = posts?.filter(p => p.status === 'active') || []
  const sold = posts?.filter(p => p.status === 'sold') || []
  const revenue = sold.reduce((sum, p) => sum + p.price, 0)
  const avgPrice = posts?.length ? (posts.reduce((sum, p) => sum + p.price, 0) / posts.length) : 0

  const categoryCounts: Record<string, number> = {}
  posts?.forEach(p => { categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1 })
  const topCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const maxCategoryCount = topCategories[0]?.[1] || 1

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const newUsers = users?.filter(u => new Date(u.created_at) > sevenDaysAgo).length || 0

  const DAYS = 14
  const dayKeys: string[] = []
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dayKeys.push(d.toISOString().slice(0, 10))
  }
  const postsPerDay: Record<string, number> = {}
  const usersPerDay: Record<string, number> = {}
  dayKeys.forEach(k => { postsPerDay[k] = 0; usersPerDay[k] = 0 })
  posts?.forEach(p => { const k = p.created_at.slice(0, 10); if (k in postsPerDay) postsPerDay[k]++ })
  users?.forEach(u => { const k = u.created_at.slice(0, 10); if (k in usersPerDay) usersPerDay[k]++ })
  const maxDayCount = Math.max(1, ...dayKeys.map(k => Math.max(postsPerDay[k], usersPerDay[k])))

  return (
    <>
      <Navbar username={profile?.display_name || profile?.username} />
      <main style={{ background: 'var(--bg-page)', minHeight: '100vh', padding: '24px 20px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

          <div style={{ background: '#1a3a6e', borderRadius: '10px', padding: '20px 24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h1 style={{ fontSize: '20px', fontWeight: 500, color: '#fff', marginBottom: '4px' }}>Admin-Bereich</h1>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '10px' }}>Verwaltung aller Inserate, Nutzer und Meldungen</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <Link href="/admin/reports" style={{ fontSize: '12px', color: '#fff', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '4px', padding: '6px 12px', display: 'inline-block' }}>
                    Alle Meldungen ansehen ({(reports?.length || 0) + (resolvedReports?.length || 0) + (messageReports?.length || 0)})
                  </Link>
                  {isOwner && (
                    <>
                      <Link href="/admin/messages" style={{ fontSize: '12px', color: '#fff', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '4px', padding: '6px 12px', display: 'inline-block' }}>
                        Alle Nachrichten ansehen
                      </Link>
                      <Link href="/admin/audit-log" style={{ fontSize: '12px', color: '#fff', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '4px', padding: '6px 12px', display: 'inline-block' }}>
                        Audit-Log ansehen
                      </Link>
                    </>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {[
                  { num: posts?.length || 0, label: 'Inserate' },
                  { num: active.length, label: 'Aktiv' },
                  { num: users?.length || 0, label: 'Nutzer' },
                  { num: (reports?.length || 0) + (userReports?.length || 0) + (messageReports?.length || 0), label: 'Offene Meldungen', highlight: true },
                ].map((s, i) => (
                  <div key={s.label} className="fade-in-up" style={{ animationDelay: `${i * 60}ms`, textAlign: 'center', minWidth: '64px' }}>
                    <div style={{ fontSize: '22px', fontWeight: 500, color: s.highlight && s.num > 0 ? '#f0c040' : 'rgba(255,255,255,0.92)' }}>{s.num}</div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {isOwner && <AdminAnnouncements announcements={announcements || []} />}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div className="card-modern fade-in-up" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '18px 20px' }}>
              <p style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Umsatz (verkauft)</p>
              <p style={{ fontSize: '24px', fontWeight: 700, color: '#1a6e3a', margin: 0 }}>{revenue.toFixed(2)} €</p>
              <p style={{ fontSize: '12px', color: 'var(--text-faint)', marginTop: '4px' }}>{sold.length} verkaufte Artikel · Ø {avgPrice.toFixed(2)} € pro Inserat</p>
            </div>

            <div className="card-modern fade-in-up" style={{ animationDelay: '60ms', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '18px 20px' }}>
              <p style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Top-Kategorien</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {topCategories.map(([cat, count]) => (
                  <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', width: '90px', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{categoryLabel[cat] || cat}</span>
                    <div style={{ flex: 1, height: '6px', background: 'var(--border-light)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${(count / maxCategoryCount) * 100}%`, height: '100%', background: '#1a3a6e', borderRadius: '3px' }} />
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 500, width: '20px', textAlign: 'right' }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card-modern fade-in-up" style={{ animationDelay: '120ms', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '18px 20px' }}>
              <p style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Neue Nutzer (7 Tage)</p>
              <p style={{ fontSize: '24px', fontWeight: 700, color: '#1a3a6e', margin: 0 }}>{newUsers}</p>
              <p style={{ fontSize: '12px', color: 'var(--text-faint)', marginTop: '4px' }}>von {users?.length || 0} Nutzern insgesamt</p>
            </div>

            <div className="card-modern fade-in-up" style={{ animationDelay: '180ms', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '18px 20px' }}>
              <p style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Gemeldete Nutzer</p>
              <p style={{ fontSize: '24px', fontWeight: 700, color: '#b91c1c', margin: 0 }}>{userReports?.length || 0}</p>
              <p style={{ fontSize: '12px', color: 'var(--text-faint)', marginTop: '4px' }}>offene Meldungen</p>
            </div>
          </div>

          <div className="card-modern fade-in-up" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '18px 20px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <p style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Zeitverlauf (letzte {DAYS} Tage)</p>
              <div style={{ display: 'flex', gap: '14px', fontSize: '11px', color: 'var(--text-muted)' }}>
                <span><span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '2px', background: '#1a3a6e', marginRight: '5px' }} />Neue Inserate</span>
                <span><span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '2px', background: '#7da7d9', marginRight: '5px' }} />Neue Nutzer</span>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100px', paddingBottom: '0', flexShrink: 0, alignItems: 'flex-end' }}>
                  <span style={{ fontSize: '9px', color: 'var(--text-faint)', lineHeight: 1 }}>{maxDayCount}</span>
                  <span style={{ fontSize: '9px', color: 'var(--text-faint)', lineHeight: 1 }}>{Math.round(maxDayCount / 2)}</span>
                  <span style={{ fontSize: '9px', color: 'var(--text-faint)', lineHeight: 1 }}>0</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '100px', minWidth: '480px', borderLeft: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)', position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', borderTop: '1px dashed var(--border-light)', pointerEvents: 'none' }} />
                    {dayKeys.map(k => (
                      <div key={k} style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '2px', height: '100%' }} title={`${k}: ${postsPerDay[k]} Inserate, ${usersPerDay[k]} Nutzer`}>
                        <div style={{ width: '40%', height: `${(postsPerDay[k] / maxDayCount) * 100}%`, minHeight: postsPerDay[k] > 0 ? '3px' : 0, background: '#1a3a6e', borderRadius: '2px 2px 0 0' }} />
                        <div style={{ width: '40%', height: `${(usersPerDay[k] / maxDayCount) * 100}%`, minHeight: usersPerDay[k] > 0 ? '3px' : 0, background: '#7da7d9', borderRadius: '2px 2px 0 0' }} />
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '4px', marginTop: '6px', minWidth: '480px' }}>
                    {dayKeys.map(k => (
                      <span key={k} style={{ flex: 1, textAlign: 'center', fontSize: '9px', color: 'var(--text-faint)' }}>
                        {new Date(k).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {blocks && blocks.length > 0 && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', marginBottom: '20px', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontSize: '14px', fontWeight: 500, color: '#1a3a6e' }}>Blockierte Nutzer</p>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{blocks.length} gesamt</span>
              </div>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {blocks.map(b => (
                  <div key={b.id} className="row-modern" style={{ padding: '12px 20px', borderTop: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>{b.blocker?.display_name || b.blocker?.username}</strong>
                    <span style={{ color: 'var(--text-faint)' }}>hat</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{b.blocked?.display_name || b.blocked?.username}</strong>
                    <span style={{ color: 'var(--text-faint)' }}>blockiert</span>
                    <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-faint)' }}>{new Date(b.created_at).toLocaleDateString('de-DE')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isOwner && deletedPosts && deletedPosts.length > 0 && (
            <div style={{ background: '#fff8f8', border: '1px solid #fecaca', borderRadius: '10px', marginBottom: '20px', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontSize: '14px', fontWeight: 500, color: '#b91c1c' }}>Kürzlich gelöscht</p>
                <span style={{ fontSize: '12px', color: '#b91c1c', background: '#fee2e2', padding: '2px 8px', borderRadius: '3px' }}>{deletedPosts.length} · wiederherstellbar bis 48h</span>
              </div>
              <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                {deletedPosts.map(post => {
                  const deletedAt = new Date(post.deleted_at)
                  const hoursLeft = Math.max(0, 48 - (Date.now() - deletedAt.getTime()) / (1000 * 60 * 60))
                  return (
                    <div key={post.id} className="row-modern" style={{ padding: '12px 20px', borderTop: '1px solid #fee2e2', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.title}</p>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                          von {post.profiles?.display_name || post.profiles?.username} · gelöscht am {deletedAt.toLocaleDateString('de-DE')} um {deletedAt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <span style={{ fontSize: '11px', color: hoursLeft < 6 ? '#b91c1c' : '#aaa', flexShrink: 0 }}>
                        noch {hoursLeft.toFixed(1)}h
                      </span>
                      <RestorePostButton postId={post.id} />
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {userReports && userReports.length > 0 && (
            <AdminUserReports reports={userReports} isOwner={isOwner} currentUserId={user.id} />
          )}

          {messageReports && messageReports.length > 0 && (
            <AdminMessageReports reports={messageReports} isOwner={isOwner} currentUserId={user.id} />
          )}

          {reports && reports.length > 0 && (
            <AdminReports reports={reports} title="Offene Meldungen" showResolve={true} isOwner={isOwner} currentUserId={user.id} />
          )}

          <AdminPostsTable posts={posts || []} />

          <AdminUsers users={users || []} isOwner={isOwner} currentUserId={user.id} />

        </div>
      </main>
      <Footer />
    </>
  )
}