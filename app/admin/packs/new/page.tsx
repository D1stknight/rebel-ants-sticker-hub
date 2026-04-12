'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import UploadDropzone from '@/components/admin/UploadDropzone'
import { slugify } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Category, Asset } from '@/types'

export default function NewPackPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [allAssets, setAllAssets] = useState<Asset[]>([])
  const [selectedAssets, setSelectedAssets] = useState<string[]>([])
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [zipFile, setZipFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [assetSearch, setAssetSearch] = useState('')
  const [form, setForm] = useState({
    title: '', slug: '', description: '', type: 'sticker' as 'sticker' | 'gif',
    category_id: '', featured: false, is_published: true,
  })

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('categories').select('*').order('name'),
      supabase.from('assets').select('id, title, type, thumbnail_url, file_url').eq('is_published', true).order('created_at', { ascending: false }),
    ]).then(([catsRes, assetsRes]) => {
      setCategories((catsRes.data as Category[]) ?? [])
      setAllAssets((assetsRes.data as Asset[]) ?? [])
    })
  }, [])

  const uploadOne = async (file: File, bucket: string) => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('bucket', bucket)
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    const { url, error } = await res.json()
    if (error) throw new Error(error)
    return url as string
  }

  const toggleAsset = (id: string) => {
    setSelectedAssets(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title) return toast.error('Title is required')
    setUploading(true)

    try {
      const [coverUrl, zipUrl] = await Promise.all([
        coverFile ? uploadOne(coverFile, 'covers') : Promise.resolve(null),
        zipFile ? uploadOne(zipFile, 'zips') : Promise.resolve(null),
      ])

      const supabase = createClient()
      const { data: pack, error } = await supabase.from('packs').insert({
        title: form.title,
        slug: form.slug || slugify(form.title),
        description: form.description || null,
        type: form.type,
        cover_image_url: coverUrl,
        zip_file_url: zipUrl,
        category_id: form.category_id || null,
        featured: form.featured,
        is_published: form.is_published,
      }).select().single()

      if (error) throw error

      // Add selected assets as pack items
      if (selectedAssets.length > 0) {
        await supabase.from('pack_items').insert(
          selectedAssets.map((assetId, i) => ({
            pack_id: pack.id,
            asset_id: assetId,
            sort_order: i,
          }))
        )
      }

      toast.success('Pack created!')
      router.push('/admin/packs')
    } catch (err) {
      console.error(err)
      toast.error('Failed to create pack')
    } finally {
      setUploading(false)
    }
  }

  const filteredAssets = allAssets.filter(a => {
    const matchType = a.type === form.type
    const matchSearch = !assetSearch || a.title.toLowerCase().includes(assetSearch.toLowerCase())
    return matchType && matchSearch
  })

  const label = (text: string) => (
    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
      {text}
    </label>
  )

  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 4px' }}>📦 Create Pack</h1>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 14 }}>Bundle stickers or GIFs into a downloadable pack</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Basic info */}
        <div className="card-glow" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700 }}>Pack Details</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              {label('Title *')}
              <input className="input" value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value, slug: slugify(e.target.value) }))}
                placeholder="Colony Essentials" required />
            </div>
            <div>
              {label('Type')}
              <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as 'sticker' | 'gif' }))}>
                <option value="sticker">🖼️ Sticker</option>
                <option value="gif">✨ GIF</option>
              </select>
            </div>
          </div>

          <div>
            {label('Slug')}
            <input className="input" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="colony-essentials" />
          </div>

          <div>
            {label('Description')}
            <textarea className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} style={{ resize: 'vertical' }} placeholder="What's in this pack?" />
          </div>

          <div>
            {label('Category')}
            <select className="input" value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
              <option value="">No category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 20 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
              <input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} /> Featured
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
              <input type="checkbox" checked={form.is_published} onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))} /> Published
            </label>
          </div>
        </div>

        {/* Files */}
        <div className="card-glow" style={{ padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Files</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              {label('Cover Image')}
              <UploadDropzone accept={{ 'image/*': ['.png', '.jpg', '.webp'] }} onFile={setCoverFile} label="Drop cover image" />
            </div>
            <div>
              {label('ZIP File (full pack)')}
              <UploadDropzone accept={{ 'application/zip': ['.zip'], 'application/x-zip-compressed': ['.zip'] }} onFile={setZipFile} label="Drop .zip file" loading={uploading && !!zipFile} />
            </div>
          </div>
        </div>

        {/* Asset selector */}
        <div className="card-glow" style={{ padding: 20 }}>
          <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700 }}>Add Items to Pack</h3>
          <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--text-muted)' }}>
            {selectedAssets.length} selected · showing {form.type}s only
          </p>

          <input className="input" value={assetSearch} onChange={e => setAssetSearch(e.target.value)} placeholder="Search assets…" style={{ marginBottom: 14 }} />

          <div style={{ maxHeight: 320, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 8 }}>
            {filteredAssets.map(asset => {
              const selected = selectedAssets.includes(asset.id)
              return (
                <div
                  key={asset.id}
                  onClick={() => toggleAsset(asset.id)}
                  style={{
                    cursor: 'pointer', borderRadius: 10,
                    border: `2px solid ${selected ? 'var(--accent-purple)' : 'var(--border)'}`,
                    background: selected ? 'rgba(139,92,246,0.1)' : 'var(--bg-surface)',
                    overflow: 'hidden', transition: 'all 0.15s',
                  }}
                >
                  <div style={{ aspectRatio: '1', position: 'relative' }}>
                    {asset.thumbnail_url || asset.file_url ? (
                      <img src={asset.thumbnail_url || asset.file_url} alt={asset.title}
                        style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 20 }}>
                        {asset.type === 'gif' ? '✨' : '🖼️'}
                      </div>
                    )}
                    {selected && (
                      <div style={{ position: 'absolute', top: 4, right: 4, background: 'var(--accent-purple)', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'white', fontWeight: 700 }}>✓</div>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: 10, padding: '4px 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                    {asset.title}
                  </p>
                </div>
              )
            })}
            {filteredAssets.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: 13, gridColumn: '1/-1' }}>
                No {form.type}s found. Upload some first!
              </p>
            )}
          </div>
        </div>

        <button type="submit" disabled={uploading} className="btn-primary" style={{ justifyContent: 'center', height: 48 }}>
          {uploading ? <><span className="spinner" style={{ width: 18, height: 18 }} /> Creating…</> : '📦 Create Pack'}
        </button>
      </form>
    </div>
  )
}
