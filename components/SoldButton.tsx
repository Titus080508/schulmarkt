'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function SoldButton({ postId }: { postId: string }) {
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSold() {
    if (!confirm) { setConfirm(true); return }
    setLoading(true)
    await supabase
      .from('posts')
      .update({ status: 'sold' })
      .eq('id', postId)
    router.push('/my-posts')
    router.refresh()
  }

  return (
    <button
      onClick={handleSold}
      disabled={loading}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'center',
        background: confirm ? 'var(--state-success)' : 'var(--state-success-bg)',
        border: `1px solid ${confirm ? 'var(--state-success)' : 'var(--state-success-border)'}`,
        color: confirm ? 'var(--text-on-dark)' : 'var(--state-success)',
        fontSize: '13px',
        fontWeight: 500,
        borderRadius: '6px',
        padding: '10px',
        cursor: 'pointer'
      }}>
      {loading ? 'Wird gespeichert...' : confirm ? 'Wirklich als verkauft markieren?' : 'Als verkauft markieren'}
    </button>
  )
}