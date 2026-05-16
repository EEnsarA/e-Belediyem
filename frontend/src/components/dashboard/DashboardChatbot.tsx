'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Sparkles, Loader2, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '@/lib/api/client'

export default function DashboardChatbot() {
  const [messages, setMessages] = useState<{ role: 'ai' | 'user'; content: string }[]>([
    { role: 'ai', content: 'Merhaba! Size belediye hizmetleri, başvurular veya şikayetleriniz konusunda nasıl yardımcı olabilirim?' }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      const res = await api.quickChat(userMessage)
      setMessages(prev => [...prev, { role: 'ai', content: res.content }])
    } catch (err) {
      // Fallback for demo if endpoint not ready
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'ai', content: "Şu an bağlantı kurulamadı, ancak genel olarak ehliyet başvuruları nüfus müdürlüklerinden yapılmaktadır. Başka bir sorunuz var mı?" }])
        setIsLoading(false)
      }, 1000)
      return
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="card h-[400px] flex flex-col overflow-hidden border-primary-500/20 bg-gradient-to-b from-white to-primary-50/30 dark:from-surface-900 dark:to-surface-950">
      {/* Header */}
      <div className="p-4 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between bg-white/50 dark:bg-transparent backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-surface-900 dark:text-surface-50">AI Belediye Asistanı</h3>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] text-surface-500 font-medium">Çevrimiçi</span>
            </div>
          </div>
        </div>
        <Sparkles className="w-4 h-4 text-primary-400" />
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
      >
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: msg.role === 'ai' ? -10 : 10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex ${msg.role === 'ai' ? 'justify-start' : 'justify-end'}`}
          >
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
              msg.role === 'ai' 
                ? 'bg-white dark:bg-surface-800 text-surface-800 dark:text-surface-200 shadow-sm border border-surface-100 dark:border-surface-700' 
                : 'bg-primary-500 text-white shadow-md'
            }`}>
              {msg.content}
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-surface-800 p-3 rounded-2xl shadow-sm border border-surface-100 dark:border-surface-700">
              <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-white/50 dark:bg-transparent border-t border-surface-100 dark:border-surface-800">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Neyi merak ediyorsunuz? (örn: emlak vergisi)"
            className="w-full pl-4 pr-12 py-3 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {['Ehliyet nasıl alınır?', 'Su borcu ödeme', 'Nikah başvurusu'].map((q) => (
            <button
              key={q}
              onClick={() => setInput(q)}
              className="whitespace-nowrap px-3 py-1 bg-surface-100 dark:bg-surface-800 hover:bg-primary-100 dark:hover:bg-primary-900/30 text-[10px] font-medium text-surface-600 dark:text-surface-400 rounded-full border border-surface-200 dark:border-surface-700 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
