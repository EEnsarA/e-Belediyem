'use client'

import { motion } from 'framer-motion'
import {
  Trophy, ThumbsUp, BarChart3, Building2, Globe, Home, LogIn, UserPlus, ArrowRight,
  Sun, Moon
} from 'lucide-react'
import Link from 'next/link'
import { useTheme } from 'next-themes'

interface DiscoverSidebarProps {
  activeTab: 'leaderboard' | 'global' | 'polls' | 'all'
  setActiveTab: (tab: 'leaderboard' | 'global' | 'polls' | 'all') => void
  isAuthenticated: boolean
  user: any
}

export default function DiscoverSidebar({ activeTab, setActiveTab, isAuthenticated, user }: DiscoverSidebarProps) {
  const { theme, setTheme } = useTheme()
  const navItems = [
    { key: 'leaderboard', label: 'Liderlik Tablosu', icon: Trophy, color: 'text-amber-400' },
    { key: 'global', label: 'Öne Çıkan Şikayetler', icon: ThumbsUp, color: 'text-red-400' },
    { key: 'polls', label: 'Faaliyetler ve Anketler', icon: BarChart3, color: 'text-blue-400' },
    { key: 'all', label: 'Tüm Belediyeler', icon: Building2, color: 'text-emerald-400' },
  ] as const;

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-primary-900 via-primary-800 to-violet-950 text-white flex flex-col z-40 overflow-hidden shadow-2xl border-r border-white/5">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-hero-pattern opacity-5 pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full">
        {/* Logo Area */}
        <div className="p-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg border border-white/20">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <div className="text-xl font-black tracking-tighter text-white leading-none">e-<span className="text-blue-300">Belediyem</span></div>
              <div className="text-[10px] font-bold text-white/40 mt-1 uppercase tracking-widest">Keşif Panosu</div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] px-5 mb-4">PLATFORM KEŞFİ</div>
          
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`flex items-center gap-4 w-full px-5 py-3.5 rounded-2xl text-sm font-bold transition-all group ${
                activeTab === item.key
                  ? 'bg-white text-primary-900 shadow-xl shadow-white/5'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className={`w-4 h-4 shrink-0 transition-colors ${
                activeTab === item.key ? 'text-primary-900' : item.color
              }`} />
              <span className="flex-1 text-left">{item.label}</span>
              {activeTab === item.key && (
                <motion.div layoutId="active-pill" className="w-1.5 h-1.5 rounded-full bg-primary-600" />
              )}
            </button>
          ))}

          <div className="pt-8 text-[10px] font-black text-white/30 uppercase tracking-[0.2em] px-5 mb-4">HIZLI ERİŞİM</div>
          
          {isAuthenticated ? (
            <Link
              href={user?.is_admin ? '/admin/dashboard' : '/dashboard'}
              className="flex items-center gap-4 w-full px-5 py-3.5 rounded-2xl text-sm font-bold text-white/60 hover:text-white hover:bg-white/5 transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-primary-500/20 transition-colors">
                <Home className="w-4 h-4 text-blue-300" />
              </div>
              Panelime Git
              <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="flex items-center gap-4 w-full px-5 py-3.5 rounded-2xl text-sm font-bold text-white/60 hover:text-white hover:bg-white/5 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-primary-500/20 transition-colors">
                  <LogIn className="w-4 h-4 text-blue-300" />
                </div>
                Giriş Yap
              </Link>
              <Link
                href="/login"
                className="flex items-center gap-4 w-full px-5 py-3.5 rounded-2xl text-sm font-bold text-white/60 hover:text-white hover:bg-white/5 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-primary-500/20 transition-colors">
                  <UserPlus className="w-4 h-4 text-emerald-300" />
                </div>
                Kayıt Ol
              </Link>
            </>
          )}
        </nav>

        {/* Theme Toggle */}
        <div className="px-6 pb-2">
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
            className="flex items-center gap-4 w-full px-5 py-3 rounded-2xl text-sm font-bold text-white/60 hover:text-white hover:bg-white/5 transition-all border border-white/5"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-blue-300" />}
            <span className="flex-1 text-left">{theme === 'dark' ? 'Açık Tema' : 'Koyu Tema'}</span>
          </button>
        </div>

        {/* User Status Section */}
        <div className="p-6">
          {isAuthenticated ? (
            <div className="p-4 rounded-[2rem] bg-white/5 border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-black text-sm shadow-inner border border-white/20">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-black text-white truncate">{user?.full_name}</div>
                <div className="text-[10px] font-bold text-blue-300 uppercase tracking-tighter">
                  {user?.is_admin ? 'YÖNETİCİ' : 'VATANDAŞ'}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-[2rem] bg-gradient-to-br from-white/5 to-transparent border border-white/10 text-center">
              <div className="text-xs font-black text-white mb-1">Misafir Oturumu</div>
              <div className="text-[10px] font-medium text-white/40 mb-4">Giriş yaparak tüm özelliklere erişin</div>
              <Link 
                href="/login"
                className="inline-block w-full py-2 bg-blue-500 hover:bg-blue-600 text-white text-[11px] font-black rounded-xl transition-all shadow-lg shadow-blue-500/20"
              >
                HEMEN KATIL
              </Link>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
