'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Send, Bot, User, MessageSquare, Plus, Loader2 } from 'lucide-react'
import api from '@/lib/api/client'
import { Conversation, Message } from '@/types'
import { useAuthStore } from '@/store'
import { PageHeader, EmptyState, LoadingSkeleton } from '@/components/ui'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import toast from 'react-hot-toast'

const TOPICS = ['Genel Bilgi', 'Şikayet Takibi', 'Anket Bilgisi', 'Ulaşım', 'Park & Yeşil Alan', 'Diğer']

export default function ChatPage() {
  const { user } = useAuthStore()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [newTopic, setNewTopic] = useState(TOPICS[0])
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api.getConversations()
      .then(setConversations)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedConv?.messages])

  const startNew = async () => {
    if (!newMessage.trim()) return
    setSending(true)
    try {
      const conv = await api.startConversation(newTopic, newMessage)
      setConversations(prev => [conv, ...prev])
      setSelectedConv(conv)
      setShowNew(false)
      setNewMessage('')
    } catch { toast.error('Konuşma başlatılamadı') }
    finally { setSending(false) }
  }

  const sendMessage = async () => {
    if (!message.trim() || !selectedConv) return
    setSending(true)
    try {
      const msg = await api.sendMessage(selectedConv.id, message)
      // AI mesajını da dahil et (API yanıtı)
      const updated = await api.getConversations()
      setConversations(updated)
      const fresh = updated.find((c: Conversation) => c.id === selectedConv.id)
      if (fresh) setSelectedConv(fresh)
      setMessage('')
    } catch { toast.error('Mesaj gönderilemedi') }
    finally { setSending(false) }
  }

  return (
    <div>
      <PageHeader title="AI Destekli Chat" description="Sorularınızı sorun, AI hemen yanıtlar." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 h-[calc(100vh-200px)]">
        {/* Konuşma listesi */}
        <div className="card overflow-hidden flex flex-col">
          <div className="p-4 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between">
            <h3 className="font-semibold text-sm">Konuşmalar</h3>
            <button onClick={() => setShowNew(true)} className="btn-primary text-xs px-3 py-1.5">
              <Plus className="w-3 h-3" /> Yeni
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? <div className="p-4"><LoadingSkeleton rows={3} /></div> :
             conversations.length === 0 ? (
               <div className="p-6 text-center text-xs text-surface-500">
                 Henüz konuşma yok. Yeni bir konuşma başlatın.
               </div>
             ) : conversations.map(conv => (
               <button key={conv.id} onClick={() => setSelectedConv(conv)}
                 className={`w-full text-left p-4 border-b border-surface-100 dark:border-surface-800 transition-colors
                   ${selectedConv?.id === conv.id ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-surface-50 dark:hover:bg-surface-800'}`}>
                 <div className="flex items-center justify-between mb-1">
                   <span className="text-xs font-semibold text-surface-900 dark:text-surface-50">{conv.topic || 'Genel'}</span>
                   <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                     conv.status === 'AI Yanıtlıyor' ? 'bg-blue-100 text-blue-600' :
                     conv.status === 'İnsan Devredildi' ? 'bg-green-100 text-green-600' :
                     'bg-surface-100 text-surface-500'
                   }`}>{conv.status}</span>
                 </div>
                 <p className="text-xs text-surface-500 truncate">
                   {conv.messages[conv.messages.length - 1]?.content || 'Mesaj yok'}
                 </p>
               </button>
             ))}
          </div>
        </div>

        {/* Mesajlaşma */}
        <div className="lg:col-span-2 card overflow-hidden flex flex-col">
          {showNew ? (
            <div className="flex-1 p-6 flex flex-col gap-4">
              <h3 className="font-semibold">Yeni Konuşma</h3>
              <div>
                <label className="text-xs text-surface-500 mb-1 block">Konu</label>
                <select value={newTopic} onChange={e => setNewTopic(e.target.value)} className="input-field">
                  {TOPICS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs text-surface-500 mb-1 block">İlk Mesajınız</label>
                <textarea value={newMessage} onChange={e => setNewMessage(e.target.value)}
                  placeholder="Sorunuzu yazın..." className="input-field resize-none h-32" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowNew(false)} className="btn-secondary flex-1">İptal</button>
                <button onClick={startNew} disabled={sending || !newMessage.trim()} className="btn-primary flex-1">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Başlat
                </button>
              </div>
            </div>
          ) : selectedConv ? (
            <>
              <div className="p-4 border-b border-surface-100 dark:border-surface-800 flex items-center gap-3">
                <Bot className="w-5 h-5 text-primary-500" />
                <div>
                  <p className="text-sm font-semibold text-surface-900 dark:text-surface-50">{selectedConv.topic || 'Genel'}</p>
                  <p className="text-xs text-surface-400">{selectedConv.status}</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {selectedConv.messages.map(msg => (
                  <div key={msg.id} className={`flex gap-2 ${msg.sender_type === 'Vatandaş' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      msg.sender_type === 'Vatandaş' ? 'bg-primary-100 dark:bg-primary-800' :
                      msg.sender_type === 'AI' ? 'bg-violet-100 dark:bg-violet-900' :
                      'bg-green-100 dark:bg-green-900'
                    }`}>
                      {msg.sender_type === 'Vatandaş' ? <User className="w-3.5 h-3.5 text-primary-600" /> :
                       msg.sender_type === 'AI' ? <Bot className="w-3.5 h-3.5 text-violet-600" /> :
                       <User className="w-3.5 h-3.5 text-green-600" />}
                    </div>
                    <div className={`max-w-xs lg:max-w-md ${msg.sender_type === 'Vatandaş' ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div className={`px-3 py-2 rounded-xl text-sm ${
                        msg.sender_type === 'Vatandaş'
                          ? 'bg-primary-600 text-white rounded-tr-none'
                          : msg.sender_type === 'AI'
                          ? 'bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-surface-50 rounded-tl-none'
                          : 'bg-green-50 dark:bg-green-900/20 text-surface-900 dark:text-surface-50 rounded-tl-none'
                      }`}>
                        {msg.content}
                      </div>
                      <span className="text-xs text-surface-400 mt-0.5">
                        {msg.sender_type !== 'Vatandaş' && (
                          <span className="text-xs font-medium mr-1">
                            {msg.sender_type === 'AI' ? '🤖 AI' : `👤 ${msg.sender_name || 'Yetkili'}`}
                          </span>
                        )}
                        {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: tr })}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 border-t border-surface-100 dark:border-surface-800 flex gap-2">
                <input value={message} onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Mesajınızı yazın..." className="input-field flex-1" />
                <button onClick={sendMessage} disabled={sending || !message.trim()} className="btn-primary px-4">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState icon={<MessageSquare className="w-8 h-8" />}
                title="Konuşma Seçin"
                description="Sol taraftan bir konuşma seçin veya yeni bir konuşma başlatın."
                action={<button onClick={() => setShowNew(true)} className="btn-primary"><Plus className="w-4 h-4" /> Yeni Konuşma</button>}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
