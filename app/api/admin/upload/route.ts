import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  // Verify auth
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const bucket = formData.get('bucket') as string
    const path = formData.get('path') as string | null

    if (!file || !bucket) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    // Use service role for upload (bypasses RLS)
    const adminClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const ext = file.name.split('.').pop()
    const filePath = path ?? `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const { error } = await adminClient.storage.from(bucket).upload(filePath, arrayBuffer, {
      contentType: file.type,
      cacheControl: '31536000',
      upsert: false,
    })

    if (error) throw error

    const { data } = adminClient.storage.from(bucket).getPublicUrl(filePath)
    return NextResponse.json({ url: data.publicUrl, path: filePath })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
