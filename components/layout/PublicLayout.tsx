import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main style={{ minHeight: 'calc(100dvh - 60px)', maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
        {children}
      </main>
      <Footer />
    </>
  )
}
