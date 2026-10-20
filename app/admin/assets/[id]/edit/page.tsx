'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { uploadFileToBucket } from '@/lib/upload'
import toast from 'react-hot-toast'
import type { Category, Asset, AssetTag } from '@/types'

export default function EditAssetPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [existingTags, setExistingTags] = useState<AssetTag[]>([])
  const [asset, setAsset] = useState<Asset | null>(null)
  const [replacementFile, setReplacementFile] = useState<File | null>(null)
  const [replacementPreview, setReplacementPreview] = useState<string | null>(null)
  const [pendingUpload, setPendingUpload] = useState<{ file: File; url: string } | null>(null)
  const replacementInput = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    title: '', slug: '', description: '', category_id: '',
    tags: '', featured: false, is_published: false,
  })
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('assets').select('*, tags:asset_tags(*)').eq('id', id).single(),
      supabase.from('categories').select('*').order('name'),
    ]).then(([assetRes, catsRes]) => {
      const asset = assetRes.data as Asset & { tags: AssetTag[] }
      if (asset) {
        setAsset(asset)
        setExistingTags(asset.tags ?? [])
        setPreview(asset.thumbnail_url ?? asset.file_url)
        setForm({
          title: asset.title,
          slug: asset.slug,
          description: asset.description ?? '',
          category_id: asset.category_id ?? '',
          tags: asset.tags?.map(t => t.tag).join(', ') ?? '',
          featured: asset.featured,
          is_published: asset.is_published,
        })
      }
      setCategories((catsRes.data as Category[]) ?? [])
      setLoading(false)
    })
  }, [id])

  useEffect(() => {
    if (!replacementFile) {
      setReplacementPreview(null)
      return
    }
    const url = URL.createObjectURL(replacementFile)
    setReplacementPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [replacementFile])

  const isGif = asset?.type === 'gif'

  const handleReplacement = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const validType = isGif
      ? file.type === 'image/gif' && /\.gif$/i.test(file.name)
      : ['image/png', 'image/webp'].includes(file.type)
    const maxMB = isGif ? 20 : 10
    if (!validType || file.size === 0 || file.size > maxMB * 1024 * 1024) {
      toast.error(isGif ? 'Choose a GIF file up to 20 MB' : 'Choose a PNG or WebP image up to 10 MB')
      setReplacementFile(null)
      setPendingUpload(null)
      e.target.value = ''
      return
    }
    setReplacementFile(file)
    setPendingUpload(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!asset || saving) return
    setSaving(true)
    const supabase = createClient()
    try {
      let replacementUrl: string | undefined
      if (replacementFile) {
        if (isGif) {
          const header = new TextDecoder().decode(await replacementFile.slice(0, 6).arrayBuffer())
          if (header !== 'GIF87a' && header !== 'GIF89a') throw new Error('Choose a valid GIF file')
        }
        replacementUrl = pendingUpload?.file === replacementFile
          ? pendingUpload.url
          : await uploadFileToBucket(isGif ? 'gifs' : 'stickers', replacementFile)
        setPendingUpload({ file: replacementFile, url: replacementUrl })
      }
      const { error } = await supabase.from('assets').update({
        title: form.title,
        slug: form.slug,
        description: form.description || null,
        category_id: form.category_id || null,
        featured: form.featured,
        is_published: form.is_published,
        updated_at: new Date().toISOString(),
        ...(replacementUrl ? { file_url: replacementUrl, thumbnail_url: replacementUrl, preview_url: isGif ? replacementUrl : null } : {}),
      }).eq('id', id).select('id').single()

      if (error) throw error

      const newTags = [...new Set(form.tags.split(',').map(t => t.trim()).filter(Boolean))]
      const oldTags = [...new Set(existingTags.map(t => t.tag))]
      if (JSON.stringify([...newTags].sort()) !== JSON.stringify(oldTags.sort())) {
        const removed = await supabase.from('asset_tags').delete().eq('asset_id', id)
        if (removed.error) throw new Error('Asset saved, but tags could not be updated. Please try again.')
        if (newTags.length > 0) {
          const inserted = await supabase.from('asset_tags').insert(newTags.map(tag => ({ asset_id: id, tag })))
          if (inserted.error) throw new Error('Asset saved, but tags could not be updated. Please try again.')
        }
      }

      toast.success('Asset updated!')
      router.push('/admin/assets')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not save changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const label = (text: string) => (
    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
      {text}
    </label>
  )

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  )

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 4px' }}>✏️ Edit Asset</h1>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 14 }}>{form.title}</p>
      </div>

      {(replacementPreview || preview) && (
        <div className="card-glow" style={{ padding: 16, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 140, background: 'var(--bg-surface)' }}>
          <img src={replacementPreview || preview || ''} alt={replacementFile ? 'Replacement asset preview' : form.title} style={{ maxWidth: 120, maxHeight: 120, objectFit: 'contain' }} />
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <fieldset disabled={saving} style={{ border: 0, padding: 0, margin: 0, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {(asset?.type === 'sticker' || isGif) && (
          <div className="card-glow" style={{ padding: 20 }}>
            <label htmlFor="replacement-asset" style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>{isGif ? 'Replace GIF' : 'Replace sticker image'}</label>
            <input ref={replacementInput} id="replacement-asset" type="file" accept={isGif ? "image/gif,.gif" : "image/png,image/webp"} onChange={handleReplacement} disabled={saving} aria-describedby="replacement-help" />
            <p id="replacement-help" style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.5 }}>{isGif ? 'Optional GIF, up to 20 MB.' : 'Optional PNG or WebP, up to 10 MB.'} Save Changes updates this {isGif ? 'GIF' : 'sticker'} in its existing packs. The previous file is kept as a backup. Pack ZIPs and covers can be updated in the pack editor.</p>
            {replacementFile && <button type="button" className="btn-secondary" disabled={saving} onClick={() => { setReplacementFile(null); setPendingUpload(null); if (replacementInput.current) replacementInput.current.value = '' }}>{isGif ? 'Keep current GIF' : 'Keep current image'}</button>}
          </div>
        )}
        <div className="card-glow" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            {label('Title *')}
            <input className="input" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          </div>

          <div>
            {label('Slug')}
            <input className="input" value={form.slug}
              onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} />
          </div>

          <div>
            {label('Description')}
            <textarea className="input" value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3} style={{ resize: 'vertical' }} />
          </div>

          <div>
            {label('Tags (comma separated)')}
            <input className="input" value={form.tags}
              onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              placeholder="tag1, tag2, tag3" />
          </div>

          <div>
            {label('Category')}
            <select className="input" value={form.category_id}
              onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
              <option value="">No category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 24 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
              <input type="checkbox" checked={form.featured}
                onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} /> Featured
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
              <input type="checkbox" checked={form.is_published}
                onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))} /> Published
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="submit" disabled={saving} className="btn-primary" style={{ flex: 1, justifyContent: 'center', height: 48 }}>
            {saving ? <><span className="spinner" style={{ width: 18, height: 18 }} /> Saving…</> : '💾 Save Changes'}
          </button>
          <button type="button" disabled={saving} onClick={() => router.back()} className="btn-secondary" style={{ height: 48 }}>
            Cancel
          </button>
        </div>
        </fieldset>
      </form>
    </div>
  )
}
