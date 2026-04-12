import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'How to Use Stickers — Rebel Ants Hub' }

const platforms = [
  {
    name: 'iMessage',
    emoji: '💬',
    steps: [
      'Download the sticker pack (.zip) from this site',
      'Unzip the folder on your iPhone or Mac',
      'Open the Stickers app on iPhone (or Messages on Mac)',
      'Tap the + button and import your stickers',
      'Use them in any iMessage conversation',
    ],
  },
  {
    name: 'Telegram',
    emoji: '✈️',
    steps: [
      'Download individual PNG stickers or the full pack',
      'Open Telegram and go to any chat',
      'Tap the sticker icon in the text bar',
      'Tap "Add Stickers" and upload your files',
      'Your sticker pack is now saved in Telegram',
    ],
  },
  {
    name: 'Discord',
    emoji: '🎮',
    steps: [
      'Download the GIF or PNG file',
      'Open Discord and go to Server Settings',
      'Navigate to Emoji or Stickers section',
      'Upload your Rebel Ants GIF/sticker',
      'Use it in any channel with the picker',
    ],
  },
  {
    name: 'WhatsApp',
    emoji: '📱',
    steps: [
      'Download the sticker PNG files',
      'Use a sticker maker app like "Sticker Maker"',
      'Import the Rebel Ants PNGs into the app',
      'Create a sticker pack and send to WhatsApp',
      'Your pack appears in the WhatsApp sticker tray',
    ],
  },
]

export default function HowToUsePage() {
  return (
    <div style={{ paddingTop: 48, paddingBottom: 64, maxWidth: 720, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, margin: '0 0 12px', letterSpacing: '-0.02em' }}>
          🐜 How to Use Stickers
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 16, margin: 0 }}>
          Step-by-step guides for adding Rebel Ants stickers to your favorite apps.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {platforms.map(platform => (
          <div key={platform.name} className="card-glow" style={{ padding: 24 }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span>{platform.emoji}</span>
              <span>{platform.name}</span>
            </h2>
            <ol style={{ margin: 0, padding: '0 0 0 20px' }}>
              {platform.steps.map((step, i) => (
                <li key={i} style={{
                  color: 'var(--text-secondary)', marginBottom: i < platform.steps.length - 1 ? 12 : 0,
                  lineHeight: 1.6, paddingLeft: 8,
                }}>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>

      {/* GIF guide */}
      <div className="card-glow" style={{
        padding: 24, marginTop: 20,
        background: 'linear-gradient(135deg, rgba(236,72,153,0.05), rgba(139,92,246,0.05))',
        borderColor: 'rgba(236,72,153,0.2)',
      }}>
        <h2 style={{ margin: '0 0 12px', fontSize: 20, fontWeight: 800 }}>✨ Using GIFs</h2>
        <p style={{ margin: '0 0 12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          GIFs work everywhere that supports animated images. Download the .gif file and upload directly to Discord, Twitter, Telegram, or any messaging platform.
        </p>
        <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          You can also use the <strong style={{ color: 'var(--text-primary)' }}>Copy Link</strong> button on any GIF to share it directly from our server.
        </p>
      </div>

      <div style={{ textAlign: 'center', marginTop: 40 }}>
        <Link href="/stickers" className="btn-primary">Browse Sticker Packs →</Link>
      </div>
    </div>
  )
}
