interface SkeletonGridProps {
  count?: number
  type?: 'pack' | 'asset'
}

export default function SkeletonGrid({ count = 8, type = 'pack' }: SkeletonGridProps) {
  return (
    <div className={type === 'asset' ? 'asset-grid' : 'pack-grid'}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)' }}>
          <div className="skeleton" style={{ aspectRatio: '1' }} />
          <div style={{ padding: '12px 14px', background: 'var(--bg-card)' }}>
            <div className="skeleton" style={{ height: 14, borderRadius: 6, marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 11, borderRadius: 6, width: '60%' }} />
          </div>
        </div>
      ))}
    </div>
  )
}
