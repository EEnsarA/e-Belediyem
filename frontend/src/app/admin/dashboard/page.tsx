'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import {
  AlertCircle, CheckCircle2, Clock, MessageSquare, Zap, TrendingUp,
  BarChart3, Download, FileText, Bot, ArrowUp, ArrowDown
} from 'lucide-react'
import { StatusBadge } from '@/components/ui'
import Link from 'next/link'

const STATUS_COLORS = ['#f59e0b', '#3b82f6', '#8b5cf6', '#10b981']

const DashboardChart = dynamic(() => import('@/components/charts/DashboardChart'), { ssr: false })

import api from '@/lib/api/client'
import { AdminDashboard, EarlyWarningResponse } from '@/types'
import { StatCard, LoadingSkeleton, PageHeader } from '@/components/ui'

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboard | null>(null)
  const [earlyWarnings, setEarlyWarnings] = useState<EarlyWarningResponse | null>(null)
  const [aiBriefing, setAiBriefing] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Ana veriler
    api.getAdminDashboard()
      .then(setData)
      .catch(() => { })
      .finally(() => setLoading(false))

    // Radar arka planda taranır, sayfayı bloke etmez
    api.getEarlyWarnings()
      .then(setEarlyWarnings)
      .catch(() => { })

    // AI Brifing arka planda taranır
    api.getAiBriefing()
      .then(res => setAiBriefing(res.summary))
      .catch(() => { })
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

      {/* AI Erken Uyarı Radarı */}
      {earlyWarnings && earlyWarnings.alerts.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/10 border border-red-100 dark:border-red-900/30 rounded-3xl p-6 shadow-sm">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <AlertCircle className="w-32 h-32 text-red-500 animate-pulse" />
          </div>

          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </div>
            <h3 className="text-red-600 dark:text-red-400 font-black tracking-wide uppercase text-sm">AI Erken Uyarı Radarı</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
            {earlyWarnings.alerts.map((alert, i) => (
              <div key={i} className="bg-white/60 dark:bg-surface-900/60 backdrop-blur-md p-5 rounded-2xl border border-red-100 dark:border-red-900/20 hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-bold text-surface-900 dark:text-surface-50 text-sm">{alert.title}</h4>
                  <span className={`text-[10px] uppercase font-black px-2 py-1 rounded-lg ${alert.risk_level === 'high' ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400' :
                      'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400'
                    }`}>
                    {alert.location}
                  </span>
                </div>
                <p className="text-xs text-surface-600 dark:text-surface-400 mb-4 leading-relaxed">{alert.description}</p>
                <div className="bg-white dark:bg-surface-800 p-3 rounded-xl border border-red-100 dark:border-red-900/20 text-xs text-red-600 dark:text-red-400 font-medium flex items-start gap-2">
                  <Zap className="w-4 h-4 shrink-0 mt-0.5" />
                  <span><strong className="font-bold">Öneri:</strong> {alert.action_recommended}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

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
            <div className="card p-8 min-h-[350px] flex flex-col">
              <DashboardChart data={data.weekly_trend} />
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
                  {aiBriefing ? (
                    <p className="text-sm text-surface-300 leading-relaxed font-medium italic">
                      "{aiBriefing}"
                    </p>
                  ) : (
                    <div className="space-y-2 animate-pulse mt-2">
                      <div className="h-4 bg-surface-800 rounded w-full"></div>
                      <div className="h-4 bg-surface-800 rounded w-5/6"></div>
                      <div className="h-4 bg-surface-800 rounded w-4/6"></div>
                      <div className="text-xs text-surface-500 mt-2 font-medium">Yapay zeka verileri sentezliyor...</div>
                    </div>
                  )}
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
        <div className="space-y-6">
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
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-surface-900 dark:text-surface-50 px-2">Kategori Dağılımı</h3>
            <div className="card p-6 space-y-2">
              {/* Değiştireceğin Alan Başlangıcı */}
              {data.by_category.slice(0, 6).map(({ category, count }) => {
                // Baştaki "ComplaintCategory." kısmını siler
                let cleanCategory = category.replace('ComplaintCategory.', '');

                // Sondaki yapışık sayıyı (örn: 3) temizler
                if (cleanCategory.endsWith(count.toString())) {
                  cleanCategory = cleanCategory.slice(0, -count.toString().length);
                }

                // Baş harfi büyük, kalanı küçük yapar (ELECTRICITY -> Electricity)
                const formattedCategory = cleanCategory.charAt(0).toUpperCase() + cleanCategory.slice(1).toLowerCase();

                return (
                  <div key={category} className="flex items-center justify-between py-1">
                    <span className="text-sm font-medium text-surface-600 dark:text-surface-400 truncate pr-2">
                      {formattedCategory}
                    </span>
                    <span
                      className="text-sm font-black text-surface-900 dark:text-white shrink-0"
                      style={{ color: count > 3 ? '#ef4444' : count > 1 ? '#f59e0b' : '#10b981' }}
                    >
                      {count}
                    </span>
                  </div>
                );
              })}
              {/* Değiştireceğin Alan Bitişi */}
            </div>
          </div>
        </div>
      </div>

      {/* Urgent Tasks */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-lg font-bold text-surface-900 dark:text-surface-50">Öncelikli Aksiyonlar</h3>
          <Link href="/admin/complaints" className="text-sm font-bold text-primary-500 hover:text-primary-600 transition-colors">Tümünü Gör →</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.recent_urgent.slice(0, 4).map((c) => (
            <Link key={c.id} href={`/admin/complaints/${c.id}`} className="card p-6 flex items-center gap-6 hover:border-primary-500/50 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-tighter text-red-500 bg-red-50 dark:bg-red-900/30 px-1.5 py-0.5 rounded">ACİL</span>
                  <span className="text-xs text-surface-400">{new Date(c.created_at).toLocaleDateString('tr-TR')}</span>
                </div>
                <p className="text-sm font-bold text-surface-900 dark:text-surface-50 truncate">{c.description}</p>
              </div>
              <StatusBadge status={c.status as any} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
