import { ComplaintStatus } from '@/types'
import { Clock, Search, ArrowRight, CheckCircle2 } from 'lucide-react'
import { clsx } from 'clsx'

const statusConfig: Record<ComplaintStatus, { label: string; className: string; icon: React.ReactNode }> = {
  'Beklemede': {
    label: 'Beklemede',
    className: 'status-pending',
    icon: <Clock className="w-3 h-3" />,
  },
  'İnceleniyor': {
    label: 'İnceleniyor',
    className: 'status-reviewing',
    icon: <Search className="w-3 h-3" />,
  },
  'İlgili Birime Yönlendirildi': {
    label: 'Yönlendirildi',
    className: 'status-forwarded',
    icon: <ArrowRight className="w-3 h-3" />,
  },
  'Çözüldü': {
    label: 'Çözüldü',
    className: 'status-resolved',
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
}

interface StatusBadgeProps {
  status: ComplaintStatus
  showIcon?: boolean
}

export function StatusBadge({ status, showIcon = true }: StatusBadgeProps) {
  const config = statusConfig[status]
  if (!config) return null
  return (
    <span className={clsx('status-badge', config.className)}>
      {showIcon && config.icon}
      {config.label}
    </span>
  )
}

// Urgency badge
interface UrgencyBadgeProps {
  score: number | null
}

export function UrgencyBadge({ score }: UrgencyBadgeProps) {
  if (!score) return null
  const cls = score >= 8 ? 'urgency-critical' : score >= 6 ? 'urgency-high' : score >= 4 ? 'urgency-medium' : 'urgency-low'
  const label = score >= 8 ? 'Kritik' : score >= 6 ? 'Yüksek' : score >= 4 ? 'Orta' : 'Düşük'
  return (
    <span className={clsx('text-xs font-semibold', cls)}>
      ⚡ {label} ({score}/10)
    </span>
  )
}

// Stat Card
interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  trend?: 'up' | 'down' | 'stable'
  trendValue?: string
  color?: 'blue' | 'green' | 'amber' | 'red' | 'purple'
}

export function StatCard({ label, value, icon, trend, trendValue, color = 'blue' }: StatCardProps) {
  const colorMap = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-emerald-600',
    amber: 'from-amber-500 to-orange-500',
    red: 'from-red-500 to-rose-600',
    purple: 'from-violet-500 to-purple-600',
  }
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between mb-4">
        <div className={clsx('w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-sm', colorMap[color])}>
          {icon}
        </div>
        {trend && trendValue && (
          <span className={clsx('text-xs font-semibold px-2 py-1 rounded-full', trend === 'up' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300')}>
            {trend === 'up' ? '↑' : '↓'} {trendValue}
          </span>
        )}
      </div>
      <div className="text-3xl font-display font-bold text-surface-900 dark:text-surface-50 mb-1">{value}</div>
      <div className="text-sm text-surface-500 dark:text-surface-400">{label}</div>
    </div>
  )
}

// Loading skeleton
export function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton h-16 w-full" />
      ))}
    </div>
  )
}

// Empty state
interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-surface-100 dark:bg-surface-800 rounded-2xl flex items-center justify-center text-surface-400 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-50 mb-1">{title}</h3>
      <p className="text-sm text-surface-500 max-w-xs mb-6">{description}</p>
      {action}
    </div>
  )
}

// Page header
interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
  breadcrumb?: { label: string; href?: string }[]
}

export function PageHeader({ title, description, action, breadcrumb }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        {breadcrumb && (
          <div className="flex items-center gap-1 text-xs text-surface-500 mb-2">
            {breadcrumb.map((item, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span>/</span>}
                {item.href ? (
                  <a href={item.href} className="hover:text-primary-500 transition-colors">{item.label}</a>
                ) : (
                  <span>{item.label}</span>
                )}
              </span>
            ))}
          </div>
        )}
        <h1 className="text-2xl font-display font-bold text-surface-900 dark:text-surface-50">{title}</h1>
        {description && <p className="text-surface-500 text-sm mt-1">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
