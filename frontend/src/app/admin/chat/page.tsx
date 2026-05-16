'use client'

import { useEffect, useState, useRef } from 'react'
import { MessageSquare, Send, Bot, UserCheck, Loader2 } from 'lucide-react'
import api from '@/lib/api/client'
import { Conversation, Message } from '@/types'
import { PageHeader, LoadingSkeleton, EmptyState } from '@/components/ui'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import toast from 'react-hot-toast'

export default function AdminChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selected, setSelected] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api.getConversations().then(setConversations).catch(() => {}).finally(() => setLoading(false))
    const interval = setInterval(() => api.getConversations().then(setConversations).catch(() => {}), 10000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selected?.messages])

  const sendMessage = async () => {
    if (!message.trim() || !selected) return
    setSending(true)
    try {
      await api.sendMessage(selected.id, message)
      const updated = await api.getConversations()
      setConversations(updated)
      const fresh = updated.find((c: Conversation) => c.id === selected.id)
      if (fresh) setSelected(fresh)
      setMessage('')
    } catch { toast.error('Mesaj gönderilemedi') }
    finally { setSending(false) }
  }

  const takeover = async (id: number) => {
    try {
      await api.takeoverConversation(id)
      const updated = await api.getConversations()
      setConversations(updated)
      const fresh = updated.find((c: Conversation) => c.id === id)
      if (fresh) setSelected(fresh)
      toast.success('Konuşma devralındı')
    } catch { toast.error('Devralma başarısız') }
  }

  return (
    <div>
      <PageHeader title="Canlı Destek Yönetimi" description="Vatandaş konuşmalarını takip edin ve devralın" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 h-[calc(100vh-200px)]">
        {/* Konuşma listesi */}
        <div className="card overflow-hidden flex flex-col">
          <div className="p-4 border-b border-surface-100 dark:border-surface-800">
            <h3 className="font-semibold text-sm">{conversations.length} Konuşma</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? <div className="p-4"><LoadingSkeleton rows={4} /></div> :
             conversations.map(conv => (
               <button key={conv.id} onClick={() => setSelected(conv)}
                 className={`w-full text-left p-4 border-b border-surface-100 dark:border-surface-800 transition-colors
                   ${selected?.id === conv.id ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-surface-50 dark:hover:bg-surface-800'}`}>
                 <div className="flex items-center justify-between mb-1">
                   <span className="text-xs font-semibold text-surface-900 dark:text-surface-50">{conv.topic || 'Genel'}</span>
                   <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                     conv.status === 'İnsan Devredildi' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300' :
                     conv.status === 'AI Yanıtlıyor' ? 'bg-blue-100 text-blue-600' :
                     'bg-surface-100 text-surface-500'
                   }`}>{conv.status}</span>
                 </div>
                 <p className="text-xs text-surface-400 truncate">
                   {conv.messages[conv.messages.length - 1]?.content || '—'}
                 </p>
                 {conv.unread_count > 0 && (
                   <span className="inline-block mt-1 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                     {conv.unread_count} okunmamış
                   </span>
                 )}
               </button>
             ))
            }
          </div>
        </div>

        {/* Mesajlaşma */}
        <div className="lg:col-span-2 card overflow-hidden flex flex-col">
          {selected ? (
            <>
              <div className="p-4 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-surface-900 dark:text-surface-50">{selected.topic || 'Genel'}</p>
                  <p className="text-xs text-surface-400">{selected.status}</p>
                </div>
                {selected.status === 'AI Yanıtlıyor' && (
                  <button onClick={() => takeover(selected.id)} className="btn-secondary text-xs px-3 py-1.5">
                    <UserCheck className="w-3.5 h-3.5" /> Devral
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {selected.messages.map(msg => (
                  <div key={msg.id} className={`flex gap-2 ${msg.sender_type === 'Yetkili' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      msg.sender_type === 'Vatandaş' ? 'bg-surface-200 dark:bg-surface-700' :
                      msg.sender_type === 'AI' ? 'bg-violet-100 dark:bg-violet-900' : 'bg-primary-100 dark:bg-primary-900'
                    }`}>
                      {msg.sender_type === 'AI' ? <Bot className="w-3.5 h-3.5 text-violet-600" /> : '👤'}
                    </div>
                    <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-xl text-sm ${
                      msg.sender_type === 'Yetkili'
                        ? 'bg-primary-600 text-white rounded-tr-none'
                        : msg.sender_type === 'AI'
                        ? 'bg-violet-50 dark:bg-violet-900/20 text-surface-900 dark:text-surface-50 rounded-tl-none'
                        : 'bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-surface-50 rounded-tl-none'
                    }`}>
                      <p className="text-xs font-medium opacity-70 mb-0.5">
                        {msg.sender_type === 'AI' ? '🤖 AI' : msg.sender_type === 'Yetkili' ? '👮 Yetkili' : '👤 Vatandaş'}
                      </p>
                      {msg.content}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              {selected.status === 'İnsan Devredildi' && (
                <div className="p-4 border-t border-surface-100 dark:border-surface-800 flex gap-2">
                  <input value={message} onChange={e => setMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    placeholder="Yanıt yazın..." className="input-field flex-1" />
                  <button onClick={sendMessage} disabled={sending || !message.trim()} className="btn-primary px-4">
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState icon={<MessageSquare className="w-8 h-8" />}
                title="Konuşma Seçin"
                description="Sol taraftan bir konuşma seçin." />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
