'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, BarChart3, Users, X, Bot, Zap, Trash2, ChevronRight } from 'lucide-react'
import api from '@/lib/api/client'
import { Poll } from '@/types'
import { PageHeader, LoadingSkeleton, EmptyState } from '@/components/ui'
import toast from 'react-hot-toast'

export default function AdminPollsPage() {
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    api.getPolls().then(setPolls).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const addOption = () => options.length < 10 && setOptions([...options, ''])
  const removeOption = (i: number) => options.length > 2 && setOptions(options.filter((_, idx) => idx !== i))

  const create = async () => {
    const validOpts = options.filter(o => o.trim())
    if (!title.trim() || validOpts.length < 2) return toast.error('Başlık ve en az 2 seçenek gerekli')
    setCreating(true)
    try {
      await api.createPoll({ title, description, options: validOpts })
      const updated = await api.getPolls()
      setPolls(updated)
      setShowCreate(false)
      setTitle(''); setDescription(''); setOptions(['', ''])
      toast.success('Anket oluşturuldu!')
    } catch { toast.error('Anket oluşturulamadı') }
    finally { setCreating(false) }
  }

  const closePoll = async (id: number) => {
    try {
      await api.closePoll(id)
      const updated = await api.getPolls()
      setPolls(updated)
      toast.success('Anket kapatıldı ve AI analizi yapıldı')
    } catch { toast.error('İşlem başarısız') }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <PageHeader 
          title="Anket Yönetimi"
          description="Vatandaş katılımını artırmak ve görüş toplamak için dijital anketler oluşturun"
          action={
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              <Plus className="w-4 h-4" /> Yeni Anket Oluştur
            </button>
          }
        />
      </motion.div>

      {showCreate && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="card p-8 bg-gradient-to-br from-white to-surface-50 dark:from-surface-900 dark:to-surface-950 border-none shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-surface-900 dark:text-surface-50">Anket Tasarla</h3>
              <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-full transition-colors">
                <X className="w-5 h-5 text-surface-400" />
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="text-xs font-black text-surface-400 uppercase tracking-widest mb-2 block">Anket Sorusu</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Örn: Yeni park alanı nereye yapılmalı?" className="input-field" />
              </div>
              <div>
                <label className="text-xs font-black text-surface-400 uppercase tracking-widest mb-2 block">Açıklama</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Anket hakkında detaylı bilgi verin..." className="input-field resize-none" rows={2} />
              </div>
              <div className="space-y-3">
                <label className="text-xs font-black text-surface-400 uppercase tracking-widest mb-1 block">Cevap Seçenekleri</label>
                {options.map((opt, i) => (
                  <div key={i} className="flex gap-3 group">
                    <div className="flex-1 relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-primary-500/50">{i + 1}</div>
                      <input value={opt} onChange={e => { const n = [...options]; n[i] = e.target.value; setOptions(n) }}
                        placeholder={`Seçenek ${i + 1}`} className="input-field pl-10 bg-white dark:bg-surface-900" />
                    </div>
                    {options.length > 2 && (
                      <button onClick={() => removeOption(i)} className="p-2 text-surface-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {options.length < 10 && (
                  <button onClick={addOption} className="inline-flex items-center gap-2 text-xs font-black text-primary-500 hover:text-primary-600 transition-colors py-2 px-1">
                    <Plus className="w-3.5 h-3.5" /> Seçenek Ekle
                  </button>
                )}
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1 py-4">İptal</button>
                <button onClick={create} disabled={creating} className="btn-primary flex-1 py-4 shadow-lg shadow-primary-500/20">
                  {creating ? 'Oluşturuluyor...' : 'Anketi Yayına Al'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="space-y-6">
        <h3 className="text-sm font-black text-surface-400 uppercase tracking-widest px-2">Mevcut Anketler</h3>
        {loading ? <LoadingSkeleton rows={3} /> :
         polls.length === 0 ? (
           <EmptyState icon={<BarChart3 className="w-12 h-12 text-primary-500" />} title="Aktif anket bulunamadı"
             description="Belediye hizmetleri hakkında vatandaşların görüşlerini almak için bir anket oluşturun."
             action={<button onClick={() => setShowCreate(true)} className="btn-primary px-8 py-3 rounded-2xl"><Plus className="w-4 h-4" /> İlk Anketi Oluştur</button>} />
         ) : (
           <div className="grid grid-cols-1 gap-6">
             {polls.map((poll, idx) => (
               <motion.div 
                 key={poll.id}
                 initial={{ opacity: 0, x: -20 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ delay: idx * 0.05 }}
               >
                 <div className="card p-8 bg-gradient-to-br from-white to-surface-50 dark:from-surface-900 dark:to-surface-950 border-none shadow-sm group">
                   <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                     <div className="space-y-1 flex-1">
                       <div className="flex items-center gap-3 mb-2">
                         <h3 className="text-xl font-black text-surface-900 dark:text-surface-50 group-hover:text-primary-500 transition-colors leading-tight">{poll.title}</h3>
                         <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${
                           poll.is_active ? 'bg-green-100 text-green-600 dark:bg-green-900/30' : 'bg-surface-100 text-surface-500 dark:bg-surface-800'
                         }`}>
                           {poll.is_active ? '● AKTİF' : 'KAPALI'}
                         </span>
                       </div>
                       {poll.description && <p className="text-sm font-medium text-surface-500 dark:text-surface-400 leading-relaxed">{poll.description}</p>}
                       <div className="flex items-center gap-4 pt-2">
                         <div className="flex items-center gap-1.5 text-xs font-bold text-surface-400">
                           <Users className="w-3.5 h-3.5" /> {poll.total_votes} Vatandaş Katıldı
                         </div>
                       </div>
                     </div>
                     <div className="shrink-0">
                       {poll.is_active && (
                         <button onClick={() => closePoll(poll.id)} className="btn-secondary text-xs px-4 py-2 border-amber-200 text-amber-600 hover:bg-amber-50">Anketi Kapat</button>
                       )}
                     </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {poll.options.map(opt => {
                       const pct = poll.total_votes > 0 ? Math.round((opt.votes / poll.total_votes) * 100) : 0
                       return (
                         <div key={opt.id} className="p-4 rounded-2xl bg-surface-100/50 dark:bg-surface-800/50 border border-surface-100 dark:border-surface-800 space-y-3">
                           <div className="flex items-center justify-between">
                             <span className="text-sm font-bold text-surface-700 dark:text-surface-200 truncate pr-2">{opt.text}</span>
                             <span className="text-xs font-black text-primary-500">{pct}%</span>
                           </div>
                           <div className="h-2 bg-surface-200/50 dark:bg-surface-700/50 rounded-full overflow-hidden">
                             <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${pct}%` }}
                               transition={{ duration: 1, ease: "easeOut" }}
                               className="h-full bg-primary-500 rounded-full shadow-sm" 
                             />
                           </div>
                           <div className="text-[10px] font-bold text-surface-400 text-right">{opt.votes} oy</div>
                         </div>
                       )
                     })}
                   </div>

                   {poll.ai_analysis && (
                     <motion.div 
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       className="mt-8 p-6 bg-surface-900 rounded-2xl relative overflow-hidden group/ai"
                     >
                       <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/10 rounded-full blur-2xl -mr-12 -mt-12 group-hover/ai:bg-primary-500/20 transition-all" />
                       <div className="relative z-10 flex items-start gap-4">
                         <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center shrink-0">
                           <Bot className="w-5 h-5 text-white" />
                         </div>
                         <div className="space-y-1">
                           <p className="text-[10px] font-black text-primary-400 uppercase tracking-widest">Yapay Zeka Analizi</p>
                           <p className="text-sm text-surface-300 leading-relaxed font-medium italic">"{poll.ai_analysis}"</p>
                         </div>
                       </div>
                     </motion.div>
                   )}
                 </div>
               </motion.div>
             ))}
           </div>
         )
        }
      </div>
    </div>
  )
}

