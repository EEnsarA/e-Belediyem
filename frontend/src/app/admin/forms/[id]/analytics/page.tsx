'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts'
import { Download, ArrowLeft, Loader2, Users, ClipboardList, TrendingUp } from 'lucide-react'
import api from '@/lib/api/client'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function FormAnalyticsPage() {
  const { id } = useParams()
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.getFormAnalytics(Number(id))
        setData(res)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  const handleExport = async () => {
    setExporting(true)
    try {
      await api.exportFormResponses(Number(id))
    } catch (err) {
      alert("Dışa aktarma sırasında bir hata oluştu.")
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    )
  }

  if (!data) return <div className="p-8 text-center text-red-500">Analiz verileri yüklenemedi.</div>

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{data.form_title}</h1>
            <p className="text-gray-500">Form Yanıt Analizi ve İstatistikleri</p>
          </div>
        </div>
        
        <button
          onClick={handleExport}
          disabled={exporting}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl flex items-center gap-2 font-medium transition-all shadow-lg shadow-green-600/20"
        >
          {exporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
          Excel/CSV İndir
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600">
            <Users size={28} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Toplam Katılım</p>
            <p className="text-3xl font-black text-gray-900 dark:text-white">{data.total_responses}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600">
            <ClipboardList size={28} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Soru Sayısı</p>
            <p className="text-3xl font-black text-gray-900 dark:text-white">{data.analytics.length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
          <div className="w-14 h-14 bg-amber-50 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center text-amber-600">
            <TrendingUp size={28} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Yanıt Oranı</p>
            <p className="text-3xl font-black text-gray-900 dark:text-white">%100</p>
          </div>
        </div>
      </div>

      {/* Individual Question Analytics */}
      <div className="space-y-8">
        {data.analytics.map((q: any) => (
          <div key={q.id} className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{q.title}</h3>
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-full uppercase">
                {q.type}
              </span>
            </div>

            {q.data && q.data.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={q.data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {q.data.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="space-y-4">
                  {q.data.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-gray-900 dark:text-white">{item.value} Yanıt</span>
                        <span className="text-xs text-gray-400 font-bold">%{( (item.value / q.total_answers) * 100 ).toFixed(1)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : q.recent_answers ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-500 mb-4">Son Yanıtlar:</p>
                {q.recent_answers.map((ans: string, idx: number) => (
                  <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                    {ans}
                  </div>
                ))}
                {q.total_answers > 10 && (
                  <p className="text-xs text-center text-gray-400 mt-2 italic">+ {q.total_answers - 10} yanıt daha var (Excel/CSV çıktısında görebilirsiniz)</p>
                )}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8 italic text-sm">Henüz bu soru için yanıt toplanmamış.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
