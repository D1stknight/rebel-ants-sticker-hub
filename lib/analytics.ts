export async function trackDownload(opts: { assetId?: string; packId?: string; type: 'asset' | 'pack' }) {
  try {
    await fetch('/api/track-download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(opts),
    })
  } catch {
    // Non-critical — fail silently
  }
}
