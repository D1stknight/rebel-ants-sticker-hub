'use client'

import Image from 'next/image'
import { useState } from 'react'
import type { Asset } from '@/types'
import AssetModal from './AssetModal'

interface AssetCardProps {
  asset: Asset
}

export default function AssetCard({ asset }: AssetCardProps) {
  const [modalOpen, setModalOpen] = useState(false)

  const isGif = asset.type === 'gif'

  return (
    <>
      <div
        className="card-glow"
        style={{ overflow: 'hidden', cursor: 'pointer' }}
        onClick={() => setModalOpen(true)}
      >
        <div style={{
          position: 'relative',
          aspectRatio: '1',
          background: 'var(--bg-surface)',
          overflow: 'hidden',
        }}>
          {asset.thumbnail_url || asset.file_url ? (
            <Image
              src={asset.thumbnail_url || asset.file_url}
              alt={asset.title}
              fill
              unoptimized={isGif}
              style={{ objectFit: 'contain', padding: 8 }}
              sizes="(max-width: 480px) 50vw, (max-width: 768px) 33vw, 20vw"
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32,
            }}>
              {isGif ? '✨' : '🖼️'}
            </div>
          )}

          {/* GIF indicator */}
          {isGif && (
            <div style={{
              position: 'absolute', bottom: 6, right: 6,
              background: 'rgba(0,0,0,0.7)', borderRadius: 6,
              padding: '2px 6px', fontSize: 10, fontWeight: 700,
              color: 'var(--accent-pink)', letterSpacing: '0.05em',
            }}>
              GIF
            </div>
          )}
        </div>

        <div style={{ padding: '8px 10px' }}>
          <p style={{
            margin: 0, fontSize: 12, fontWeight: 500,
            color: 'var(--text-secondary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {asset.title}
          </p>
        </div>
      </div>

      {modalOpen && (
        <AssetModal asset={asset} onClose={() => setModalOpen(false)} />
      )}
    </>
  )
}
