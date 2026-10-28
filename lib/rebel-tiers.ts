// Badge tier colours and labels (safe for the browser).
export const TIERS: Record<string, { label: string; color: string }> = {
  common: { label: 'Bronze', color: '#c98a4b' },
  rare: { label: 'Silver', color: '#cfd8e3' },
  epic: { label: 'Neon', color: '#b77bff' },
  legendary: { label: 'Gold', color: '#f5d061' },
  mythic: { label: 'Mythic', color: '#ff3b6b' },
  secret: { label: 'Obsidian', color: '#8ff0b8' },
}

export const tierOf = (tier: string) => TIERS[tier] ?? { label: tier, color: '#94a3b8' }
