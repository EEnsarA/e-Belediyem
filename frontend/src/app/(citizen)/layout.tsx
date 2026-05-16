'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import CitizenSidebar from '@/components/layout/CitizenSidebar'
import { useAuthStore } from '@/store'
import React from 'react'

export default function CitizenLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push('/login')
    } else if (user?.is_admin) {
      router.push('/admin/dashboard')
    }
  }, [isAuthenticated, user, router])

  if (!mounted) return null;
  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-surface-950 relative flex">
      <CitizenSidebar />
      <main className="flex-1 ml-64 min-h-screen p-6 lg:p-10 relative z-10">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary-500/5 blur-[120px] pointer-events-none -z-10" />
        {children}
      </main>
    </div>
  )
}

