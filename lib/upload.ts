'use client'
import { createClient } from '@/lib/supabase/client'

export async function uploadFileToBucket(
  bucket: string,
  file: File
): Promise<string> {
  const supabase = createClient()
  const ext = file.name.split('.').pop()
  const filePath = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      contentType: file.type,
      cacheControl: '31536000',
      upsert: false,
    })

  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)
  return data.publicUrl
}
