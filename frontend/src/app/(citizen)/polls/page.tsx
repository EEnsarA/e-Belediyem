'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, Check, Clock } from 'lucide-react'
import api from '@/lib/api/client'
import { Poll } from '@/types'
import { PageHeader, LoadingSkeleton, EmptyState } from '@/components/ui'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import toast from 'react-hot-toast'

export default function PollsPage() {
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getPolls().then(setPolls).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const vote = async (pollId: number, optionId: number) => {
    try {
      await api.votePoll(pollId, optionId)
      const updated = await api.getPolls()
      setPolls(updated)
      toast.success('Oyunuz kaydedildi!')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Oy kullanılamadı')
    }
  }

  return (
    <div>
      <PageHeader title="Anketler" description="Belediyenizin kararlarına katkıda bulunun" />

      {loading ? <LoadingSkeleton rows={3} /> :
       polls.length === 0 ? (
         <EmptyState icon={<BarChart3 className="w-8 h-8" />} title="Aktif Anket Yok"
           description="Şu anda aktif anket bulunmuyor. Daha sonra tekrar kontrol edin." />
       ) : (
         <div className="space-y-5">
           {polls.map((poll, i) => (
             <motion.div key={poll.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
               transition={{ delay: i * 0.1 }} className="card p-6">
               <div className="flex items-start justify-between mb-3">
                 <div>
                   <h3 className="font-semibold text-surface-900 dark:text-surface-50">{poll.title}</h3>
                   {poll.description && <p className="text-sm text-surface-500 mt-1">{poll.description}</p>}
                 </div>
                 <div className="flex items-center gap-1.5 text-xs text-surface-400 shrink-0 ml-4">
                   <Clock className="w-3.5 h-3.5" />
                   {poll.ends_at
                     ? `${formatDistanceToNow(new Date(poll.ends_at), { locale: tr })} kaldı`
                     : 'Süresiz'}
                 </div>
               </div>

               <div className="space-y-2.5 mb-4">
                 {poll.options.map(opt => {
                   const pct = poll.total_votes > 0 ? Math.round((opt.votes / poll.total_votes) * 100) : 0
                   const isSelected = poll.user_vote_option === opt.id
                   return (
                     <button key={opt.id}
                       onClick={() => !poll.user_voted && vote(poll.id, opt.id)}
                       disabled={poll.user_voted}
                       className={`w-full text-left p-3 rounded-xl border transition-all ${
                         poll.user_voted
                           ? isSelected
                             ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                             : 'border-surface-200 dark:border-surface-700'
                           : 'border-surface-200 dark:border-surface-700 hover:border-primary-400 hover:bg-surface-50 dark:hover:bg-surface-800 cursor-pointer'
                       }`}>
                       <div className="flex items-center justify-between mb-1.5">
                         <span className="text-sm text-surface-900 dark:text-surface-50 flex items-center gap-2">
                           {isSelected && <Check className="w-3.5 h-3.5 text-primary-500" />}
                           {opt.text}
                         </span>
                         {poll.user_voted && (
                           <span className="text-xs font-bold text-surface-700 dark:text-surface-300">{pct}%</span>
                         )}
                       </div>
                       {poll.user_voted && (
                         <div className="w-full h-1.5 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                           <div className={`h-full rounded-full transition-all duration-500 ${isSelected ? 'bg-primary-500' : 'bg-surface-400'}`}
                             style={{ width: `${pct}%` }} />
                         </div>
                       )}
                     </button>
                   )
                 })}
               </div>
               <div className="flex items-center justify-between text-xs text-surface-400">
                 <span>{poll.total_votes} oy kullanıldı</span>
                 {poll.user_voted && <span className="text-green-500 font-medium">✓ Oyladınız</span>}
               </div>
             </motion.div>
           ))}
         </div>
       )
      }
    </div>
  )
}
