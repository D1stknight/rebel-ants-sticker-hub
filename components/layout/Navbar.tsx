'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const navLinks = [
  { href: '/stickers', label: 'Stickers', emoji: '🖼️' },
  { href: '/gifs', label: 'GIFs', emoji: '✨' },
  { href: '/search', label: 'Search', emoji: '🔍' },
]

export default function Navbar() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(8,11,20,0.9)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
            {/* Logo */}
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
              <span style={{ fontSize: 28 }}>🐜</span>
              <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em' }}>
                <span className="gradient-text">Rebel Ants</span>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 400, fontSize: 13, marginLeft: 6 }}>Hub</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="desktop-nav">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="btn-ghost"
                  style={{
                    color: pathname === link.href ? 'var(--accent-purple)' : 'var(--text-secondary)',
                    fontWeight: pathname === link.href ? 600 : 400,
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Mobile menu button */}
            <button
              className="mobile-menu-btn btn-ghost"
              onClick={() => setMenuOpen(!menuOpen)}
              style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}
              aria-label="Toggle menu"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2}>
                {menuOpen ? (
                  <>
                    <path d="M18 6L6 18" strokeLinecap="round"/>
                    <path d="M6 6l12 12" strokeLinecap="round"/>
                  </>
                ) : (
                  <>
                    <path d="M3 12h18" strokeLinecap="round"/>
                    <path d="M3 6h18" strokeLinecap="round"/>
                    <path d="M3 18h18" strokeLinecap="round"/>
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div style={{
            borderTop: '1px solid var(--border)',
            background: 'var(--bg-base)',
            padding: '8px 16px 16px',
          }}>
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 12px',
                  borderRadius: 12,
                  textDecoration: 'none',
                  color: pathname === link.href ? 'var(--accent-purple)' : 'var(--text-primary)',
                  background: pathname === link.href ? 'rgba(139,92,246,0.08)' : 'transparent',
                  fontWeight: pathname === link.href ? 600 : 400,
                }}
              >
                <span>{link.emoji}</span>
                <span>{link.label}</span>
              </Link>
            ))}
          </div>
        )}
      </nav>

      <style>{`
        .mobile-menu-btn { display: none; }
        @media (max-width: 640px) {
          .desktop-nav { display: none; }
          .mobile-menu-btn { display: flex; }
        }
      `}</style>
    </>
  )
}
