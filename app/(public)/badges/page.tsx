import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { readRebel, readBadges, REBEL_ECONOMY_URL, type CatalogBadge } from '@/lib/rebel'
import { tierOf } from '@/lib/rebel-tiers'
import BadgeArt from '@/components/rebel/BadgeArt'
import { RebelSignInButton } from '@/components/rebel/RebelAccount'

export const metadata: Metadata = { title: 'Badges — Rebel Ants Hub' }
export const dynamic = 'force-dynamic'

export default async function BadgesPage() {
  const me = await readRebel(await cookies()).catch(() => null)
  const data = await readBadges(me?.userId ?? '_').catch(() => null)

  const earned = new Map((data?.badges ?? []).map(b => [b.id, b]))
  const catalog = data?.catalog ?? []
  const families: { id: string; name: string; badges: CatalogBadge[] }[] = []
  for (const b of catalog) {
    let f = families.find(x => x.id === b.family)
    if (!f) families.push(f = { id: b.family, name: b.familyName, badges: [] })
    f.badges.push(b)
  }
  const earnedHere = catalog.filter(b => earned.has(b.id)).length
  const wallUrl = me
    ? `${REBEL_ECONOMY_URL}/badges/${encodeURIComponent(me.userId)}?from=hub`
    : `${REBEL_ECONOMY_URL}/badges?from=hub`

  return (
    <div style={{ paddingTop: 40, paddingBottom: 64 }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 56, marginBottom: 8 }}>🏅</div>
        <h1 style={{ fontSize: 32, fontWeight: 900, margin: '0 0 10px', letterSpacing: '-0.02em' }}>
          Hub <span className="gradient-text">Badges</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.6, maxWidth: 560, margin: '0 auto' }}>
          Collect Rebel Ants badges by downloading stickers, GIFs and packs. Badges are collectibles for the colony —
          they live on your Rebel Ants profile with the rest of your badges.
        </p>

        {me ? (
          <div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="badge badge-purple">{me.displayName}</span>
            {data && <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{earnedHere} of {catalog.length} collected</span>}
            <a href={wallUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ color: 'var(--accent-purple)' }}>
              See every badge ↗
            </a>
          </div>
        ) : (
          <div className="card-glow" style={{ marginTop: 24, padding: 20, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
            <p style={{ margin: '0 0 14px', color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
              Downloading is free for everyone. Sign in with Discord or your colony name and your downloads start counting.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <RebelSignInButton />
              <a href={wallUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary">See every badge ↗</a>
            </div>
          </div>
        )}
      </div>

      {!data || catalog.length === 0 ? (
        <div className="card-glow" style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)', maxWidth: 480, margin: '0 auto' }}>
          The badge list isn’t reachable right now. Your downloads still work — check back soon.
        </div>
      ) : (
        families.map(f => {
          const got = f.badges.filter(b => earned.has(b.id)).length
          return (
            <section key={f.id} style={{ marginBottom: 36 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{f.name}</h2>
                {me && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{got} / {f.badges.length}</span>}
              </div>
              <div className="rebel-badge-grid">
                {f.badges.map(b => {
                  const have = earned.get(b.id)
                  const tier = tierOf(b.tier)
                  const name = have?.name || b.name
                  const art = have?.art || b.art
                  const prog = !have && me ? data.toGo[b.id] : undefined
                  return (
                    <div key={b.id} className={`rebel-badge-card ${have ? 'earned' : 'locked'}`}
                      style={{ ['--tier' as string]: tier.color } as React.CSSProperties}>
                      <BadgeArt src={art ? REBEL_ECONOMY_URL + art : null} name={name} />
                      <div className="rebel-badge-name">{name}</div>
                      <div className="rebel-badge-tier">{tier.label}{have ? ' · Earned' : ''}</div>
                      <div className="rebel-badge-rule">{have?.rule || b.rule}</div>
                      {prog && (
                        <div style={{ width: '100%' }}>
                          <div className="rebel-badge-bar"><span style={{ width: `${Math.min(100, Math.round((prog[0] / Math.max(1, prog[1])) * 100))}%` }} /></div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{prog[0]} / {prog[1]}</div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })
      )}
    </div>
  )
}
