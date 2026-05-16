'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Search, Filter, ChevronRight, AlertCircle, Calendar, Hash } from 'lucide-react'
import api from '@/lib/api/client'
import { Complaint } from '@/types'
import { PageHeader, StatusBadge, UrgencyBadge, LoadingSkeleton, EmptyState } from '@/components/ui'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Globe, ThumbsUp } from 'lucide-react'

const STATUSES = ['Beklemede', 'İnceleniyor', 'İlgili Birime Yönlendirildi', 'Çözüldü']

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'upvotes'>('newest')

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.getComplaints({ 
        page, 
        page_size: 20, 
        status: statusFilter || undefined,
        sort: sortBy === 'upvotes' ? 'upvotes' : undefined
      })
      setComplaints(res.items)
      setTotal(res.total)
      setTotalPages(res.total_pages)
    } catch {} finally {
      setLoading(false) }
  }

  useEffect(() => { load() }, [page, statusFilter, sortBy])

  const filtered = search
    ? complaints.filter(c => c.description.toLowerCase().includes(search.toLowerCase()))
    : complaints

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <PageHeader 
          title="Şikayet Yönetimi" 
          description={`${total} vatandaş talebi ve şikayeti sistemde kayıtlı`}
        />
      </motion.div>

      {/* Filters */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.1 }}
        className="flex flex-col md:flex-row gap-4 items-center justify-between"
      >
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 group-focus-within:text-primary-500 transition-colors" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Şikayetlerde veya vatandaş adında ara..."
            className="input-field pl-11 py-3 bg-white dark:bg-surface-900 border-none shadow-sm focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Sıralama */}
          <div className="relative flex-1 md:flex-none">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
            <select 
              value={sortBy} 
              onChange={e => { setSortBy(e.target.value as any); setPage(1) }}
              className="input-field pl-11 pr-10 py-3 w-full md:w-48 appearance-none bg-white dark:bg-surface-900 border-none shadow-sm"
            >
              <option value="newest">En Yeniler</option>
              <option value="upvotes">Öne Çıkanlar (Oy)</option>
            </select>
          </div>
          
          <div className="relative flex-1 md:flex-none">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
            <select 
              value={statusFilter} 
              onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
              className="input-field pl-11 pr-10 py-3 w-full md:w-48 appearance-none bg-white dark:bg-surface-900 border-none shadow-sm"
            >
              <option value="">Tüm Durumlar</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Table Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.2 }}
      >
        {loading ? <LoadingSkeleton rows={8} /> : (
          <div className="card border-none bg-white dark:bg-surface-900 shadow-xl overflow-hidden rounded-3xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-50/50 dark:bg-surface-800/30">
                    <th className="px-6 py-5 text-[10px] font-black text-surface-400 uppercase tracking-widest border-b border-surface-100 dark:border-surface-800">
                      <div className="flex items-center gap-2"><Hash className="w-3 h-3" /> ID</div>
                    </th>
                    <th className="px-6 py-5 text-[10px] font-black text-surface-400 uppercase tracking-widest border-b border-surface-100 dark:border-surface-800">Şikayet Detayı</th>
                    <th className="px-6 py-5 text-[10px] font-black text-surface-400 uppercase tracking-widest border-b border-surface-100 dark:border-surface-800 text-center">Durum</th>
                    <th className="px-6 py-5 text-[10px] font-black text-surface-400 uppercase tracking-widest border-b border-surface-100 dark:border-surface-800">Kategori</th>
                    <th className="px-6 py-5 text-[10px] font-black text-surface-400 uppercase tracking-widest border-b border-surface-100 dark:border-surface-800 text-center">Aciliyet</th>
                    <th className="px-6 py-5 text-[10px] font-black text-surface-400 uppercase tracking-widest border-b border-surface-100 dark:border-surface-800">
                      <div className="flex items-center gap-2"><Calendar className="w-3 h-3" /> Tarih</div>
                    </th>
                    <th className="px-6 py-5 border-b border-surface-100 dark:border-surface-800"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <AlertCircle className="w-10 h-10 text-surface-200" />
                          <p className="text-sm font-bold text-surface-500">Aradığınız kriterlere uygun şikayet bulunamadı</p>
                        </div>
                      </td>
                    </tr>
                  ) : filtered.map((c, idx) => (
                    <tr key={c.id} className="group hover:bg-surface-50/50 dark:hover:bg-surface-800/20 transition-colors">
                      <td className="px-6 py-5 text-xs font-black text-surface-300 group-hover:text-primary-500 transition-colors">#{c.id}</td>
                      <td className="px-6 py-5 max-w-md">
                        <div className="flex items-start gap-2">
                          <p className="text-sm font-bold text-surface-900 dark:text-surface-50 truncate flex-1">{c.description}</p>
                          {c.is_public && (
                            <div className="flex items-center gap-1 shrink-0 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full text-[10px] font-bold" title="Herkese Açık">
                              <Globe className="w-3 h-3" />
                              <ThumbsUp className="w-2.5 h-2.5 ml-1" />
                              {c.upvote_count || 0}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="w-4 h-4 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-[8px] font-black text-surface-400">
                            {c.user_name?.charAt(0) || '?'}
                          </div>
                          <p className="text-[11px] font-medium text-surface-400">{c.user_name || 'Anonim Vatandaş'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-6 py-5">
                        <span className="inline-flex items-center px-2 py-1 rounded-lg bg-surface-100 dark:bg-surface-800 text-[10px] font-bold text-surface-600 dark:text-surface-400">
                          {c.ai_category || c.category || 'Belirlenmedi'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <UrgencyBadge score={c.ai_urgency_score} />
                      </td>
                      <td className="px-6 py-5 text-[11px] font-bold text-surface-400">
                        {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: tr })}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <Link href={`/admin/complaints/${c.id}`}
                          className="w-8 h-8 rounded-full flex items-center justify-center bg-surface-50 dark:bg-surface-800 text-surface-400 hover:bg-primary-500 hover:text-white transition-all">
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-8 py-6 bg-surface-50/30 dark:bg-surface-800/20 border-t border-surface-100 dark:border-surface-800">
                <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest">{total} toplam kayıt</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="p-2 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 disabled:opacity-30 hover:bg-surface-50 transition-colors">
                    <ChevronRight className="w-4 h-4 rotate-180" />
                  </button>
                  <div className="flex items-center px-4 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-xs font-bold">
                    {page} / {totalPages}
                  </div>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="p-2 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 disabled:opacity-30 hover:bg-surface-50 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  )
}

