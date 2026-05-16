'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, Filter, Clock, Globe, Terminal, Activity } from 'lucide-react'
import api from '@/lib/api/client'
import { PageHeader, LoadingSkeleton } from '@/components/ui'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getAuditLogs().then(setLogs).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const ACTION_COLORS: Record<string, string> = {
    'complaint.status_changed': 'bg-blue-100 text-blue-600 dark:bg-blue-900/30',
    'announcement.created': 'bg-green-100 text-green-600 dark:bg-green-900/30',
    'poll.created': 'bg-violet-100 text-violet-600 dark:bg-violet-900/30',
    default: 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400',
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <PageHeader 
          title="Sistem Güvenlik Kayıtları" 
          description="Belediye panelinde gerçekleştirilen tüm kritik işlemlerin şeffaf dökümü" 
        />
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.1 }}
      >
        {loading ? <LoadingSkeleton rows={10} /> : (
          <div className="card border-none bg-white dark:bg-surface-900 shadow-xl overflow-hidden rounded-3xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-50/50 dark:bg-surface-800/30">
                    <th className="px-8 py-5 text-[10px] font-black text-surface-400 uppercase tracking-widest border-b border-surface-100 dark:border-surface-800">
                      <div className="flex items-center gap-2"><Activity className="w-3 h-3" /> İşlem Türü</div>
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black text-surface-400 uppercase tracking-widest border-b border-surface-100 dark:border-surface-800">
                      <div className="flex items-center gap-2"><Terminal className="w-3 h-3" /> Etkilenen Kaynak</div>
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black text-surface-400 uppercase tracking-widest border-b border-surface-100 dark:border-surface-800">
                      <div className="flex items-center gap-2"><Globe className="w-3 h-3" /> Erişim Bilgisi</div>
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black text-surface-400 uppercase tracking-widest border-b border-surface-100 dark:border-surface-800">
                      <div className="flex items-center gap-2"><Clock className="w-3 h-3" /> İşlem Tarihi</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Shield className="w-10 h-10 text-surface-100" />
                          <p className="text-sm font-bold text-surface-500">Henüz bir sistem kaydı bulunmuyor</p>
                        </div>
                      </td>
                    </tr>
                  ) : logs.map((log, idx) => (
                    <tr key={log.id} className="group hover:bg-surface-50/30 dark:hover:bg-surface-800/20 transition-colors">
                      <td className="px-8 py-5">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm ${
                          ACTION_COLORS[log.action] || ACTION_COLORS.default
                        }`}>{log.action.replace(/\./g, ' ')}</span>
                      </td>
                      <td className="px-8 py-5">
                        {log.resource_type ? (
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-surface-900 dark:text-surface-50 capitalize">{log.resource_type}</span>
                            <span className="text-[10px] font-bold text-surface-400 mt-0.5">ID: #{log.resource_id}</span>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-surface-300">—</span>
                        )}
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-[10px] font-black text-surface-400">IP</div>
                          <span className="text-xs font-mono font-bold text-surface-500">{log.ip_address || 'Gizli IP'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-surface-900 dark:text-surface-50">
                            {log.created_at ? format(new Date(log.created_at), 'dd MMM yyyy', { locale: tr }) : '—'}
                          </span>
                          <span className="text-[10px] font-bold text-surface-400 mt-0.5">
                            {log.created_at ? format(new Date(log.created_at), 'HH:mm:ss', { locale: tr }) : '—'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="px-8 py-5 bg-surface-50/50 dark:bg-surface-800/30 border-t border-surface-100 dark:border-surface-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest">Sistem Güvenli & Canlı İzleniyor</span>
              </div>
              <div className="text-[10px] font-bold text-surface-400">Son {logs.length} işlem gösteriliyor</div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

