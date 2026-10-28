'use client'

import { useState } from 'react'

/** Badge art from the economy site; until it is drawn (404), a tier-coloured stand-in with the first letter. */
export default function BadgeArt({ src, name }: { src: string | null; name: string }) {
  const [broken, setBroken] = useState(false)
  if (!src || broken) {
    const letter = name === '???' ? '?' : (name.trim()[0] || '?').toUpperCase()
    return <span className="rebel-badge-stand-in" aria-hidden>{letter}</span>
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="rebel-badge-art" src={src} alt="" loading="lazy" onError={() => setBroken(true)} />
}
