'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useState } from 'react'

export default function RestorePostButton({ postId }: { postId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleRestore() {
    setLoading(true)
    await supabase.from('posts').update({ deleted_at: null }).eq('id', postId)
    router.refresh()
    setLoading(false)
  }

  return (
    <button onClick={handleRestore} disabled={loading} className="btn-modern"
      style={{ fontSize: '12px', color: '#1a6e3a', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer' }}>
      {loading ? 'Wird wiederhergestellt...' : '↺ Wiederherstellen'}
    </button>
  )
}
