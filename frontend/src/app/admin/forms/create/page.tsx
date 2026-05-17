'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, ArrowUp, ArrowDown, Save, Settings, GripVertical, Wand2, Sparkles, Loader2 } from 'lucide-react'
import api from '@/lib/api/client'
import { QuestionType, FormQuestion } from '@/types'

export default function CreateFormPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [questions, setQuestions] = useState<FormQuestion[]>([])
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiTopic, setAiTopic] = useState('')

  // Ayarlar
  const [isPublic, setIsPublic] = useState(true)
  const [allowMultiple, setAllowMultiple] = useState(false)

  const generateAIQuestions = async () => {
    if (!aiTopic) {
      alert("Lütfen bir konu girin (Örn: Park temizliği)")
      return
    }
    setAiLoading(true)
    try {
      const res = await api.generateAIForm(aiTopic)
      setQuestions([...questions, ...res.questions])
      if (!title) setTitle(aiTopic + " Anketi")
    } catch (error) {
      console.error(error)
      alert("AI soru üretirken bir hata oluştu.")
    } finally {
      setAiLoading(false)
    }
  }

  const addQuestion = () => {
    const newQ: FormQuestion = {
      id: crypto.randomUUID(),
      title: '',
      type: 'short_text',
      required: false,
      options: []
    }
    setQuestions([...questions, newQ])
  }

  const updateQuestion = (id: string, updates: Partial<FormQuestion>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q))
  }

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id))
  }

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === questions.length - 1) return
    
    const newQuestions = [...questions]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    const temp = newQuestions[index]
    newQuestions[index] = newQuestions[targetIndex]
    newQuestions[targetIndex] = temp
    setQuestions(newQuestions)
  }

  const handleSave = async () => {
    if (!title) {
      alert("Lütfen form başlığı girin.")
      return
    }
    if (questions.length === 0) {
      alert("En az bir soru eklemelisiniz.")
      return
    }

    setLoading(true)
    try {
      await api.createForm({
        title,
        description,
        schema: questions,
        settings: {
          is_public: isPublic,
          allow_multiple_responses: allowMultiple,
          max_responses: null,
          expires_at: null
        }
      })
      alert("Form başarıyla oluşturuldu!")
      router.push('/admin/dashboard') // Şimdilik ana admin paneline dön
    } catch (error) {
      console.error(error)
      alert("Form kaydedilirken bir hata oluştu.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Yeni Dinamik Form Oluştur</h1>
          <p className="text-gray-500 mt-1">Sürüklemeye gerek kalmadan pratik butonlarla sorularınızı yönetin.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-xl flex items-center gap-2 font-medium transition-all"
        >
          {loading ? 'Kaydediliyor...' : <><Save size={18} /> Formu Kaydet</>}
        </button>
      </div>

      {/* AI Assistant Section */}
      <div className="mb-8 bg-gradient-to-r from-violet-600/10 to-indigo-600/10 dark:from-violet-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-violet-200/50 dark:border-violet-700/30 relative overflow-hidden group">
        <div className="absolute -right-4 -top-4 text-violet-500/10 group-hover:scale-110 transition-transform">
          <Sparkles size={120} />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-4">
          <div className="w-12 h-12 bg-violet-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-violet-600/20">
            <Wand2 size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-violet-900 dark:text-violet-100">AI Soru Asistanı</h3>
            <p className="text-sm text-violet-700/70 dark:text-violet-400">Konuyu yazın, AI sizin için profesyonel sorular hazırlasın.</p>
          </div>
          <div className="flex w-full md:w-auto gap-2">
            <input
              type="text"
              placeholder="Örn: Ulaşım Memnuniyeti"
              className="flex-1 md:w-64 bg-white dark:bg-gray-900 border border-violet-200 dark:border-violet-700 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && generateAIQuestions()}
            />
            <button
              onClick={generateAIQuestions}
              disabled={aiLoading}
              className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles size={18} />}
              Üret
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-8 border-l-4 border-l-primary">
        <input
          type="text"
          placeholder="Form Başlığı (Örn: Çevre Temizliği Anketi)"
          className="w-full text-3xl font-bold bg-transparent border-b border-gray-200 dark:border-gray-700 focus:border-primary focus:outline-none pb-2 mb-4 text-gray-900 dark:text-white placeholder-gray-400"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          placeholder="Form Açıklaması (İsteğe bağlı)"
          className="w-full text-gray-600 dark:text-gray-300 bg-transparent border-none focus:outline-none resize-none"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="space-y-6">
        {questions.map((q, index) => (
          <div key={q.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 relative group transition-all hover:shadow-md">
            
            {/* Action Bar */}
            <div className="absolute right-4 top-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-50 dark:bg-gray-700 p-1 rounded-lg">
              <button onClick={() => moveQuestion(index, 'up')} className="p-1.5 text-gray-500 hover:text-primary rounded-md hover:bg-white dark:hover:bg-gray-600 disabled:opacity-30" disabled={index === 0} title="Yukarı Taşı">
                <ArrowUp size={16} />
              </button>
              <button onClick={() => moveQuestion(index, 'down')} className="p-1.5 text-gray-500 hover:text-primary rounded-md hover:bg-white dark:hover:bg-gray-600 disabled:opacity-30" disabled={index === questions.length - 1} title="Aşağı Taşı">
                <ArrowDown size={16} />
              </button>
              <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1"></div>
              <button onClick={() => removeQuestion(q.id)} className="p-1.5 text-red-500 hover:text-red-600 rounded-md hover:bg-red-50 dark:hover:bg-gray-600" title="Soruyu Sil">
                <Trash2 size={16} />
              </button>
            </div>

            <div className="flex gap-4">
              <div className="flex-1 space-y-4">
                <div className="flex gap-4">
                  <input
                    type="text"
                    placeholder="Sorunuzu buraya yazın..."
                    className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-lg font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all dark:text-white"
                    value={q.title}
                    onChange={(e) => updateQuestion(q.id, { title: e.target.value })}
                  />
                  <select
                    className="w-48 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                    value={q.type}
                    onChange={(e) => updateQuestion(q.id, { type: e.target.value as QuestionType })}
                  >
                    <option value="short_text">Kısa Cevap</option>
                    <option value="paragraph">Paragraf</option>
                    <option value="multiple_choice">Çoktan Seçmeli</option>
                    <option value="checkbox">Onay Kutuları</option>
                    <option value="dropdown">Açılır Liste</option>
                    <option value="file_upload">Dosya Yükleme</option>
                  </select>
                </div>

                {/* Seçenekler (Multiple Choice / Checkbox / Dropdown) */}
                {['multiple_choice', 'checkbox', 'dropdown'].includes(q.type) && (
                  <div className="pl-2 space-y-2">
                    {(q.options || []).map((opt, optIdx) => (
                      <div key={optIdx} className="flex items-center gap-3">
                        <div className={`w-4 h-4 border border-gray-300 ${q.type === 'multiple_choice' ? 'rounded-full' : 'rounded'} flex-shrink-0`}></div>
                        <input
                          type="text"
                          placeholder={`Seçenek ${optIdx + 1}`}
                          className="flex-1 bg-transparent border-b border-gray-200 dark:border-gray-700 py-1 focus:border-primary outline-none text-gray-700 dark:text-gray-300"
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...(q.options || [])]
                            newOpts[optIdx] = e.target.value
                            updateQuestion(q.id, { options: newOpts })
                          }}
                        />
                        <button
                          onClick={() => {
                            const newOpts = (q.options || []).filter((_, i) => i !== optIdx)
                            updateQuestion(q.id, { options: newOpts })
                          }}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center gap-3 mt-2">
                       <div className={`w-4 h-4 border border-gray-300 ${q.type === 'multiple_choice' ? 'rounded-full' : 'rounded'} flex-shrink-0 opacity-50`}></div>
                       <button
                         onClick={() => updateQuestion(q.id, { options: [...(q.options || []), ''] })}
                         className="text-sm text-primary hover:underline font-medium"
                       >
                         Seçenek Ekle
                       </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end items-center">
              <label className="flex items-center gap-2 cursor-pointer text-gray-600 dark:text-gray-300 text-sm font-medium">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  checked={q.required}
                  onChange={(e) => updateQuestion(q.id, { required: e.target.checked })}
                />
                Zorunlu Alan
              </label>
            </div>
          </div>
        ))}
      </div>

      {/* Soru Ekleme Butonu */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={addQuestion}
          className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-primary border border-gray-200 dark:border-gray-700 px-6 py-3 rounded-full flex items-center gap-2 shadow-sm font-medium transition-all"
        >
          <Plus size={20} /> Yeni Soru Ekle
        </button>
      </div>

      {/* Form Ayarları (Kenar Çubuğu veya Alt Kısım) */}
      <div className="mt-12 bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <Settings size={20} className="text-gray-500" /> Form Ayarları
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer">
            <input
              type="checkbox"
              className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Herkese Açık (Public)</p>
              <p className="text-sm text-gray-500">Üye girişi gerektirmeden link ile doldurulabilir.</p>
            </div>
          </label>

          <label className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer">
            <input
              type="checkbox"
              className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
              checked={allowMultiple}
              onChange={(e) => setAllowMultiple(e.target.checked)}
            />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Çoklu Yanıt İzni</p>
              <p className="text-sm text-gray-500">Aynı kişinin (hesabın) birden fazla doldurmasına izin ver.</p>
            </div>
          </label>
        </div>
      </div>

    </div>
  )
}
