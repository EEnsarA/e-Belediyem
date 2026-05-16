'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { MapPin } from 'lucide-react'
import api from '@/lib/api/client'
import { MapPoint } from '@/types'
import { PageHeader, LoadingSkeleton } from '@/components/ui'

const ComplaintMap = dynamic(() => import('@/components/map/ComplaintMap'), { ssr: false })

export default function CitizenMapPage() {
  const [points, setPoints] = useState<MapPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Vatandaş için kendi şikayetlerini haritada göster
    api.getComplaints({ page_size: 100 })
      .then(data => {
        const mapPoints: MapPoint[] = data.items
          .filter((c: any) => c.latitude && c.longitude)
          .map((c: any) => ({
            id: c.id, lat: c.latitude, lng: c.longitude,
            status: c.status, category: c.category,
            urgency: c.ai_urgency_score, description: c.description,
          }))
        setPoints(mapPoints)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <PageHeader title="Harita Görünümü" description="Şikayetlerinizin konumlarını görüntüleyin" />
      {loading ? <LoadingSkeleton rows={2} /> : (
        <div className="card overflow-hidden" style={{ height: '500px' }}>
          {points.length === 0 ? (
            <div className="flex items-center justify-center h-full flex-col gap-3 text-surface-400">
              <MapPin className="w-12 h-12" />
              <p>Konum bilgisi olan şikayet bulunmuyor</p>
            </div>
          ) : <ComplaintMap points={points} />}
        </div>
      )}
    </div>
  )
}
