'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Building2, Save, Upload, User, Globe, Loader2, CheckCircle2 } from 'lucide-react'
import api from '@/lib/api/client'
import { toast } from 'react-hot-toast'

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    name: '',
    logo_url: '',
    mayor_name: '',
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const data = await api.getAdminSettings()
      setSettings({
        name: data.name || '',
        logo_url: data.logo_url || '',
        mayor_name: data.mayor_name || '',
      })
    } catch (err) {
      toast.error('Ayarlar yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.updateAdminSettings(settings)
      toast.success('Ayarlar başarıyla güncellendi')
    } catch (err) {
      toast.error('Güncelleme başarısız')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-surface-900 dark:text-surface-50 flex items-center gap-3">
            <Building2 className="w-8 h-8 text-primary-600" />
            Belediye Ayarları
          </h1>
          <p className="text-surface-500 mt-1 font-medium">Belediye profilini ve sistem ayarlarını buradan yönetebilirsiniz.</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-surface-900 rounded-3xl p-8 border border-surface-100 dark:border-surface-800 shadow-sm"
      >
        <form onSubmit={handleSave} className="space-y-8">
          
          {/* Logo Section */}
          <div className="flex flex-col md:flex-row gap-8 items-start pb-8 border-b border-surface-100 dark:border-surface-800">
            <div className="space-y-4">
              <label className="text-sm font-bold text-surface-700 dark:text-surface-300">Belediye Logosu</label>
              <div className="relative group">
                <div className="w-32 h-32 rounded-3xl bg-surface-50 dark:bg-surface-800 border-2 border-dashed border-surface-200 dark:border-surface-700 flex items-center justify-center overflow-hidden transition-all group-hover:border-primary-500">
                  {settings.logo_url ? (
                    <img src={settings.logo_url} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <Building2 className="w-10 h-10 text-surface-300" />
                  )}
                </div>
                <div className="mt-4 flex flex-col gap-2">
                  <input
                    type="text"
                    placeholder="Logo URL (örn: /logos/erzurum.png)"
                    value={settings.logo_url}
                    onChange={e => setSettings({ ...settings, logo_url: e.target.value })}
                    className="w-full px-4 py-2 text-sm bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                  <p className="text-[10px] text-surface-400 font-medium italic">
                    * Şimdilik URL üzerinden güncelleme destekleniyor.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-2 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Belediye Adı
                  </label>
                  <input
                    type="text"
                    value={settings.name}
                    onChange={e => setSettings({ ...settings, name: e.target.value })}
                    className="w-full px-4 py-3 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none font-medium"
                    placeholder="Belediye tam adı"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Belediye Başkanı
                  </label>
                  <input
                    type="text"
                    value={settings.mayor_name}
                    onChange={e => setSettings({ ...settings, mayor_name: e.target.value })}
                    className="w-full px-4 py-3 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none font-medium"
                    placeholder="Başkan adı ve soyadı"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Additional Settings (Placeholders) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 bg-surface-50 dark:bg-surface-800/50 rounded-2xl border border-surface-100 dark:border-surface-800">
               <h3 className="font-bold text-surface-900 dark:text-surface-50 mb-4 flex items-center gap-2">
                 <Globe className="w-4 h-4 text-blue-500" />
                 Sosyal Medya ve Web
               </h3>
               <p className="text-xs text-surface-500">Bu özellik yakında aktif edilecektir. İletişim bilgilerini buradan yönetebileceksiniz.</p>
            </div>
            <div className="p-6 bg-surface-50 dark:bg-surface-800/50 rounded-2xl border border-surface-100 dark:border-surface-800">
               <h3 className="font-bold text-surface-900 dark:text-surface-50 mb-4 flex items-center gap-2">
                 <CheckCircle2 className="w-4 h-4 text-green-500" />
                 Sistem Doğrulamaları
               </h3>
               <p className="text-xs text-surface-500">e-Devlet entegrasyonu ve resmi evrak onaylama ayarları.</p>
            </div>
          </div>

          <div className="flex justify-end pt-6">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-primary-500/20 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Değişiklikleri Kaydet
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
