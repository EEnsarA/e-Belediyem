'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Megaphone, Pin, Trash2, X } from 'lucide-react'
import api from '@/lib/api/client'
import { Announcement } from '@/types'
import { PageHeader, LoadingSkeleton, EmptyState } from '@/components/ui'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import toast from 'react-hot-toast'

const CATEGORIES = ['Bilgi', 'Uyarı', 'Etkinlik', 'Acil']

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('Bilgi')
  const [isPinned, setIsPinned] = useState(false)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    api.getAnnouncements().then(setAnnouncements).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const create = async () => {
    if (!title.trim() || !content.trim()) return toast.error('Başlık ve içerik gerekli')
    setCreating(true)
    try {
      await api.createAnnouncement({ title, content, category, is_pinned: isPinned })
      const updated = await api.getAnnouncements()
      setAnnouncements(updated)
      setShowCreate(false)
      setTitle(''); setContent(''); setIsPinned(false)
      toast.success('Duyuru yayınlandı!')
    } catch { toast.error('Duyuru oluşturulamadı') }
    finally { setCreating(false) }
  }

  const remove = async (id: number) => {
    try {
      await api.deleteAnnouncement(id)
      setAnnouncements(prev => prev.filter(a => a.id !== id))
      toast.success('Duyuru silindi')
    } catch { toast.error('Silinemedi') }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <PageHeader 
          title="Duyuru Yönetimi"
          description="Vatandaşlara iletilecek önemli duyuruları ve etkinlikleri yönetin"
          action={
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              <Plus className="w-4 h-4" /> Yeni Duyuru
            </button>
          }
        />
      </motion.div>

      {showCreate && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="card p-8 bg-gradient-to-br from-white to-surface-50 dark:from-surface-900 dark:to-surface-950 border-none shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-surface-900 dark:text-surface-50">Yeni Duyuru Oluştur</h3>
              <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-full transition-colors">
                <X className="w-5 h-5 text-surface-400" />
              </button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-surface-400 uppercase tracking-widest mb-2 block">Başlık</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Duyuru başlığı..." className="input-field" />
              </div>
              <div>
                <label className="text-xs font-bold text-surface-400 uppercase tracking-widest mb-2 block">İçerik</label>
                <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Vatandaşlara ne duyurmak istersiniz?" rows={5} className="input-field resize-none" />
              </div>
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-1">
                  <label className="text-xs font-bold text-surface-400 uppercase tracking-widest mb-2 block">Kategori</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="input-field">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex items-end pb-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-10 h-6 rounded-full transition-colors relative ${isPinned ? 'bg-amber-500' : 'bg-surface-200 dark:bg-surface-700'}`}>
                      <input type="checkbox" checked={isPinned} onChange={e => setIsPinned(e.target.checked)} className="sr-only" />
                      <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${isPinned ? 'translate-x-4' : ''}`} />
                    </div>
                    <span className="text-sm font-bold text-surface-600 dark:text-surface-400 group-hover:text-surface-900 dark:group-hover:text-surface-100 transition-colors">Ana Sayfaya Sabitle</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1 py-3">İptal</button>
                <button onClick={create} disabled={creating} className="btn-primary flex-1 py-3">
                  {creating ? 'Yayınlanıyor...' : 'Duyuruyu Yayınla'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="space-y-4">
        <h3 className="text-sm font-black text-surface-400 uppercase tracking-widest px-2">Yayındaki Duyurular</h3>
        {loading ? <LoadingSkeleton rows={4} /> :
         announcements.length === 0 ? (
           <EmptyState icon={<Megaphone className="w-8 h-8 text-primary-500" />} title="Henüz duyuru yayınlanmamış"
             description="Belediyenizden önemli haberleri vatandaşlara ulaştırmak için ilk duyurunuzu hemen oluşturun."
             action={<button onClick={() => setShowCreate(true)} className="btn-primary px-8 py-3 rounded-2xl"><Plus className="w-4 h-4" /> İlk Duyuruyu Oluştur</button>} />
         ) : (
           <div className="grid grid-cols-1 gap-4">
             {announcements.map((ann, idx) => (
               <motion.div 
                 key={ann.id}
                 initial={{ opacity: 0, x: -20 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ delay: idx * 0.05 }}
               >
                 <div className={`card group p-6 flex items-start gap-6 hover:shadow-lg transition-all ${ann.is_pinned ? 'border-l-4 border-amber-500 bg-amber-50/30 dark:bg-amber-900/10' : 'border-none bg-gradient-to-br from-white to-surface-50 dark:from-surface-900 dark:to-surface-950'}`}>
                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${ann.is_pinned ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 'bg-surface-100 dark:bg-surface-800 text-surface-400 group-hover:text-primary-500 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-colors'}`}>
                     {ann.is_pinned ? <Pin className="w-5 h-5 fill-current" /> : <Megaphone className="w-5 h-5" />}
                   </div>
                   <div className="flex-1 min-w-0">
                     <div className="flex items-center gap-3 mb-2">
                       <h3 className="font-black text-surface-900 dark:text-surface-50 leading-tight">{ann.title}</h3>
                       {ann.category && (
                         <span className={`text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full ${
                           ann.category === 'Acil' ? 'bg-red-100 text-red-600 dark:bg-red-900/30' :
                           ann.category === 'Uyarı' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30' :
                           'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400'
                         }`}>
                           {ann.category}
                         </span>
                       )}
                     </div>
                     <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all">{ann.content}</p>
                     <div className="flex items-center gap-4 mt-4 pt-4 border-t border-surface-100 dark:border-surface-800">
                       <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">
                         {format(new Date(ann.created_at), 'dd MMMM yyyy, HH:mm', { locale: tr })}
                       </span>
                     </div>
                   </div>
                   <button onClick={() => remove(ann.id)} className="p-2 text-surface-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all self-start">
                     <Trash2 className="w-5 h-5" />
                   </button>
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

