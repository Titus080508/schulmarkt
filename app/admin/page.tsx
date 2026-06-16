import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import DeleteButton from '@/components/DeleteButton'
import AdminUsers from '@/components/AdminUsers'
import AdminReports from '@/components/AdminReports'
import Footer from '@/components/Footer'

const categoryLabel: Record<string, string> = {
  calculator: 'Taschenrechner', shirt: 'Sportshirt', book: 'Schulbuch', other: 'Sonstiges'
}

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/dashboard')

  const { data: posts } = await supabase
    .from('posts').select('*, profiles(username, display_name)').order('created_at', { ascending: false })

  const { data: users } = await supabase
    .from('profiles').select('*').order('created_at', { ascending: false })

  const { data: reports } = await supabase
    .from('reports')
    .select('*, reporter:profiles!reporter_id(username, display_name), post:posts(id, title)')
    .eq('resolved', false)
    .order('created_at', { ascending: false })

  const { data: resolvedReports } = await supabase
    .from('reports')
    .select('*, reporter:profiles!reporter_id(username, display_name), post:posts(id, title)')
    .eq('resolved', true)
    .order('resolved_at', { ascending: false })

  const active = posts?.filter(p => p.status === 'active') || []

  return (
    <>
      <Navbar username={profile?.display_name || profile?.username} />
      <main style={{ background: '#f7f5f0', minHeight: '100vh', padding: '24px 20px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

          <div style={{ background: '#1a3a6e', borderRadius: '10px', padding: '20px 24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h1 style={{ fontSize: '20px', fontWeight: 500, color: '#fff', marginBottom: '4px' }}>Admin-Bereich</h1>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '10px' }}>Verwaltung aller Inserate, Nutzer und Meldungen</p>
                <Link href="/admin/reports" style={{ fontSize: '12px', color: '#f0c040', textDecoration: 'none', border: '1px solid rgba(240,192,64,0.3)', borderRadius: '4px', padding: '6px 12px', display: 'inline-block' }}>
                  Alle Meldungen ansehen ({(reports?.length || 0) + (resolvedReports?.length || 0)})
                </Link>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                {[
                  { num: posts?.length || 0, label: 'Inserate' },
                  { num: active.length, label: 'Aktiv' },
                  { num: users?.length || 0, label: 'Nutzer' },
                  { num: reports?.length || 0, label: 'Offene Meldungen' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '22px', fontWeight: 500, color: '#f0c040' }}>{s.num}</div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {reports && reports.length > 0 && (
            <AdminReports reports={reports} title="Offene Meldungen" showResolve={true} />
          )}

          <div style={{ background: '#fff', border: '1px solid #e0dcd4', borderRadius: '10px', marginBottom: '20px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e0dcd4', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: '14px', fontWeight: 500, color: '#1a3a6e' }}>Alle Inserate</p>
              <span style={{ fontSize: '12px', color: '#888' }}>{posts?.length} gesamt</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f7f5f0' }}>
                  {['Titel', 'Kategorie', 'Preis', 'Verkäufer', 'Status', 'Aktionen'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 500, color: '#888', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {posts?.map(post => (
                  <tr key={post.id} style={{ borderTop: '1px solid #f0ece4' }}>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#1a2040', fontWeight: 500, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.title}</td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: '#666' }}>{categoryLabel[post.category]}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#1a3a6e', fontWeight: 500 }}>{post.price.toFixed(2)} €</td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: '#666' }}>{post.profiles?.display_name || post.profiles?.username}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 500, padding: '3px 8px', borderRadius: '3px', background: post.status === 'active' ? '#f0fdf4' : '#f7f5f0', color: post.status === 'active' ? '#1a6e3a' : '#888' }}>
                        {post.status === 'active' ? 'Aktiv' : 'Verkauft'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <Link href={`/post/${post.id}`} style={{ fontSize: '12px', color: '#1a3a6e', textDecoration: 'none', background: '#eef2f8', border: '1px solid #c8d4e8', borderRadius: '4px', padding: '4px 10px' }}>Ansehen</Link>
                        <Link href={`/post/${post.id}/edit`} style={{ fontSize: '12px', color: '#666', textDecoration: 'none', background: '#f7f5f0', border: '1px solid #ddd', borderRadius: '4px', padding: '4px 10px' }}>Bearbeiten</Link>
                        <DeleteButton postId={post.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <AdminUsers users={users || []} />

        </div>
      </main>
      <Footer />
    </>
  )
}