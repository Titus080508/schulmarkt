'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useState } from 'react'

export default function DeleteButton({ postId }: { postId: string }) {
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleDelete() {
    if (!confirm) { setConfirm(true); return }
    setLoading(true)
    await supabase.from('posts').delete().eq('id', postId)
    router.push('/dashboard')
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      style={{
        flex: 1,
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
      {loading ? 'Wird gelöscht...' : confirm ? 'Wirklich löschen?' : '🗑️ Löschen'}
    </button>
  )
}