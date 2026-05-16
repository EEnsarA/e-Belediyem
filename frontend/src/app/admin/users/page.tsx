'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Shield, CheckCircle2, XCircle, Mail, Clock, Search, MoreVertical } from 'lucide-react'
import api from '@/lib/api/client'
import { PageHeader, LoadingSkeleton } from '@/components/ui'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.getUsers().then(setUsers).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <PageHeader 
          title="Kullanıcı ve Yetki Yönetimi" 
          description={`${users.length} kayıtlı vatandaş ve yönetici hesabı aktif`} 
        />
      </motion.div>

      {/* Search Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.1 }}
        className="relative max-w-md group"
      >
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 group-focus-within:text-primary-500 transition-colors" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="İsim veya e-posta ile ara..."
          className="input-field pl-11 py-3 bg-white dark:bg-surface-900 border-none shadow-sm focus:ring-2 focus:ring-primary-500/20"
        />
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.2 }}
      >
        {loading ? <LoadingSkeleton rows={8} /> : (
          <div className="card border-none bg-white dark:bg-surface-900 shadow-xl overflow-hidden rounded-3xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-50/50 dark:bg-surface-800/30">
                    <th className="px-8 py-5 text-[10px] font-black text-surface-400 uppercase tracking-widest border-b border-surface-100 dark:border-surface-800">Kullanıcı Profili</th>
                    <th className="px-8 py-5 text-[10px] font-black text-surface-400 uppercase tracking-widest border-b border-surface-100 dark:border-surface-800 text-center">Yetki Seviyesi</th>
                    <th className="px-8 py-5 text-[10px] font-black text-surface-400 uppercase tracking-widest border-b border-surface-100 dark:border-surface-800 text-center">Hesap Durumu</th>
                    <th className="px-8 py-5 text-[10px] font-black text-surface-400 uppercase tracking-widest border-b border-surface-100 dark:border-surface-800">
                      <div className="flex items-center gap-2"><Clock className="w-3 h-3" /> Son Aktivite</div>
                    </th>
                    <th className="px-8 py-5 border-b border-surface-100 dark:border-surface-800"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-20 text-center">
                        <p className="text-sm font-bold text-surface-500">Kullanıcı bulunamadı</p>
                      </td>
                    </tr>
                  ) : filteredUsers.map((u, idx) => (
                    <tr key={u.id} className="group hover:bg-surface-50/30 dark:hover:bg-surface-800/20 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white text-sm font-black shadow-lg transition-transform group-hover:scale-110 ${
                            u.is_admin ? 'bg-gradient-to-br from-violet-500 to-indigo-600' : 'bg-gradient-to-br from-primary-500 to-primary-600'
                          }`}>
                            {u.full_name?.charAt(0) || '?'}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-surface-900 dark:text-surface-50">{u.full_name}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Mail className="w-3 h-3 text-surface-400" />
                              <span className="text-[11px] font-medium text-surface-400">{u.email || 'E-posta yok'}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center">
                        {u.is_admin ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 dark:bg-violet-900/30 text-[10px] font-black text-violet-600 uppercase tracking-tighter">
                            <Shield className="w-3 h-3" /> Yönetici
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-100 dark:bg-surface-800 text-[10px] font-black text-surface-500 uppercase tracking-tighter">
                            Vatandaş
                          </span>
                        )}
                      </td>
                      <td className="px-8 py-5 text-center">
                        {u.is_active ? (
                          <span className="inline-flex items-center gap-1.5 text-green-500 text-[11px] font-black uppercase tracking-tighter">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-red-500 text-[11px] font-black uppercase tracking-tighter">
                            <XCircle className="w-3.5 h-3.5" /> Engelli
                          </span>
                        )}
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-xs font-bold text-surface-400">
                          {u.last_login ? formatDistanceToNow(new Date(u.last_login), { addSuffix: true, locale: tr }) : 'Hiç giriş yapmadı'}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button className="p-2 rounded-xl text-surface-300 hover:text-surface-900 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-surface-800 transition-all">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

