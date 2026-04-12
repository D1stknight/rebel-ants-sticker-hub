import { notFound } from 'next/navigation'
import Image from 'next/image'
import { getPackBySlug } from '@/lib/db'
import AssetCard from '@/components/ui/AssetCard'
import DownloadPackButton from '@/components/ui/DownloadPackButton'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const pack = await getPackBySlug(slug)
  if (!pack) return { title: 'Pack Not Found' }
  return {
    title: pack.title,
    description: pack.description ?? `Download the ${pack.title} pack from Rebel Ants.`,
    openGraph: { images: pack.cover_image_url ? [pack.cover_image_url] : [] },
  }
}

export default async function PackPage({ params }: Props) {
  const { slug } = await params
  const pack = await getPackBySlug(slug)
  if (!pack) notFound()

  const assets = pack.items?.map((item) => item.asset).filter(Boolean) ?? []

  // Pass the full pack with items to the download button
  const packWithItems = { ...pack, items: pack.items ?? [] }

  return (
    <div style={{ paddingTop: 32, paddingBottom: 64 }}>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start', marginBottom: 40 }}>
        <div style={{ width: 140, height: 140, flexShrink: 0, borderRadius: 20, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-surface)', position: 'relative' }}>
          {pack.cover_image_url ? (
            <Image src={pack.cover_image_url} alt={pack.title} fill style={{ objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52 }}>🐜</div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            <span className={`badge ${pack.type === 'gif' ? 'badge-pink' : 'badge-purple'}`}>
              {pack.type === 'gif' ? '✨ GIF Pack' : '🖼️ Sticker Pack'}
            </span>
            {pack.featured && <span className="badge badge-blue">⭐ Featured</span>}
            {pack.category && <span className="badge badge-green">{pack.category.name}</span>}
          </div>

          <h1 style={{ margin: '0 0 10px', fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 900, letterSpacing: '-0.02em' }}>
            {pack.title}
          </h1>

          {pack.description && (
            <p style={{ margin: '0 0 16px', color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: 15 }}>
              {pack.description}
            </p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              {assets.length} item{assets.length !== 1 ? 's' : ''}
            </span>
            <DownloadPackButton pack={packWithItems as any} />
          </div>
        </div>
      </div>

      {assets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
          <p>This pack has no items yet.</p>
        </div>
      ) : (
        <>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px' }}>All Items</h2>
          <div className="asset-grid">
            {assets.map((asset: unknown) => {
              const a = asset as Parameters<typeof AssetCard>[0]['asset']
              return <AssetCard key={a.id} asset={a} />
            })}
          </div>
        </>
      )}
    </div>
  )
}
