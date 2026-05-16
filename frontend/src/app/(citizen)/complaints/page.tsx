'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Filter, ChevronRight, AlertCircle, Globe, ThumbsUp } from 'lucide-react'
import api from '@/lib/api/client'
import { Complaint } from '@/types'
import { PageHeader, StatusBadge, UrgencyBadge, LoadingSkeleton, EmptyState } from '@/components/ui'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

export default function ComplaintsListPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    setLoading(true)
    api.getComplaints({ page, page_size: 10, status: statusFilter || undefined })
      .then(res => { setComplaints(res.items); setTotal(res.total); setTotalPages(res.total_pages) })
      .catch(() => {}).finally(() => setLoading(false))
  }, [page, statusFilter])

  return (
    <div>
      <PageHeader title="Şikayetlerim" description={`${total} şikayet`}
        action={<Link href="/complaints/new" className="btn-primary"><Plus className="w-4 h-4" /> Yeni Şikayet</Link>}
      />

      <div className="flex gap-2 mb-5 flex-wrap">
        {['', 'Beklemede', 'İnceleniyor', 'İlgili Birime Yönlendirildi', 'Çözüldü'].map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1) }}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
              statusFilter === s ? 'bg-primary-600 text-white' : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400'
            }`}>
            {s || 'Tümü'}
          </button>
        ))}
      </div>

      {loading ? <LoadingSkeleton rows={5} /> : complaints.length === 0 ? (
        <EmptyState icon={<AlertCircle className="w-8 h-8" />} title="Şikayet Bulunamadı"
          description="Henüz şikayet oluşturmadınız veya bu filtreye uyan şikayet yok."
          action={<Link href="/complaints/new" className="btn-primary"><Plus className="w-4 h-4" /> Şikayet Oluştur</Link>}
        />
      ) : (
        <div className="space-y-3">
          {complaints.map(c => (
            <Link key={c.id} href={`/complaints/${c.id}`}
              className="card-hover flex items-start gap-4 p-5 block">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                c.status === 'Çözüldü' ? 'bg-green-100 dark:bg-green-900/30' :
                c.status === 'İnceleniyor' ? 'bg-blue-100 dark:bg-blue-900/30' :
                'bg-amber-100 dark:bg-amber-900/30'
              }`}>
                <AlertCircle className={`w-5 h-5 ${
                  c.status === 'Çözüldü' ? 'text-green-500' :
                  c.status === 'İnceleniyor' ? 'text-blue-500' : 'text-amber-500'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-surface-900 dark:text-surface-50 line-clamp-2 mb-2">{c.description}</p>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={c.status} />
                  {c.ai_urgency_score && <UrgencyBadge score={c.ai_urgency_score} />}
                  {c.category && <span className="text-xs text-surface-400">{c.category}</span>}
                  {c.is_public && (
                    <span className="flex items-center gap-1 text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-bold">
                      <Globe className="w-3 h-3" /> Herkese Açık
                      <ThumbsUp className="w-2.5 h-2.5 ml-1" /> {c.upvote_count || 0}
                    </span>
                  )}
                  <span className="text-xs text-surface-400">
                    {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: tr })}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-surface-400 shrink-0 mt-0.5" />
            </Link>
          ))}

          {totalPages > 1 && (
            <div className="flex justify-center gap-3 pt-4">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary disabled:opacity-40">← Önceki</button>
              <span className="text-sm text-surface-500 self-center">{page}/{totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary disabled:opacity-40">Sonraki →</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
