'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Megaphone, Pin, Clock } from 'lucide-react'
import api from '@/lib/api/client'
import { Announcement } from '@/types'
import { PageHeader, LoadingSkeleton, EmptyState } from '@/components/ui'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

const CATEGORY_COLORS: Record<string, string> = {
  'Bilgi': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  'Uyarı': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  'Etkinlik': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  'Acil': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getAnnouncements().then(setAnnouncements).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <PageHeader title="Duyurular" description="Belediyenizden güncel haberler ve bildirimler" />

      {loading ? <LoadingSkeleton rows={4} /> :
       announcements.length === 0 ? (
         <EmptyState icon={<Megaphone className="w-8 h-8" />} title="Duyuru Yok"
           description="Henüz duyuru paylaşılmamış." />
       ) : (
         <div className="space-y-4">
           {announcements.map((ann, i) => (
             <motion.div key={ann.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
               transition={{ delay: i * 0.08 }}
               className={`card p-6 ${ann.is_pinned ? 'border-l-4 border-primary-500' : ''}`}>
               <div className="flex items-start gap-4">
                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                   ann.is_pinned ? 'bg-primary-100 dark:bg-primary-900/30' : 'bg-surface-100 dark:bg-surface-800'
                 }`}>
                   {ann.is_pinned ? <Pin className="w-5 h-5 text-primary-500" /> : <Megaphone className="w-5 h-5 text-surface-400" />}
                 </div>
                 <div className="flex-1">
                   <div className="flex items-center gap-2 flex-wrap mb-2">
                     <h3 className="font-semibold text-surface-900 dark:text-surface-50">{ann.title}</h3>
                     {ann.category && (
                       <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[ann.category] || 'bg-surface-100 text-surface-500'}`}>
                         {ann.category}
                       </span>
                     )}
                     {ann.is_pinned && (
                       <span className="text-xs bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded-full">
                         Sabitlenmiş
                       </span>
                     )}
                   </div>
                   <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">{ann.content}</p>
                   <div className="flex items-center gap-1.5 mt-3 text-xs text-surface-400">
                     <Clock className="w-3.5 h-3.5" />
                     {format(new Date(ann.created_at), 'dd MMMM yyyy', { locale: tr })}
                   </div>
                 </div>
               </div>
             </motion.div>
           ))}
         </div>
       )
      }
    </div>
  )
}
