'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPoint } from '@/types'

const STATUS_COLORS: Record<string, string> = {
  'Beklemede': '#f59e0b',
  'İnceleniyor': '#3b82f6',
  'İlgili Birime Yönlendirildi': '#8b5cf6',
  'Çözüldü': '#10b981',
}

interface ComplaintMapProps {
  points: MapPoint[]
  center?: [number, number]
  zoom?: number
  onMarkerClick?: (id: number) => void
}

export default function ComplaintMap({ points, center = [41.0082, 28.9784], zoom = 12, onMarkerClick }: ComplaintMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current).setView(center, zoom)
    mapRef.current = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map)

    points.forEach((point) => {
      const color = STATUS_COLORS[point.status] || '#6b7280'
      const urgencySize = point.urgency ? Math.min(20 + point.urgency * 2, 40) : 24

      const icon = L.divIcon({
        html: `<div style="
          width: ${urgencySize}px;
          height: ${urgencySize}px;
          background: ${color};
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          color: white;
          font-weight: bold;
        ">${point.urgency || ''}</div>`,
        className: '',
        iconSize: [urgencySize, urgencySize],
        iconAnchor: [urgencySize / 2, urgencySize / 2],
      })

      const marker = L.marker([point.lat, point.lng], { icon }).addTo(map)
      marker.bindPopup(`
        <div style="min-width: 180px; font-family: system-ui;">
          <div style="font-weight: 600; margin-bottom: 4px;">#${point.id} - ${point.status}</div>
          <div style="font-size: 12px; color: #6b7280;">${point.description}</div>
          ${point.category ? `<div style="font-size: 11px; margin-top: 4px; color: #3b82f6;">${point.category}</div>` : ''}
          ${point.urgency ? `<div style="font-size: 11px; color: ${point.urgency >= 8 ? '#ef4444' : '#f59e0b'}">Aciliyet: ${point.urgency}/10</div>` : ''}
        </div>
      `)

      if (onMarkerClick) {
        marker.on('click', () => onMarkerClick(point.id))
      }
    })

    return () => { map.remove(); mapRef.current = null }
  }, [points])

  return <div ref={containerRef} className="w-full h-full" />
}
