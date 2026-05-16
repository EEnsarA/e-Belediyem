'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import {
  AlertCircle, CheckCircle2, Clock, MessageSquare, Zap, TrendingUp,
  BarChart3, Download, FileText, Bot, ArrowUp, ArrowDown
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts'
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false })
import api from '@/lib/api/client'
import { AdminDashboard } from '@/types'
import { StatCard, LoadingSkeleton, PageHeader } from '@/components/ui'
import { StatusBadge } from '@/components/ui'
import Link from 'next/link'

const STATUS_COLORS = ['#f59e0b', '#3b82f6', '#8b5cf6', '#10b981']

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboard | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getAdminDashboard()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="animate-pulse">
      <div className="h-10 w-48 bg-surface-200 dark:bg-surface-800 rounded-full mb-8" />
      <div className="grid grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-surface-100 dark:bg-surface-800/50 rounded-3xl" />)}
      </div>
      <div className="h-64 bg-surface-100 dark:bg-surface-800/50 rounded-3xl" />
    </div>
  )

  if (!data) return <div className="text-center text-surface-500 py-20">Veri yüklenemedi</div>

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <PageHeader 
          title="Yönetim Paneli" 
          description={new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        />
        <Link href="/admin/reports" className="btn-primary">
          <Download className="w-4 h-4" /> Veri Raporu Al
        </Link>
      </div>

      {/* Main Stats Area */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="card p-6 bg-gradient-to-br from-white to-surface-50 dark:from-surface-900 dark:to-surface-950 border-none shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-primary-500" />
              </div>
              <span className="text-xs font-bold text-primary-600 bg-primary-50 dark:bg-primary-900/30 px-2 py-1 rounded-full">+12%</span>
            </div>
            <div className="text-3xl font-black text-surface-900 dark:text-surface-50 mb-1">{data.stats.total_complaints}</div>
            <div className="text-xs font-medium text-surface-500 uppercase tracking-wider">Toplam Şikayet</div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="card p-6 bg-gradient-to-br from-white to-surface-50 dark:from-surface-900 dark:to-surface-950 border-none shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <span className="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">{data.stats.resolution_rate}%</span>
            </div>
            <div className="text-3xl font-black text-surface-900 dark:text-surface-50 mb-1">%{data.stats.resolution_rate}</div>
            <div className="text-xs font-medium text-surface-500 uppercase tracking-wider">Çözüm Oranı</div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="card p-6 bg-gradient-to-br from-white to-surface-50 dark:from-surface-900 dark:to-surface-950 border-none shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
            </div>
            <div className="text-3xl font-black text-surface-900 dark:text-surface-50 mb-1">{data.stats.pending_complaints}</div>
            <div className="text-xs font-medium text-surface-500 uppercase tracking-wider">Bekleyen Şikayet</div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="card p-6 bg-gradient-to-br from-white to-surface-50 dark:from-surface-900 dark:to-surface-950 border-none shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-red-500" />
              </div>
            </div>
            <div className="text-3xl font-black text-surface-900 dark:text-surface-50 mb-1">{data.stats.urgent_complaints}</div>
            <div className="text-xs font-medium text-surface-500 uppercase tracking-wider">Acil Durum</div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sol kolon: Şikayet Eğilimi + Haftalık Özet */}
        <div className="lg:col-span-2 space-y-6">
          {/* Şikayet Eğilimi */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-lg font-bold text-surface-900 dark:text-surface-50">Şikayet Eğilimi</h3>
              <div className="flex items-center gap-4 text-xs font-medium text-surface-400">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-primary-500" /> Şikayet</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500" /> Çözülen</div>
              </div>
            </div>
            <div className="card p-8 min-h-[300px]">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data.weekly_trend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Line type="monotone" dataKey="complaints" stroke="#14b8a6" strokeWidth={4} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                  <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={4} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Haftalık Özet — şikayet eğiliminin altında, aynı hizada */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-surface-900 dark:text-surface-50 px-2">Haftalık Özet</h3>
            <div className="card p-8 bg-surface-900 text-white border-none relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary-500/30 transition-all" />
              <div className="relative z-10 flex items-start gap-5">
                <div className="w-12 h-12 bg-primary-500 rounded-2xl flex items-center justify-center shrink-0">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-primary-400 uppercase tracking-widest mb-3">Yapay Zeka Brifingi</div>
                  <p className="text-sm text-surface-300 leading-relaxed font-medium italic">
                    "{data.ai_summary || "Gemini analizi hazır. Şikayetlerinizdeki trendler ve çözüm önerileri burada yer alacak."}"
                  </p>
                  <div className="flex items-center gap-3 mt-5 pt-5 border-t border-surface-800">
                    <div className="w-8 h-8 rounded-full bg-surface-800 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-primary-400" />
                    </div>
                    <div className="text-xs text-surface-400 font-medium">Bu hafta %15 daha hızlı aksiyon alındı.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sağ kolon: Durum dağılımı */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-surface-900 dark:text-surface-50 px-2">Durum Dağılımı</h3>
          <div className="card p-6 space-y-3">
            {data.by_status.map(({ status, count, percentage }) => (
              <div key={status}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="font-semibold text-surface-700 dark:text-surface-300 truncate pr-2">{status}</span>
                  <span className="font-black text-surface-900 dark:text-white shrink-0">{count}</span>
                </div>
                <div className="h-2 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${percentage}%`, background: 'linear-gradient(90deg,#14b8a6,#10b981)' }}
                  />
                </div>
              </div>
            ))}
          </div>

          <h3 className="text-lg font-bold text-surface-900 dark:text-surface-50 px-2 pt-4">Kategori Dağılımı</h3>
          <div className="card p-6 space-y-2">
            {data.by_category.slice(0, 6).map(({ category, count }) => (
              <div key={category} className="flex items-center justify-between py-1">
                <span className="text-sm font-medium text-surface-600 dark:text-surface-400 truncate pr-2">{category}</span>
                <span className="text-sm font-black text-surface-900 dark:text-white shrink-0"
                  style={{ color: count > 3 ? '#ef4444' : count > 1 ? '#f59e0b' : '#10b981' }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>


    </div>
  )
}
