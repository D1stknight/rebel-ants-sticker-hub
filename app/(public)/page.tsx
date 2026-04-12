import Link from 'next/link'
import { getPacks } from '@/lib/db'
import PackCard from '@/components/ui/PackCard'

export const revalidate = 60

export default async function HomePage() {
  const [featuredPacks, stickerPacks, gifPacks] = await Promise.all([
    getPacks({ featured: true, limit: 4 }),
    getPacks({ type: 'sticker', limit: 6 }),
    getPacks({ type: 'gif', limit: 6 }),
  ])

  return (
    <div style={{ paddingTop: 48, paddingBottom: 64 }}>
      {/* Hero */}
      <section style={{ textAlign: 'center', marginBottom: 64, padding: '0 16px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)',
          borderRadius: 999, padding: '6px 16px', marginBottom: 20,
        }}>
          <span>🐜</span>
          <span style={{ fontSize: 13, color: 'var(--accent-purple)', fontWeight: 600 }}>
            Official Rebel Ants Media Hub
          </span>
        </div>

        <h1 style={{
          fontSize: 'clamp(32px, 6vw, 56px)',
          fontWeight: 900,
          margin: '0 0 16px',
          lineHeight: 1.1,
          letterSpacing: '-0.03em',
        }}>
          <span className="gradient-text">Stickers & GIFs</span><br />
          for the Colony 🔥
        </h1>

        <p style={{
          fontSize: 'clamp(15px, 2vw, 18px)',
          color: 'var(--text-secondary)',
          maxWidth: 480, margin: '0 auto 32px',
          lineHeight: 1.6,
        }}>
          Download official Rebel Ants sticker packs and GIFs for iMessage, Telegram, Discord, and everywhere else.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/stickers" className="btn-primary" style={{ fontSize: 15 }}>
            🖼️ Browse Stickers
          </Link>
          <Link href="/gifs" className="btn-secondary" style={{ fontSize: 15 }}>
            ✨ Browse GIFs
          </Link>
        </div>
      </section>

      {/* Featured Packs */}
      {featuredPacks.length > 0 && (
        <section style={{ marginBottom: 56 }}>
          <SectionHeader title="⭐ Featured Packs" href="/stickers" />
          <div className="pack-grid">
            {featuredPacks.map(pack => <PackCard key={pack.id} pack={pack} />)}
          </div>
        </section>
      )}

      {/* Sticker Packs */}
      {stickerPacks.length > 0 && (
        <section style={{ marginBottom: 56 }}>
          <SectionHeader title="🖼️ Sticker Packs" href="/stickers" />
          <div className="pack-grid">
            {stickerPacks.map(pack => <PackCard key={pack.id} pack={pack} />)}
          </div>
        </section>
      )}

      {/* GIF Packs */}
      {gifPacks.length > 0 && (
        <section style={{ marginBottom: 56 }}>
          <SectionHeader title="✨ GIF Packs" href="/gifs" />
          <div className="pack-grid">
            {gifPacks.map(pack => <PackCard key={pack.id} pack={pack} />)}
          </div>
        </section>
      )}

      {/* Empty state */}
      {featuredPacks.length === 0 && stickerPacks.length === 0 && gifPacks.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🐜</div>
          <h2 style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Packs coming soon!</h2>
          <p style={{ color: 'var(--text-muted)' }}>The colony is preparing something special.</p>
        </div>
      )}

      {/* CTA */}
      <section style={{
        marginTop: 64,
        background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(59,130,246,0.1))',
        border: '1px solid rgba(139,92,246,0.2)',
        borderRadius: 24,
        padding: '40px 32px',
        textAlign: 'center',
      }}>
        <h2 style={{ margin: '0 0 12px', fontSize: 24, fontWeight: 800 }}>
          🐜 How to use Rebel Ants stickers?
        </h2>
        <p style={{ color: 'var(--text-secondary)', margin: '0 0 24px', maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
          Learn how to add our stickers to iMessage, Telegram, Discord, WhatsApp, and more.
        </p>
        <Link href="/how-to-use" className="btn-primary">
          View Guide →
        </Link>
      </section>
    </div>
  )
}

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: '-0.01em' }}>{title}</h2>
      <Link href={href} className="btn-ghost" style={{ fontSize: 13 }}>
        View all →
      </Link>
    </div>
  )
}
