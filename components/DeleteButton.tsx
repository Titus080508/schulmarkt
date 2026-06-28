'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useState } from 'react'

export default function DeleteButton({ postId }: { postId: string }) {
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleDelete() {
    if (!confirm) { setConfirm(true); return }
    setLoading(true)
    setError('')
    const { error: updateError } = await supabase.from('posts').update({ deleted_at: new Date().toISOString() }).eq('id', postId)
    setLoading(false)
    if (updateError) { setError(updateError.message); return }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div style={{ flex: 1 }}>
      <button
        onClick={handleDelete}
        disabled={loading}
        style={{
          width: '100%',
          background: confirm ? '#b91c1c' : '#fef2f2',
          border: `1px solid ${confirm ? '#b91c1c' : '#fecaca'}`,
          color: confirm ? '#fff' : '#b91c1c',
          fontSize: '13px',
          fontWeight: 500,
          borderRadius: '10px',
          padding: '10px',
          cursor: 'pointer'
        }}
      >
        {loading ? 'Wird gelöscht...' : confirm ? 'Wirklich löschen? (48h wiederherstellbar)' : '🗑️ Löschen'}
      </button>
      {error && (
        <p style={{ fontSize: '11px', color: '#b91c1c', marginTop: '4px' }}>{error}</p>
      )}
    </div>
  )
}