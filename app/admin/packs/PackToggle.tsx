'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function PackToggle({ packId, isPublished }: { packId: string; isPublished: boolean }) {
  const [published, setPublished] = useState(isPublished)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const toggle = async () => {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('packs').update({ is_published: !published }).eq('id', packId)
    if (error) {
      toast.error('Failed to update')
    } else {
      setPublished(!published)
      router.refresh()
      toast.success(published ? 'Pack unpublished' : 'Pack published!')
    }
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      style={{
        padding: '4px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
        background: published ? 'rgba(34,197,94,0.12)' : 'rgba(100,116,139,0.12)',
        color: published ? '#22c55e' : 'var(--text-muted)',
        transition: 'all 0.15s', minWidth: 72, minHeight: 32,
      }}
    >
      {loading ? '…' : published ? '● Live' : '○ Draft'}
    </button>
  )
}
