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
from app.models.complaint import Complaint, ComplaintStatus, ComplaintCategory
from app.models.poll import Poll
from app.models.announcement import Announcement
from sqlalchemy import select, delete

async def seed():
    async with async_session_factory() as db:
        print("Seeding database...")
        
        # 1. Erzurum Büyükşehir Belediyesi
        erzurum = Municipality(
            name="Erzurum Büyükşehir Belediyesi",
            province="Erzurum",
            district="Merkez",
            logo_url="https://www.erzurum.bel.tr/images/logo.png",
            mayor_name="Mehmet Sekmen",
            population=767848,
            is_active=True
        )
        db.add(erzurum)
        await db.flush()

        # 2. Sample Users
        user1 = User(
            tckn_hash="user_hash_1",
            full_name="Fatma Demir",
            municipality_id=erzurum.id,
            is_admin=False
        )
        admin1 = User(
            tckn_hash="erzurum_admin_hash",
            full_name="Erzurum Bld. Admin",
            municipality_id=erzurum.id,
            is_admin=True
        )
        db.add_all([user1, admin1])
        await db.flush()

        # 3. Complaints for Erzurum (High resolution rate for #1)
        complaints_data = [
            ("Çat yolu üzerindeki aydınlatma sorunu", ComplaintStatus.RESOLVED, ComplaintCategory.ELECTRICITY, 5, 25),
            ("Palandöken kayak merkezi yolu kar temizleme", ComplaintStatus.RESOLVED, ComplaintCategory.ROAD, 5, 45),
            ("Yıldızkent parkı çevre düzenlemesi", ComplaintStatus.RESOLVED, ComplaintCategory.PARK, 4, 15),
            ("Erzurum Kalesi çevresi temizlik", ComplaintStatus.RESOLVED, ComplaintCategory.WASTE, 5, 30),
            ("Yakutiye Medresesi önü kaldırım çalışması", ComplaintStatus.RESOLVED, ComplaintCategory.ROAD, 5, 20),
            ("Tortum yolu su kesintisi", ComplaintStatus.RESOLVED, ComplaintCategory.WATER, 4, 10),
            ("Üniversite kampüs yolu asfalt yenileme", ComplaintStatus.RESOLVED, ComplaintCategory.ROAD, 5, 50),
            ("Şehir hastanesi önü durak eksikliği", ComplaintStatus.PENDING, ComplaintCategory.TRANSPORT, None, 12),
            ("Çifte Minareli Medrese ışıklandırması", ComplaintStatus.PENDING, ComplaintCategory.ELECTRICITY, None, 8),
        ]

        for desc, status, cat, sat, upvotes in complaints_data:
            c = Complaint(
                user_id=user1.id,
                municipality_id=erzurum.id,
                description=desc,
                status=status,
                category=cat,
                satisfaction_score=sat,
                is_public=True,
                upvote_count=upvotes,
                ai_urgency_score=7 if status == ComplaintStatus.PENDING else 4
            )
            db.add(c)
        
        # 4. Announcements
        announcements_data = [
            ("Palandöken Festivali Başlıyor", "Bu hafta sonu Palandöken'de dev festival sizleri bekliyor."),
            ("Su Kesintisi Duyurusu", "Şehrin bazı bölgelerinde planlı bakım çalışması yapılacaktır."),
            ("Yeni Sosyal Tesis Açılışı", "Hilalkent bölgesinde yeni tesisimiz hizmete girdi."),
        ]
        for title, content in announcements_data:
            a = Announcement(
                municipality_id=erzurum.id,
                title=title,
                content=content,
                created_by_id=admin1.id
            )
            db.add(a)

        # 5. Polls
        polls_data = [
            ("Yeni Şehir Meydanı Tasarımı", "Hangi tasarım projesini daha çok beğendiniz?", [{"id": 1, "text": "Klasik Mimari", "votes": 1250}, {"id": 2, "text": "Modern Çizgiler", "votes": 840}]),
            ("Toplu Taşıma Güzergah Değişikliği", "Üniversite hattı uzatılsın mı?", [{"id": 1, "text": "Evet", "votes": 3400}, {"id": 2, "text": "Hayır", "votes": 210}]),
        ]
        for title, desc, options in polls_data:
            p = Poll(
                municipality_id=erzurum.id,
                title=title,
                description=desc,
                options=options,
                is_active=True,
                created_by_id=admin1.id
            )
            db.add(p)

        # 6. Comparison Municipalities
        comparisons = [
            ("İstanbul Büyükşehir Belediyesi", "İstanbul", 15840900, 10, 20), # Low resolution rate
            ("Ankara Büyükşehir Belediyesi", "Ankara", 5747325, 15, 15),
            ("İzmir Büyükşehir Belediyesi", "İzmir", 4425789, 8, 12),
        ]

        for name, prov, pop, resolved_count, pending_count in comparisons:
            m = Municipality(
                name=name,
                province=prov,
                district="Merkez",
                is_active=True,
                population=pop
            )
            db.add(m)
            await db.flush()

            # Add complaints to affect leaderboard score
            for i in range(resolved_count):
                db.add(Complaint(
                    user_id=user1.id, municipality_id=m.id, 
                    description=f"{prov} resolved {i}", status=ComplaintStatus.RESOLVED,
                    satisfaction_score=3, is_public=True
                ))
            for i in range(pending_count):
                db.add(Complaint(
                    user_id=user1.id, municipality_id=m.id, 
                    description=f"{prov} pending {i}", status=ComplaintStatus.PENDING,
                    is_public=True
                ))

        await db.commit()
        print("Successfully seeded Erzurum as #1!")

if __name__ == "__main__":
    asyncio.run(seed())
