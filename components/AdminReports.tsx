'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import DeleteButton from '@/components/DeleteButton'

export default function AdminReports({ reports, title, showResolve }: { reports: any[], title: string, showResolve: boolean }) {
  const [list, setList] = useState(reports)
  const [resolving, setResolving] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  async function resolveReport(reportId: string) {
    setResolving(reportId)
    const { error } = await supabase
      .from('reports')
      .update({ resolved: true, resolved_at: new Date().toISOString() })
      .eq('id', reportId)

    if (!error) {
      setList(prev => prev.filter(r => r.id !== reportId))
      router.refresh()
    }
    setResolving(null)
  }

  if (list.length === 0) return null

  return (
    <div style={{ background: '#fff8f8', border: '1px solid #fecaca', borderRadius: '10px', marginBottom: '20px', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: '14px', fontWeight: 500, color: '#b91c1c' }}>{title}</p>
        <span style={{ fontSize: '12px', color: '#b91c1c', background: '#fee2e2', padding: '2px 8px', borderRadius: '3px' }}>{list.length} Meldungen</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {list.map(report => (
          <div key={report.id} style={{ padding: '14px 20px', borderBottom: '1px solid #fee2e2', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', background: '#fee2e2', color: '#b91c1c', padding: '2px 8px', borderRadius: '3px', fontWeight: 500 }}>Meldung</span>
                <span style={{ fontSize: '11px', color: '#aaa' }}>
                  {new Date(report.created_at).toLocaleDateString('de-DE')} um {new Date(report.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p style={{ fontSize: '13px', fontWeight: 500, color: '#1a2040', marginBottom: '3px' }}>
                Post: <Link href={`/post/${report.post_id}`} style={{ color: '#1a3a6e', textDecoration: 'none' }}>{report.post?.title}</Link>
              </p>
              <p style={{ fontSize: '13px', color: '#666', marginBottom: '3px' }}>
                Gemeldet von: <strong>{report.reporter?.display_name || report.reporter?.username}</strong>
                <span style={{ color: '#aaa', fontSize: '11px' }}> (@{report.reporter?.username})</span>
              </p>
              <p style={{ fontSize: '13px', color: '#b91c1c' }}>
                Grund: <strong>{report.reason}</strong>
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0, flexWrap: 'wrap' }}>
              <Link href={`/post/${report.post_id}`}
                style={{ fontSize: '12px', color: '#1a3a6e', textDecoration: 'none', background: '#eef2f8', border: '1px solid #c8d4e8', borderRadius: '4px', padding: '6px 12px' }}>
                Ansehen
              </Link>
              {showResolve && (
                <button
                  onClick={() => resolveReport(report.id)}
                  disabled={resolving === report.id}
                  style={{ fontSize: '12px', color: '#1a6e3a', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer', opacity: resolving === report.id ? 0.6 : 1 }}>
                  {resolving === report.id ? 'Wird gespeichert...' : 'Erledigt'}
                </button>
              )}
              <DeleteButton postId={report.post_id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}