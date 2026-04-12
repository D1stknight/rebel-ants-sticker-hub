import { createClient } from '@/lib/supabase/client'

const BUCKETS = {
  stickers: 'stickers',
  gifs: 'gifs',
  covers: 'covers',
  zips: 'zips',
  thumbnails: 'thumbnails',
} as const

type BucketKey = keyof typeof BUCKETS

export async function uploadFile(
  bucket: BucketKey,
  file: File,
  path?: string
): Promise<string> {
  const supabase = createClient()
  const ext = file.name.split('.').pop()
  const filePath = path ?? `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabase.storage.from(BUCKETS[bucket]).upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
  })

  if (error) throw error

  const { data } = supabase.storage.from(BUCKETS[bucket]).getPublicUrl(filePath)
  return data.publicUrl
}

export async function deleteFile(bucket: BucketKey, url: string) {
  const supabase = createClient()
  // Extract path from full URL
  const path = url.split(`/${BUCKETS[bucket]}/`)[1]
  if (!path) return
  await supabase.storage.from(BUCKETS[bucket]).remove([path])
}

export function getPublicUrl(bucket: BucketKey, path: string) {
  const supabase = createClient()
  const { data } = supabase.storage.from(BUCKETS[bucket]).getPublicUrl(path)
  return data.publicUrl
}
