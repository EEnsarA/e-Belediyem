import logging
import json
from typing import Optional, Dict, Any, List
from app.core.config import settings

logger = logging.getLogger(__name__)


class AIService:
    """Google Gemini AI entegrasyonu - Şikayet analizi, chat, raporlama."""

    def __init__(self):
        self.enabled = bool(settings.GEMINI_API_KEY)
        self._client = None
        if self.enabled:
            try:
                import google.generativeai as genai
                genai.configure(api_key=settings.GEMINI_API_KEY)
                self._genai = genai
                self._text_model = genai.GenerativeModel(settings.GEMINI_MODEL)
                self._vision_model = genai.GenerativeModel(settings.GEMINI_VISION_MODEL)
                logger.info("✅ Gemini AI başarıyla başlatıldı")
            except Exception as e:
                logger.warning(f"⚠️ Gemini AI başlatılamadı: {e}")
                self.enabled = False
        else:
            logger.warning("⚠️ GEMINI_API_KEY ayarlanmamış - AI özellikleri devre dışı")

    async def analyze_complaint(self, description: str, photo_bytes: Optional[bytes] = None) -> Dict[str, Any]:
        """
        Şikayet analizi pipeline:
        1. Metin analizi (kategori, aciliyet, duygu, spam, özet)
        2. Fotoğraf varsa görsel analiz
        3. Embedding oluşturma
        """
        if not self.enabled:
            return self._default_analysis()

        try:
            # Metin analizi
            text_result = await self._analyze_text(description)

            # Görsel analiz
            photo_analysis = None
            if photo_bytes:
                photo_analysis = await self._analyze_image(photo_bytes, description)

            # Embedding
            embedding = await self._get_embedding(description)

            return {
                **text_result,
                "ai_photo_analysis": photo_analysis,
                "embedding": embedding,
                "ai_processed": True,
            }
        except Exception as e:
            logger.error(f"AI analiz hatası: {e}")
            return self._default_analysis()

    async def _analyze_text(self, description: str) -> Dict[str, Any]:
        """Gemini ile metin analizi - TCKN veya kişisel veri gönderilmez."""
        prompt = f"""
Sen bir belediye şikayet analiz sistemisin. Aşağıdaki vatandaş şikayetini analiz et.
KESİNLİKLE kişisel veri (isim, TC kimlik, telefon vb.) içermeyen analizler üret.

Şikayet: "{description}"

Aşağıdaki JSON formatında yanıt ver:
{{
  "category": "Yol ve Kaldırım|Park ve Yeşil Alan|Su ve Kanalizasyon|Elektrik ve Aydınlatma|Çöp ve Temizlik|Gürültü|İmar ve Ruhsat|Çevre|Ulaşım|Sosyal Hizmetler|Diğer",
  "urgency_score": 1-10 (1=düşük, 10=kritik),
  "sentiment": "positive|neutral|negative",
  "spam_score": 0.0-1.0 (0=gerçek, 1=spam),
  "toxicity_score": 0.0-1.0,
  "summary": "Yönetici için 1-2 cümle özet (Türkçe)",
  "keywords": ["anahtar", "kelime", "listesi"]
}}

SADECE JSON döndür, başka metin ekleme.
"""
        response = self._text_model.generate_content(prompt)
        text = response.text.strip()
        # JSON temizle
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()

        data = json.loads(text)
        return {
            "ai_category": data.get("category"),
            "ai_urgency_score": min(10, max(1, int(data.get("urgency_score", 5)))),
            "ai_sentiment": data.get("sentiment", "neutral"),
            "ai_spam_score": float(data.get("spam_score", 0.0)),
            "ai_toxicity_score": float(data.get("toxicity_score", 0.0)),
            "ai_summary": data.get("summary"),
            "ai_keywords": json.dumps(data.get("keywords", []), ensure_ascii=False),
        }

    async def _analyze_image(self, image_bytes: bytes, context: str) -> str:
        """Gemini Vision ile görsel analiz."""
        import PIL.Image
        import io
        img = PIL.Image.open(io.BytesIO(image_bytes))

        prompt = f"""
Bu belediye şikayet fotoğrafını analiz et. Şikayet: "{context[:200]}"
Fotoğrafta ne görüyorsun? Sorunun ne olduğunu kısaca açıkla (max 150 kelime, Türkçe).
Kişisel bilgilere değinme.
"""
        response = self._vision_model.generate_content([prompt, img])
        return response.text.strip()

    async def _get_embedding(self, text: str) -> Optional[List[float]]:
        """Text embedding oluştur (benzer şikayet gruplandırması için)."""
        try:
            result = self._genai.embed_content(
                model=settings.GEMINI_EMBEDDING_MODEL,
                content=text[:500],  # Max 500 karakter
            )
            return result["embedding"]
        except Exception as e:
            logger.warning(f"Embedding oluşturulamadı: {e}")
            return None

    async def generate_chat_response(self, topic: str, message: str, history: List[Dict], knowledge_context: Optional[str] = None) -> str:
        """AI chat yanıtı - Belediye danışma chatbot."""
        if not self.enabled:
            return "Şu anda AI asistan hizmet dışı. Yetkililerimiz en kısa sürede size yardımcı olacak."

        try:
            history_text = "\n".join([
                f"{h['sender']}: {h['content']}" for h in history[-5:]  # Son 5 mesaj
            ])
            
            knowledge_prompt = ""
            if knowledge_context:
                knowledge_prompt = f"\nBELEDİYE BİLGİ MERKEZİ VERİLERİ:\n{knowledge_context}\n"

            prompt = f"""
Sen bir belediye dijital asistanısın. Vatandaşların sorularını kibarca, doğru ve özlü şekilde yanıtlıyorsun.
{knowledge_prompt}
Konu: {topic}
Konuşma geçmişi:
{history_text}

Vatandaş: {message}

KURALLARA: 
1. Eğer yukarıdaki 'BELEDİYE BİLGİ MERKEZİ VERİLERİ' kısmında aranan cevap varsa oradaki bilgiyi önceliklendir.
2. Kişisel veri isteme. 
3. Belediye hizmetleri hakkında genel bilgi ver.
4. Yanıtı kısa tut (max 200 kelime). Türkçe yanıt ver.

Asistan:"""
            response = self._text_model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            logger.error(f"Chat yanıt hatası: {e}")
            return "Üzgünüm, şu an yanıt veremiyorum. Yetkili bir personele bağlanıyorum."

    async def generate_weekly_briefing(self, stats: Dict[str, Any]) -> str:
        """Haftalık yönetici özeti."""
        if not self.enabled:
            return f"Bu hafta {stats.get('total', 0)} şikayet alındı."

        try:
            prompt = f"""
Belediye yöneticisi için haftalık özet oluştur:
- Toplam şikayet: {stats.get('total', 0)}
- Çözülen: {stats.get('resolved', 0)}
- Bekleyen: {stats.get('pending', 0)}
- Ortalama memnuniyet: {stats.get('avg_satisfaction', 'N/A')}
- En çok şikayet kategorisi: {stats.get('top_category', 'Bilinmiyor')}

3 madde halinde, net ve aksiyonel yönetici brifing yaz (Türkçe).
"""
            response = self._text_model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            logger.error(f"Brifing hatası: {e}")
            return "Haftalık analiz tamamlanamadı."

    async def analyze_poll_results(self, poll_title: str, options: List[Dict]) -> str:
        """Anket sonuçlarını analiz et."""
        if not self.enabled:
            return "Anket analizi tamamlandı."

        try:
            options_text = "\n".join([f"- {o['text']}: {o['votes']} oy" for o in options])
            prompt = f"""
Anket: "{poll_title}"
Sonuçlar:
{options_text}

Bu anket sonuçlarını kısaca analiz et, trend ve öneri sun (max 150 kelime, Türkçe).
"""
            response = self._text_model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            logger.error(f"Anket analiz hatası: {e}")
            return "Anket analizi tamamlanamadı."

    async def generate_form_questions(self, topic: str) -> List[Dict[str, Any]]:
        """Verilen konuya göre yapay zeka ile anket/form soruları üretir."""
        if not self.enabled:
            return []

        try:
            prompt = f"""
            Sen bir belediye anket uzmanısın. "{topic}" konusu hakkında vatandaşlara sorulacak profesyonel bir anket tasarla.
            
            Lütfen aşağıdaki kurallara göre tam olarak 5 soru üret:
            1. Sorular; 'short_text', 'paragraph', 'multiple_choice', 'checkbox', 'dropdown' tiplerinden karma olmalı.
            2. Her soru için bir benzersiz 'id' (string) üret.
            3. Seçenekli sorularda 'options' listesi ekle.
            4. Yanıtı SADECE aşağıdaki JSON formatında ver, başka hiçbir metin ekleme (markdown code block kullanma, sadece ham JSON):
            
            [
              {{
                "id": "q1",
                "type": "multiple_choice",
                "title": "Soru metni?",
                "required": true,
                "options": ["A", "B", "C"]
              }}
            ]
            """
            response = self._text_model.generate_content(prompt)
            text = response.text.strip()
            
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()
            
            return json.loads(text)
        except Exception as e:
            logger.error(f"Soru üretme hatası: {e}")
            # Kota aşımı veya hata durumunda fallback (yedek) sorular dön
            return self._get_fallback_questions(topic)

    def _get_fallback_questions(self, topic: str) -> List[Dict[str, Any]]:
        """API kotası dolduğunda veya hata alındığında dönülecek örnek sorular."""
        topic_lower = topic.lower()
        
        # Varsayılan sorular (Eğer konu eşleşmezse)
        questions = [
            {"id": "f1", "type": "short_text", "title": "Adınız ve Soyadınız", "required": True},
            {"id": "f2", "type": "multiple_choice", "title": "Hizmetimizden ne kadar memnunsunuz?", "required": True, "options": ["Çok Memnunum", "Memnunum", "Kararsızım", "Memnun Değilim"]},
            {"id": "f3", "type": "paragraph", "title": "Görüş ve önerileriniz nelerdir?", "required": False}
        ]

        if "ulaşım" in topic_lower or "otobüs" in topic_lower or "metro" in topic_lower:
            questions = [
                {"id": "u1", "type": "multiple_choice", "title": "En sık hangi toplu taşıma aracını kullanıyorsunuz?", "required": True, "options": ["Otobüs", "Metro", "Metrobüs", "Tramvay"]},
                {"id": "u2", "type": "dropdown", "title": "Sefer sıklıklarından memnun musunuz?", "required": True, "options": ["Evet, yeterli", "Hayır, yetersiz", "Kısmen"]},
                {"id": "u3", "type": "checkbox", "title": "İyileştirilmesini istediğiniz alanlar hangileri?", "required": False, "options": ["Araç temizliği", "Şoför nezaketi", "Dakiklik", "Durak konforu"]},
                {"id": "u4", "type": "paragraph", "title": "Eklemek istediğiniz ulaşım sorunu var mı?", "required": False}
            ]
        elif "park" in topic_lower or "yeşil alan" in topic_lower or "bahçe" in topic_lower:
            questions = [
                {"id": "p1", "type": "multiple_choice", "title": "Mahallenizdeki parkları ne sıklıkla ziyaret ediyorsunuz?", "required": True, "options": ["Her gün", "Haftada birkaç kez", "Ayda bir", "Hiç"]},
                {"id": "p2", "type": "checkbox", "title": "Parklarda hangi donatıların artırılmasını istersiniz?", "required": False, "options": ["Çocuk oyun alanı", "Spor aletleri", "Bank ve oturma yerleri", "Aydınlatma"]},
                {"id": "p3", "type": "dropdown", "title": "Park temizliğinden memnun musunuz?", "required": True, "options": ["Çok Memnunum", "Memnunum", "Memnun Değilim"]},
                {"id": "p4", "type": "paragraph", "title": "Yeni yapılacak parklar için lokasyon öneriniz var mı?", "required": False}
            ]
        elif "memnuniyet" in topic_lower or "genel" in topic_lower:
            questions = [
                {"id": "m1", "type": "multiple_choice", "title": "Belediyemizin genel performansını nasıl değerlendirirsiniz?", "required": True, "options": ["Mükemmel", "İyi", "Orta", "Zayıf"]},
                {"id": "m2", "type": "checkbox", "title": "En başarılı bulduğunuz hizmet alanları hangileri?", "required": False, "options": ["Temizlik Hizmetleri", "Kültür ve Sanat", "Sosyal Yardımlar", "Altyapı Çalışmaları"]},
                {"id": "m3", "type": "dropdown", "title": "Belediye binasındaki hizmet hızından memnun musunuz?", "required": True, "options": ["Hızlı", "Normal", "Yavaş"]},
                {"id": "m4", "type": "paragraph", "title": "Belediye başkanımıza iletmek istediğiniz bir mesaj var mı?", "required": False}
            ]

        return questions

    def _default_analysis(self) -> Dict[str, Any]:
        """AI devre dışıyken varsayılan değerler."""
        return {
            "ai_category": None,
            "ai_urgency_score": 5,
            "ai_sentiment": "neutral",
            "ai_spam_score": 0.0,
            "ai_toxicity_score": 0.0,
            "ai_summary": None,
            "ai_keywords": "[]",
            "ai_photo_analysis": None,
            "embedding": None,
            "ai_processed": False,
        }


# Singleton
ai_service = AIService()
