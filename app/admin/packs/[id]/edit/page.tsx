'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { uploadFileToBucket } from '@/lib/upload'
import { slugify } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Category, Pack, Asset } from '@/types'

export default function EditPackPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [packAssets, setPackAssets] = useState<Asset[]>([])
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [currentCover, setCurrentCover] = useState<string | null>(null)
  const [currentZip, setCurrentZip] = useState<string | null>(null)
  const [zipFile, setZipFile] = useState<File | null>(null)
  const [uploadedZip, setUploadedZip] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '', slug: '', description: '',
    type: 'sticker' as 'sticker' | 'gif',
    category_id: '', featured: false, is_published: false,
  })

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('packs').select('*').eq('id', id).single(),
      supabase.from('categories').select('*').order('name'),
      supabase.from('pack_items').select('*, asset:assets(id, title, thumbnail_url, file_url)').eq('pack_id', id).order('sort_order'),
    ]).then(([packRes, catsRes, itemsRes]) => {
      const pack = packRes.data as Pack
      if (pack) {
        setForm({
          title: pack.title,
          slug: pack.slug,
          description: pack.description ?? '',
          type: pack.type,
          category_id: pack.category_id ?? '',
          featured: pack.featured,
          is_published: pack.is_published,
        })
        setCurrentCover(pack.cover_image_url)
        setCurrentZip(pack.zip_file_url)
      }
      setCategories((catsRes.data as Category[]) ?? [])
      const assets = (itemsRes.data ?? []).map((item: any) => item.asset).filter(Boolean)
      setPackAssets(assets as Asset[])
      setLoading(false)
    })
  }, [id])

  const handleCoverFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  const handlePickAssetAsCover = (asset: Asset) => {
    setCurrentCover(asset.thumbnail_url ?? asset.file_url)
    setCoverFile(null)
    setCoverPreview(null)
    toast.success('Cover selected — click Save to apply')
  }

  const handleZipFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.zip') || file.size > 50 * 1024 * 1024) {
      e.target.value = ''
      toast.error('Choose a ZIP file up to 50 MB')
      return
    }
    const signature = new Uint8Array(await file.slice(0, 4).arrayBuffer())
    if (signature[0] !== 0x50 || signature[1] !== 0x4b ||
        ![[3, 4], [5, 6], [7, 8]].some(([a, b]) => signature[2] === a && signature[3] === b)) {
      e.target.value = ''
      toast.error('This file is not a ZIP archive')
      return
    }
    setZipFile(file)
    setUploadedZip(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      let coverUrl = currentCover
      let zipUrl = currentZip

      if (zipFile) {
        zipUrl = uploadedZip ?? await uploadFileToBucket('zips', zipFile)
        setUploadedZip(zipUrl)
      }

      // Upload new cover file if selected
      if (coverFile) {
        coverUrl = await uploadFileToBucket('covers', coverFile)
      }

      const supabase = createClient()
      const { error } = await supabase.from('packs').update({
        title: form.title,
        slug: form.slug || slugify(form.title),
        description: form.description || null,
        type: form.type,
        category_id: form.category_id || null,
        featured: form.featured,
        is_published: form.is_published,
        cover_image_url: coverUrl,
        zip_file_url: zipUrl,
        updated_at: new Date().toISOString(),
      }).eq('id', id).select('id').single()

      if (error) throw error
      toast.success('Pack updated!')
      router.push('/admin/packs')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const L: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  )

  const displayCover = coverPreview ?? currentCover

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 4px' }}>✏️ Edit Pack</h1>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 14 }}>{form.title}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <fieldset disabled={saving} style={{ border: 0, margin: 0, padding: 0, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Cover image */}
        <div className="card-glow" style={{ padding: 20 }}>
          <label style={L}>Cover Image</label>

          {/* Current cover preview */}
          {displayCover && (
            <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
              <img src={displayCover} alt="Cover" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--border)' }} />
              <div>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>Current cover</p>
                <button type="button" onClick={() => { setCurrentCover(null); setCoverPreview(null); setCoverFile(null) }}
                  style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 12, cursor: 'pointer', padding: 0, marginTop: 4 }}>
                  Remove
                </button>
              </div>
            </div>
          )}

          {/* Upload new cover */}
          <div style={{ marginBottom: packAssets.length > 0 ? 16 : 0 }}>
            <input type="file" accept="image/*" onChange={handleCoverFile} id="cover-upload" style={{ display: 'none' }} />
            <label htmlFor="cover-upload" className="btn-secondary" style={{ display: 'inline-flex', cursor: 'pointer', fontSize: 13 }}>
              📁 Upload new cover image
            </label>
          </div>

          {/* Pick from pack assets */}
          {packAssets.length > 0 && (
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 10px' }}>
                Or pick one from this pack:
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {packAssets.map(asset => (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => handlePickAssetAsCover(asset)}
                    title={asset.title}
                    style={{
                      width: 56, height: 56, padding: 0, border: '2px solid',
                      borderColor: (displayCover === asset.thumbnail_url || displayCover === asset.file_url) ? 'var(--accent-purple)' : 'var(--border)',
                      borderRadius: 10, overflow: 'hidden', cursor: 'pointer',
                      background: 'var(--bg-surface)', transition: 'border-color 0.15s',
                    }}
                  >
                    <img
                      src={asset.thumbnail_url ?? asset.file_url}
                      alt={asset.title}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="card-glow" style={{ padding: 20 }}>
          <label htmlFor="zip-replacement" style={L}>Replace pack ZIP</label>
          {currentZip && <p style={{ fontSize: 13 }}><a href={currentZip} target="_blank" rel="noreferrer">Current pack ZIP</a></p>}
          <input id="zip-replacement" type="file" accept=".zip,application/zip,application/x-zip-compressed" onChange={handleZipFile} />
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 0 }}>
            Optional ZIP, up to 50 MB. Save Changes updates the full-pack download. The previous file is kept as a backup. Pack items stay in place.
          </p>
          {zipFile && <p style={{ fontSize: 13 }}>Selected: {zipFile.name}</p>}
        </div>

        {/* Pack details */}
        <div className="card-glow" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={L}>Title *</label>
              <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
            </div>
            <div>
              <label style={L}>Type</label>
              <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as 'sticker' | 'gif' }))}>
                <option value="sticker">🖼️ Sticker</option>
                <option value="gif">✨ GIF</option>
              </select>
            </div>
          </div>

          <div>
            <label style={L}>Slug</label>
            <input className="input" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} />
          </div>

          <div>
            <label style={L}>Description</label>
            <textarea className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} style={{ resize: 'vertical' }} />
          </div>

          <div>
            <label style={L}>Category</label>
            <select className="input" value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
              <option value="">No category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 24 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
              <input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} /> Featured
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
              <input type="checkbox" checked={form.is_published} onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))} /> Published
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="submit" disabled={saving} className="btn-primary" style={{ flex: 1, justifyContent: 'center', height: 48 }}>
            {saving ? <><span className="spinner" style={{ width: 18, height: 18 }} /> Saving…</> : '💾 Save Changes'}
          </button>
          <button type="button" onClick={() => router.back()} className="btn-secondary" style={{ height: 48 }}>Cancel</button>
        </div>
        </fieldset>
      </form>
    </div>
  )
}
