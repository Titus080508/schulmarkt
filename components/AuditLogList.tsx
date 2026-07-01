'use client'
import { useMemo, useState } from 'react'

const actionLabel: Record<string, string> = {
  display_name_changed: 'Anzeigename geändert',
  role_changed: 'Rolle geändert',
  user_suspended: 'Nutzer gesperrt',
  user_unsuspended: 'Nutzer entsperrt',
  post_deleted: 'Inserat endgültig gelöscht',
  post_soft_deleted: 'Inserat gelöscht (48h wiederherstellbar)',
  post_restored: 'Inserat wiederhergestellt',
  report_resolved: 'Meldung erledigt',
  user_report_resolved: 'Nutzer-Meldung erledigt'
}
const actionColor: Record<string, string> = {
  display_name_changed: 'var(--color-primary)',
  role_changed: 'var(--color-secondary)',
  user_suspended: 'var(--state-danger)',
  user_unsuspended: 'var(--state-success)',
  post_deleted: 'var(--text-muted)',
  post_soft_deleted: 'var(--state-danger)',
  post_restored: 'var(--state-success)',
  report_resolved: 'var(--state-success)',
  user_report_resolved: 'var(--state-success)'
}

const inputStyle = { background: 'var(--bg-page)', border: '1px solid var(--border-input)', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' as const }

export default function AuditLogList({ entries }: { entries: any[] }) {
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const availableActions = useMemo(() => {
    const set = new Set(entries.map(e => e.action))
    return Array.from(set)
  }, [entries])

  const filtered = entries.filter(entry => {
    if (actionFilter !== 'all' && entry.action !== actionFilter) return false

    const created = new Date(entry.created_at)
    if (dateFrom && created < new Date(dateFrom)) return false
    if (dateTo && created > new Date(dateTo + 'T23:59:59')) return false

    if (search) {
      const haystack = [
        entry.actor?.display_name, entry.actor?.username,
        actionLabel[entry.action] || entry.action,
        entry.details ? JSON.stringify(entry.details) : ''
      ].join(' ').toLowerCase()
      if (!haystack.includes(search.toLowerCase())) return false
    }

    return true
  })

  function resetFilters() {
    setSearch(''); setActionFilter('all'); setDateFrom(''); setDateTo('')
  }

  const hasActiveFilters = search || actionFilter !== 'all' || dateFrom || dateTo

  return (
    <>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Suche nach Person, Aktion, Details..."
          style={{ ...inputStyle, flex: 1, minWidth: '200px' }} />
        <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}
          style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="all">Alle Aktionen</option>
          {availableActions.map(a => (
            <option key={a} value={a}>{actionLabel[a] || a}</option>
          ))}
        </select>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          style={{ ...inputStyle, cursor: 'pointer' }} />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          style={{ ...inputStyle, cursor: 'pointer' }} />
        {hasActiveFilters && (
          <button onClick={resetFilters} className="btn-modern"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-input)', color: 'var(--text-secondary)', fontSize: '13px', borderRadius: '6px', padding: '8px 14px', cursor: 'pointer' }}>
            Zurücksetzen
          </button>
        )}
      </div>

      <p style={{ fontSize: '12px', color: 'var(--text-faint)', marginBottom: '12px' }}>
        {filtered.length} von {entries.length} Einträgen
      </p>

      {filtered.length === 0 && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '40px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-faint)', fontSize: '14px' }}>Keine Einträge gefunden.</p>
        </div>
      )}

      {filtered.length > 0 && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ maxHeight: '65vh', overflowY: 'auto' }}>
            {filtered.map(entry => (
              <div key={entry.id} className="row-modern" style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-on-dark)', background: actionColor[entry.action] || 'var(--text-muted)', padding: '2px 8px', borderRadius: '3px' }}>
                    {actionLabel[entry.action] || entry.action}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                    {new Date(entry.created_at).toLocaleDateString('de-DE')} um {new Date(entry.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-primary)', margin: 0 }}>
                  Ausgeführt von: <strong>{entry.actor?.display_name || entry.actor?.username || 'System'}</strong>
                </p>
                {entry.details && (
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                    {Object.entries(entry.details).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
