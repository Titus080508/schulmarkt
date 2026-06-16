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
        background: confirm ? '#1a6e3a' : '#f0fdf4',
        border: `1px solid ${confirm ? '#1a6e3a' : '#86efac'}`,
        color: confirm ? '#fff' : '#1a6e3a',
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