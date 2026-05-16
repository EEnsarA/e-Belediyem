'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';
import { motion } from 'framer-motion';
import AdminSidebar from '@/components/layout/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    } else if (!user?.is_admin) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, user, router])

  if (!isAuthenticated || !user?.is_admin) return null

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-surface-950 relative flex">
      <AdminSidebar />
      <main className="flex-1 ml-64 min-h-screen p-6 lg:p-10 relative z-10">
        {/* Subtle background light on the right */}
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary-500/5 blur-[120px] pointer-events-none -z-10" />
        {children}
      </main>
    </div>
  )
}


