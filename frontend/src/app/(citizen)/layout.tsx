'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CitizenSidebar from '@/components/layout/CitizenSidebar'
import { useAuthStore } from '@/store'
import React from 'react'

export default function CitizenLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    <div className="min-h-screen bg-[#f8fafc] dark:bg-surface-950 flex">
      <CitizenSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(o => !o)} />
      <main
        className={`flex-1 min-h-screen p-6 lg:p-10 relative z-10
                    transition-[margin] duration-300 ease-in-out
                    ${sidebarOpen ? 'ml-60' : 'ml-[64px]'}`}
      >
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary-500/5 blur-[120px] pointer-events-none -z-10" />
        {children}
      </main>
    </div>
  )
}

