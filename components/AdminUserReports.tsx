'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function AdminUserReports({ reports }: { reports: any[] }) {
  const [list, setList] = useState(reports)
  const [resolving, setResolving] = useState<string | null>(null)
  const [bulkBusy, setBulkBusy] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const supabase = createClient()
  const router = useRouter()

  async function resolveReport(reportId: string) {
    setResolving(reportId)
    const { error } = await supabase
      .from('user_reports')
      .update({ resolved: true, resolved_at: new Date().toISOString() })
      .eq('id', reportId)

    if (!error) {
      setList(prev => prev.filter(r => r.id !== reportId))
      router.refresh()
    }
    setResolving(null)
  }

  function toggleOne(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function bulkResolve() {
    if (selected.size === 0) return
    setBulkBusy(true)
    const ids = Array.from(selected)
    await supabase.from('user_reports').update({ resolved: true, resolved_at: new Date().toISOString() }).in('id', ids)
    setList(prev => prev.filter(r => !selected.has(r.id)))
    setSelected(new Set())
    setBulkBusy(false)
    router.refresh()
  }

  if (list.length === 0) return null

  return (
    <div style={{ background: '#fff8f8', border: '1px solid #fecaca', borderRadius: '10px', marginBottom: '20px', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <p style={{ fontSize: '14px', fontWeight: 500, color: '#b91c1c', margin: 0 }}>Gemeldete Nutzer</p>
        {selected.size > 0 ? (
          <div className="fade-in-up" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', color: '#b91c1c' }}>{selected.size} ausgewählt</span>
            <button onClick={bulkResolve} disabled={bulkBusy} className="btn-modern"
              style={{ fontSize: '12px', fontWeight: 600, color: '#1a6e3a', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer' }}>
              {bulkBusy ? 'Wird gespeichert...' : 'Als erledigt markieren'}
            </button>
            <button onClick={() => setSelected(new Set())}
              style={{ fontSize: '12px', color: '#b91c1c', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}>
              Abbrechen
            </button>
          </div>
        ) : (
          <span style={{ fontSize: '12px', color: '#b91c1c', background: '#fee2e2', padding: '2px 8px', borderRadius: '3px' }}>{list.length} Meldungen</span>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '480px', overflowY: 'auto' }}>
        {list.map(report => (
          <div key={report.id} style={{ padding: '14px 20px', borderBottom: '1px solid #fee2e2', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', background: selected.has(report.id) ? '#fef2f2' : 'transparent' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1, minWidth: '200px' }}>
              <input type="checkbox" checked={selected.has(report.id)} onChange={() => toggleOne(report.id)}
                style={{ width: '15px', height: '15px', marginTop: '3px', cursor: 'pointer', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', background: '#fee2e2', color: '#b91c1c', padding: '2px 8px', borderRadius: '3px', fontWeight: 500 }}>Nutzer-Meldung</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                    {new Date(report.created_at).toLocaleDateString('de-DE')} um {new Date(report.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '3px' }}>
                  Gemeldet: <strong>{report.reported?.display_name || report.reported?.username}</strong>
                  <span style={{ color: 'var(--text-faint)', fontSize: '11px' }}> (@{report.reported?.username})</span>
                </p>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '3px' }}>
                  Von: <strong>{report.reporter?.display_name || report.reporter?.username}</strong>
                  <span style={{ color: 'var(--text-faint)', fontSize: '11px' }}> (@{report.reporter?.username})</span>
                </p>
                <p style={{ fontSize: '13px', color: '#b91c1c' }}>
                  Grund: <strong>{report.reason}</strong>
                </p>
              </div>
            </div>
            <button
              onClick={() => resolveReport(report.id)}
              disabled={resolving === report.id}
              style={{ fontSize: '12px', color: '#1a6e3a', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer', opacity: resolving === report.id ? 0.6 : 1, flexShrink: 0 }}>
              {resolving === report.id ? 'Wird gespeichert...' : 'Erledigt'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
