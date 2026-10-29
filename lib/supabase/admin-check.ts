// Is this signed-in Supabase account a Sticker Hub admin? (supabase/002-admin-lock.sql)
// Until that SQL has run, the is_hub_admin() function does not exist yet; then the old rule
// (any signed-in account) still applies, so the switch-over can never lock the owner out.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function isHubAdmin(supabase: any): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_hub_admin')
  if (error) {
    const msg = String(error.message || '')
    return error.code === 'PGRST202' || (/is_hub_admin/.test(msg) && /not find|does not exist/i.test(msg))
  }
  return data === true
}
