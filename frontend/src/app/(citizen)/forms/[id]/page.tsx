'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowRight, ArrowLeft, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import api from '@/lib/api/client'
import { DynamicForm, FormQuestion } from '@/types'

export default function FormRendererPage() {
  const { id } = useParams()
  const router = useRouter()
  
  const [form, setForm] = useState<DynamicForm | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [currentIndex, setCurrentIndex] = useState(0)
  const [history, setHistory] = useState<number[]>([]) // Geri gitmek için
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [submitting, setSubmitting] = useState(false)
  const [isFinished, setIsFinished] = useState(false)

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const data = await api.getForm(Number(id))
        setForm(data)
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Form yüklenirken bir hata oluştu.')
      } finally {
        setLoading(false)
      }
    }
    fetchForm()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Hata</h2>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  const questions = form.schema || []
  const currentQ = questions[currentIndex]
  const isLastQuestion = currentIndex === questions.length - 1
  const currentAnswer = answers[currentQ?.id]

  const handleNext = async () => {
    if (currentQ.required && (!currentAnswer || currentAnswer.length === 0)) {
      alert("Bu alan zorunludur, lütfen doldurun.")
      return
    }

    // Logic Jump kontrolü
    let nextIndex = currentIndex + 1
    if (currentQ.logic_jump && currentQ.logic_jump.length > 0) {
      // Eğer çoktan seçmeli veya dropdown ise, cevaba göre jump ara
      const jumpRule = currentQ.logic_jump.find(j => j.option === currentAnswer)
      if (jumpRule) {
        const targetIndex = questions.findIndex(q => q.id === jumpRule.goto_id)
        if (targetIndex !== -1) {
          nextIndex = targetIndex
        }
      }
    }

    if (nextIndex < questions.length) {
      setHistory([...history, currentIndex])
      setCurrentIndex(nextIndex)
    } else {
      // Formu Gönder
      setSubmitting(true)
      try {
        await api.submitFormResponse(form.id, answers)
        setIsFinished(true)
      } catch (err: any) {
        alert(err.response?.data?.detail || "Yanıtınız kaydedilemedi.")
      } finally {
        setSubmitting(false)
      }
    }
  }

  const handleBack = () => {
    if (history.length > 0) {
      const prevIndex = history[history.length - 1]
      setHistory(history.slice(0, -1))
      setCurrentIndex(prevIndex)
    }
  }

  if (isFinished) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-lg w-full text-center shadow-xl border border-gray-100 dark:border-gray-700">
          <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Teşekkürler!</h1>
          <p className="text-gray-500 mb-8">Yanıtlarınız başarıyla kaydedildi. Zaman ayırdığınız için teşekkür ederiz.</p>
          <button 
            onClick={() => router.push('/')}
            className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl font-bold transition-all w-full"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    )
  }

  // Progress Bar yüzdesi
  const progress = Math.round(((currentIndex + 1) / questions.length) * 100)

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Progress Bar */}
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-800">
        <div 
          className="h-full bg-primary transition-all duration-500 ease-out" 
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {/* Soru İçeriği */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100 dark:border-gray-700 mb-8 animate-in slide-in-from-bottom-4 fade-in duration-500">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {currentQ.title}
            </h2>
            {currentQ.required && <p className="text-primary text-sm font-medium mb-6">* Zorunlu Alan</p>}
            
            <div className="mt-8">
              {currentQ.type === 'short_text' && (
                <input 
                  type="text" 
                  className="w-full text-2xl bg-transparent border-b-2 border-gray-200 dark:border-gray-700 focus:border-primary outline-none py-2 text-gray-900 dark:text-white placeholder-gray-400 transition-colors"
                  placeholder="Cevabınızı buraya yazın..."
                  value={currentAnswer || ''}
                  onChange={(e) => setAnswers({ ...answers, [currentQ.id]: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                  autoFocus
                />
              )}

              {currentQ.type === 'paragraph' && (
                <textarea 
                  className="w-full text-xl bg-transparent border-b-2 border-gray-200 dark:border-gray-700 focus:border-primary outline-none py-2 text-gray-900 dark:text-white placeholder-gray-400 transition-colors resize-none"
                  placeholder="Cevabınızı buraya yazın..."
                  rows={4}
                  value={currentAnswer || ''}
                  onChange={(e) => setAnswers({ ...answers, [currentQ.id]: e.target.value })}
                  autoFocus
                />
              )}

              {currentQ.type === 'multiple_choice' && (
                <div className="space-y-3">
                  {(currentQ.options || []).map((opt, i) => (
                    <label 
                      key={i} 
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        currentAnswer === opt 
                          ? 'border-primary bg-primary/5 dark:bg-primary/10' 
                          : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name={currentQ.id} 
                        value={opt}
                        className="w-5 h-5 text-primary focus:ring-primary border-gray-300"
                        checked={currentAnswer === opt}
                        onChange={(e) => setAnswers({ ...answers, [currentQ.id]: e.target.value })}
                      />
                      <span className="text-lg font-medium text-gray-800 dark:text-gray-200">{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {currentQ.type === 'checkbox' && (
                <div className="space-y-3">
                  {(currentQ.options || []).map((opt, i) => {
                    const isChecked = (currentAnswer || []).includes(opt);
                    return (
                      <label 
                        key={i} 
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          isChecked 
                            ? 'border-primary bg-primary/5 dark:bg-primary/10' 
                            : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                        }`}
                      >
                        <input 
                          type="checkbox" 
                          className="w-5 h-5 text-primary rounded focus:ring-primary border-gray-300"
                          checked={isChecked}
                          onChange={(e) => {
                            const currentList = currentAnswer || []
                            const newList = e.target.checked 
                              ? [...currentList, opt] 
                              : currentList.filter((a: string) => a !== opt)
                            setAnswers({ ...answers, [currentQ.id]: newList })
                          }}
                        />
                        <span className="text-lg font-medium text-gray-800 dark:text-gray-200">{opt}</span>
                      </label>
                    )
                  })}
                </div>
              )}

              {currentQ.type === 'dropdown' && (
                <select 
                  className="w-full text-xl bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-primary outline-none p-4 text-gray-900 dark:text-white transition-colors cursor-pointer"
                  value={currentAnswer || ''}
                  onChange={(e) => setAnswers({ ...answers, [currentQ.id]: e.target.value })}
                >
                  <option value="" disabled>Lütfen bir seçenek belirleyin</option>
                  {(currentQ.options || []).map((opt, i) => (
                    <option key={i} value={opt}>{opt}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between px-2">
            <button
              onClick={handleBack}
              disabled={history.length === 0 || submitting}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white font-medium disabled:opacity-0 transition-all px-4 py-2"
            >
              <ArrowLeft size={20} /> Önceki
            </button>

            <button
              onClick={handleNext}
              disabled={submitting}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-primary/30 transition-all hover:scale-105"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isLastQuestion ? (
                <>Gönder <CheckCircle2 size={20} /></>
              ) : (
                <>Sonraki <ArrowRight size={20} /></>
              )}
            </button>
          </div>
          
        </div>
      </div>
    </div>
  )
}
