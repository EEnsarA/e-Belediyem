'use client'

import { useAuthStore } from '@/store'
import { Building2, Mail, Bell, Shield, User } from 'lucide-react'
import { PageHeader } from '@/components/ui'

export default function ProfilePage() {
  const { user } = useAuthStore()

  return (
    <div>
      <PageHeader title="Profilim" />

      <div className="max-w-xl space-y-5">
        {/* Kullanıcı bilgisi */}
        <div className="card p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center text-white text-2xl font-bold">
              {user?.full_name?.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-surface-900 dark:text-surface-50">{user?.full_name}</h2>
              <p className="text-sm text-surface-500">{user?.municipality_name || 'Belediye atanmamış'}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-surface-50 dark:bg-surface-800 rounded-xl">
              <User className="w-4 h-4 text-surface-400" />
              <div>
                <p className="text-xs text-surface-500">Ad Soyad</p>
                <p className="text-sm font-medium text-surface-900 dark:text-surface-50">{user?.full_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-surface-50 dark:bg-surface-800 rounded-xl">
              <Mail className="w-4 h-4 text-surface-400" />
              <div>
                <p className="text-xs text-surface-500">E-posta</p>
                <p className="text-sm font-medium text-surface-900 dark:text-surface-50">{user?.email || 'Tanımlanmamış'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-surface-50 dark:bg-surface-800 rounded-xl">
              <Building2 className="w-4 h-4 text-surface-400" />
              <div>
                <p className="text-xs text-surface-500">Bağlı Belediye</p>
                <p className="text-sm font-medium text-surface-900 dark:text-surface-50">{user?.municipality_name || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-surface-50 dark:bg-surface-800 rounded-xl">
              <Shield className="w-4 h-4 text-surface-400" />
              <div>
                <p className="text-xs text-surface-500">Hesap Türü</p>
                <p className="text-sm font-medium text-surface-900 dark:text-surface-50">{user?.is_admin ? 'Yönetici' : 'Vatandaş'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bildirim tercihleri */}
        <div className="card p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary-500" /> Bildirim Tercihleri
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-surface-900 dark:text-surface-50">Push Bildirimleri</p>
                <p className="text-xs text-surface-500">Şikayet durumu güncellemelerinde bildirim al</p>
              </div>
              <div className={`w-10 h-6 rounded-full transition-colors ${user?.push_enabled ? 'bg-primary-500' : 'bg-surface-300 dark:bg-surface-600'} relative`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${user?.push_enabled ? 'translate-x-5' : 'translate-x-1'}`} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-surface-900 dark:text-surface-50">E-posta Bildirimleri</p>
                <p className="text-xs text-surface-500">Önemli güncellemeler için e-posta al</p>
              </div>
              <div className={`w-10 h-6 rounded-full transition-colors ${user?.email_enabled ? 'bg-primary-500' : 'bg-surface-300 dark:bg-surface-600'} relative`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${user?.email_enabled ? 'translate-x-5' : 'translate-x-1'}`} />
              </div>
            </div>
          </div>
        </div>

        <div className="card p-5 bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900">
          <p className="text-sm text-amber-700 dark:text-amber-300">
            🔒 KVKK gereği TC Kimlik bilgileriniz şifreli olarak saklanmakta ve üçüncü taraflarla paylaşılmamaktadır.
          </p>
        </div>
      </div>
    </div>
  )
}
