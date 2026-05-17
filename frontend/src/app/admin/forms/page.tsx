'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, BarChart2, Calendar, FileText, ChevronRight, Loader2, ClipboardList, BarChart3, Layers, List, Users, Bot, Zap, Trash2 } from 'lucide-react'
import api from '@/lib/api/client'
import { DynamicForm, Poll } from '@/types'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import toast from 'react-hot-toast'

export default function AdminFormsListPage() {
  const [activeTab, setActiveTab] = useState<'forms' | 'polls'>('forms')
  const [forms, setForms] = useState<DynamicForm[]>([])
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [formsRes, pollsRes] = await Promise.all([
          api.getForms(),
          api.getPolls()
        ])
        setForms(formsRes.forms)
        setPolls(pollsRes)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const closePoll = async (id: number) => {
    try {
      await api.closePoll(id)
      const updated = await api.getPolls()
      setPolls(updated)
      toast.success('Anket kapatıldı ve AI analizi yapıldı')
    } catch { toast.error('İşlem başarısız') }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Anket & Form Yönetimi</h1>
          <p className="text-gray-500">Vatandaş katılımını artırmak için kullanılan tüm araçlar</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'forms' ? (
            <Link
              href="/admin/forms/create"
              className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-xl flex items-center gap-2 font-medium transition-all shadow-lg shadow-primary/20"
            >
              <Plus size={18} /> Yeni Form Oluştur
            </Link>
          ) : (
            <Link
              href="/admin/polls"
              className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-xl flex items-center gap-2 font-medium transition-all shadow-lg shadow-primary/20"
            >
              <Plus size={18} /> Hızlı Anket Sayfasına Git
            </Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl mb-8 w-fit">
        <button
          onClick={() => setActiveTab('forms')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'forms' 
              ? 'bg-white dark:bg-gray-700 text-primary shadow-sm' 
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Layers size={18} /> Gelişmiş Formlar
        </button>
        <button
          onClick={() => setActiveTab('polls')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'polls' 
              ? 'bg-white dark:bg-gray-700 text-primary shadow-sm' 
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <BarChart3 size={18} /> Hızlı Anketler
        </button>
      </div>

      {activeTab === 'forms' ? (
        <>
          {forms.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-700">
              <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Henüz Form Yok</h3>
              <p className="text-gray-500 mb-6">İlk dinamik formunuzu oluşturarak vatandaşlardan veri toplamaya başlayın.</p>
              <Link href="/admin/forms/create" className="text-primary font-bold hover:underline">Form Oluşturmaya Başla</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {forms.map((form) => (
                <div key={form.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between hover:shadow-md transition-shadow group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <FileText size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{form.title}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1"><Calendar size={14} /> {format(new Date(form.created_at), 'd MMMM yyyy', { locale: tr })}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${form.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{form.is_active ? 'Aktif' : 'Pasif'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right"><p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">YANIT SAYISI</p><p className="text-2xl font-black text-gray-900 dark:text-white">{form.responses_count || 0}</p></div>
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/forms/${form.id}/analytics`} className="p-3 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm"><BarChart2 size={20} /></Link>
                      <Link href={`/forms/${form.id}`} target="_blank" className="p-3 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-sm"><ChevronRight size={20} /></Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {polls.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-700">
              <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Henüz Anket Yok</h3>
              <p className="text-gray-500 mb-6">Hızlı bir anket oluşturarak vatandaşların görüşlerini alın.</p>
              <Link href="/admin/polls" className="text-primary font-bold hover:underline">Anket Oluşturmaya Başla</Link>
            </div>
          ) : (
            polls.map((poll) => (
              <div key={poll.id} className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 group">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors">{poll.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${poll.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{poll.is_active ? 'Aktif' : 'Kapalı'}</span>
                    </div>
                    {poll.description && <p className="text-sm text-gray-500">{poll.description}</p>}
                    <div className="flex items-center gap-4 pt-2 text-xs text-gray-400 font-medium">
                      <span className="flex items-center gap-1"><Users size={14} /> {poll.total_votes} Katılımcı</span>
                      <span className="flex items-center gap-1"><Calendar size={14} /> {format(new Date(poll.created_at), 'd MMMM yyyy', { locale: tr })}</span>
                    </div>
                  </div>
                  {poll.is_active && (
                    <button onClick={() => closePoll(poll.id)} className="text-xs font-bold px-4 py-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors">Anketi Kapat</button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {poll.options.map(opt => {
                    const pct = poll.total_votes > 0 ? Math.round((opt.votes / poll.total_votes) * 100) : 0
                    return (
                      <div key={opt.id} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 space-y-2">
                        <div className="flex items-center justify-between text-sm font-bold">
                          <span className="truncate pr-2">{opt.text}</span>
                          <span className="text-primary">{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="text-[10px] text-gray-400 text-right">{opt.votes} oy</div>
                      </div>
                    )
                  })}
                </div>
                {poll.ai_analysis && (
                  <div className="mt-6 p-4 bg-primary/5 rounded-xl border border-primary/10 flex items-start gap-4">
                    <div className="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center shrink-0"><Bot size={18} /></div>
                    <div>
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">AI Analizi</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 italic">"{poll.ai_analysis}"</p>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
