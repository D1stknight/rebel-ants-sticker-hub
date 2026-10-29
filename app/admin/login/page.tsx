// The Sticker Hub admin lives in the Rebel Console now (Apps → The Sticker Hub). Oct 28, 2026.
import { redirect } from 'next/navigation'

export default function AdminMoved() {
  redirect('https://economy.rebelants.io/admin/hub')
}
