'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Filter, MapPin } from 'lucide-react'
import api from '@/lib/api/client'
import { MapPoint } from '@/types'
import { PageHeader, LoadingSkeleton } from '@/components/ui'
import { useAuthStore } from '@/store'

const ComplaintMap = dynamic(() => import('@/components/map/ComplaintMap'), { ssr: false })

/* Belediye ismine göre koordinat */
const MUNICIPALITY_COORDS: Record<string, [number, number]> = {
  'Erzurum Büyükşehir Belediyesi': [39.9208, 41.2769],
  'Kadıköy Belediyesi':            [40.9920, 29.0236],
  'Çankaya Belediyesi':            [39.9032, 32.8597],
  'Konak Belediyesi':              [38.4237, 27.1428],
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  'Beklemede':                   { label: 'Beklemede',     color: '#f59e0b', bg: '#fffbeb' },
  'İnceleniyor':                 { label: 'İnceleniyor',   color: '#3b82f6', bg: '#eff6ff' },
  'İlgili Birime Yönlendirildi': { label: 'Yönlendirildi', color: '#8b5cf6', bg: '#f5f3ff' },
  'Çözüldü':                     { label: 'Çözüldü',       color: '#10b981', bg: '#f0fdf4' },
}

export default function AdminMapPage() {
  const [points,  setPoints]  = useState<MapPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState<string>('all')
  const { user } = useAuthStore()

  useEffect(() => {
    api.getMapData()
      .then((data) => setPoints(data.points || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? points : points.filter(p => p.status === filter)
  const stats = {
    total:    points.length,
    urgent:   points.filter(p => (p.urgency || 0) >= 8).length,
    resolved: points.filter(p => p.status === 'Çözüldü').length,
    pending:  points.filter(p => p.status === 'Beklemede').length,
  }

  const municipalityName   = user?.municipality_name ?? null
  const municipalityCenter = municipalityName ? (MUNICIPALITY_COORDS[municipalityName] ?? null) : null
  const mapCenter          = municipalityCenter ?? ([41.0082, 28.9784] as [number, number])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <PageHeader title="Harita Analiz" description="Şikayetlerin coğrafi dağılımı" />
        {municipalityName && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl
                          bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm">
            {user?.municipality_logo_url && (
              <img src={user.municipality_logo_url} alt="" className="w-6 h-6 object-contain rounded" />
            )}
            <MapPin className="w-4 h-4 text-red-500" />
            <span className="text-sm font-bold text-surface-700 dark:text-surface-200">{municipalityName}</span>
          </div>
        )}
      </div>

      {/* İstatistik kartları */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Toplam Nokta',  value: stats.total,    color: 'text-surface-900 dark:text-white',  dot: '#6b7280' },
          { label: 'Acil Şikayet', value: stats.urgent,   color: 'text-red-500',                      dot: '#ef4444' },
          { label: 'Bekleyen',     value: stats.pending,  color: 'text-amber-500',                    dot: '#f59e0b' },
          { label: 'Çözülen',      value: stats.resolved, color: 'text-emerald-500',                  dot: '#10b981' },
        ].map(({ label, value, color, dot }) => (
          <div key={label} className="card p-5 flex items-center gap-4">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ background: dot, boxShadow: `0 0 8px ${dot}` }} />
            <div>
              <div className={`text-2xl font-black ${color}`}>{value}</div>
              <div className="text-xs font-medium text-surface-500 mt-0.5">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filtre */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-surface-400" />
        {['all', 'Beklemede', 'İnceleniyor', 'İlgili Birime Yönlendirildi', 'Çözüldü'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
              filter === s
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200'
            }`}>
            {s === 'all' ? 'Tümü' : STATUS_LABELS[s]?.label ?? s}
          </button>
        ))}
      </div>

      {/* Renk + pin gösterge */}
      <div className="flex flex-wrap items-center gap-5 mb-4 text-xs font-medium text-surface-500">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-5 flex items-end justify-center">
            <div style={{ width: 10, height: 13, background: '#ef4444', borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%' }} />
          </div>
          <span>{municipalityName ? `${municipalityName} merkezi` : 'Belediye Merkezi'}</span>
        </div>
        {Object.entries(STATUS_LABELS).map(([, { label, color }]) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: color, boxShadow: `0 0 5px ${color}` }} />
            <span>{label}</span>
          </div>
        ))}
        <span className="text-surface-400">• Daire boyutu aciliyeti gösterir</span>
      </div>

      {/* Harita */}
      {loading ? (
        <LoadingSkeleton rows={2} />
      ) : (
        <div className="card overflow-hidden" style={{ height: '620px' }}>
          <ComplaintMap
            points={filtered}
            center={mapCenter}
            zoom={municipalityCenter ? 13 : 12}
            municipalityName={municipalityName}
            municipalityCenter={municipalityCenter}
          />
        </div>
      )}
    </div>
  )
}
