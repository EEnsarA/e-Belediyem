'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Filter, Map } from 'lucide-react'
import api from '@/lib/api/client'
import { MapPoint } from '@/types'
import { PageHeader, LoadingSkeleton } from '@/components/ui'

const ComplaintMap = dynamic(() => import('@/components/map/ComplaintMap'), { ssr: false })

export default function AdminMapPage() {
  const [points, setPoints] = useState<MapPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    api.getMapData()
      .then((data) => setPoints(data.points || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? points : points.filter(p => p.status === filter)
  const stats = {
    total: points.length,
    urgent: points.filter(p => (p.urgency || 0) >= 8).length,
    resolved: points.filter(p => p.status === 'Çözüldü').length,
  }

  return (
    <div>
      <PageHeader title="Harita Analiz" description="Şikayetlerin coğrafi dağılımı" />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-surface-900 dark:text-surface-50">{stats.total}</div>
          <div className="text-xs text-surface-500">Toplam Nokta</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-red-500">{stats.urgent}</div>
          <div className="text-xs text-surface-500">Acil Şikayet</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-green-500">{stats.resolved}</div>
          <div className="text-xs text-surface-500">Çözülen</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-surface-500" />
        {['all', 'Beklemede', 'İnceleniyor', 'İlgili Birime Yönlendirildi', 'Çözüldü'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filter === s ? 'bg-primary-600 text-white' : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400'
            }`}>
            {s === 'all' ? 'Tümü' : s}
          </button>
        ))}
      </div>

      {/* Renk göstergesi */}
      <div className="flex items-center gap-4 mb-4 text-xs">
        {[
          { color: '#f59e0b', label: 'Beklemede' },
          { color: '#3b82f6', label: 'İnceleniyor' },
          { color: '#8b5cf6', label: 'Yönlendirildi' },
          { color: '#10b981', label: 'Çözüldü' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: color }} />
            <span className="text-surface-500">{label}</span>
          </div>
        ))}
        <span className="text-surface-400 ml-2">• Daire boyutu aciliyeti gösterir</span>
      </div>

      {loading ? (
        <LoadingSkeleton rows={2} />
      ) : (
        <div className="card overflow-hidden" style={{ height: '600px' }}>
          <ComplaintMap points={filtered} />
        </div>
      )}
    </div>
  )
}
