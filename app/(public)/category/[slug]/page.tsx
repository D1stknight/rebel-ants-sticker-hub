import { notFound } from 'next/navigation'
import { getCategoryBySlug, getPacks } from '@/lib/db'
import PackCard from '@/components/ui/PackCard'
import type { Metadata } from 'next'

export const revalidate = 60

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const cat = await getCategoryBySlug(slug)
  if (!cat) return { title: 'Category Not Found' }
  return { title: `${cat.name} — Rebel Ants Hub` }
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)
  if (!category) notFound()

  const packs = await getPacks()
  const filtered = packs.filter(p => p.category_id === category.id)

  return (
    <div style={{ paddingTop: 32, paddingBottom: 64 }}>
      <div style={{ marginBottom: 32 }}>
        <span className="badge badge-blue" style={{ marginBottom: 10, display: 'inline-flex' }}>Category</span>
        <h1 style={{ fontSize: 28, fontWeight: 900, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
          {category.name}
        </h1>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 14 }}>
          {filtered.length} pack{filtered.length !== 1 ? 's' : ''}
        </p>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
          <p style={{ color: 'var(--text-secondary)' }}>No packs in this category yet.</p>
        </div>
      ) : (
        <div className="pack-grid">
          {filtered.map(pack => <PackCard key={pack.id} pack={pack} />)}
        </div>
      )}
    </div>
  )
}
