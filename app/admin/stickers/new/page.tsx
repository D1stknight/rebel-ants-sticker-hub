'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import UploadDropzone from '@/components/admin/UploadDropzone'
import { uploadFileToBucket } from '@/lib/upload'
import { slugify } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Category } from '@/types'

export default function NewStickerPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({
    title: '', slug: '', description: '', category_id: '',
    tags: '', featured: false, is_published: true,
  })

  useEffect(() => {
    createClient().from('categories').select('*').in('type', ['sticker', 'both']).order('name')
      .then(({ data }) => setCategories((data as Category[]) ?? []))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return toast.error('Please select a file')
    if (!form.title) return toast.error('Title is required')
    setUploading(true)

    try {
      const url = await uploadFileToBucket('stickers', file)

      const supabase = createClient()
      const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean)

      const { data: asset, error } = await supabase.from('assets').insert({
        title: form.title,
        slug: form.slug || slugify(form.title),
        description: form.description || null,
        type: 'sticker',
        file_url: url,
        thumbnail_url: url,
        category_id: form.category_id || null,
        featured: form.featured,
        is_published: form.is_published,
      }).select().single()

      if (error) throw error

      if (tags.length > 0) {
        await supabase.from('asset_tags').insert(tags.map(tag => ({ asset_id: asset.id, tag })))
      }

      toast.success('Sticker uploaded!')
      router.push('/admin/assets')
    } catch (err: unknown) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 13, fontWeight: 600,
    color: 'var(--text-secondary)', marginBottom: 8,
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 4px' }}>🖼️ Upload Sticker</h1>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 14 }}>Add a new PNG sticker to the hub</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="card-glow" style={{ padding: 20 }}>
          <label style={labelStyle}>PNG File *</label>
          <UploadDropzone
            accept={{ 'image/png': ['.png'], 'image/webp': ['.webp'] }}
            onFile={setFile}
            label="Drop PNG sticker here"
            loading={uploading}
          />
        </div>

        <div className="card-glow" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Title *</label>
            <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value, slug: slugify(e.target.value) }))} placeholder="Rebel Ant Salute" required />
          </div>
          <div>
            <label style={labelStyle}>Slug</label>
            <input className="input" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="rebel-ant-salute" />
          </div>
          <div>
            <label style={labelStyle}>Description</label>
            <textarea className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description..." rows={3} style={{ resize: 'vertical' }} />
          </div>
          <div>
            <label style={labelStyle}>Tags (comma separated)</label>
            <input className="input" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="salute, proud, ant, rebel" />
          </div>
          <div>
            <label style={labelStyle}>Category</label>
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

        <button type="submit" disabled={uploading} className="btn-primary" style={{ justifyContent: 'center', height: 48 }}>
          {uploading ? <><span className="spinner" style={{ width: 18, height: 18 }} /> Uploading...</> : '🖼️ Upload Sticker'}
        </button>
      </form>
    </div>
  )
}
