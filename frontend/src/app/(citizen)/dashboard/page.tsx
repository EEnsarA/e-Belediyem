'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Clock, Plus, ChevronRight, BarChart3, Megaphone, MessageSquare, Zap, ShieldAlert, Heart, Info, ArrowRight } from 'lucide-react'
import { useAuthStore } from '@/store'
import api from '@/lib/api/client'
import { Complaint, Poll, Announcement } from '@/types'
import { StatusBadge, LoadingSkeleton } from '@/components/ui'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import DashboardChatbot from '@/components/dashboard/DashboardChatbot'

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

  const quickActions = [
    { title: 'Şikayet Oluştur', desc: 'Sorunları bildir', icon: Plus, color: 'bg-primary-500', href: '/complaints/new' },
    { title: 'İhbar Hattı', desc: 'Acil durum ihbarı', icon: ShieldAlert, color: 'bg-red-500', href: '/complaints/new?type=ihbar' },
    { title: 'Anketlere Katıl', desc: 'Kararlara ortak ol', icon: BarChart3, color: 'bg-amber-500', href: '/polls' },
    { title: 'Şikayetleri Gör', desc: 'Mahallendeki sorunlar', icon: Info, color: 'bg-blue-500', href: '/complaints' },
  ]

  return (
    <div className="animate-fade-in space-y-8">
      {/* Top Grid: Welcome & Chatbot */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3 space-y-6">
          <div className="bg-gradient-to-br from-primary-600 to-violet-700 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-primary-500/20">
            <div className="absolute inset-0 bg-hero-pattern opacity-10" />
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-2">
                {user?.municipality_logo_url && (
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md p-2 shadow-inner border border-white/20">
                    <img src={user.municipality_logo_url} alt="Logo" className="w-full h-full object-contain" />
                  </div>
                )}
                <div>
                  <h1 className="text-3xl font-display font-black">
                    Merhaba, {user?.full_name?.split(' ')[0]} 👋
                  </h1>
                  <p className="text-primary-100 text-sm">
                    {user?.municipality_name} dijital portalındasınız.
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-8">
                {quickActions.map((action) => (
                  <Link 
                    key={action.title} 
                    href={action.href}
                    className="group flex items-center gap-3 p-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl transition-all"
                  >
                    <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <action.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">{action.title}</div>
                      <div className="text-[10px] text-white/60">{action.desc}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Başvurularım', value: stats.total, icon: <Zap className="w-5 h-5" />, color: 'primary' },
              { label: 'Çözülen', value: stats.resolved, icon: <CheckCircle2 className="w-5 h-5" />, color: 'green' },
              { label: 'Devam Eden', value: stats.pending, icon: <Clock className="w-5 h-5" />, color: 'amber' },
            ].map((stat) => (
              <div key={stat.label} className="card p-4 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center
                  ${stat.color === 'primary' ? 'bg-primary-500/10 text-primary-500' : 
                    stat.color === 'green' ? 'bg-green-500/10 text-green-500' : 
                    'bg-amber-500/10 text-amber-500'}`}>
                  {stat.icon}
                </div>
                <div>
                  <div className="text-xl font-black text-surface-900 dark:text-surface-50">{stat.value}</div>
                  <div className="text-[10px] uppercase tracking-wider font-bold text-surface-400">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="xl:col-span-2">
          <DashboardChatbot />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Son şikayetler */}
        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-surface-100 dark:border-surface-800">
              <h2 className="text-lg font-black text-surface-900 dark:text-surface-50 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary-500" />
                Aktif Başvurularım
              </h2>
              <Link href="/complaints" className="text-xs font-bold text-primary-500 hover:bg-primary-50 px-3 py-1.5 rounded-lg transition-colors">
                Tümünü Gör
              </Link>
            </div>
            {loading ? (
              <div className="p-6"><LoadingSkeleton rows={3} /></div>
            ) : complaints.length === 0 ? (
              <div className="p-12 text-center">
                <AlertCircle className="w-12 h-12 text-surface-200 mx-auto mb-4" />
                <p className="text-surface-500 font-medium">Henüz bir başvurunuz bulunmuyor.</p>
              </div>
            ) : (
              <div className="divide-y divide-surface-100 dark:divide-surface-800">
                {complaints.map((complaint) => (
                  <Link key={complaint.id} href={`/complaints/${complaint.id}`}
                    className="flex items-start gap-4 p-5 hover:bg-surface-50 dark:hover:bg-surface-800/40 transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center shrink-0 group-hover:bg-white dark:group-hover:bg-surface-700 transition-colors">
                      <Info className="w-5 h-5 text-surface-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-surface-900 dark:text-surface-50 line-clamp-1">{complaint.description}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <StatusBadge status={complaint.status} />
                        <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">
                          {formatDistanceToNow(new Date(complaint.created_at), { addSuffix: true, locale: tr })}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-surface-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all shrink-0 mt-2" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sağ kolon */}
        <div className="space-y-6">
          {/* Aktif anketler */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-amber-500" />
              </div>
              <h3 className="font-black text-surface-900 dark:text-surface-50 text-sm">Kararlara Katıl</h3>
            </div>
            {polls.length === 0 ? (
              <p className="text-xs text-surface-500">Aktif anket bulunmuyor</p>
            ) : (
              <div className="space-y-3">
                {polls.map((poll) => (
                  <Link key={poll.id} href="/polls"
                    className="block p-4 rounded-2xl border border-surface-100 dark:border-surface-800 hover:border-amber-200 dark:hover:border-amber-900/30 hover:bg-amber-50/30 dark:hover:bg-amber-900/10 transition-all">
                    <p className="text-xs font-bold text-surface-900 dark:text-surface-50 mb-2">{poll.title}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-surface-400 font-bold uppercase">{poll.total_votes} KATILIM</span>
                      <span className="text-[10px] text-primary-500 font-black">KATIL →</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Son duyurular */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Megaphone className="w-4 h-4 text-blue-500" />
              </div>
              <h3 className="font-black text-surface-900 dark:text-surface-50 text-sm">Duyurular</h3>
            </div>
            <div className="space-y-4">
              {announcements.map((ann) => (
                <Link key={ann.id} href="/announcements" className="group block">
                  <p className="text-xs font-bold text-surface-900 dark:text-surface-50 group-hover:text-primary-500 transition-colors line-clamp-2">{ann.title}</p>
                  <p className="text-[10px] text-surface-400 font-bold mt-1 uppercase">
                    {formatDistanceToNow(new Date(ann.created_at), { addSuffix: true, locale: tr })}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
