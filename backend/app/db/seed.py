"""
Seed data - 3 örnek belediye + admin kullanıcılar + demo şikayetler
Çalıştır: python -m app.db.seed
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.db.session import async_session_factory, engine
from app.db.base import Base
from app.models import *
from app.core.security import hash_tckn
from datetime import datetime, timezone, timedelta
import random


MUNICIPALITIES = [
    {
        "name": "Kadıköy Belediyesi",
        "province": "İstanbul",
        "district": "Kadıköy",
        "address": "Söğütlüçeşme Cad. No:1, Kadıköy/İstanbul",
        "phone": "0216 542 50 00",
        "email": "info@kadikoy.bel.tr",
        "website": "https://www.kadikoy.bel.tr",
        "mayor_name": "Şerdil Dara Odabaşı",
        "population": 478900,
        "center_lat": "40.9928",
        "center_lon": "29.0306",
    },
    {
        "name": "Çankaya Belediyesi",
        "province": "Ankara",
        "district": "Çankaya",
        "address": "Ziya Gökalp Cad. No:11, Çankaya/Ankara",
        "phone": "0312 458 89 00",
        "email": "bilgi@cankaya.bel.tr",
        "website": "https://www.cankaya.bel.tr",
        "mayor_name": "Hüseyin Can Güner",
        "population": 935000,
        "center_lat": "39.9208",
        "center_lon": "32.8541",
    },
    {
        "name": "Konak Belediyesi",
        "province": "İzmir",
        "district": "Konak",
        "address": "Alsancak, Konak/İzmir",
        "phone": "0232 293 29 00",
        "email": "info@konak.bel.tr",
        "website": "https://www.konak.bel.tr",
        "mayor_name": "Abdül Batur",
        "population": 383700,
        "center_lat": "38.4189",
        "center_lon": "27.1287",
    },
]

SAMPLE_COMPLAINTS = [
    ("Sokağımızdaki kaldırım taşları bozuk ve yürüyüş yapılamıyor durumda. Yaşlılar için tehlike oluşturuyor.", "Yol ve Kaldırım", 40.9935, 29.0298),
    ("Parkta lambalar yanmıyor, akşamları karanlık kalıyor. Çocuklar için güvensiz.", "Park ve Yeşil Alan", 40.9920, 29.0315),
    ("Su borusu patladı, cadde sular altında. Acil müdahale gerekiyor!", "Su ve Kanalizasyon", 40.9940, 29.0280),
    ("Sokak çöpleri günlerce toplanmıyor. Koku ve sağlık sorunu oluşuyor.", "Çöp ve Temizlik", 40.9910, 29.0320),
    ("Gece geç saatlere kadar süren inşaat gürültüsü uyumamıza engel oluyor.", "Gürültü", 40.9950, 29.0300),
    ("Trafik ışığı arızalanmış, kavşakta kaza riski var.", "Ulaşım", 40.9925, 29.0310),
    ("Yeşil alan yıllardır bakımsız, ağaçlar kuru ve tehlikeli.", "Park ve Yeşil Alan", 40.9915, 29.0295),
    ("Elektrik direği eğilmiş, düşme tehlikesi var. Acil!", "Elektrik ve Aydınlatma", 40.9945, 29.0305),
    ("Metruk bina yıkılmıyor, evsizler barınak olarak kullanıyor ve güvenlik sorunu var.", "İmar ve Ruhsat", 40.9930, 29.0325),
    ("Kanalizasyon taşıyor, sokağa pis su akıyor.", "Su ve Kanalizasyon", 40.9920, 29.0285),
]


async def seed():
    print("[START] Seed baslatiliyor...")

    # Tabloları oluştur
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("[OK] Tablolar olusturuldu")

    async with async_session_factory() as db:
        # Belediyeler
        municipality_ids = {}
        for muni_data in MUNICIPALITIES:
            from sqlalchemy import select
            existing = await db.execute(
                select(Municipality).where(Municipality.district == muni_data["district"])
            )
            if not existing.scalar_one_or_none():
                muni = Municipality(**muni_data)
                db.add(muni)
                await db.flush()
                municipality_ids[muni_data["district"]] = muni.id
                print(f"[OK] Belediye: {muni_data['name']}")
            else:
                print(f"[INFO] Belediye zaten var: {muni_data['name']}")

        await db.commit()

        # Municipality ID'leri yeniden al
        for district in ["Kadıköy", "Çankaya", "Konak"]:
            result = await db.execute(
                select(Municipality).where(Municipality.district == district)
            )
            muni = result.scalar_one_or_none()
            if muni:
                municipality_ids[district] = muni.id

        # Seed TCKN'ler (mock e-Devlet kullanıcıları)
        seed_users = [
            {"tckn": "12345678901", "full_name": "Ahmet Yılmaz", "email": "ahmet@test.com", "district": "Kadıköy"},
            {"tckn": "23456789012", "full_name": "Fatma Demir", "email": "fatma@test.com", "district": "Kadıköy"},
            {"tckn": "34567890123", "full_name": "Mehmet Kaya", "email": "mehmet@test.com", "district": "Çankaya"},
            {"tckn": "56789012345", "full_name": "Ali Çelik", "email": "ali@test.com", "district": "Konak"},
            {"tckn": "11111111111", "full_name": "Kadıköy Yöneticisi", "email": "admin.kadikoy@test.com", "district": "Kadıköy", "is_admin": True},
            {"tckn": "22222222222", "full_name": "Çankaya Yöneticisi", "email": "admin.cankaya@test.com", "district": "Çankaya", "is_admin": True},
            {"tckn": "33333333333", "full_name": "Konak Yöneticisi", "email": "admin.konak@test.com", "district": "Konak", "is_admin": True},
        ]

        user_ids = {}
        for u_data in seed_users:
            district = u_data.pop("district")
            tckn = u_data.pop("tckn")
            muni_id = municipality_ids.get(district)

            from sqlalchemy import select
            existing = await db.execute(select(User).where(User.email == u_data["email"]))
            if not existing.scalar_one_or_none():
                user = User(
                    tckn_hash=hash_tckn(tckn),
                    municipality_id=muni_id,
                    is_admin=u_data.pop("is_admin", False),
                    **u_data,
                )
                db.add(user)
                await db.flush()
                user_ids[u_data["email"]] = user.id
                print(f"[OK] Kullanici: {u_data['full_name']}")

        await db.commit()

        # Demo şikayetler (Kadıköy için)
        kadikoy_id = municipality_ids.get("Kadıköy")
        user_result = await db.execute(select(User).where(User.email == "ahmet@test.com"))
        demo_user = user_result.scalar_one_or_none()

        if kadikoy_id and demo_user:
            existing_count = await db.execute(
                select(Complaint).where(Complaint.municipality_id == kadikoy_id)
            )
            if not list(existing_count.scalars().all()):
                statuses = list(ComplaintStatus)
                categories_from_complaint = ["Yol ve Kaldırım", "Park ve Yeşil Alan", "Su ve Kanalizasyon",
                                              "Çöp ve Temizlik", "Gürültü", "Ulaşım", "Elektrik ve Aydınlatma"]

                for i, (desc, cat, lat, lon) in enumerate(SAMPLE_COMPLAINTS):
                    status = statuses[i % len(statuses)]
                    complaint = Complaint(
                        user_id=demo_user.id,
                        municipality_id=kadikoy_id,
                        description=desc,
                        latitude=lat + random.uniform(-0.005, 0.005),
                        longitude=lon + random.uniform(-0.005, 0.005),
                        status=status,
                        ai_urgency_score=random.randint(3, 9),
                        ai_sentiment=random.choice(["negative", "neutral", "negative"]),
                        ai_spam_score=0.05,
                        ai_processed=True,
                        ai_summary=f"Vatandaş {cat.lower()} konusunda şikayette bulunuyor.",
                        created_at=datetime.now(timezone.utc) - timedelta(days=random.randint(0, 30)),
                    )
                    db.add(complaint)
                    await db.flush()

                    # Timeline
                    timeline_entry = ComplaintTimeline(
                        complaint_id=complaint.id,
                        old_status=None,
                        new_status=ComplaintStatus.PENDING,
                        note="Şikayet oluşturuldu",
                    )
                    db.add(timeline_entry)

                await db.commit()
                print(f"[OK] {len(SAMPLE_COMPLAINTS)} demo sikayet olusturuldu")

        # Demo anket
        if kadikoy_id:
            poll_result = await db.execute(select(Poll).where(Poll.municipality_id == kadikoy_id))
            if not poll_result.scalar_one_or_none():
                poll = Poll(
                    municipality_id=kadikoy_id,
                    title="İlçemizde en çok hangi konuda iyileştirme yapılmasını istersiniz?",
                    description="Görüşleriniz belediyemizin yatırım planlamasına katkı sağlayacaktır.",
                    options=[
                        {"id": 1, "text": "Yol ve Kaldırım", "votes": 47},
                        {"id": 2, "text": "Park ve Yeşil Alan", "votes": 38},
                        {"id": 3, "text": "Toplu Taşıma", "votes": 29},
                        {"id": 4, "text": "Spor Tesisleri", "votes": 21},
                    ],
                    is_active=True,
                )
                db.add(poll)

                # Demo duyuru
                announcement = Announcement(
                    municipality_id=kadikoy_id,
                    title="Yaz Dönemi Asfalt Çalışmaları Başlıyor",
                    content="Değerli Kadıköylüler, 15 Haziran - 15 Eylül tarihleri arasında ilçemizin 23 caddesinde kapsamlı asfalt yenileme çalışmaları yapılacaktır. Çalışmalar nedeniyle bazı güzergahlarda trafik akışı değiştirilecektir.",
                    category="Bilgi",
                    is_pinned=True,
                )
                db.add(announcement)
                await db.commit()
                print("[OK] Demo anket ve duyuru olusturuldu")

    print("\n[DONE] Seed tamamlandi!")
    print("\n--- Test Hesaplari ---")
    print("  Vatandaş - TCKN: 12345678901, Şifre: herhangi (mock)")
    print("  Admin    - TCKN: 11111111111, Şifre: herhangi (mock)")
    print("  (Kadıköy için - Çankaya: 34567890123 / 22222222222, Konak: 56789012345 / 33333333333)")


if __name__ == "__main__":
    asyncio.run(seed())
