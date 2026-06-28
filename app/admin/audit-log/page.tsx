import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import Footer from '@/components/Footer'
import AuditLogList from '@/components/AuditLogList'

export default async function AuditLogPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()
  if (profile?.role !== 'owner') redirect('/admin')

  const { data: entries } = await supabase
    .from('audit_log')
    .select('*, actor:profiles!actor_id(username, display_name)')
    .order('created_at', { ascending: false })
    .limit(300)

  return (
    <>
      <Navbar username={profile?.display_name || profile?.username} />
      <main style={{ background: 'var(--bg-page)', minHeight: '100vh', padding: '24px 20px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <Link href="/admin" className="link-modern" style={{ fontSize: '13px', color: '#1a3a6e', textDecoration: 'none' }}>← Admin</Link>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 500, color: '#1a3a6e' }}>Audit-Log</h1>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>{entries?.length || 0} Einträge geladen (letzte 300)</p>
            </div>
          </div>

          {(!entries || entries.length === 0) ? (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '40px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-faint)', fontSize: '14px' }}>Noch keine Einträge.</p>
            </div>
          ) : (
            <AuditLogList entries={entries} />
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
