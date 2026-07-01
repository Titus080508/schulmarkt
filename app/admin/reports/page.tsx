import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import AdminReports from '@/components/AdminReports'
import AdminUserReports from '@/components/AdminUserReports'
import AdminMessageReports from '@/components/AdminMessageReports'
import Footer from '@/components/Footer'

export default async function AdminReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/dashboard')
  const isOwner = profile.role === 'owner'

  const { data: openReports } = await supabase
    .from('reports')
    .select('*, reporter:profiles!reporter_id(username, display_name), post:posts(id, title, profiles(id, username, display_name))')
    .eq('resolved', false)
    .order('created_at', { ascending: false })

  const { data: resolvedReports } = await supabase
    .from('reports')
    .select('*, reporter:profiles!reporter_id(username, display_name), post:posts(id, title)')
    .eq('resolved', true)
    .order('resolved_at', { ascending: false })

  const { data: openUserReports } = await supabase
    .from('user_reports')
    .select('*, reporter:profiles!reporter_id(username, display_name), reported:profiles!reported_id(username, display_name)')
    .eq('resolved', false)
    .order('created_at', { ascending: false })

  const { data: resolvedUserReports } = await supabase
    .from('user_reports')
    .select('*, reporter:profiles!reporter_id(username, display_name), reported:profiles!reported_id(username, display_name)')
    .eq('resolved', true)
    .order('resolved_at', { ascending: false })

  const { data: openMessageReports } = await supabase
    .from('message_reports')
    .select('*, reporter:profiles!reporter_id(username, display_name), reported:profiles!reported_id(username, display_name), message:messages(content)')
    .eq('resolved', false)
    .order('created_at', { ascending: false })

  const { data: resolvedMessageReports } = await supabase
    .from('message_reports')
    .select('*, reporter:profiles!reporter_id(username, display_name), reported:profiles!reported_id(username, display_name), message:messages(content)')
    .eq('resolved', true)
    .order('resolved_at', { ascending: false })

  const totalOpen = (openReports?.length || 0) + (openUserReports?.length || 0) + (openMessageReports?.length || 0)

  const resolvedHistory = [
    ...(resolvedReports || []).map(r => ({ ...r, kind: 'post' as const })),
    ...(resolvedUserReports || []).map(r => ({ ...r, kind: 'user' as const })),
    ...(resolvedMessageReports || []).map(r => ({ ...r, kind: 'message' as const })),
  ].sort((a, b) => new Date(b.resolved_at).getTime() - new Date(a.resolved_at).getTime())

  return (
    <>
      <Navbar username={profile?.display_name || profile?.username} />
      <main style={{ background: 'var(--bg-page)', minHeight: '100vh', padding: '24px 20px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <Link href="/admin" style={{ fontSize: '13px', color: 'var(--color-primary)', textDecoration: 'none' }}>← Admin</Link>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 500, color: 'var(--color-primary)' }}>Alle Meldungen</h1>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {totalOpen} offen · {resolvedHistory.length} erledigt
              </p>
            </div>
          </div>

          {openUserReports && openUserReports.length > 0 && (
            <AdminUserReports reports={openUserReports} isOwner={isOwner} currentUserId={user.id} />
          )}

          {openMessageReports && openMessageReports.length > 0 && (
            <AdminMessageReports reports={openMessageReports} isOwner={isOwner} currentUserId={user.id} />
          )}

          {openReports && openReports.length > 0 && (
            <AdminReports reports={openReports} title="Offene Meldungen" showResolve={true} isOwner={isOwner} currentUserId={user.id} />
          )}

          {totalOpen === 0 && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '40px', textAlign: 'center', marginBottom: '20px' }}>
              <p style={{ color: 'var(--text-faint)', fontSize: '14px' }}>Keine offenen Meldungen.</p>
            </div>
          )}

          {resolvedHistory.length > 0 && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-muted)' }}>Erledigte Meldungen</p>
                <span style={{ fontSize: '12px', color: 'var(--text-faint)', background: 'var(--bg-page)', padding: '2px 8px', borderRadius: '3px' }}>{resolvedHistory.length} gesamt</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '480px', overflowY: 'auto' }}>
                {resolvedHistory.map(report => (
                  <div key={`${report.kind}-${report.id}`} style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', opacity: 0.7 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', background: report.status === 'rejected' ? 'var(--state-danger-bg)' : 'var(--state-success-bg)', color: report.status === 'rejected' ? 'var(--state-danger)' : 'var(--state-success)', padding: '2px 8px', borderRadius: '3px', fontWeight: 500 }}>
                          {report.status === 'rejected' ? 'Abgelehnt' : 'Erledigt'}
                        </span>
                        <span style={{ fontSize: '11px', background: 'var(--bg-page)', color: 'var(--text-muted)', padding: '2px 8px', borderRadius: '3px' }}>
                          {report.kind === 'post' ? 'Beitrag' : report.kind === 'user' ? 'Nutzer' : 'Nachricht'}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                          {new Date(report.created_at).toLocaleDateString('de-DE')}
                        </span>
                      </div>
                      {report.kind === 'post' && (
                        <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '3px' }}>
                          Post: <Link href={`/post/${report.post_id}`} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>{report.post?.title}</Link>
                        </p>
                      )}
                      {(report.kind === 'user' || report.kind === 'message') && (
                        <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '3px' }}>
                          Gemeldet: <strong>{report.reported?.display_name || report.reported?.username}</strong>
                          <span style={{ color: 'var(--text-faint)', fontSize: '11px' }}> (@{report.reported?.username})</span>
                        </p>
                      )}
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '3px' }}>
                        Gemeldet von: <strong>{report.reporter?.display_name || report.reporter?.username}</strong>
                        <span style={{ color: 'var(--text-faint)', fontSize: '11px' }}> (@{report.reporter?.username})</span>
                      </p>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        Grund: {report.reason}
                      </p>
                      {report.kind === 'message' && report.message?.content && (
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic', background: 'var(--bg-page)', padding: '6px 10px', borderRadius: '4px' }}>
                          „{report.message.content}"
                        </p>
                      )}
                      {report.admin_note && (
                        <p style={{ fontSize: '12px', color: 'var(--text-faint)', marginTop: '4px', fontStyle: 'italic' }}>
                          Admin-Notiz: {report.admin_note}
                        </p>
                      )}
                    </div>
                    {report.kind === 'post' && (
                      <Link href={`/post/${report.post_id}`}
                        style={{ fontSize: '12px', color: 'var(--color-primary)', textDecoration: 'none', background: 'var(--border-light)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '6px 12px', flexShrink: 0 }}>
                        Ansehen
                      </Link>
                    )}
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
