'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Clock, Plus, ChevronRight, BarChart3, Megaphone, MessageSquare, Zap } from 'lucide-react'
import { useAuthStore } from '@/store'
import api from '@/lib/api/client'
import { Complaint, Poll, Announcement } from '@/types'
import { StatusBadge, LoadingSkeleton } from '@/components/ui'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [polls, setPolls] = useState<Poll[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [c, p, a] = await Promise.all([
          api.getComplaints({ page_size: 5 }),
          api.getPolls(),
          api.getAnnouncements(),
        ])
        setComplaints(c.items || [])
        setPolls(p.slice(0, 3))
        setAnnouncements(a.slice(0, 3))
      } catch {} finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const stats = {
    total: complaints.length,
    resolved: complaints.filter(c => c.status === 'Çözüldü').length,
    pending: complaints.filter(c => c.status === 'Beklemede').length,
  }

  return (
    <div className="animate-fade-in">
      {/* Welcome */}
      <div className="bg-gradient-to-br from-primary-600 to-violet-700 rounded-2xl p-7 mb-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-pattern opacity-10" />
        <div className="relative">
          <h1 className="text-2xl font-display font-bold mb-1">
            Merhaba, {user?.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="text-primary-100 text-sm">
            {user?.municipality_name} vatandaş portalına hoş geldiniz
          </p>
        </div>
        <div className="relative mt-5 flex flex-wrap gap-3">
          <Link href="/complaints/new" className="inline-flex items-center gap-2 bg-white text-primary-700 font-semibold px-4 py-2.5 rounded-xl text-sm hover:bg-primary-50 transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Şikayet Oluştur
          </Link>
          <Link href="/chat" className="inline-flex items-center gap-2 bg-white/10 text-white font-semibold px-4 py-2.5 rounded-xl text-sm hover:bg-white/20 transition-colors border border-white/20">
            <MessageSquare className="w-4 h-4" /> AI Destek
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Toplam Şikayet', value: stats.total, icon: <AlertCircle className="w-5 h-5" />, color: 'blue' },
          { label: 'Çözülen', value: stats.resolved, icon: <CheckCircle2 className="w-5 h-5" />, color: 'green' },
          { label: 'Bekleyen', value: stats.pending, icon: <Clock className="w-5 h-5" />, color: 'amber' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <div className="card p-5">
              <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center text-white
                ${stat.color === 'blue' ? 'bg-primary-500' : stat.color === 'green' ? 'bg-green-500' : 'bg-amber-500'}`}>
                {stat.icon}
              </div>
              <div className="text-2xl font-display font-bold text-surface-900 dark:text-surface-50">{stat.value}</div>
              <div className="text-xs text-surface-500">{stat.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Son şikayetler */}
        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-surface-100 dark:border-surface-800">
              <h2 className="font-display font-bold text-surface-900 dark:text-surface-50">Son Şikayetlerim</h2>
              <Link href="/complaints" className="text-xs text-primary-500 hover:text-primary-600 flex items-center gap-1">
                Tümü <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            {loading ? (
              <div className="p-5"><LoadingSkeleton rows={3} /></div>
            ) : complaints.length === 0 ? (
              <div className="p-10 text-center">
                <AlertCircle className="w-10 h-10 text-surface-300 mx-auto mb-3" />
                <p className="text-sm text-surface-500">Henüz şikayet oluşturmadınız</p>
                <Link href="/complaints/new" className="btn-primary mt-4 text-xs px-4 py-2">
                  <Plus className="w-3 h-3" /> İlk şikayetini oluştur
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-surface-100 dark:divide-surface-800">
                {complaints.map((complaint) => (
                  <Link key={complaint.id} href={`/complaints/${complaint.id}`}
                    className="flex items-start gap-3 p-4 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-surface-900 dark:text-surface-50 line-clamp-1">{complaint.description}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <StatusBadge status={complaint.status} />
                        {complaint.ai_urgency_score && complaint.ai_urgency_score >= 7 && (
                          <span className="text-xs text-red-500 font-medium">⚡ Acil</span>
                        )}
                        <span className="text-xs text-surface-400">
                          {formatDistanceToNow(new Date(complaint.created_at), { addSuffix: true, locale: tr })}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-surface-400 shrink-0 mt-0.5" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sağ kolon */}
        <div className="space-y-5">
          {/* Aktif anketler */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-primary-500" />
              <h3 className="font-semibold text-surface-900 dark:text-surface-50 text-sm">Aktif Anketler</h3>
            </div>
            {polls.length === 0 ? (
              <p className="text-xs text-surface-500">Aktif anket bulunmuyor</p>
            ) : polls.map((poll) => (
              <Link key={poll.id} href="/polls"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors mb-1.5">
                <div>
                  <p className="text-xs font-medium text-surface-900 dark:text-surface-50 line-clamp-1">{poll.title}</p>
                  <p className="text-xs text-surface-400">{poll.total_votes} oy</p>
                </div>
                {poll.user_voted ? (
                  <span className="text-xs text-green-500 font-medium">✓ Oyladım</span>
                ) : (
                  <span className="text-xs text-primary-500 font-medium">Oy Ver →</span>
                )}
              </Link>
            ))}
          </div>

          {/* Son duyurular */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Megaphone className="w-4 h-4 text-amber-500" />
              <h3 className="font-semibold text-surface-900 dark:text-surface-50 text-sm">Son Duyurular</h3>
            </div>
            {announcements.length === 0 ? (
              <p className="text-xs text-surface-500">Duyuru bulunmuyor</p>
            ) : announcements.map((ann) => (
              <Link key={ann.id} href="/announcements"
                className="block p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors mb-1.5">
                {ann.is_pinned && <span className="text-xs text-amber-500 font-medium">📌 Sabitlenmiş</span>}
                <p className="text-xs font-medium text-surface-900 dark:text-surface-50 line-clamp-2">{ann.title}</p>
                <p className="text-xs text-surface-400 mt-0.5">
                  {formatDistanceToNow(new Date(ann.created_at), { addSuffix: true, locale: tr })}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
