// Authentication
export interface User {
  id: number
  full_name: string
  email: string | null
  is_admin: boolean
  municipality_id: number | null
  municipality_name: string | null
  municipality_logo_url: string | null
  push_enabled: boolean
  email_enabled: boolean
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

// Complaints
export type ComplaintStatus = 'Beklemede' | 'İnceleniyor' | 'İlgili Birime Yönlendirildi' | 'Çözüldü'
export type ComplaintCategory =
  | 'Yol ve Kaldırım'
  | 'Park ve Yeşil Alan'
  | 'Su ve Kanalizasyon'
  | 'Elektrik ve Aydınlatma'
  | 'Çöp ve Temizlik'
  | 'Gürültü'
  | 'İmar ve Ruhsat'
  | 'Çevre'
  | 'Ulaşım'
  | 'Sosyal Hizmetler'
  | 'Diğer'

export interface TimelineItem {
  id: number
  old_status: ComplaintStatus | null
  new_status: ComplaintStatus
  note: string | null
  changed_by_name: string | null
  created_at: string
}

export interface Complaint {
  id: number
  description: string
  photo_url: string | null
  latitude: number | null
  longitude: number | null
  address_text: string | null
  status: ComplaintStatus
  category: ComplaintCategory | null
  assigned_unit: string | null
  ai_category: string | null
  ai_sentiment: string | null
  ai_urgency_score: number | null
  ai_summary: string | null
  ai_photo_analysis: string | null
  ai_processed: boolean
  satisfaction_score: number | null
  is_public: boolean
  upvote_count: number
  user_upvoted: boolean
  municipality_id: number
  user_id: number
  user_name: string | null
  group_id: number | null
  created_at: string
  updated_at: string | null
  timeline: TimelineItem[]
}

export interface ComplaintListResponse {
  items: Complaint[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface MapPoint {
  id: number
  lat: number | null
  lng: number | null
  status: ComplaintStatus
  category: ComplaintCategory | null
  urgency: number | null
  description: string
}

// Polls
export interface PollOption {
  id: number
  text: string
  votes: number
}

export interface Poll {
  id: number
  title: string
  description: string | null
  options: PollOption[]
  is_active: boolean
  ends_at: string | null
  total_votes: number
  user_voted: boolean
  user_vote_option: number | null
  ai_analysis: string | null
  municipality_id: number
  created_at: string
}

// Conversations
export type ConversationStatus = 'Açık' | 'AI Yanıtlıyor' | 'İnsan Devredildi' | 'Kapatıldı'
export type SenderType = 'Vatandaş' | 'AI' | 'Yetkili'

export interface Message {
  id: number
  sender_type: SenderType
  sender_name: string | null
  content: string
  is_read: boolean
  created_at: string
}

export interface Conversation {
  id: number
  topic: string | null
  status: ConversationStatus
  last_message_at: string | null
  created_at: string
  messages: Message[]
  unread_count: number
}

// Announcements
export interface Announcement {
  id: number
  title: string
  content: string
  category: string | null
  is_pinned: boolean
  is_active: boolean
  created_at: string
}

// Dashboard
export interface DashboardStats {
  total_complaints: number
  pending_complaints: number
  resolved_complaints: number
  resolution_rate: number
  avg_resolution_hours: number | null
  nps_score: number | null
  active_conversations: number
  urgent_complaints: number
}

export interface AdminDashboard {
  stats: DashboardStats
  by_status: { status: string; count: number; percentage: number }[]
  by_category: { category: string; count: number }[]
  weekly_trend: { date: string; complaints: number; resolved: number }[]
  recent_urgent: {
    id: number
    description: string
    urgency_score: number
    status: string
    created_at: string
  }[]
  ai_summary: string | null
}

export interface ComplaintGroup {
  id: number
  title: string
  description: string | null
  complaint_count: number
  avg_urgency: number | null
  status: string
  created_at: string
}

// WebSocket Messages
export type WSMessage =
  | { type: 'complaint_update'; complaint_id: number; status: string }
  | { type: 'new_complaint'; data: Partial<Complaint> }
  | { type: 'chat_message'; data: { conversation_id: number; sender_type: SenderType; content: string } }
  | { type: 'pong' }
