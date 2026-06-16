'use client'
import { useState } from 'react'

export default function ReportButton({ postId }: { postId: string }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleReport() {
    if (!reason) return
    setLoading(true)
    await fetch(`/report/${postId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    })
    setLoading(false)
    setDone(true)
    setOpen(false)
  }

  if (done) return (
    <p style={{ fontSize: '12px', color: '#888', textAlign: 'center', marginTop: '8px' }}>
      Meldung wurde übermittelt.
    </p>
  )

  return (
    <div style={{ marginTop: '8px' }}>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{ width: '100%', background: 'none', border: '1px solid #ddd', color: '#aaa', fontSize: '12px', borderRadius: '6px', padding: '8px', cursor: 'pointer' }}
        >
          Post melden
        </button>
      )}
      {open && (
        <div style={{ background: '#fff8f8', border: '1px solid #fecaca', borderRadius: '8px', padding: '14px' }}>
          <p style={{ fontSize: '13px', fontWeight: 500, color: '#b91c1c', marginBottom: '10px' }}>Post melden</p>
          <select
            value={reason}
            onChange={e => setReason(e.target.value)}
            style={{ width: '100%', background: '#fff', border: '1px solid #ddd', borderRadius: '6px', padding: '9px 12px', fontSize: '13px', color: '#444', outline: 'none', marginBottom: '10px', boxSizing: 'border-box' }}
          >
            <option value="">Grund auswählen...</option>
            <option>Unangemessener Inhalt</option>
            <option>Falsche Kategorie</option>
            <option>Betrug / Täuschung</option>
            <option>Bereits verkauft</option>
            <option>Sonstiges</option>
          </select>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setOpen(false)}
              style={{ flex: 1, background: '#f7f5f0', border: '1px solid #ddd', color: '#666', fontSize: '13px', borderRadius: '6px', padding: '8px', cursor: 'pointer' }}
            >
              Abbrechen
            </button>
            <button
              onClick={handleReport}
              disabled={loading || !reason}
              style={{ flex: 1, background: '#b91c1c', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 500, borderRadius: '6px', padding: '8px', cursor: 'pointer' }}
            >
              {loading ? 'Wird gesendet...' : 'Melden'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}