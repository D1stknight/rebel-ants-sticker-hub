import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'About — Rebel Ants Hub' }

export default function AboutPage() {
  return (
    <div style={{ paddingTop: 48, paddingBottom: 64, maxWidth: 680, margin: '0 auto' }}>
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 64, marginBottom: 16, textAlign: 'center' }}>🐜</div>
        <h1 style={{ fontSize: 32, fontWeight: 900, textAlign: 'center', margin: '0 0 16px', letterSpacing: '-0.02em' }}>
          About <span className="gradient-text">Rebel Ants</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: 16, lineHeight: 1.7 }}>
          The official media hub for Rebel Ants stickers, GIFs, and digital collectibles.
        </p>
      </div>

      {[
        {
          icon: '🎨',
          title: 'What is Rebel Ants Hub?',
          body: 'Rebel Ants Hub is the official download platform for all Rebel Ants sticker packs and GIFs. Browse, preview, and download content for use across your favorite apps.',
        },
        {
          icon: '📱',
          title: 'Where can I use them?',
          body: 'Our stickers and GIFs work everywhere — iMessage, Telegram, Discord, WhatsApp, Twitter, Instagram, and more. Download once, use anywhere.',
        },
        {
          icon: '💡',
          title: 'Free to use',
          body: 'All sticker packs and GIFs are free to download for personal use by Rebel Ants community members.',
        },
        {
          icon: '🚀',
          title: 'More coming soon',
          body: 'New packs drop regularly. Follow the Rebel Ants community to get notified when new content is available.',
        },
      ].map(item => (
        <div key={item.title} className="card-glow" style={{ padding: 24, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 28, lineHeight: 1 }}>{item.icon}</span>
            <div>
              <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 700 }}>{item.title}</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.body}</p>
            </div>
          </div>
        </div>
      ))}

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 40, flexWrap: 'wrap' }}>
        <Link href="/stickers" className="btn-primary">Browse Stickers</Link>
        <Link href="/how-to-use" className="btn-secondary">How to Use</Link>
      </div>
    </div>
  )
}
