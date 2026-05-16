# 🏙️ e-Belediyem — Vatandaş Etkileşim Platformu

> Vatandaşların e-Devlet ile güvenle giriş yaparak belediyelerine bağlandığı, AI destekli modern dijital belediye platformu.

![Stack](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)
![Stack](https://img.shields.io/badge/Frontend-Next.js-000000?logo=next.js)
![Stack](https://img.shields.io/badge/Database-PostgreSQL-336791?logo=postgresql)
![Stack](https://img.shields.io/badge/AI-Google%20Gemini-4285F4?logo=google)

---

## 🚀 Hızlı Başlangıç

### Gereksinimler
- Docker & Docker Compose
- Node.js 20+ (local geliştirme için)
- Python 3.12+ (local geliştirme içi
,

### 1. Ortam değişkenlerini ayarla
```bash
cp .env.example .env
# .env dosyasını düzenle (özellikle GEMINI_API_KEY)
```

### 2. Docker Compose ile başlat
```bash
docker-compose up -d
```

### 3. Veritabanını hazırla ve seed data ekle
```bash
docker exec akilli_belediye_backend python -m app.db.seed
```

### 4. Uygulamaya eriş
| Servis | URL |
|--------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000/api/docs |
| MinIO Console | http://localhost:9001 |
| PostgreSQL | localhost:5432 |

---

## 🔑 Demo Hesapları

| Kullanıcı | TCKN | Belediye | Şifre |
|-----------|------|----------|-------|
| Vatandaş | 12345678901 | Kadıköy | herhangi |
| Admin | 11111111111 | Kadıköy | herhangi |
| Vatandaş | 34567890123 | Çankaya | herhangi |
| Admin | 22222222222 | Çankaya | herhangi |
| Vatandaş | 56789012345 | Konak | herhangi |
| Admin | 33333333333 | Konak | herhangi |

---

## 🏗️ Mimari

```
akilli-belediye/
├── backend/          # FastAPI Python
├── frontend/         # Next.js TypeScript
├── nginx/            # Reverse proxy
└── docker-compose.yml
```

### Tech Stack
| Katman | Teknoloji |
|--------|-----------|
| Frontend | Next.js 14, TypeScript, TailwindCSS, Zustand |
| Backend | Python, FastAPI, SQLAlchemy, asyncpg |
| Database | PostgreSQL + pgvector |
| AI | Google Gemini (Vision + Text + Embedding) |
| Storage | MinIO (S3-compatible) |
| Realtime | FastAPI WebSocket |
| Maps | Leaflet.js (OSM) |
| Auth | Mock e-Devlet + JWT (Argon2) |
| Deployment | Docker, Nginx, GitHub Actions, Vercel |

---

## 🤖 AI Pipeline

```
Şikayet gelir
    ↓
[1] Fotoğraf varsa → Gemini Vision analizi
    ↓
[2] Text embedding (text-embedding-004)
    ↓
[3] Spam kontrolü (0.0-1.0 skor)
    ↓
[4] Kategori belirleme
    ↓
[5] Aciliyet skoru (1-10)
    ↓
[6] Duygu analizi
    ↓
[7] Benzer şikayetler (cosine similarity)
    ↓
[8] DB'ye kaydet → WebSocket broadcast
```

---

## 📡 API Endpoints

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | /api/auth/edevlet | e-Devlet login |
| GET | /api/auth/me | Mevcut kullanıcı |
| GET | /api/complaints | Şikayet listesi |
| POST | /api/complaints | Yeni şikayet |
| PATCH | /api/complaints/{id}/status | Durum güncelle |
| GET | /api/polls | Anketler |
| POST | /api/polls/{id}/vote | Oy kullan |
| GET | /api/conversations | Konuşmalar |
| POST | /api/conversations | Chat başlat |
| GET | /api/admin/dashboard | Admin dashboard |
| GET | /api/admin/map | Harita verileri |
| POST | /api/admin/report | PDF/Word rapor |
| WS | /api/conversations/ws/{token} | WebSocket |

---

## 🔒 Güvenlik

- **JWT**: Access 15dk, Refresh 7gün
- **TCKN**: Argon2 hash (KVKK uyumu)
- **AI Gizliliği**: Gemini'ye kişisel veri gönderilmez
- **Storage**: MinIO signed URL (24h geçerli)
- **Rate Limiting**: 100 req/min (auth: 10 req/min)
- **RLS**: Her belediye sadece kendi verisini görür

---

## 🛠️ Local Geliştirme

### Backend
```bash
cd backend
python -m venv .venv
.venv/Scripts/activate  # Windows
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

---

## 📄 Lisans
MIT
