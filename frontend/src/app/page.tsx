'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Search, Trophy, Building2, TrendingUp, Star, Users, Megaphone,
  BarChart3, AlertCircle, ChevronUp, Filter, Award, Zap, Globe,
  ArrowRight, CheckCircle2, Clock, ThumbsUp
} from 'lucide-react'
import { useAuthStore } from '@/store'
import api from '@/lib/api/client'
import LoginModal from '@/components/ui/LoginModal'
import CitizenSidebar from '@/components/layout/CitizenSidebar'
import AdminSidebar from '@/components/layout/AdminSidebar'
import DiscoverNavbar from '@/components/layout/DiscoverNavbar'

interface MunicipalityData {
  id: number
  name: string
  province: string
  district: string
  logo_url?: string
  mayor_name?: string
  score: number
  resolution_rate: number
  active_polls: number
  recent_announcements: number
  total_complaints: number
  top_public_complaints: PublicComplaint[]
  is_my_municipality: boolean
}

interface LeaderboardEntry {
  id: number
  name: string
  province: string
  district: string
  score: number
  resolution_rate: number
  recent_announcements: number
  active_polls: number
  total_complaints: number
  rank: number
  badge?: string
  achievement?: string
}

interface PublicComplaint {
  id: number
  description: string
  upvote_count: number
  status: string
  category?: string
  municipality_name?: string
  province?: string
  created_at?: string
  user_upvoted?: boolean
  municipality_id?: number
}

interface GlobalPoll {
  id: number
  title: string
  description: string
  municipality_name: string
  province: string
  total_votes: number
  ends_at?: string
  created_at?: string
}

