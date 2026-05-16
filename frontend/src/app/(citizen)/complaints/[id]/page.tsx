'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { MapPin, Star, CheckCircle2, Clock, ArrowRight, Search, Bot, Image as ImageIcon } from 'lucide-react'
import api from '@/lib/api/client'
import { Complaint } from '@/types'
import { StatusBadge, UrgencyBadge, LoadingSkeleton, PageHeader } from '@/components/ui'
import { formatDistanceToNow, format } from 'date-fns'
import { tr } from 'date-fns/locale'
import toast from 'react-hot-toast'

export default function ComplaintDetailPage() {
  const params = useParams()
  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState(0)
  const [submittingRating, setSubmittingRating] = useState(false)

  useEffect(() => {
    api.getComplaint(Number(params.id))
      .then(setComplaint)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [params.id])

  const submitRating = async () => {
    if (!rating || !complaint) return
    setSubmittingRating(true)
    try {
      await api.rateComplaint(complaint.id, rating)
      setComplaint({ ...complaint, satisfaction_score: rating })
      toast.success('Değerlendirmeniz kaydedildi, teşekkürler!')
    } catch {
      toast.error('Bir hata oluştu')
    } finally {
      setSubmittingRating(false)
    }
  }

  if (loading) return <div className="p-8"><LoadingSkeleton rows={5} /></div>
  if (!complaint) return <div className="p-8 text-center text-surface-500">Şikayet bulunamadı</div>

  return (
    <div>
      <PageHeader
        title={`Şikayet #${complaint.id}`}
        breadcrumb={[{ label: 'Şikayetlerim', href: '/complaints' }, { label: `#${complaint.id}` }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol */}
        <div className="lg:col-span-2 space-y-5">
          {/* Açıklama */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <StatusBadge status={complaint.status} />
              <UrgencyBadge score={complaint.ai_urgency_score} />
            </div>
            <p className="text-surface-700 dark:text-surface-300 leading-relaxed">{complaint.description}</p>
            <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-surface-100 dark:border-surface-800">
              {complaint.category && (
                <span className="text-xs bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 px-2.5 py-1 rounded-full">
                  📁 {complaint.category}
                </span>
              )}
              {complaint.address_text && (
                <span className="text-xs bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {complaint.address_text}
                </span>
              )}
              <span className="text-xs text-surface-400">
                {format(new Date(complaint.created_at), 'dd MMMM yyyy HH:mm', { locale: tr })}
              </span>
            </div>
          </div>

          {/* Fotoğraf */}
          {complaint.photo_url && (
            <div className="card overflow-hidden">
              <img src={complaint.photo_url} alt="Şikayet fotoğrafı" className="w-full max-h-72 object-cover" />
              {complaint.ai_photo_analysis && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20">
                  <div className="flex items-start gap-2">
                    <Bot className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">AI Görsel Analizi</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">{complaint.ai_photo_analysis}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Timeline */}
          <div className="card p-6">
            <h3 className="font-semibold text-surface-900 dark:text-surface-50 mb-5">Süreç Takibi</h3>
            <div className="relative">
              <div className="timeline-line" />
              <div className="space-y-6">
                {complaint.timeline.map((entry, i) => (
                  <div key={entry.id} className="flex gap-4 relative">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 shrink-0 -ml-0 
                      ${i === complaint.timeline.length - 1 ? 'bg-primary-100 dark:bg-primary-900' : 'bg-surface-100 dark:bg-surface-800'}`}>
                      {entry.new_status === 'Çözüldü' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : entry.new_status === 'İnceleniyor' ? (
                        <Search className="w-4 h-4 text-blue-500" />
                      ) : entry.new_status === 'İlgili Birime Yönlendirildi' ? (
                        <ArrowRight className="w-4 h-4 text-purple-500" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-500" />
                      )}
                    </div>
                    <div className="flex-1 pb-2">
                      <div className="flex items-center gap-2 mb-1">
                        <StatusBadge status={entry.new_status} showIcon={false} />
                        <span className="text-xs text-surface-400">
                          {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true, locale: tr })}
                        </span>
                      </div>
                      {entry.note && <p className="text-xs text-surface-500">{entry.note}</p>}
                      {entry.changed_by_name && (
                        <p className="text-xs text-surface-400 mt-0.5">— {entry.changed_by_name}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sağ */}
        <div className="space-y-5">
          {/* AI Özeti */}
          {complaint.ai_summary && (
            <div className="card p-5 border-l-4 border-primary-500">
              <div className="flex items-center gap-2 mb-2">
                <Bot className="w-4 h-4 text-primary-500" />
                <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">AI Yönetici Özeti</span>
              </div>
              <p className="text-sm text-surface-700 dark:text-surface-300">{complaint.ai_summary}</p>
            </div>
          )}

          {/* AI Analiz */}
          {complaint.ai_processed && (
            <div className="card p-5">
              <h4 className="text-sm font-semibold text-surface-900 dark:text-surface-50 mb-3">AI Analiz Sonuçları</h4>
              <div className="space-y-2">
                {complaint.ai_category && (
                  <div className="flex justify-between text-xs">
                    <span className="text-surface-500">Kategori</span>
                    <span className="text-surface-700 dark:text-surface-300 font-medium">{complaint.ai_category}</span>
                  </div>
                )}
                {complaint.ai_sentiment && (
                  <div className="flex justify-between text-xs">
                    <span className="text-surface-500">Duygu</span>
                    <span className={`font-medium ${
                      complaint.ai_sentiment === 'negative' ? 'text-red-500' :
                      complaint.ai_sentiment === 'positive' ? 'text-green-500' : 'text-amber-500'
                    }`}>
                      {complaint.ai_sentiment === 'negative' ? '😠 Olumsuz' :
                       complaint.ai_sentiment === 'positive' ? '😊 Olumlu' : '😐 Nötr'}
                    </span>
                  </div>
                )}
                {complaint.ai_urgency_score && (
                  <div className="flex justify-between text-xs">
                    <span className="text-surface-500">Aciliyet</span>
                    <div className="flex items-center gap-1">
                      <div className="w-20 h-1.5 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            complaint.ai_urgency_score >= 8 ? 'bg-red-500' :
                            complaint.ai_urgency_score >= 6 ? 'bg-orange-500' :
                            complaint.ai_urgency_score >= 4 ? 'bg-amber-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${complaint.ai_urgency_score * 10}%` }}
                        />
                      </div>
                      <span className="font-medium text-surface-700 dark:text-surface-300">{complaint.ai_urgency_score}/10</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Memnuniyet puanı */}
          {complaint.status === 'Çözüldü' && (
            <div className="card p-5">
              <h4 className="text-sm font-semibold text-surface-900 dark:text-surface-50 mb-3">Memnuniyet Değerlendirmesi</h4>
              {complaint.satisfaction_score ? (
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`w-6 h-6 ${s <= complaint.satisfaction_score! ? 'text-amber-400 fill-amber-400' : 'text-surface-300'}`} />
                  ))}
                  <span className="text-sm text-surface-500">({complaint.satisfaction_score}/5)</span>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-surface-500 mb-3">Şikayetiniz çözüldü. Memnuniyetinizi değerlendirin:</p>
                  <div className="flex gap-2 mb-3">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button key={s} onClick={() => setRating(s)}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                          s <= rating ? 'bg-amber-400' : 'bg-surface-100 dark:bg-surface-800 hover:bg-amber-100'
                        }`}>
                        <Star className={`w-5 h-5 ${s <= rating ? 'text-white' : 'text-surface-400'}`} />
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={submitRating}
                    disabled={!rating || submittingRating}
                    className="btn-primary w-full text-xs py-2"
                  >
                    Değerlendir
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
