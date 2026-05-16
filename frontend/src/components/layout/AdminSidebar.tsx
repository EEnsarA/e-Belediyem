'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import {
  Building2, LayoutDashboard, AlertCircle, Map, Users, BarChart3,
  Megaphone, MessageSquare, FileText, Shield, Sun, Moon, LogOut, Zap, Globe
} from 'lucide-react';
import { useAuthStore } from '@/store';
import toast from 'react-hot-toast';

const adminNav = [
  { href: '/', icon: Globe, label: 'Keşif Platformu' },
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/complaints', icon: AlertCircle, label: 'Şikayetler' },
  { href: '/admin/map', icon: Map, label: 'Harita Analiz' },
  { href: '/admin/groups', icon: Zap, label: 'AI Gruplar' },
  { href: '/admin/polls', icon: BarChart3, label: 'Anket Yönetimi' },
  { href: '/admin/announcements', icon: Megaphone, label: 'Duyurular' },
  { href: '/admin/chat', icon: MessageSquare, label: 'Canlı Destek' },
  { href: '/admin/reports', icon: FileText, label: 'Raporlama' },
  { href: '/admin/logs', icon: Shield, label: 'Audit Log' },
  { href: '/admin/users', icon: Users, label: 'Kullanıcılar' },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuthStore()

  const handleLogout = async () => {
    await logout()
    toast.success('Çıkış yapıldı')
    router.push('/login')
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-primary-900 via-primary-800 to-violet-950 text-white flex flex-col z-40 overflow-hidden shadow-2xl shadow-primary-900/40">
      {/* Background Decor (Login Style) */}
      <div className="absolute inset-0 bg-hero-pattern opacity-10 pointer-events-none" />
      <motion.div 
        className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity }}
      />

      <div className="relative z-10 flex flex-col h-full">
        {/* Logo Area */}
        <div className="p-8">
          <Link href="/admin/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg border border-white/20">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-black tracking-tighter text-white">e-<span className="text-blue-300">Belediyem</span></div>
          </Link>
        </div>

        {/* Municipality Info */}
        <div className="mx-6 p-4 rounded-3xl bg-white/10 backdrop-blur-md border border-white/10">
          <div className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-1">BELEDİYE</div>
          <div className="text-xs font-bold text-white truncate">{user?.municipality_name}</div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto">
          {adminNav.map(({ href, icon: Icon, label }) => {
            const isActive = href === '/' 
              ? pathname === '/' 
              : pathname === href || (href !== '/admin/dashboard' && pathname.startsWith(href));
              
            return (
              <Link 
                key={href} 
                href={href} 
                className={`flex items-center gap-4 px-5 py-3 rounded-2xl text-sm font-bold transition-all ${
                  isActive 
                    ? 'bg-white text-primary-900 shadow-xl shadow-white/10' 
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-primary-900' : 'text-blue-300'}`} />
                {label}
              </Link>
            )
          })}

        </nav>

        {/* Bottom Area */}
        <div className="p-4 space-y-2 border-t border-white/5">
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
            className="flex items-center gap-4 w-full px-5 py-3 rounded-2xl text-sm font-bold text-white/60 hover:text-white hover:bg-white/5 transition-all"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-blue-300" />}
            {theme === 'dark' ? 'Açık Tema' : 'Koyu Tema'}
          </button>
          
          <div className="p-4 rounded-3xl bg-white/5 border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white font-black text-sm">
              {user?.full_name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-black text-white truncate">{user?.full_name}</div>
              <div className="text-[10px] font-bold text-blue-300 uppercase tracking-tighter">YÖNETİCİ</div>
            </div>
            <button onClick={handleLogout} className="p-2 hover:bg-red-500/10 rounded-full group transition-all">
              <LogOut className="w-4 h-4 text-white/40 group-hover:text-red-400" />
            </button>
          </div>
        </div>
      </div>
    </aside>

  )
}

