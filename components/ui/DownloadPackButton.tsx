'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import type { Pack } from '@/types'
import { trackDownload } from '@/lib/analytics'
import { showBadgeToasts } from '@/components/rebel/badgeToast'

interface Props { pack: Pack }

export default function DownloadPackButton({ pack }: Props) {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')

  const handleDownload = async () => {
    setLoading(true)
    try {
      if (pack.zip_file_url) {
        setProgress('Downloading...')
        const res = await fetch(pack.zip_file_url)
        const blob = await res.blob()
        triggerDownload(blob, `${pack.slug}.zip`)
        const badges = await trackDownload({ packId: pack.id, type: 'pack' })
        toast.success('Pack downloaded!')
        showBadgeToasts(badges)
        return
      }

      const items = (pack as any).items
      if (!items || items.length === 0) {
        toast.error('No items in this pack yet')
        return
      }

      setProgress('Preparing pack...')
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()
      const folder = zip.folder(pack.slug) ?? zip

      setProgress(`Downloading ${items.length} files...`)
      await Promise.all(items.map(async (item: any) => {
        const asset = item.asset ?? item
        if (!asset?.file_url) return
        try {
          const res = await fetch(asset.file_url)
          const blob = await res.blob()
          const ext = asset.type === 'gif' ? 'gif' : 'png'
          const filename = `${asset.slug ?? asset.title.toLowerCase().replace(/\s+/g, '-')}.${ext}`
          folder.file(filename, blob)
        } catch {}
      }))

      setProgress('Zipping...')
      const zipBlob = await zip.generateAsync(
        { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } },
        (meta) => setProgress(`Zipping... ${Math.round(meta.percent)}%`)
      )

      triggerDownload(zipBlob, `${pack.slug}.zip`)
      const badges = await trackDownload({ packId: pack.id, type: 'pack' })
      toast.success('Pack downloaded!')
      showBadgeToasts(badges)
    } catch (err) {
      console.error(err)
      toast.error('Download failed — try again')
    } finally {
      setLoading(false)
      setProgress('')
    }
  }

  return (
    <button onClick={handleDownload} disabled={loading} className="btn-primary"
      style={{ fontSize: 14, minWidth: 180, justifyContent: 'center' }}>
      {loading ? (
        <><span className="spinner" style={{ width: 16, height: 16 }} />{progress || 'Preparing...'}</>
      ) : (
        <><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path d="M8 3v9M4 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 14h10" strokeLinecap="round" />
        </svg>Download Full Pack (.zip)</>
      )}
    </button>
  )
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
