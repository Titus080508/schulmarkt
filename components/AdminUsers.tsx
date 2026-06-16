'use client'
import { useState } from 'react'

export default function AdminUsers({ users }: { users: any[] }) {
  const [search, setSearch] = useState('')

  const filtered = users.filter(u =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.display_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ background: '#fff', border: '1px solid #e0dcd4', borderRadius: '10px', overflow: 'hidden', marginBottom: '20px' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #e0dcd4', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <p style={{ fontSize: '14px', fontWeight: 500, color: '#1a3a6e' }}>Alle Nutzer</p>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Nutzer suchen..."
          style={{ background: '#f7f5f0', border: '1px solid #ddd', borderRadius: '6px', padding: '7px 12px', fontSize: '13px', color: '#1a2040', outline: 'none', width: '220px' }}
        />
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f7f5f0' }}>
            {['Anzeigename', 'Benutzername', 'Registriert am', 'Admin', 'Inserate'].map(h => (
              <th key={h} style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 500, color: '#888', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 && (
            <tr>
              <td colSpan={5} style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: '#aaa' }}>Kein Nutzer gefunden</td>
            </tr>
          )}
          {filtered.map(u => (
            <tr key={u.id} style={{ borderTop: '1px solid #f0ece4' }}>
              <td style={{ padding: '12px 16px', fontSize: '13px', color: '#1a2040', fontWeight: 500 }}>
                {u.display_name || <span style={{ color: '#aaa', fontStyle: 'italic' }}>Nicht gesetzt</span>}
                {u.is_admin && <span style={{ marginLeft: '6px', fontSize: '10px', background: '#1a3a6e', color: '#fff', padding: '2px 6px', borderRadius: '3px' }}>Admin</span>}
              </td>
              <td style={{ padding: '12px 16px', fontSize: '12px', color: '#666' }}>@{u.username}</td>
              <td style={{ padding: '12px 16px', fontSize: '12px', color: '#888' }}>
                {new Date(u.created_at).toLocaleDateString('de-DE')}
              </td>
              <td style={{ padding: '12px 16px', fontSize: '12px', color: u.is_admin ? '#1a6e3a' : '#aaa' }}>
                {u.is_admin ? 'Ja' : 'Nein'}
              </td>
              <td style={{ padding: '12px 16px', fontSize: '12px', color: '#666' }}>
                {u.post_count || 0}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
