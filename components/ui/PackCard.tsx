import Link from 'next/link'
import Image from 'next/image'
import type { Pack } from '@/types'

interface PackCardProps {
  pack: Pack
}

export default function PackCard({ pack }: PackCardProps) {
  return (
    <Link href={`/packs/${pack.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div className="card-glow" style={{ overflow: 'hidden', cursor: 'pointer' }}>
        {/* Cover image */}
        <div style={{
          position: 'relative',
          aspectRatio: '1',
          background: 'var(--bg-surface)',
          overflow: 'hidden',
        }}>
          {pack.cover_image_url ? (
            <Image
              src={pack.cover_image_url}
              alt={pack.title}
              fill
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 480px) 50vw, (max-width: 768px) 33vw, 25vw"
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 48,
              background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(59,130,246,0.1))',
            }}>
              🐜
            </div>
          )}

          {/* Featured badge */}
          {pack.featured && (
            <div style={{
              position: 'absolute', top: 8, left: 8,
              background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-blue))',
              color: 'white', borderRadius: 8, padding: '3px 8px', fontSize: 10, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              ⭐ Featured
            </div>
          )}

          {/* Type badge */}
          <div style={{
            position: 'absolute', top: 8, right: 8,
          }}>
            <span className={`badge ${pack.type === 'gif' ? 'badge-pink' : 'badge-purple'}`}>
              {pack.type === 'gif' ? '✨ GIF' : '🖼️ Sticker'}
            </span>
          </div>
        </div>

        {/* Info */}
        <div style={{ padding: '12px 14px' }}>
          <h3 style={{
            margin: 0, fontSize: 14, fontWeight: 700,
            color: 'var(--text-primary)', lineHeight: 1.3,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {pack.title}
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
            {pack.item_count !== undefined && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {pack.item_count} items
              </span>
            )}
            {pack.category && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {pack.category.name}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
