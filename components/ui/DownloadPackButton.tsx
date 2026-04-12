'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import type { Pack } from '@/types'
import { trackDownload } from '@/lib/analytics'

export default function DownloadPackButton({ pack }: { pack: Pack }) {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    if (!pack.zip_file_url) return
    setLoading(true)
    try {
      const res = await fetch(pack.zip_file_url)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${pack.slug}.zip`
      a.click()
      URL.revokeObjectURL(url)
      await trackDownload({ packId: pack.id, type: 'pack' })
      toast.success('Pack downloaded!')
    } catch {
      toast.error('Download failed — try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="btn-primary"
      style={{ fontSize: 14 }}
    >
      {loading ? (
        <span className="spinner" style={{ width: 16, height: 16 }} />
      ) : (
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path d="M8 3v9M4 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 14h10" strokeLinecap="round" />
        </svg>
      )}
      {loading ? 'Downloading…' : 'Download Pack (.zip)'}
    </button>
  )
}
