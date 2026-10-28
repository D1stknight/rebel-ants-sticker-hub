export type NewBadge = { id: string; name: string; tier: string; tierLabel: string; app: string }

/** Records a download. Returns any Rebel badges it just earned (empty when signed out or on error). */
export async function trackDownload(opts: { assetId?: string; packId?: string; type: 'asset' | 'pack' }): Promise<NewBadge[]> {
  try {
    const res = await fetch('/api/track-download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(opts),
    })
    const j = await res.json().catch(() => null)
    return Array.isArray(j?.awarded) ? j.awarded : []
  } catch {
    // Non-critical — fail silently
    return []
  }
}
