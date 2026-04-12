'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface Props {
  assetId: string
  fileUrl: string
  thumbnailUrl?: string | null
  assetType: string
  onDeleted?: () => void
}

function getStoragePath(url: string) {
  const match = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)/)
  return match ? match[1] : null
}

export default function DeleteAssetButton({ assetId, fileUrl, thumbnailUrl, assetType, onDeleted }: Props) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Delete this asset permanently? This cannot be undone.')) return
    setLoading(true)
    try {
      const supabase = createClient()
      const bucket = fileUrl.includes('/gifs/') ? 'gifs' : 'stickers'
      const filePath = getStoragePath(fileUrl)
      if (filePath) await supabase.storage.from(bucket).remove([filePath])
      if (thumbnailUrl && thumbnailUrl !== fileUrl) {
        const thumbPath = getStoragePath(thumbnailUrl)
        if (thumbPath) await supabase.storage.from('thumbnails').remove([thumbPath])
      }
      await supabase.from('asset_tags').delete().eq('asset_id', assetId)
      await supabase.from('pack_items').delete().eq('asset_id', assetId)
      const { error } = await supabase.from('assets').delete().eq('id', assetId)
      if (error) throw error
      toast.success('Asset deleted')
      onDeleted?.()
    } catch (err) {
      console.error(err)
      toast.error('Delete failed')
    } finally { setLoading(false) }
  }

  return (
    <button onClick={handleDelete} disabled={loading} className="btn-ghost" style={{ padding: '6px 10px', fontSize: 12, color: '#ef4444' }}>
      {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : '🗑 Delete'}
    </button>
  )
}
