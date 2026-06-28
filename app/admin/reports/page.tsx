import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import AdminReports from '@/components/AdminReports'
import Footer from '@/components/Footer'

export default async function AdminReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/dashboard')

  const { data: openReports } = await supabase
    .from('reports')
    .select('*, reporter:profiles!reporter_id(username, display_name), post:posts(id, title)')
    .eq('resolved', false)
    .order('created_at', { ascending: false })

  const { data: resolvedReports } = await supabase
    .from('reports')
    .select('*, reporter:profiles!reporter_id(username, display_name), post:posts(id, title)')
    .eq('resolved', true)
    .order('resolved_at', { ascending: false })

  return (
    <>
      <Navbar username={profile?.display_name || profile?.username} />
      <main style={{ background: 'var(--bg-page)', minHeight: '100vh', padding: '24px 20px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <Link href="/admin" style={{ fontSize: '13px', color: '#1a3a6e', textDecoration: 'none' }}>← Admin</Link>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 500, color: '#1a3a6e' }}>Alle Meldungen</h1>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {openReports?.length || 0} offen · {resolvedReports?.length || 0} erledigt
              </p>
            </div>
          </div>

          {openReports && openReports.length > 0 && (
            <AdminReports reports={openReports} title="Offene Meldungen" showResolve={true} />
          )}

          {openReports?.length === 0 && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '40px', textAlign: 'center', marginBottom: '20px' }}>
              <p style={{ color: 'var(--text-faint)', fontSize: '14px' }}>Keine offenen Meldungen.</p>
            </div>
          )}

          {resolvedReports && resolvedReports.length > 0 && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-muted)' }}>Erledigte Meldungen</p>
                <span style={{ fontSize: '12px', color: 'var(--text-faint)', background: 'var(--bg-page)', padding: '2px 8px', borderRadius: '3px' }}>{resolvedReports.length} gesamt</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '480px', overflowY: 'auto' }}>
                {resolvedReports.map(report => (
                  <div key={report.id} style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', opacity: 0.7 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', background: '#f0fdf4', color: '#1a6e3a', padding: '2px 8px', borderRadius: '3px', fontWeight: 500 }}>Erledigt</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                          {new Date(report.created_at).toLocaleDateString('de-DE')}
                        </span>
                      </div>
                      <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '3px' }}>
                        Post: <Link href={`/post/${report.post_id}`} style={{ color: '#1a3a6e', textDecoration: 'none' }}>{report.post?.title}</Link>
                      </p>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '3px' }}>
                        Gemeldet von: <strong>{report.reporter?.display_name || report.reporter?.username}</strong>
                        <span style={{ color: 'var(--text-faint)', fontSize: '11px' }}> (@{report.reporter?.username})</span>
                      </p>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        Grund: {report.reason}
                      </p>
                    </div>
                    <Link href={`/post/${report.post_id}`}
                      style={{ fontSize: '12px', color: '#1a3a6e', textDecoration: 'none', background: '#eef2f8', border: '1px solid #c8d4e8', borderRadius: '4px', padding: '6px 12px', flexShrink: 0 }}>
                      Ansehen
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}