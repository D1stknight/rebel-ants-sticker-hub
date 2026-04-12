'use client'

import Image from 'next/image'
import { useState } from 'react'
import toast from 'react-hot-toast'
import type { Asset } from '@/types'
import { trackDownload } from '@/lib/analytics'

interface AssetModalProps {
  asset: Asset
  onClose: () => void
}

export default function AssetModal({ asset, onClose }: AssetModalProps) {
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const res = await fetch(asset.file_url)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const ext = asset.type === 'gif' ? 'gif' : 'png'
      a.download = `${asset.slug}.${ext}`
      a.click()
      URL.revokeObjectURL(url)
      await trackDownload({ assetId: asset.id, type: 'asset' })
      toast.success('Downloaded!')
    } catch {
      toast.error('Download failed')
    } finally {
      setDownloading(false)
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(asset.file_url)
      toast.success('Link copied!')
    } catch {
      toast.error('Could not copy link')
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid var(--border)',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{asset.title}</h2>
            {asset.category && (
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>{asset.category.name}</p>
            )}
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: 8 }}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M18 6L6 18" strokeLinecap="round"/>
              <path d="M6 6l12 12" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Preview */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--bg-surface)', padding: 24, minHeight: 240,
          position: 'relative',
        }}>
          {/* Checkerboard for transparency */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'linear-gradient(45deg, #1a1a2e 25%, transparent 25%), linear-gradient(-45deg, #1a1a2e 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1a1a2e 75%), linear-gradient(-45deg, transparent 75%, #1a1a2e 75%)',
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
            opacity: 0.3,
          }} />
          <Image
            src={asset.preview_url || asset.file_url}
            alt={asset.title}
            width={240}
            height={240}
            unoptimized={asset.type === 'gif'}
            style={{ objectFit: 'contain', maxHeight: 240, position: 'relative', zIndex: 1 }}
          />
        </div>

        {/* Tags */}
        {asset.tags && asset.tags.length > 0 && (
          <div style={{ padding: '12px 20px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {asset.tags.map(t => (
              <span key={t.id} style={{
                background: 'var(--bg-surface)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '3px 10px', fontSize: 12, color: 'var(--text-muted)',
              }}>
                #{t.tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div style={{ padding: '12px 20px 20px', display: 'flex', gap: 10 }}>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="btn-primary"
            style={{ flex: 1, justifyContent: 'center' }}
          >
            {downloading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : (
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M8 3v9M4 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 14h10" strokeLinecap="round"/>
              </svg>
            )}
            {downloading ? 'Downloading…' : 'Download'}
          </button>

          <button onClick={handleCopyLink} className="btn-secondary" style={{ minWidth: 44, padding: '12px 14px' }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M10 13H13a3 3 0 000-6H10M6 3H3a3 3 0 000 6h3M6 10h6" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
