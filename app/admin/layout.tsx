import AdminNav from '@/components/admin/AdminNav'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100dvh', background: 'var(--bg-base)' }}>
      <AdminNav />
      <main style={{ flex: 1, padding: '32px 28px', overflowX: 'hidden', maxWidth: 'calc(100vw - 220px)' }}>
        {children}
      </main>
    </div>
  )
}
