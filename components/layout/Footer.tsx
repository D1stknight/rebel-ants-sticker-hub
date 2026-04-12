import Link from 'next/link'

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      background: 'var(--bg-base)',
      padding: '32px 16px',
      marginTop: 64,
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>🐜</span>
            <span style={{ fontWeight: 700, fontSize: 16 }} className="gradient-text">Rebel Ants Hub</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {[
              { href: '/stickers', label: 'Stickers' },
              { href: '/gifs', label: 'GIFs' },
              { href: '/about', label: 'About' },
              { href: '/how-to-use', label: 'How to Use' },
            ].map(link => (
              <Link key={link.href} href={link.href} className="btn-ghost" style={{ fontSize: 13 }}>
                {link.label}
              </Link>
            ))}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
            © {new Date().getFullYear()} Rebel Ants. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
