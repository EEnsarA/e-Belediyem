'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Zap, Bot, AlertCircle, TrendingUp, Layers, ChevronRight } from 'lucide-react'
import api from '@/lib/api/client'
import { ComplaintGroup } from '@/types'
import { PageHeader, LoadingSkeleton, EmptyState } from '@/components/ui'

export default function AdminGroupsPage() {
  const [groups, setGroups] = useState<ComplaintGroup[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getComplaintGroups().then(setGroups).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <PageHeader 
          title="AI Şikayet Grupları"
          description="Gemini AI tarafından embedding analizi ile otomatik oluşturulan benzer şikayet öbekleri" 
        />
      </motion.div>

      {loading ? <LoadingSkeleton rows={4} /> :
       groups.length === 0 ? (
         <div className="space-y-10">
           <EmptyState icon={<Bot className="w-12 h-12 text-primary-500" />} title="Henüz Yapay Zeka Grubu Oluşmadı"
             description="Şikayetler sisteme düştükçe Gemini benzerlik analizi yaparak otomatik gruplar oluşturacaktır." />
           
           <motion.div 
             initial={{ opacity: 0, y: 20 }} 
             animate={{ opacity: 1, y: 0 }} 
             className="card p-8 bg-surface-900 text-white border-none max-w-2xl mx-auto relative overflow-hidden group"
           >
             <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary-500/30 transition-all" />
             <div className="relative z-10">
               <div className="flex items-center gap-3 mb-6">
                 <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
                   <Zap className="w-5 h-5 text-white" />
                 </div>
                 <h4 className="text-sm font-black uppercase tracking-widest text-primary-400">AI Gruplandırma Algoritması</h4>
               </div>
               <div className="space-y-4 text-surface-300 font-medium leading-relaxed">
                 <div className="flex items-start gap-3">
                   <div className="w-5 h-5 rounded-full bg-surface-800 flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</div>
                   <p className="text-sm">Her yeni şikayet için <span className="text-white font-bold">Gemini embedding</span> (vektör) oluşturulur.</p>
                 </div>
                 <div className="flex items-start gap-3">
                   <div className="w-5 h-5 rounded-full bg-surface-800 flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</div>
                   <p className="text-sm">Vektörel uzayda <span className="text-white font-bold">Cosine Similarity</span> (Açısal Benzerlik) hesaplanır.</p>
                 </div>
                 <div className="flex items-start gap-3">
                   <div className="w-5 h-5 rounded-full bg-surface-800 flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</div>
                   <p className="text-sm">Benzerlik oranı <span className="text-primary-400 font-bold">%85'in üzerindeyse</span> şikayetler aynı gruba atanır.</p>
                 </div>
                 <div className="flex items-start gap-3">
                   <div className="w-5 h-5 rounded-full bg-surface-800 flex items-center justify-center text-[10px] shrink-0 mt-0.5">4</div>
                   <p className="text-sm">Adminler gruplara <span className="text-white font-bold">toplu çözüm</span> veya aksiyon tanımlayabilir.</p>
                 </div>
               </div>
             </div>
           </motion.div>
         </div>
       ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {groups.map((group, idx) => (
             <motion.div 
               key={group.id}
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: idx * 0.05 }}
             >
               <div className="card group p-8 bg-gradient-to-br from-white to-surface-50 dark:from-surface-900 dark:to-surface-950 border-none shadow-sm hover:shadow-xl transition-all cursor-pointer">
                 <div className="flex items-start justify-between mb-6">
                   <div className="w-12 h-12 bg-violet-50 dark:bg-violet-900/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                     <Layers className="w-6 h-6 text-violet-500" />
                   </div>
                   {group.avg_urgency && group.avg_urgency >= 7 && (
                     <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-50 dark:bg-red-900/30 text-[10px] font-black text-red-500 uppercase tracking-tighter">
                       <Zap className="w-3 h-3 fill-current" /> KRİTİK
                     </span>
                   )}
                 </div>
                 
                 <div className="space-y-2 mb-6">
                   <h3 className="text-lg font-black text-surface-900 dark:text-surface-50 leading-tight group-hover:text-primary-500 transition-colors">{group.title}</h3>
                   {group.description && (
                     <p className="text-sm font-medium text-surface-500 dark:text-surface-400 line-clamp-2 leading-relaxed">
                       {group.description}
                     </p>
                   )}
                 </div>

                 <div className="flex items-center justify-between pt-6 border-t border-surface-100 dark:border-surface-800">
                   <div className="flex items-center gap-4">
                     <div className="flex flex-col">
                       <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest">Şikayet</span>
                       <span className="text-sm font-black text-surface-900 dark:text-surface-50">{group.complaint_count}</span>
                     </div>
                     <div className="w-px h-6 bg-surface-100 dark:bg-surface-800" />
                     <div className="flex flex-col">
                       <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest">Öncelik</span>
                       <span className={`text-sm font-black ${
                         group.avg_urgency && group.avg_urgency >= 7 ? 'text-red-500' : 
                         group.avg_urgency && group.avg_urgency >= 5 ? 'text-amber-500' : 'text-green-500'
                       }`}>
                         {group.avg_urgency?.toFixed(1)}/10
                       </span>
                     </div>
                   </div>
                   <div className="w-8 h-8 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-surface-400 group-hover:bg-primary-500 group-hover:text-white transition-all">
                     <ChevronRight className="w-4 h-4" />
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

