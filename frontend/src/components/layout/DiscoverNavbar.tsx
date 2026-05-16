'use client'

import { motion } from 'framer-motion'
import {
  Trophy, ThumbsUp, BarChart3, Building2, Globe, Home, LogIn, UserPlus, ArrowRight,
  Sun, Moon, Menu, X, LogOut
} from 'lucide-react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { useState } from 'react'
import { useAuthStore } from '@/store'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface DiscoverNavbarProps {
  activeTab: 'leaderboard' | 'global' | 'polls' | 'all'
  setActiveTab: (tab: 'leaderboard' | 'global' | 'polls' | 'all') => void
  isAuthenticated: boolean
  user: any
}

export default function DiscoverNavbar({ activeTab, setActiveTab, isAuthenticated, user }: DiscoverNavbarProps) {
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const { logout } = useAuthStore()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    toast.success('Çıkış yapıldı')
    router.push('/')
  }

  const navItems = [
    { key: 'leaderboard', label: 'Liderlik', icon: Trophy, color: 'text-amber-400' },
    { key: 'global', label: 'Şikayetler', icon: ThumbsUp, color: 'text-red-400' },
    { key: 'polls', label: 'Anketler', icon: BarChart3, color: 'text-blue-400' },
    { key: 'all', label: 'Belediyeler', icon: Building2, color: 'text-emerald-400' },
  ] as const;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-primary-900/80 dark:bg-surface-950/80 backdrop-blur-xl border-b border-white/10 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/20">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <div className="text-xl font-black tracking-tighter text-white leading-none">e-<span className="text-blue-300">Belediyem</span></div>
              <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Keşif Panosu</div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                  activeTab === item.key
                    ? 'bg-white/10 text-white shadow-inner'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon className={`w-4 h-4 ${activeTab === item.key ? 'text-white' : item.color}`} />
                {item.label}
              </button>
            ))}
          </div>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all border border-white/5"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-blue-300" />}
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                <Link
                  href={user?.is_admin ? '/admin/dashboard' : '/dashboard'}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black transition-all"
                >
                  PANELİM
                </Link>
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-black text-xs border border-white/20">
                    {user?.full_name?.charAt(0) || 'U'}
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all border border-red-500/10"
                    title="Çıkış Yap"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="px-4 py-2 text-sm font-bold text-white/60 hover:text-white transition-colors">
                  Giriş Yap
                </Link>
                <Link href="/login" className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-black rounded-xl transition-all shadow-lg shadow-blue-500/20">
                  KATIL
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-3">
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
              className="p-2 rounded-lg bg-white/5"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-blue-300" />}
            </button>
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-white/60 hover:text-white">
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-primary-900 border-b border-white/10 p-4 space-y-2"
        >
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => { setActiveTab(item.key); setIsOpen(false); }}
              className={`flex items-center gap-4 w-full px-5 py-3 rounded-xl text-sm font-bold ${
                activeTab === item.key ? 'bg-white/10 text-white' : 'text-white/60'
              }`}
            >
              <item.icon className={`w-4 h-4 ${item.color}`} />
              {item.label}
            </button>
          ))}
          <div className="pt-4 mt-4 border-t border-white/10">
            {isAuthenticated ? (
              <div className="grid grid-cols-2 gap-2">
                <Link href={user?.is_admin ? '/admin/dashboard' : '/dashboard'} className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-4 rounded-xl text-center text-xs transition-all">
                  PANELİM
                </Link>
                <button 
                  onClick={handleLogout}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold py-3 px-4 rounded-xl text-center text-xs transition-all flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  ÇIKIŞ YAP
                </button>
              </div>
            ) : (
              <Link href="/login" className="btn-primary w-full py-3 text-center">
                HEMEN KATIL
              </Link>
            )}
          </div>
        </motion.div>
      )}
    </nav>
  )
}