export default function RootDiscoverPage() {
  const { isAuthenticated, user } = useAuthStore()
  const router = useRouter()
  
  const [municipalities, setMunicipalities] = useState<MunicipalityData[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [globalComplaints, setGlobalComplaints] = useState<PublicComplaint[]>([])
  const [globalPolls, setGlobalPolls] = useState<GlobalPoll[]>([])
  
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'global' | 'polls' | 'all'>('leaderboard')
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [loginAction, setLoginAction] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [muniData, lbData, gcData, pollsData] = await Promise.all([
        api.discoverMunicipalities({ search: search || undefined }),
        api.getLeaderboard(),
        api.getGlobalPublicComplaints({ sort: 'upvotes' }),
        api.getGlobalPolls()
      ])
      setMunicipalities(muniData.municipalities || [])
      setLeaderboard(lbData.leaderboard || [])
      setGlobalComplaints(gcData.items || [])
      setGlobalPolls(pollsData.items || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    const timer = setTimeout(loadData, 300)
    return () => clearTimeout(timer)
  }, [loadData])

  // Admin routing shortcut for sidebars
  useEffect(() => {
    if (isAuthenticated && user?.is_admin && window.location.pathname === '/') {
       // Let them stay if they clicked from sidebar
    }
  }, [isAuthenticated, user])

  const requireAuth = (action: string, callback: () => void) => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    callback()
  }

  const handleUpvote = async (complaintId: number, isCurrentlyUpvoted: boolean, muniId?: number) => {
    requireAuth('Şikayeti öne çıkarmak', async () => {
      if (user?.municipality_id !== muniId) {
        import('react-hot-toast').then(toast => toast.default.error('Sadece kendi belediyenizin şikayetlerini öne çıkarabilirsiniz.'));
        return;
      }
      try {
        if (isCurrentlyUpvoted) {
          await api.removeUpvote(complaintId);
        } else {
          await api.upvoteComplaint(complaintId);
        }
        setGlobalComplaints(prev => prev.map(c => {
          if (c.id === complaintId) {
            return {
              ...c,
              user_upvoted: !isCurrentlyUpvoted,
              upvote_count: isCurrentlyUpvoted ? Math.max(0, c.upvote_count - 1) : c.upvote_count + 1
            }
          }
          return c;
        }))
      } catch (err) {
        import('react-hot-toast').then(toast => toast.default.error('İşlem başarısız oldu.'));
      }
    })
  }

  const myMunicipality = municipalities.find(m => m.is_my_municipality)
  const top3 = leaderboard.slice(0, 3)
  const rest = leaderboard.slice(3)

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-surface-950 flex flex-col transition-all">
      
      {/* Universal Navbar for Discover Page */}
      <DiscoverNavbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isAuthenticated={isAuthenticated}
        user={user}
      />

      <main className="flex-1 w-full relative z-10 overflow-x-hidden pb-20 pt-20">
        
        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary-500/5 blur-[120px] pointer-events-none -z-10" />

        {/* Hero Header */}
        <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-violet-800 dark:from-primary-950 dark:via-surface-900 dark:to-black text-white relative transition-all duration-500">
          {/* My Municipality Action Button */}
          <div className="absolute top-6 right-6 z-20">
            <button
              onClick={() => requireAuth('Kendi belediyenizi görüntülemek', () => {
                document.getElementById('my-municipality')?.scrollIntoView({ behavior: 'smooth' })
              })}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md rounded-2xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-black/10"
            >
              <Building2 className="w-4 h-4 text-blue-300" />
              Kendi Belediyemi Gör
            </button>
          </div>

          <div className="max-w-6xl mx-auto px-6 py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mt-8"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4">
                Belediyeleri <span className="text-blue-300">Keşfet</span>
              </h1>
              <p className="text-primary-200 text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
                Türkiye genelindeki tüm belediyelerin faaliyetlerini, şikayetlerini ve vatandaş memnuniyetini tek bir platformda takip edin.
              </p>

              {/* Search */}
              <div className="relative max-w-2xl mx-auto">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  placeholder="Belediye adı veya il arayın..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 font-medium text-lg shadow-2xl"
                />
              </div>
            </motion.div>
          </div>

          {/* Horizontal Tabs Restore */}
          <div className="max-w-6xl mx-auto px-6 pb-0">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {[
                { key: 'leaderboard', label: '🏆 Liderlik Tablosu', icon: Trophy },
                { key: 'global', label: '🔥 Öne Çıkan Şikayetler', icon: ThumbsUp },
                { key: 'polls', label: '📊 Faaliyetler ve Anketler', icon: BarChart3 },
                { key: 'all', label: '🗺 Tüm Belediyeler', icon: Building2 },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`px-6 py-3.5 text-sm font-bold rounded-t-2xl transition-all whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'bg-[#f8fafc] dark:bg-surface-950 text-primary-900 dark:text-primary-100'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8 space-y-10">
          
          {/* My Municipality Highlight */}
          {isAuthenticated && myMunicipality && (
            <motion.div
              id="my-municipality"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-primary-600/10 to-violet-600/10 border-2 border-primary-200 dark:border-primary-800 rounded-3xl p-6 md:p-8 relative overflow-hidden"
            >
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary-500/10 rounded-full blur-2xl" />
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-black text-2xl text-primary-900 dark:text-primary-100">Benim Belediyem</h2>
                  <p className="text-sm text-primary-700 dark:text-primary-300">Aktif durumunuz ve istatistikler</p>
                </div>
              </div>
              <MunicipalityCard municipality={myMunicipality} isHighlighted onRequireAuth={requireAuth} />
            </motion.div>
          )}

          {/* GLOBAL FEED TAB */}
          {activeTab === 'global' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-surface-900 dark:text-surface-50 flex items-center gap-2">
                  <ThumbsUp className="w-6 h-6 text-red-500" />
                  Türkiye Gündemi
                </h2>
                <p className="text-sm font-medium text-surface-500">En çok desteklenen açık şikayetler</p>
              </div>

              {loading ? <LoadingState /> : globalComplaints.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {globalComplaints.map((c, i) => (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-white dark:bg-surface-900 rounded-3xl p-6 border border-surface-100 dark:border-surface-800 shadow-sm hover:shadow-xl transition-all group"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center border border-surface-200 dark:border-surface-700">
                            <Building2 className="w-4 h-4 text-surface-500" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-surface-900 dark:text-surface-50">{c.municipality_name}</div>
                            <div className="text-[10px] text-surface-400 font-medium">{c.province}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-full text-xs font-black shadow-sm">
                          <ThumbsUp className="w-3.5 h-3.5" />
                          {c.upvote_count} Oy
                        </div>
                      </div>

                      <p className="text-sm text-surface-700 dark:text-surface-300 line-clamp-3 mb-4 leading-relaxed">
                        "{c.description}"
                      </p>

                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-surface-100 dark:border-surface-800">
                        <div className="flex items-center gap-2">
                          <StatusDot status={c.status} text={true} />
                          {c.category && (
                            <span className="text-[10px] font-bold text-surface-400 uppercase tracking-wider bg-surface-50 dark:bg-surface-800 px-2 py-1 rounded-md">
                              {c.category}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleUpvote(c.id, !!c.user_upvoted, c.municipality_id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                            c.user_upvoted 
                              ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800' 
                              : 'bg-white dark:bg-surface-800 text-surface-500 hover:bg-surface-50 dark:hover:bg-surface-700 border-surface-200 dark:border-surface-700'
                          }`}
                        >
                          <ChevronUp className="w-4 h-4" />
                          {c.user_upvoted ? 'Öne Çıkarıldı' : 'Öne Çıkar'}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-24 bg-white dark:bg-surface-900 rounded-3xl border border-surface-100 dark:border-surface-800 shadow-sm">
                  <div className="w-20 h-20 bg-surface-50 dark:bg-surface-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ThumbsUp className="w-10 h-10 text-surface-300 dark:text-surface-600" />
                  </div>
                  <h3 className="text-xl font-black text-surface-900 dark:text-surface-50 mb-2">Henüz Gündem Yok</h3>
                  <p className="text-surface-500 max-w-sm mx-auto">
                    Şu an Türkiye genelinde öne çıkan bir şikayet bulunmuyor. Herkese açık ilk şikayeti siz oluşturabilir ve destek toplayabilirsiniz!
                  </p>
                  {!isAuthenticated && (
                    <button
                      onClick={() => requireAuth('Şikayet oluşturmak', () => {})}
                      className="mt-6 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors"
                    >
                      Şikayet Oluştur
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* POLLS TAB */}
          {activeTab === 'polls' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-surface-900 dark:text-surface-50 flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-primary-500" />
                  Öne Çıkan Faaliyetler ve Anketler
                </h2>
                <p className="text-sm font-medium text-surface-500">Tüm belediyelerdeki en güncel projeler</p>
              </div>

              {loading ? <LoadingState /> : globalPolls.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {globalPolls.map((p, i) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-white dark:bg-surface-900 rounded-3xl p-6 border border-surface-100 dark:border-surface-800 shadow-sm hover:shadow-xl transition-all group flex flex-col"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-white shadow-md">
                            <BarChart3 className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-xs text-primary-600 dark:text-primary-400 font-bold uppercase tracking-wider mb-0.5">{p.municipality_name}</div>
                            <h3 className="font-bold text-surface-900 dark:text-surface-50 leading-tight line-clamp-1">{p.title}</h3>
                          </div>
                        </div>
                        <div className="bg-surface-50 dark:bg-surface-800 text-surface-600 dark:text-surface-300 px-3 py-1 rounded-full text-xs font-black shadow-sm flex items-center gap-1.5 border border-surface-200 dark:border-surface-700">
                          <Users className="w-3 h-3" />
                          {p.total_votes} Katılım
                        </div>
                      </div>

                      <p className="text-sm text-surface-500 line-clamp-2 mb-6 flex-1">
                        {p.description || "Bu faaliyet/anket için henüz bir açıklama girilmemiş."}
                      </p>

                      <div className="flex items-center justify-between pt-4 border-t border-surface-100 dark:border-surface-800">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-surface-400">
                          <Clock className="w-4 h-4" />
                          {p.ends_at ? `Bitiş: ${new Date(p.ends_at).toLocaleDateString('tr-TR')}` : 'Süresiz'}
                        </div>
                        <button
                          onClick={() => requireAuth('Ankete katılmak veya incelemek', () => {})}
                          className="px-4 py-2 bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/20 dark:hover:bg-primary-900/40 text-primary-600 dark:text-primary-400 text-sm font-bold rounded-xl transition-colors"
                        >
                          İncele ve Oy Ver
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-24 bg-white dark:bg-surface-900 rounded-3xl border border-surface-100 dark:border-surface-800 shadow-sm">
                  <div className="w-20 h-20 bg-surface-50 dark:bg-surface-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <BarChart3 className="w-10 h-10 text-surface-300 dark:text-surface-600" />
                  </div>
                  <h3 className="text-xl font-black text-surface-900 dark:text-surface-50 mb-2">Aktif Faaliyet Bulunamadı</h3>
                  <p className="text-surface-500 max-w-sm mx-auto">
                    Şu an Türkiye genelinde oylamaya sunulmuş aktif bir anket veya faaliyet bulunmuyor.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* LEADERBOARD TAB */}
          {activeTab === 'leaderboard' && (
            <div className="space-y-8">
              {/* Top 3 Podium */}
              {!loading && top3.length > 0 && (
                <div>
                  <h2 className="text-2xl font-black text-surface-900 dark:text-surface-50 mb-6 flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-amber-500" />
                    Bu Haftanın Şampiyonları
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {top3.map((entry, i) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`relative rounded-3xl p-8 text-white overflow-hidden shadow-2xl ${
                          i === 0
                            ? 'bg-gradient-to-br from-amber-400 to-orange-500 md:order-2 md:-mt-4'
                            : i === 1
                            ? 'bg-gradient-to-br from-slate-400 to-slate-600 md:order-1 mt-4'
                            : 'bg-gradient-to-br from-orange-300 to-orange-600 md:order-3 mt-4'
                        }`}
                      >
                        <div className="absolute -top-4 -right-4 text-8xl opacity-10 font-black p-2">{entry.badge}</div>
                        <div className="text-5xl mb-3 drop-shadow-md">{entry.badge}</div>
                        <div className="text-xl font-black truncate drop-shadow-sm">{entry.name}</div>
                        <div className="text-white/80 text-sm mb-6 font-medium">{entry.province}</div>
                        
                        <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/20">
                          <div className="text-4xl font-black">{entry.score}</div>
                          <div className="text-white/70 text-xs font-bold uppercase tracking-wider mb-2">Performans Puanı</div>
                          
                          {entry.achievement && (
                            <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 bg-white/20 rounded-full text-xs font-bold text-white shadow-sm border border-white/10">
                              <Award className="w-3.5 h-3.5" />
                              {entry.achievement}
                            </div>
                          )}
                          
                          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <div className="font-black text-white/90">%{entry.resolution_rate}</div>
                              <div className="text-white/60 text-[10px] uppercase font-bold">Çözüm</div>
                            </div>
                            <div>
                              <div className="font-black text-white/90">{entry.active_polls}</div>
                              <div className="text-white/60 text-[10px] uppercase font-bold">Anket</div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rest of leaderboard */}
              {rest.length > 0 && (
                <div className="bg-white dark:bg-surface-900 rounded-3xl shadow-sm border border-surface-100 dark:border-surface-800 overflow-hidden">
                  <div className="p-6 border-b border-surface-100 dark:border-surface-800">
                    <h3 className="font-black text-lg text-surface-900 dark:text-surface-50">Sıralamada Diğerleri</h3>
                  </div>
                  <div className="divide-y divide-surface-50 dark:divide-surface-800/50">
                    {rest.map((entry, i) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-4 p-5 hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-colors"
                      >
                        <div className="w-12 h-12 bg-surface-100 dark:bg-surface-800 rounded-2xl flex items-center justify-center font-black text-surface-600 dark:text-surface-300 shadow-inner">
                          {entry.rank}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-surface-900 dark:text-surface-50 truncate text-base">{entry.name}</div>
                          <div className="text-xs text-surface-400 font-medium">{entry.province} • {entry.district}</div>
                        </div>
                        {entry.achievement && (
                          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-full text-xs font-bold">
                            <Zap className="w-3.5 h-3.5" />
                            {entry.achievement}
                          </div>
                        )}
                        <div className="text-right px-4">
                          <div className="font-black text-surface-900 dark:text-surface-50 text-lg">{entry.score}</div>
                          <div className="text-[10px] font-bold text-surface-400 uppercase">puan</div>
                        </div>
                        <div className="text-right hidden sm:block border-l border-surface-200 dark:border-surface-700 pl-4">
                          <div className="font-black text-green-600 dark:text-green-400 text-lg">%{entry.resolution_rate}</div>
                          <div className="text-[10px] font-bold text-surface-400 uppercase">çözüm</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {loading && <LoadingState />}
            </div>
          )}

          {/* ALL MUNICIPALITIES TAB */}
          {activeTab === 'all' && (
            <div className="space-y-6">
              {loading ? <LoadingState /> : municipalities.map((m, i) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <MunicipalityCard municipality={m} onRequireAuth={requireAuth} />
                </motion.div>
              ))}
              {!loading && municipalities.length === 0 && (
                <div className="text-center py-20 bg-white dark:bg-surface-900 rounded-3xl border border-surface-100 dark:border-surface-800">
                  <Building2 className="w-16 h-16 text-surface-300 mx-auto mb-4" />
                  <p className="text-surface-500 font-medium">Belediye bulunamadı</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* --- Landing Page Extra Sections (Visible to Guests/All) --- */}
        <div className="max-w-6xl mx-auto px-6 py-16 space-y-32">
          
          {/* Features Section */}
          <section>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-black text-surface-900 dark:text-surface-50 mb-4">Neler Yapabilirsiniz?</h2>
              <p className="text-surface-500 text-lg">e-Belediyem platformu ile yerel yönetim sürecine doğrudan dahil olun, sesinizi duyurun ve gelişime katkı sağlayın.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: AlertCircle, title: 'Şikayet ve Öneri Bildirin', desc: 'Sorunları fotoğraflayıp harita üzerinden bildirin. AI destekli sistemimiz şikayetinizi otomatik kategorize edip ilgili birime iletsin.', color: 'from-amber-400 to-orange-500' },
                { icon: BarChart3, title: 'Anketlere Katılın', desc: 'Belediyenizin aldığı kararlarda söz sahibi olun. Projeler ve bütçe planlamaları için açılan oylamalara katılarak şehri birlikte yönetin.', color: 'from-blue-400 to-indigo-500' },
                { icon: TrendingUp, title: 'Performansı Takip Edin', desc: 'Belediyenizin çözüm hızını, anket istatistiklerini ve vatandaş memnuniyet oranlarını şeffaf bir şekilde diğer ilçelerle karşılaştırın.', color: 'from-emerald-400 to-teal-500' },
              ].map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="bg-white dark:bg-surface-900 rounded-3xl p-8 border border-surface-100 dark:border-surface-800 shadow-sm hover:shadow-xl transition-all"
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-6 shadow-lg`}>
                    <f.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-black text-surface-900 dark:text-surface-50 mb-3">{f.title}</h3>
                  <p className="text-surface-500 leading-relaxed font-medium">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* How It Works Section */}
          <section className="relative">
            <div className="absolute inset-0 bg-gradient-to-b from-primary-500/5 to-violet-500/5 rounded-[3rem] -z-10" />
            <div className="p-8 md:p-16">
              <div className="text-center max-w-2xl mx-auto mb-16">
                <h2 className="text-3xl md:text-4xl font-black text-surface-900 dark:text-surface-50 mb-4">Nasıl Çalışır?</h2>
                <p className="text-surface-500 text-lg">Sadece 3 adımda güvenli ve hızlı etkileşim.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-surface-200 via-primary-300 to-surface-200 dark:from-surface-700 dark:via-primary-700 dark:to-surface-700" />
                
                {[
                  { step: '01', title: 'Güvenli Giriş', desc: 'e-Devlet altyapısı ile kimliğinizi güvenle doğrulayın. Adres bilginizle kendi belediyenize otomatik bağlanın.' },
                  { step: '02', title: 'Topluluğa Katılın', desc: 'Belediyenizin anketlerini inceleyin veya mahallenizdeki bir sorun için şikayet kaydı oluşturup herkese açık yapın.' },
                  { step: '03', title: 'Çözümü Takip Edin', desc: 'Bildirimleriniz ilgili birimlerce anında işleme alınsın. Süreci şeffaf bir şekilde anlık olarak sistemden takip edin.' },
                ].map((s, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.2 }}
                    className="relative text-center"
                  >
                    <div className="w-24 h-24 mx-auto bg-white dark:bg-surface-900 border-4 border-primary-100 dark:border-primary-900/30 rounded-full flex items-center justify-center mb-6 relative z-10 shadow-xl shadow-primary-500/10">
                      <span className="text-3xl font-black text-primary-600 dark:text-primary-400">{s.step}</span>
                    </div>
                    <h3 className="text-xl font-black text-surface-900 dark:text-surface-50 mb-3">{s.title}</h3>
                    <p className="text-surface-500 font-medium">{s.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <footer className="bg-surface-900 dark:bg-surface-950 text-surface-400 py-12 mt-20 border-t border-surface-800">
          <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-6 h-6 text-primary-500" />
                <span className="text-xl font-black text-white">e-Belediyem</span>
              </div>
              <p className="text-sm max-w-sm mb-6">Türkiye'nin en gelişmiş, AI destekli vatandaş-belediye etkileşim ve şikayet yönetim platformu.</p>
              <div className="text-xs text-surface-600">
                &copy; 2026 e-Belediyem Platformu. Tüm hakları saklıdır.
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/" className="hover:text-primary-400 transition-colors">Keşif Panosu</Link></li>
                <li><Link href="/login" className="hover:text-primary-400 transition-colors">Vatandaş Girişi</Link></li>
                <li><Link href="/login" className="hover:text-primary-400 transition-colors">Belediye Paneli</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4">Destek</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-primary-400 transition-colors">Sıkça Sorulan Sorular</a></li>
                <li><a href="#" className="hover:text-primary-400 transition-colors">KVKK Metni</a></li>
                <li><a href="#" className="hover:text-primary-400 transition-colors">Kullanım Koşulları</a></li>
              </ul>
            </div>
          </div>
        </footer>

        {/* Login prompt (bottom bar) for unauthenticated */}
        {!isAuthenticated && (
          <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-surface-900/90 backdrop-blur-xl border-t border-surface-200 dark:border-surface-800 py-4 px-6 z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <p className="text-sm font-bold text-surface-700 dark:text-surface-200">
                  Oy vermek, şikayet oluşturmak ve kendi belediyenizi görmek için giriş yapın
                </p>
              </div>
              <Link
                href="/login"
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-violet-600 text-white font-black rounded-xl hover:from-primary-700 hover:to-violet-700 transition-all shrink-0 shadow-lg shadow-primary-500/20"
              >
                e-Devlet ile Giriş
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}


function MunicipalityCard({
  municipality: m,
  isHighlighted = false,
  onRequireAuth,
}: {
  municipality: MunicipalityData
  isHighlighted?: boolean
  onRequireAuth: (action: string, cb: () => void) => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={`bg-white dark:bg-surface-900 rounded-3xl border transition-all ${
      isHighlighted ? 'border-primary-200 dark:border-primary-800 shadow-md' : 'border-surface-100 dark:border-surface-800 shadow-sm hover:shadow-md'
    }`}>
      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-xl shrink-0 shadow-sm ${
              isHighlighted ? 'bg-gradient-to-br from-primary-500 to-violet-600' : 'bg-surface-100 dark:bg-surface-800'
            }`}>
              {m.logo_url ? (
                <img src={m.logo_url} alt={m.name} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <Building2 className={`w-8 h-8 ${isHighlighted ? 'text-white' : 'text-surface-400'}`} />
              )}
            </div>
            <div>
              <h3 className="font-black text-xl text-surface-900 dark:text-surface-50 mb-1">{m.name}</h3>
              <p className="text-sm font-medium text-surface-500">{m.province} / {m.district}</p>
              {m.mayor_name && <p className="text-xs text-surface-400 mt-1">Başkan: <span className="font-semibold text-surface-600 dark:text-surface-300">{m.mayor_name}</span></p>}
            </div>
          </div>
          <div className="text-left md:text-right shrink-0 bg-surface-50 dark:bg-surface-800/50 p-4 rounded-2xl border border-surface-100 dark:border-surface-700/50">
            <div className="text-3xl font-black text-primary-600 dark:text-primary-400 leading-none">{m.score}</div>
            <div className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mt-1">Sistem Puanı</div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <StatPill icon={<CheckCircle2 className="w-4 h-4 text-green-500" />} label="Çözüm Oranı" value={`%${m.resolution_rate}`} color="green" />
          <StatPill icon={<AlertCircle className="w-4 h-4 text-amber-500" />} label="Toplam Şikayet" value={m.total_complaints} color="amber" />
          <StatPill icon={<BarChart3 className="w-4 h-4 text-primary-500" />} label="Aktif Anket" value={m.active_polls} color="blue" />
          <StatPill icon={<Megaphone className="w-4 h-4 text-violet-500" />} label="Yeni Duyuru" value={m.recent_announcements} color="violet" />
        </div>

        {/* Top Public Complaints */}
        {m.top_public_complaints.length > 0 && (
          <div className="mt-8 pt-6 border-t border-surface-100 dark:border-surface-800">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-2 text-sm font-black text-surface-700 dark:text-surface-300 hover:text-primary-600 transition-colors w-full"
            >
              <ThumbsUp className="w-4 h-4" />
              Öne Çıkan Şikayetler <span className="bg-surface-100 dark:bg-surface-800 px-2 py-0.5 rounded-full text-xs">{m.top_public_complaints.length}</span>
              <ChevronUp className={`w-4 h-4 ml-auto transition-transform ${expanded ? '' : 'rotate-180'}`} />
            </button>

            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mt-4 space-y-3"
                >
                  {m.top_public_complaints.map(c => (
                    <div key={c.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-surface-50 dark:bg-surface-800/30 rounded-2xl border border-surface-100 dark:border-surface-800/50 hover:border-primary-200 transition-colors">
                      <div className="flex items-center gap-1.5 bg-white dark:bg-surface-900 px-3 py-1.5 rounded-full text-xs font-black text-red-500 shrink-0 shadow-sm border border-surface-100 dark:border-surface-800">
                        <ThumbsUp className="w-3.5 h-3.5" />
                        {c.upvote_count}
                      </div>
                      <p className="text-sm text-surface-700 dark:text-surface-300 line-clamp-2 flex-1 font-medium">{c.description}</p>
                      <StatusDot status={c.status} text={true} />
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}

function StatPill({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: any; color: string }) {
  const colors: Record<string, string> = {
    green: 'bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30',
    amber: 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30',
    blue: 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30',
    violet: 'bg-violet-50 dark:bg-violet-900/10 border-violet-100 dark:border-violet-900/30',
  }
  return (
    <div className={`${colors[color] || 'bg-surface-50 dark:bg-surface-800'} border rounded-2xl p-4 transition-all hover:scale-105`}>
      <div className="flex items-center gap-1.5 mb-2">{icon}<span className="text-[10px] uppercase tracking-wider text-surface-500 font-bold">{label}</span></div>
      <div className="font-black text-surface-900 dark:text-surface-50 text-xl">{value}</div>
    </div>
  )
}

function StatusDot({ status, text = false }: { status: string, text?: boolean }) {
  const colors: Record<string, string> = {
    'Çözüldü': 'bg-green-400 text-green-700 dark:text-green-400',
    'Beklemede': 'bg-amber-400 text-amber-700 dark:text-amber-400',
    'İnceleniyor': 'bg-blue-400 text-blue-700 dark:text-blue-400',
    'İlgili Birime Yönlendirildi': 'bg-violet-400 text-violet-700 dark:text-violet-400',
  }
  
  if (text) {
     return (
       <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md bg-surface-100 dark:bg-surface-800 ${colors[status]?.split(' ')[1] || 'text-surface-500'}`}>
         <div className={`w-2 h-2 rounded-full shrink-0 ${colors[status]?.split(' ')[0] || 'bg-surface-400'}`} />
         {status}
       </div>
     )
  }
  
  return (
    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${colors[status]?.split(' ')[0] || 'bg-surface-400'}`} title={status} />
  )
}

function LoadingState() {
  return (
    <div className="space-y-6">
      {[1, 2].map(i => (
        <div key={i} className="bg-white dark:bg-surface-900 rounded-3xl border border-surface-100 dark:border-surface-800 p-8 animate-pulse">
          <div className="flex items-center gap-5 mb-8">
            <div className="w-16 h-16 bg-surface-100 dark:bg-surface-800 rounded-2xl" />
            <div className="space-y-3">
              <div className="h-5 bg-surface-100 dark:bg-surface-800 rounded-md w-48" />
              <div className="h-3 bg-surface-100 dark:bg-surface-800 rounded-md w-32" />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[1,2,3,4].map(j => <div key={j} className="h-20 bg-surface-50 dark:bg-surface-800 rounded-2xl" />)}
          </div>
        </div>
      ))}
    </div>
  )
}
