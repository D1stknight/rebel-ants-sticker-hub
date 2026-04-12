'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import UploadDropzone from '@/components/admin/UploadDropzone'
import { slugify } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Category } from '@/types'

export default function NewGifPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [gifFile, setGifFile] = useState<File | null>(null)
  const [thumbFile, setThumbFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({
    title: '', slug: '', description: '', category_id: '',
    tags: '', external_url: '', featured: false, is_published: true,
  })

  useEffect(() => {
    createClient().from('categories').select('*').in('type', ['gif', 'both']).order('name')
      .then(({ data }) => setCategories((data as Category[]) ?? []))
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!gifFile) return toast.error('Please upload a GIF file')
    setUploading(true)

    try {
      const [gifUrl, thumbUrl] = await Promise.all([
        uploadOne(gifFile, 'gifs'),
        thumbFile ? uploadOne(thumbFile, 'thumbnails') : Promise.resolve(null),
      ])

      const supabase = createClient()
      const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean)

      const { data: asset, error } = await supabase.from('assets').insert({
        title: form.title,
        slug: form.slug || slugify(form.title),
        description: form.description || null,
        type: 'gif',
        file_url: gifUrl,
        thumbnail_url: thumbUrl ?? gifUrl,
        preview_url: gifUrl,
        external_url: form.external_url || null,
        category_id: form.category_id || null,
        featured: form.featured,
        is_published: form.is_published,
      }).select().single()

      if (error) throw error

      if (tags.length > 0) {
        await supabase.from('asset_tags').insert(tags.map(tag => ({ asset_id: asset.id, tag })))
      }

      toast.success('GIF uploaded!')
      router.push('/admin/assets')
    } catch (err) {
      console.error(err)
      toast.error('Upload failed')
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
        <h1 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 4px' }}>✨ Upload GIF</h1>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 14 }}>Add a new animated GIF to the hub</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="card-glow" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>GIF File *</label>
            <UploadDropzone
              accept={{ 'image/gif': ['.gif'] }}
              onFile={setGifFile}
              label="Drop .gif file here"
              loading={uploading}
            />
          </div>
          <div>
            <label style={labelStyle}>Thumbnail (optional PNG/WebP for fast loading)</label>
            <UploadDropzone
              accept={{ 'image/png': ['.png'], 'image/webp': ['.webp'], 'image/jpeg': ['.jpg', '.jpeg'] }}
              onFile={setThumbFile}
              label="Drop thumbnail image here"
            />
          </div>
        </div>

        <div className="card-glow" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Title *</label>
            <input className="input" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value, slug: slugify(e.target.value) }))}
              placeholder="Rebel Ant Dance" required />
          </div>

          <div>
            <label style={labelStyle}>Slug</label>
            <input className="input" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="rebel-ant-dance" />
          </div>

          <div>
            <label style={labelStyle}>Description</label>
            <textarea className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} style={{ resize: 'vertical' }} placeholder="Optional description…" />
          </div>

          <div>
            <label style={labelStyle}>External URL (GIPHY / Tenor link)</label>
            <input className="input" value={form.external_url} onChange={e => setForm(f => ({ ...f, external_url: e.target.value }))} placeholder="https://giphy.com/…" />
          </div>

          <div>
            <label style={labelStyle}>Tags (comma separated)</label>
            <input className="input" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="dance, party, celebrate" />
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
              <input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} />
              Featured
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
              <input type="checkbox" checked={form.is_published} onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))} />
              Published
            </label>
          </div>
        </div>

        <button type="submit" disabled={uploading} className="btn-primary" style={{ justifyContent: 'center', height: 48 }}>
          {uploading ? <><span className="spinner" style={{ width: 18, height: 18 }} /> Uploading…</> : '✨ Upload GIF'}
        </button>
      </form>
    </div>
  )
}
