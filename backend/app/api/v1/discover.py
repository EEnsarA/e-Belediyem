"""
Discover API — Genel keşif sayfası için public endpoint'ler.
Auth gerektirmez (giriş yapmayanlar da görüntüleyebilir).
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, and_
from typing import Optional, List
from app.core.dependencies import get_db, get_optional_user
from app.models.municipality import Municipality
from app.models.complaint import Complaint, ComplaintStatus
from app.models.announcement import Announcement
from app.models.poll import Poll

router = APIRouter(prefix="/discover", tags=["Discover"])


async def _get_municipality_stats(db: AsyncSession, muni_id: int) -> dict:
    """Bir belediyenin özet istatistiklerini hesapla."""
    total_r = await db.execute(
        select(func.count(Complaint.id)).where(
            Complaint.municipality_id == muni_id,
            Complaint.is_hidden == False,
        )
    )
    total = total_r.scalar_one() or 0

    resolved_r = await db.execute(
        select(func.count(Complaint.id)).where(
            Complaint.municipality_id == muni_id,
            Complaint.status == ComplaintStatus.RESOLVED,
            Complaint.is_hidden == False,
        )
    )
    resolved = resolved_r.scalar_one() or 0

    resolution_rate = round((resolved / total * 100), 1) if total > 0 else 0.0

    avg_sat_r = await db.execute(
        select(func.avg(Complaint.satisfaction_score)).where(
            Complaint.municipality_id == muni_id,
            Complaint.satisfaction_score.isnot(None),
        )
    )
    avg_satisfaction = avg_sat_r.scalar_one()
    avg_satisfaction = round(float(avg_satisfaction), 2) if avg_satisfaction else None

    # Aktif anket sayısı
    poll_r = await db.execute(
        select(func.count(Poll.id)).where(
            Poll.municipality_id == muni_id,
            Poll.is_active == True,
        )
    )
    active_polls = poll_r.scalar_one() or 0

    # Son duyuru sayısı (son 30 gün)
    from datetime import datetime, timedelta, timezone
    cutoff = datetime.now(timezone.utc) - timedelta(days=30)
    ann_r = await db.execute(
        select(func.count(Announcement.id)).where(
            Announcement.municipality_id == muni_id,
            Announcement.created_at >= cutoff,
        )
    )
    recent_announcements = ann_r.scalar_one() or 0

    # Top public complaints (en çok öne çıkarılan 3)
    top_complaints_r = await db.execute(
        select(Complaint).where(
            Complaint.municipality_id == muni_id,
            Complaint.is_public == True,
            Complaint.is_hidden == False,
        )
        .order_by(desc(Complaint.upvote_count))
        .limit(3)
    )
    top_complaints = [
        {
            "id": c.id,
            "description": c.description[:100],
            "upvote_count": c.upvote_count or 0,
            "status": c.status.value,
            "category": c.category.value if c.category else None,
        }
        for c in top_complaints_r.scalars().all()
    ]

    return {
        "total_complaints": total,
        "resolved_complaints": resolved,
        "resolution_rate": resolution_rate,
        "avg_satisfaction": avg_satisfaction,
        "active_polls": active_polls,
        "recent_announcements": recent_announcements,
        "top_public_complaints": top_complaints,
    }


def _calculate_score(stats: dict) -> float:
    """AI benzeri skor hesaplama — belediyeleri sıralamak için."""
    score = 0.0
    # Çözüm oranı ağırlığı: %50
    score += stats["resolution_rate"] * 0.5
    # Memnuniyet ağırlığı: %20 (1-5 ölçeği → 0-20 puan)
    if stats["avg_satisfaction"]:
        score += (stats["avg_satisfaction"] / 5) * 20
    # Aktivite: duyuru ve anket ağırlığı: %20
    score += min(stats["recent_announcements"] * 2, 10)
    score += min(stats["active_polls"] * 2, 10)
    # Toplam şikayet hacmi bonus (aktiflik göstergesi): %10
    score += min(stats["total_complaints"] * 0.1, 10)
    return round(score, 1)


@router.get("")
async def discover(
    search: Optional[str] = Query(None, description="Belediye adı veya il ara"),
    province: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_optional_user),
):
    """Tüm aktif belediyeleri listele (public)."""
    query = select(Municipality).where(Municipality.is_active == True)

    if search:
        search_term = f"%{search}%"
        from sqlalchemy import or_
        query = query.where(
            or_(
                Municipality.name.ilike(search_term),
                Municipality.province.ilike(search_term),
                Municipality.district.ilike(search_term),
            )
        )
    if province:
        query = query.where(Municipality.province.ilike(f"%{province}%"))

    query = query.order_by(Municipality.name)
    result = await db.execute(query)
    municipalities = result.scalars().all()

    output = []
    for m in municipalities:
        stats = await _get_municipality_stats(db, m.id)
        score = _calculate_score(stats)
        output.append({
            "id": m.id,
            "name": m.name,
            "province": m.province,
            "district": m.district,
            "logo_url": m.logo_url,
            "mayor_name": m.mayor_name,
            "population": m.population,
            "score": score,
            **stats,
            "is_my_municipality": (
                current_user.municipality_id == m.id if current_user else False
            ),
        })

    return {"municipalities": output, "total": len(output)}


@router.get("/leaderboard")
async def leaderboard(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_optional_user),
):
    """AI destekli liderlik tablosu — tüm belediyeleri sıralar."""
    result = await db.execute(
        select(Municipality).where(Municipality.is_active == True)
    )
    municipalities = result.scalars().all()

    ranked = []
    for m in municipalities:
        stats = await _get_municipality_stats(db, m.id)
        score = _calculate_score(stats)
        ranked.append({
            "id": m.id,
            "name": m.name,
            "province": m.province,
            "district": m.district,
            "score": score,
            "resolution_rate": stats["resolution_rate"],
            "avg_satisfaction": stats["avg_satisfaction"],
            "recent_announcements": stats["recent_announcements"],
            "active_polls": stats["active_polls"],
            "total_complaints": stats["total_complaints"],
        })

    # Skora göre sırala
    ranked.sort(key=lambda x: x["score"], reverse=True)

    # Rozet ata
    badges = ["🥇", "🥈", "🥉"]
    for i, item in enumerate(ranked):
        item["rank"] = i + 1
        item["badge"] = badges[i] if i < 3 else None

        # Kategori rozetleri
        item["achievement"] = None
        if item["resolution_rate"] == max(r["resolution_rate"] for r in ranked):
            item["achievement"] = "En Çok Çözüm Üreten"
        elif item["recent_announcements"] == max(r["recent_announcements"] for r in ranked):
            item["achievement"] = "En Aktif Belediye"
        elif item["active_polls"] == max(r["active_polls"] for r in ranked):
            item["achievement"] = "En Çok Anket Yapan"

    return {"leaderboard": ranked}


@router.get("/municipality/{municipality_id}/public-complaints")
async def get_public_complaints(
    municipality_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    sort: str = Query("upvotes", description="'upvotes' veya 'newest'"),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_optional_user),
):
    """Bir belediyenin kamuya açık şikayetlerini listele."""
    base_query = select(Complaint).where(
        Complaint.municipality_id == municipality_id,
        Complaint.is_public == True,
        Complaint.is_hidden == False,
    )

    if sort == "upvotes":
        base_query = base_query.order_by(desc(Complaint.upvote_count), desc(Complaint.created_at))
    else:
        base_query = base_query.order_by(desc(Complaint.created_at))

    count_r = await db.execute(select(func.count()).select_from(base_query.subquery()))
    total = count_r.scalar_one()

    offset = (page - 1) * page_size
    items_r = await db.execute(base_query.offset(offset).limit(page_size))
    complaints = items_r.scalars().all()

    return {
        "items": [
            {
                "id": c.id,
                "description": c.description[:200],
                "status": c.status.value,
                "category": c.category.value if c.category else None,
                "upvote_count": c.upvote_count or 0,
                "ai_urgency_score": c.ai_urgency_score,
                "created_at": c.created_at.isoformat() if c.created_at else None,
            }
            for c in complaints
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/global-complaints")
async def get_global_public_complaints(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    sort: str = Query("upvotes", description="'upvotes' veya 'newest'"),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_optional_user),
):
    """Tüm Türkiye geneli kamuya açık şikayetleri listele."""
    base_query = select(Complaint).where(
        Complaint.is_public == True,
        Complaint.is_hidden == False,
    ).join(Complaint.municipality)

    if sort == "upvotes":
        base_query = base_query.order_by(desc(Complaint.upvote_count), desc(Complaint.created_at))
    else:
        base_query = base_query.order_by(desc(Complaint.created_at))

    count_r = await db.execute(select(func.count()).select_from(base_query.subquery()))
    total = count_r.scalar_one()

    offset = (page - 1) * page_size
    items_r = await db.execute(base_query.offset(offset).limit(page_size))
    complaints = items_r.scalars().all()

    # Giriş yapan kullanıcı varsa, hangi şikayetleri öne çıkardığını bul
    user_upvoted_ids = set()
    if current_user:
        from app.models.complaint import ComplaintUpvote
        c_ids = [c.id for c in complaints]
        if c_ids:
            upvotes_r = await db.execute(
                select(ComplaintUpvote.complaint_id).where(
                    ComplaintUpvote.complaint_id.in_(c_ids),
                    ComplaintUpvote.user_id == current_user.id
                )
            )
            user_upvoted_ids = set(upvotes_r.scalars().all())

    from app.models.municipality import Municipality
    
    result_items = []
    for c in complaints:
        muni = await db.execute(select(Municipality).where(Municipality.id == c.municipality_id))
        m_obj = muni.scalar_one_or_none()
        
        result_items.append({
            "id": c.id,
            "description": c.description[:250],
            "status": c.status.value,
            "category": c.category.value if c.category else None,
            "upvote_count": c.upvote_count or 0,
            "user_upvoted": c.id in user_upvoted_ids,
            "ai_urgency_score": c.ai_urgency_score,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "municipality_id": c.municipality_id,
            "municipality_name": m_obj.name if m_obj else "Bilinmeyen Belediye",
            "province": m_obj.province if m_obj else "",
        })

    return {
        "items": result_items,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/global-polls")
async def get_global_polls(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_optional_user)
):
    """Tüm Türkiye geneli aktif anketleri listele."""
    from app.models.poll import Poll
    from app.models.municipality import Municipality
    
    query = select(Poll, Municipality).join(Municipality).where(Poll.is_active == True).order_by(desc(Poll.created_at)).limit(10)
    result = await db.execute(query)
    rows = result.all()
    
    items = []
    for poll, muni in rows:
        total_votes = sum(opt.get("votes", 0) for opt in poll.options) if isinstance(poll.options, list) else 0
        items.append({
            "id": poll.id,
            "title": poll.title,
            "description": poll.description[:150] if poll.description else "",
            "municipality_name": muni.name,
            "province": muni.province,
            "total_votes": total_votes,
            "ends_at": poll.ends_at.isoformat() if poll.ends_at else None,
            "created_at": poll.created_at.isoformat() if poll.created_at else None,
        })
        
    return {"items": items}

