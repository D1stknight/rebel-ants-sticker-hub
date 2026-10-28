'use client'

import toast from 'react-hot-toast'
import type { NewBadge } from '@/lib/analytics'
import { tierOf } from '@/lib/rebel-tiers'

/** One small toast per new badge: "🏅 New badge: <name> · <tier>". Tap or × to close; 4 s otherwise. */
export function showBadgeToasts(badges: NewBadge[]) {
  badges.forEach((b, i) => {
    const tier = tierOf(b.tier)
    setTimeout(() => {
      toast.custom(t => (
        <div
          role="status"
          onClick={() => toast.dismiss(t.id)}
          className="rebel-badge-toast"
          style={{
            opacity: t.visible ? 1 : 0,
            transform: t.visible ? 'translateY(0)' : 'translateY(8px)',
            borderColor: tier.color,
            boxShadow: `0 0 20px ${tier.color}40`,
          }}
        >
          <span style={{ fontSize: 20, lineHeight: 1 }}>🏅</span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)' }}>New badge</span>
            <span style={{ display: 'block', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {b.name} <span style={{ color: tier.color, fontWeight: 600 }}>· {b.tierLabel || tier.label}</span>
            </span>
          </span>
          <button
            aria-label="Dismiss"
            onClick={e => { e.stopPropagation(); toast.dismiss(t.id) }}
            className="rebel-badge-toast-x"
          >
            ×
          </button>
        </div>
      ), { duration: 4000, id: `badge-${b.id}` })
    }, i * 350)
  })
}
