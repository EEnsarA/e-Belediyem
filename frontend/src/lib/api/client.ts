import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: `${BASE_URL}/api`,
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
    })

    // Request interceptor - token ekle
    this.client.interceptors.request.use((config) => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('access_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
      }
      return config
    })

    // Response interceptor - token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true
          try {
            const refreshToken = localStorage.getItem('refresh_token')
            if (refreshToken) {
              const response = await axios.post(`${BASE_URL}/api/auth/refresh`, {
                refresh_token: refreshToken,
              })
              const { access_token, refresh_token } = response.data
              localStorage.setItem('access_token', access_token)
              localStorage.setItem('refresh_token', refresh_token)
              originalRequest.headers.Authorization = `Bearer ${access_token}`
              return this.client(originalRequest)
            }
          } catch {
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
            window.location.href = '/login'
          }
        }
        return Promise.reject(error)
      }
    )
  }

  // Auth
  async login(tckn: string, password: string) {
    const res = await this.client.post('/auth/edevlet', { tckn, password })
    return res.data
  }

  async getMe() {
    const res = await this.client.get('/auth/me')
    return res.data
  }

  async logout() {
    try {
      await this.client.post('/auth/logout')
    } catch (err) {
      console.warn('Logout request failed, clearing local session anyway', err)
    } finally {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    }
  }

  // Complaints
  async getComplaints(params?: {
    page?: number
    page_size?: number
    status?: string
    category?: string
    sort?: string
  }) {
    const res = await this.client.get('/complaints', { params })
    return res.data
  }

  async getComplaint(id: number) {
    const res = await this.client.get(`/complaints/${id}`)
    return res.data
  }

  async createComplaint(formData: FormData) {
    const res = await this.client.post('/complaints', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  }

  async updateComplaintStatus(id: number, status: string, note?: string, assigned_unit?: string) {
    const res = await this.client.patch(`/complaints/${id}/status`, { status, note, assigned_unit })
    return res.data
  }

  async rateComplaint(id: number, score: number) {
    const res = await this.client.patch(`/complaints/${id}/satisfaction`, { score })
    return res.data
  }

  // Polls
  async getPolls() {
    const res = await this.client.get('/polls')
    return res.data
  }

  async createPoll(data: { title: string; description?: string; options: string[]; ends_at?: string }) {
    const res = await this.client.post('/polls', data)
    return res.data
  }

  async votePoll(pollId: number, optionId: number) {
    const res = await this.client.post(`/polls/${pollId}/vote`, { option_id: optionId })
    return res.data
  }

  async closePoll(pollId: number) {
    const res = await this.client.patch(`/polls/${pollId}/close`)
    return res.data
  }

  // Conversations
  async getConversations() {
    const res = await this.client.get('/conversations')
    return res.data
  }

  async startConversation(topic: string, firstMessage: string) {
    const res = await this.client.post('/conversations', { topic, first_message: firstMessage })
    return res.data
  }

  async sendMessage(convId: number, content: string) {
    const res = await this.client.post(`/conversations/${convId}/messages`, { content })
    return res.data
  }

  async quickChat(content: string) {
    const res = await this.client.post('/conversations/quick-chat', { content })
    return res.data
  }

  async takeoverConversation(convId: number) {
    const res = await this.client.patch(`/conversations/${convId}/takeover`)
    return res.data
  }

  // Admin Settings
  async getAdminSettings() {
    const res = await this.client.get('/admin/settings')
    return res.data
  }

  async updateAdminSettings(data: any) {
    const res = await this.client.patch('/admin/settings', data)
    return res.data
  }

  // Announcements
  async getAnnouncements() {
    const res = await this.client.get('/announcements')
    return res.data
  }

  async createAnnouncement(data: {
    title: string
    content: string
    category?: string
    is_pinned?: boolean
    expires_at?: string
  }) {
    const res = await this.client.post('/announcements', data)
    return res.data
  }

  async deleteAnnouncement(id: number) {
    const res = await this.client.delete(`/announcements/${id}`)
    return res.data
  }

  // Admin
  async getAdminDashboard() {
    const res = await this.client.get('/admin/dashboard')
    return res.data
  }

  async getMapData() {
    const res = await this.client.get('/admin/map')
    return res.data
  }

  async getComplaintGroups() {
    const res = await this.client.get('/admin/groups')
    return res.data
  }

  async generateReport(format: 'pdf' | 'docx', startDate?: string, endDate?: string, reportType = 'general') {
    const res = await this.client.post(
      '/admin/report',
      { 
        format, 
        start_date: startDate, 
        end_date: endDate, 
        report_type: reportType,
        include_ai_summary: true 
      },
      { responseType: 'blob' }
    )
    return res.data
  }

  async getAuditLogs(page = 1) {
    const res = await this.client.get('/admin/logs', { params: { page } })
    return res.data
  }

  async getUsers() {
    const res = await this.client.get('/admin/users')
    return res.data
  }

  // Discover (public — no auth required)
  async discoverMunicipalities(params?: { search?: string; province?: string }) {
    const res = await this.client.get('/discover', { params })
    return res.data
  }

  async getLeaderboard() {
    const res = await this.client.get('/discover/leaderboard')
    return res.data
  }

  async getPublicComplaints(municipalityId: number, params?: { page?: number; sort?: string }) {
    const res = await this.client.get(`/discover/municipality/${municipalityId}/public-complaints`, { params })
    return res.data
  }

  async getGlobalPublicComplaints(params?: { page?: number; sort?: string }) {
    const res = await this.client.get('/discover/global-complaints', { params })
    return res.data
  }

  async getGlobalPolls() {
    const res = await this.client.get('/discover/global-polls')
    return res.data
  }

  // Complaint upvote
  async upvoteComplaint(id: number) {

    const res = await this.client.post(`/complaints/${id}/upvote`)
    return res.data
  }

  async removeUpvote(id: number) {
    const res = await this.client.delete(`/complaints/${id}/upvote`)
    return res.data
  }
  // Dynamic Forms
  async getForms() {
    const res = await this.client.get('/forms')
    return res.data
  }

  async getForm(id: number) {
    const res = await this.client.get(`/forms/${id}`)
    return res.data
  }

  async createForm(data: any) {
    const res = await this.client.post('/forms', data)
    return res.data
  }

  async generateAIForm(topic: string) {
    const res = await this.client.post(`/forms/generate-ai?topic=${encodeURIComponent(topic)}`)
    return res.data
  }

  async submitFormResponse(formId: number, answers: any) {
    const res = await this.client.post(`/forms/${formId}/responses`, answers)
    return res.data
  }

  async getFormAnalytics(id: number) {
    const res = await this.client.get(`/forms/${id}/analytics`)
    return res.data
  }

  async exportFormResponses(id: number) {
    const res = await this.client.get(`/forms/${id}/export`, { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `form_${id}_responses.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()
  }
}

export const api = new ApiClient()
export default api
