'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPoint } from '@/types'

const STATUS_COLORS: Record<string, string> = {
  'Beklemede':                    '#f59e0b',
  'İnceleniyor':                  '#3b82f6',
  'İlgili Birime Yönlendirildi':  '#8b5cf6',
  'Çözüldü':                      '#10b981',
}

/* Şikayetleri merkez etrafına spiral şeklinde dağıt */
function scatterAroundCenter(
  index: number,
  total: number,
  center: [number, number],
): [number, number] {
  const rings      = Math.max(3, Math.ceil(Math.sqrt(total)))
  const ring       = Math.floor(index / rings)
  const posInRing  = index % rings
  const baseRadius = 0.009 + ring * 0.006
  const angle      = (posInRing / rings) * 2 * Math.PI + ring * 0.9
  const jitter     = ((index * 13) % 9 - 4) * 0.0004
  return [
    center[0] + (baseRadius + jitter) * Math.sin(angle),
    center[1] + (baseRadius + jitter) * Math.cos(angle),
  ]
}

/* Google Maps tarzı konum pini — tam fotoğraftaki gibi */
function googlePin(color: string, label: string): string {
  const shortLabel = label.length > 16 ? label.slice(0, 14) + '…' : label
  /* Rengin açık tonu — iç daire için */
  return `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    ">
      <!-- Kategori etiketi -->
      <div style="
        background: ${color};
        color: white;
        font-size: 9px;
        font-weight: 800;
        font-family: system-ui, -apple-system, sans-serif;
        padding: 2px 8px;
        border-radius: 999px;
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(0,0,0,0.25);
        letter-spacing: 0.02em;
        line-height: 1.5;
      ">${shortLabel}</div>

      <!-- Google Maps pin SVG -->
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22" height="30"
        viewBox="0 0 52 68"
        style="filter: drop-shadow(0 3px 5px rgba(0,0,0,0.40))"
      >
        <!-- Gövde -->
        <path
          d="M26 0C11.641 0 0 11.641 0 26
             C0 45.5 24.05 67.1 25.05 67.9
             a1.5 1.5 0 0 0 1.9 0
             C27.95 67.1 52 45.5 52 26
             C52 11.641 40.359 0 26 0z"
          fill="${color}"
        />
        <!-- Beyaz iç daire (highlight) -->
        <circle cx="26" cy="24" r="13" fill="white" opacity="0.25"/>
        <!-- Büyük beyaz daire -->
        <circle cx="26" cy="24" r="11" fill="white"/>
        <!-- Merkez nokta — pin rengi -->
        <circle cx="26" cy="24" r="5.5" fill="${color}"/>
      </svg>
    </div>
  `
}

interface Props {
  points: MapPoint[]
  center?: [number, number]
  zoom?: number
  onMarkerClick?: (id: number) => void
  municipalityName?: string | null
  municipalityCenter?: [number, number] | null
}

export default function ComplaintMap({
  points,
  center = [41.0082, 28.9784],
  zoom = 13,
  onMarkerClick,
  municipalityCenter,
}: Props) {
  const mapRef       = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const mapCenter: [number, number] = municipalityCenter ?? center
    const map = L.map(containerRef.current, { zoomControl: true }).setView(mapCenter, zoom)
    mapRef.current = map

    /* Renkli & modern tile — CartoDB Voyager */
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      { attribution: '© OpenStreetMap © CARTO', maxZoom: 19 }
    ).addTo(map)

    /* ── Şikayet pinleri ── */
    points.forEach((point, i) => {
      const color = STATUS_COLORS[point.status] || '#6b7280'

      /* Koordinat geçerli mi? null veya 0 ise scatter uygula */
      const hasRealCoords =
        point.lat != null && point.lng != null &&
        Math.abs(point.lat) > 0.1 && Math.abs(point.lng) > 0.1

      const [lat, lng] = hasRealCoords
        ? [point.lat as number, point.lng as number]
        : scatterAroundCenter(i, points.length, mapCenter)

      /* Kısa etiket */
      const label = point.category
        ? point.category.split(' ')[0]
        : point.status.split(' ')[0]

      const html = googlePin(color, label)

      /* iconSize geniş çünkü etiket taşıyor; anchor pinin tam ucunda */
      const icon = L.divIcon({
        html,
        className: '',
        iconSize:   [100, 52],
        iconAnchor: [50, 52],       // alt orta = pin ucu
        popupAnchor:[0, -54],
      })

      const marker = L.marker([lat, lng], { icon }).addTo(map)

      marker.bindPopup(`
        <div style="min-width:220px;font-family:system-ui;padding:6px 2px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <div style="width:12px;height:12px;border-radius:50%;flex-shrink:0;
              background:${color};box-shadow:0 0 6px ${color}88"></div>
            <span style="font-weight:800;font-size:13px;color:#1e293b">${point.status}</span>
            ${point.urgency && point.urgency >= 8
              ? `<span style="margin-left:auto;font-size:10px;font-weight:800;color:#ef4444;
                  background:#fef2f2;padding:2px 8px;border-radius:999px">⚡ ACİL</span>`
              : ''}
          </div>
          <p style="font-size:12px;color:#475569;margin:0 0 10px;line-height:1.5">${point.description}</p>
          <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center">
            ${point.category
              ? `<span style="font-size:11px;font-weight:700;color:white;
                  background:${color};padding:2px 10px;border-radius:999px">${point.category}</span>`
              : ''}
            ${point.urgency
              ? `<span style="font-size:11px;font-weight:700;
                  color:${point.urgency >= 8 ? '#ef4444' : '#f59e0b'}">
                  Aciliyet: ${point.urgency}/10</span>`
              : ''}
          </div>
        </div>
      `, { maxWidth: 270 })

      if (onMarkerClick) marker.on('click', () => onMarkerClick(point.id))
    })

    return () => { map.remove(); mapRef.current = null }
  }, [points])

  return <div ref={containerRef} className="w-full h-full" />
}
