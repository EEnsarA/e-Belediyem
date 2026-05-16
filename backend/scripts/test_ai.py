import asyncio
import os
import sys

# Backend dizinini path'e ekle
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.ai_service import ai_service
from app.core.config import settings

async def test_ai():
    print(f"Testing Gemini AI Integration...")
    print(f"API Key: {settings.GEMINI_API_KEY[:5]}...{settings.GEMINI_API_KEY[-5:]}")
    
    if not ai_service.enabled:
        print("❌ AI Service is NOT enabled. Check your API key in .env")
        return

    print("--- 1. Metin Analizi Testi ---")
    description = "Sokaktaki çöp konteynerleri 3 gündür boşaltılmadı, çok kötü koku var ve çevre kirliliği oluşuyor."
    try:
        analysis = await ai_service._analyze_text(description)
        print("[SUCCESS] Metin Analizi Basarili:")
        print(f"Kategori: {analysis['ai_category']}")
        print(f"Aciliyet (1-10): {analysis['ai_urgency_score']}")
        print(f"Duygu: {analysis['ai_sentiment']}")
        print(f"Ozet: {analysis['ai_summary']}")
    except Exception as e:
        print(f"[ERROR] Metin Analizi Hatasi: {e}")

    print("\n--- 2. Chat Yanit Testi ---")
    try:
        chat_response = await ai_service.generate_chat_response(
            "Park ve Bahceler", 
            "Yildiz parkindaki cocuk oyun alanlari cok eski ve tehlikeli, ne zaman yenilenecek?", 
            []
        )
        print("[SUCCESS] Chat Yaniti Basarili:")
        print(f"AI Yaniti: {chat_response}")
    except Exception as e:
        print(f"[ERROR] Chat Yanit Hatasi: {e}")

    print("\n--- 3. Embedding Testi ---")
    try:
        embedding = await ai_service._get_embedding(description)
        if embedding:
            print(f"[SUCCESS] Embedding Olusturuldu (Boyut: {len(embedding)})")
        else:
            print("[ERROR] Embedding olusturulamadi.")
    except Exception as e:
        print(f"[ERROR] Embedding Hatasi: {e}")

if __name__ == "__main__":
    asyncio.run(test_ai())
