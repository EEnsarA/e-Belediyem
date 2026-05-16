'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Save, Bot, MapPin, Clock, User } from 'lucide-react'
import api from '@/lib/api/client'
import { Complaint, ComplaintStatus } from '@/types'
import { StatusBadge, UrgencyBadge, LoadingSkeleton, PageHeader } from '@/components/ui'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

const STATUSES: ComplaintStatus[] = ['Beklemede', 'İnceleniyor', 'İlgili Birime Yönlendirildi', 'Çözüldü']
const UNITS = ['Fen İşleri', 'Temizlik İşleri', 'Park Bahçe', 'Su İşleri', 'Elektrik İşleri', 'İmar Müdürlüğü', 'Sosyal Hizmetler']

export default function AdminComplaintDetailPage() {
  const { id } = useParams()
  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<ComplaintStatus>('Beklemede')
  const [selectedUnit, setSelectedUnit] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.getComplaint(Number(id))
      .then(c => {
        setComplaint(c)
        setSelectedStatus(c.status)
        setSelectedUnit(c.assigned_unit || '')
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  const saveStatus = async () => {
    if (!complaint) return
    setSaving(true)
    try {
      const updated = await api.updateComplaintStatus(complaint.id, selectedStatus, note, selectedUnit)
      setComplaint(updated)
      setNote('')
      toast.success('Durum güncellendi')
    } catch {
      toast.error('Güncelleme başarısız')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8"><LoadingSkeleton rows={5} /></div>
  if (!complaint) return <div className="p-8 text-center text-surface-500">Şikayet bulunamadı</div>

  return (
    <div>
      <PageHeader
        title={`Şikayet #${complaint.id}`}
        breadcrumb={[{ label: 'Şikayetler', href: '/admin/complaints' }, { label: `#${complaint.id}` }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol */}
        <div className="lg:col-span-2 space-y-5">
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <StatusBadge status={complaint.status} />
              <UrgencyBadge score={complaint.ai_urgency_score} />
            </div>
            <p className="text-surface-700 dark:text-surface-300 leading-relaxed mb-4">{complaint.description}</p>
            <div className="grid grid-cols-2 gap-3 text-xs text-surface-500">
              <div className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {complaint.user_name || 'Anonim'}</div>
              <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />
                {format(new Date(complaint.created_at), 'dd.MM.yyyy HH:mm', { locale: tr })}
              </div>
              {complaint.address_text && (
                <div className="flex items-center gap-1.5 col-span-2"><MapPin className="w-3.5 h-3.5" /> {complaint.address_text}</div>
              )}
              {complaint.assigned_unit && (
                <div className="col-span-2 text-primary-500 font-medium">🏢 {complaint.assigned_unit}</div>
              )}
            </div>
          </div>

          {/* Fotoğraf */}
          {complaint.photo_url && (
            <div className="card overflow-hidden">
              <img src={complaint.photo_url} alt="Şikayet fotoğrafı" className="w-full max-h-72 object-cover" />
              {complaint.ai_photo_analysis && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20">
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">🤖 Görsel AI Analizi</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">{complaint.ai_photo_analysis}</p>
                </div>
              )}
            </div>
          )}

          {/* Timeline */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Süreç Geçmişi</h3>
            <div className="space-y-3">
              {complaint.timeline.map(t => (
                <div key={t.id} className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 shrink-0" />
                  <div>
                    <StatusBadge status={t.new_status} />
                    {t.note && <p className="text-xs text-surface-500 mt-1">{t.note}</p>}
                    <p className="text-xs text-surface-400 mt-0.5">
                      {t.changed_by_name && `${t.changed_by_name} · `}
                      {format(new Date(t.created_at), 'dd.MM.yyyy HH:mm', { locale: tr })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sağ - Admin İşlemleri */}
        <div className="space-y-5">
          {/* Durum güncelleme */}
          <div className="card p-5">
            <h4 className="font-semibold text-surface-900 dark:text-surface-50 mb-4">Durum Güncelle</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-surface-500 mb-1">Yeni Durum</label>
                <select value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value as ComplaintStatus)}
                  className="input-field">
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-500 mb-1">Birim Atama</label>
                <select value={selectedUnit} onChange={e => setSelectedUnit(e.target.value)} className="input-field">
                  <option value="">Birim Seçin</option>
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-500 mb-1">Not</label>
                <textarea value={note} onChange={e => setNote(e.target.value)}
                  placeholder="İşlem notu..." rows={3} className="input-field resize-none" />
              </div>
              <button onClick={saveStatus} disabled={saving} className="btn-primary w-full">
                <Save className="w-4 h-4" />
                {saving ? 'Kaydediliyor...' : 'Güncelle'}
              </button>
            </div>
          </div>

          {/* AI Analiz */}
          {complaint.ai_processed && (
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Bot className="w-4 h-4 text-primary-500" />
                <h4 className="font-semibold text-sm">AI Analiz</h4>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-surface-500">Kategori</span><span className="font-medium">{complaint.ai_category || '—'}</span></div>
                <div className="flex justify-between"><span className="text-surface-500">Duygu</span><span>{complaint.ai_sentiment || '—'}</span></div>
                <div className="flex justify-between"><span className="text-surface-500">Aciliyet</span><span className="font-bold text-red-500">{complaint.ai_urgency_score}/10</span></div>
                {complaint.ai_summary && (
                  <div className="mt-3 p-2 bg-surface-50 dark:bg-surface-800 rounded-lg">
                    <p className="text-surface-600 dark:text-surface-400 leading-relaxed">{complaint.ai_summary}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
