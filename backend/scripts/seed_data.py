import asyncio
import os
import sys

# Backend dizinini path'e ekle
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import async_session_factory
from app.models.municipality import Municipality
from app.models.user import User
from app.models.poll import Poll, Vote
from app.models.announcement import Announcement, AuditLog
from app.models.complaint import Complaint, ComplaintStatus, ComplaintCategory, ComplaintUpvote, ComplaintTimeline, ComplaintGroup
from app.models.conversation import Conversation, Message
from app.models.knowledge import KnowledgeBase
from app.core.security import hash_tckn
from sqlalchemy import select, delete

async def seed():
    async with async_session_factory() as db:
        print("Cleaning up old data...")
        await db.execute(delete(Vote))
        await db.execute(delete(AuditLog))
        await db.execute(delete(ComplaintUpvote))
        await db.execute(delete(ComplaintTimeline))
        await db.execute(delete(Message))
        await db.execute(delete(Complaint))
        await db.execute(delete(Conversation))
        await db.execute(delete(Poll))
        await db.execute(delete(Announcement))
        await db.execute(delete(ComplaintGroup))
        await db.execute(delete(KnowledgeBase))
        await db.execute(delete(User))
        await db.execute(delete(Municipality))
        await db.commit()

        print("Seeding database with comprehensive test data...")
        
        # 1. Municipalities Configuration
        muni_configs = [
            {
                "name": "Erzurum Büyükşehir Belediyesi",
                "province": "Erzurum",
                "district": "Yakutiye",
                "logo_url": "/logos/erzurum.png",
                "mayor_name": "Mehmet Sekmen",
                "population": 767848,
                "users": [
                    ("44444444444", "Erzurum Admin", True),
                    ("55555555555", "Fatma Demir", False),
                    ("99999999999", "Ahmet Erzurumlu", False),
                ],
                "complaints": [
                    ("Çat yolu üzerindeki aydınlatma sorunu", ComplaintStatus.RESOLVED, ComplaintCategory.ELECTRICITY, 5, 25),
                    ("Palandöken kayak merkezi yolu kar temizleme", ComplaintStatus.RESOLVED, ComplaintCategory.ROAD, 5, 45),
                    ("Yıldızkent parkı çevre düzenlemesi", ComplaintStatus.RESOLVED, ComplaintCategory.PARK, 4, 15),
                    ("Erzurum Kalesi çevresi temizlik", ComplaintStatus.RESOLVED, ComplaintCategory.WASTE, 5, 30),
                    ("Yakutiye Medresesi önü kaldırım çalışması", ComplaintStatus.RESOLVED, ComplaintCategory.ROAD, 5, 20),
                    ("Tortum yolu su kesintisi", ComplaintStatus.RESOLVED, ComplaintCategory.WATER, 4, 10),
                    ("Üniversite kampüs yolu asfalt yenileme", ComplaintStatus.RESOLVED, ComplaintCategory.ROAD, 5, 50),
                    ("Şehir hastanesi önü durak eksikliği", ComplaintStatus.PENDING, ComplaintCategory.TRANSPORT, None, 12),
                    ("Çifte Minareli Medrese ışıklandırması", ComplaintStatus.PENDING, ComplaintCategory.ELECTRICITY, None, 8),
                ],
                "polls": [
                    ("Yeni Şehir Meydanı Tasarımı", "Hangi tasarım projesini daha çok beğendiniz?", [{"id": 1, "text": "Klasik Mimari", "votes": 1250}, {"id": 2, "text": "Modern Çizgiler", "votes": 840}]),
                    ("Toplu Taşıma Güzergah Değişikliği", "Üniversite hattı uzatılsın mı?", [{"id": 1, "text": "Evet", "votes": 3400}, {"id": 2, "text": "Hayır", "votes": 210}]),
                ]
            },
            {
                "name": "Kadıköy Belediyesi",
                "province": "İstanbul",
                "district": "Kadiköy",
                "logo_url": "/logos/kadikoy.png",
                "mayor_name": "Mesut Kösedağı",
                "population": 481983,
                "users": [
                    ("11111111111", "Kadiköy Admin", True),
                    ("12345678901", "Ahmet Yilmaz", False),
                    ("23456789012", "Ayşe Kadiköylü", False),
                ],
                "complaints": [
                    ("Moda sahilinde gürültü kirliliği", ComplaintStatus.PENDING, ComplaintCategory.NOISE, None, 80),
                    ("Bağdat Caddesi trafik ışığı arızası", ComplaintStatus.RESOLVED, ComplaintCategory.TRANSPORT, 3, 12),
                    ("Fenerbahçe parkı bank eksikliği", ComplaintStatus.PENDING, ComplaintCategory.PARK, None, 45),
                    ("Söğütlüçeşme çöp konteynerleri dolu", ComplaintStatus.PENDING, ComplaintCategory.WASTE, None, 60),
                ],
                "polls": [
                    ("Yeldeğirmeni Yayalaştırma Projesi", "Sokaklar trafiğe kapatılsın mı?", [{"id": 1, "text": "Evet", "votes": 1200}, {"id": 2, "text": "Hayır", "votes": 1500}]),
                ]
            },
            {
                "name": "Çankaya Belediyesi",
                "province": "Ankara",
                "district": "Cankaya",
                "logo_url": "/logos/cankaya.jpg",
                "mayor_name": "Hüseyin Can Güner",
                "population": 944609,
                "users": [
                    ("22222222222", "Cankaya Admin", True),
                    ("34567890123", "Mehmet Kaya", False),
                    ("45678901234", "Zeynep Ankaralı", False),
                ],
                "complaints": [
                    ("Kızılay Meydanı metro çıkışı temizlik", ComplaintStatus.RESOLVED, ComplaintCategory.WASTE, 4, 30),
                    ("Tunalı Hilmi Caddesi kaldırım işgali", ComplaintStatus.PENDING, ComplaintCategory.ROAD, None, 55),
                    ("Bahçelievler 7. Cadde gürültü", ComplaintStatus.PENDING, ComplaintCategory.NOISE, None, 40),
                ],
                "polls": [
                    ("Kuğulu Park Yenileme", "Parkın zemini değişsin mi?", [{"id": 1, "text": "Evet", "votes": 800}, {"id": 2, "text": "Hayır", "votes": 300}]),
                ]
            },
            {
                "name": "Konak Belediyesi",
                "province": "İzmir",
                "district": "Konak",
                "logo_url": "/logos/konak.png",
                "mayor_name": "Nilüfer Çınarlı Mutlu",
                "population": 332277,
                "users": [
                    ("33333333333", "Konak Admin", True),
                    ("56789012345", "Ali Celik", False),
                    ("67890123456", "Selin İzmirli", False),
                ],
                "complaints": [
                    ("Kemeraltı Çarşısı su baskını", ComplaintStatus.PENDING, ComplaintCategory.WATER, None, 120),
                    ("Kordon boyu aydınlatma", ComplaintStatus.RESOLVED, ComplaintCategory.ELECTRICITY, 4, 25),
                ],
                "polls": [
                    ("Gültepe Kentsel Dönüşüm", "Proje onaylansın mı?", [{"id": 1, "text": "Evet", "votes": 2500}, {"id": 2, "text": "Hayır", "votes": 400}]),
                ]
            }
        ]

        for config in muni_configs:
            muni = Municipality(
                name=config["name"],
                province=config["province"],
                district=config["district"],
                logo_url=config["logo_url"],
                mayor_name=config["mayor_name"],
                population=config["population"],
                is_active=True
            )
            db.add(muni)
            await db.flush()

            # Add Users
            created_users = []
            admin_user = None
            for tckn, name, is_admin in config["users"]:
                u = User(
                    tckn_hash=hash_tckn(tckn),
                    full_name=name,
                    municipality_id=muni.id,
                    is_admin=is_admin
                )
                db.add(u)
                created_users.append(u)
                if is_admin:
                    admin_user = u
            await db.flush()

            # Add Complaints
            for desc, status, cat, sat, upvotes in config["complaints"]:
                u_idx = (len(desc) % (len(created_users) - 1)) + 1
                db.add(Complaint(
                    user_id=created_users[u_idx].id,
                    municipality_id=muni.id,
                    description=desc,
                    status=status,
                    category=cat,
                    satisfaction_score=sat,
                    is_public=True,
                    upvote_count=upvotes,
                    ai_urgency_score=7 if status == ComplaintStatus.PENDING else 4,
                    ai_processed=True,
                    ai_category=cat.value if cat else None
                ))
            
            # Add Polls
            for title, desc, options in config["polls"]:
                db.add(Poll(
                    municipality_id=muni.id,
                    title=title,
                    description=desc,
                    options=options,
                    is_active=True,
                    created_by_id=admin_user.id
                ))

            # Add Announcements
            ann_data = [
                ("Kültür Sanat Etkinlikleri", "Bu hafta sonu tüm halkımız davetlidir."),
                ("Yol Bakım Çalışması", "Ana caddelerde planlı bakım yapılacaktır."),
            ]
            for title, content in ann_data:
                db.add(Announcement(
                    municipality_id=muni.id,
                    title=title,
                    content=content,
                    created_by_id=admin_user.id
                ))

            # Add Knowledge Base Entries (FAQs) for Erzurum
            if config["district"] == "Yakutiye":
                faqs = [
                    ("Ehliyet", "Ehliyet nasıl alınır?", "Erzurum'da ehliyet başvuruları Nüfus ve Vatandaşlık İşleri Genel Müdürlüğü üzerinden randevu ile alınmaktadır. Gerekli belgeler: Sertifika, sağlık raporu ve biyometrik fotoğraf."),
                    ("Vergi", "Emlak vergisi ne zaman ödenir?", "Erzurum Büyükşehir Belediyesi'nde emlak vergisi 1. taksitleri Mayıs, 2. taksitleri ise Kasım ayı sonuna kadar ödenmelidir."),
                    ("Su", "Su faturamı nereden ödeyebilirim?", "ESKİ (Erzurum Su ve Kanalizasyon İdaresi) veznelerinden, https://online.eski.gov.tr adresinden veya anlaşmalı bankalardan ödeme yapabilirsiniz."),
                    ("Ulaşım", "Kardelen Kart nasıl yüklenir?", "Erzurum'daki Kardelen Kart yükleme noktalarından, bayilerden veya mobil uygulama üzerinden bakiye yüklemesi yapabilirsiniz.")
                ]
                for cat, q, a in faqs:
                    db.add(KnowledgeBase(
                        municipality_id=muni.id,
                        category=cat,
                        question=q,
                        answer=a
                    ))

        await db.commit()
        print("Successfully seeded 4 municipalities with users, complaints, polls and knowledge base!")

if __name__ == "__main__":
    asyncio.run(seed())
