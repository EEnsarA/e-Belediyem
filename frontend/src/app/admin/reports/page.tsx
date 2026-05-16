'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Download, FileText, FileDown, Loader2, Calendar, ShieldCheck, PieChart, Info } from 'lucide-react'
import api from '@/lib/api/client'
import { PageHeader } from '@/components/ui'
import toast from 'react-hot-toast'

export default function AdminReportsPage() {
  const [format, setFormat] = useState<'pdf' | 'docx'>('pdf')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)

  const generateReport = async () => {
    setLoading(true)
    try {
      const blob = await api.generateReport(format, startDate || undefined, endDate || undefined)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `belediye-raporu.${format}`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Rapor başarıyla oluşturuldu ve indirildi!')
    } catch {
      toast.error('Rapor oluşturulurken teknik bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <PageHeader 
          title="Veri ve Analiz Raporları" 
          description="Belediye performansını ve vatandaş taleplerini içeren detaylı raporları dışa aktarın" 
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Column: Configuration */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ delay: 0.1 }}
          className="lg:col-span-3 space-y-6"
        >
          <div className="card p-10 bg-gradient-to-br from-white to-surface-50 dark:from-surface-900 dark:to-surface-950 border-none shadow-xl">
            <h3 className="text-lg font-black text-surface-900 dark:text-surface-50 mb-8 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary-500" /> Rapor Yapılandırması
            </h3>
            
            <div className="space-y-8">
              {/* Format Selection */}
              <div>
                <label className="block text-xs font-black text-surface-400 uppercase tracking-widest mb-4">Dışa Aktarma Formatı</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { value: 'pdf', label: 'PDF Raporu', desc: 'Resmi sunumlar için uygun', icon: FileText, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/10' },
                    { value: 'docx', label: 'Word Dokümanı', desc: 'Düzenlenebilir metin belgesi', icon: FileDown, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/10' },
                  ].map(({ value, label, desc, icon: Icon, color, bg }) => (
                    <button 
                      key={value} 
                      onClick={() => setFormat(value as any)}
                      className={`flex items-start gap-4 p-5 rounded-2xl border-2 transition-all text-left group ${
                        format === value
                          ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/10'
                          : 'border-surface-100 dark:border-surface-800 hover:border-surface-200'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                        <Icon className={`w-6 h-6 ${color}`} />
                      </div>
                      <div>
                        <div className="text-sm font-black text-surface-900 dark:text-surface-50">{label}</div>
                        <div className="text-xs font-medium text-surface-400 mt-0.5">{desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-xs font-black text-surface-400 uppercase tracking-widest mb-4">
                  Zaman Aralığı Filtresi
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-surface-500 uppercase ml-1">Başlangıç</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                      <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input-field pl-11 bg-white dark:bg-surface-900 border-none shadow-sm" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-surface-500 uppercase ml-1">Bitiş</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                      <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input-field pl-11 bg-white dark:bg-surface-900 border-none shadow-sm" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  onClick={generateReport} 
                  disabled={loading} 
                  className="btn-primary w-full py-5 rounded-2xl shadow-lg shadow-primary-500/25 flex items-center justify-center gap-3 text-base"
                >
                  {loading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Veriler Derleniyor...</>
                  ) : (
                    <><Download className="w-5 h-5" /> {format.toUpperCase()} Raporu Oluştur ve İndir</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Info & Preview */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 space-y-6"
        >
          <div className="card p-8 bg-surface-900 text-white border-none h-full relative overflow-hidden group">
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-500/10 rounded-full blur-3xl -ml-16 -mb-16 group-hover:bg-primary-500/20 transition-all" />
            
            <div className="relative z-10 space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-surface-800 rounded-xl flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-primary-400" />
                </div>
                <h4 className="text-sm font-black uppercase tracking-widest text-primary-400">Rapor İçeriği Hakkında</h4>
              </div>

              <div className="space-y-6">
                <p className="text-sm text-surface-300 font-medium leading-relaxed">
                  Oluşturulan rapor, belediye yönetim süreçleri için kritik verileri içermektedir.
                </p>

                <ul className="space-y-4">
                  {[
                    'Genel performans metrikleri ve NPS skorları',
                    'Kategori bazlı şikayet yoğunluk analizi',
                    'Birim bazlı çözüm süreleri ve başarı oranları',
                    'AI destekli haftalık yönetici özeti',
                    'En çok geri bildirim alan bölgeler'
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 shrink-0 mt-0.5">
                        <Info className="w-3 h-3" />
                      </div>
                      <span className="text-xs font-medium text-surface-400 leading-tight">{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-6 border-t border-surface-800">
                  <p className="text-[10px] font-bold text-surface-500 leading-relaxed italic">
                    Not: Tarih filtresi uygulanmadığında sistemdeki tüm veriler üzerinden son 30 günlük özet rapor oluşturulur.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

