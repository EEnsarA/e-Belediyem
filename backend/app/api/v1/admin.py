from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc
from typing import Optional, List
from app.core.dependencies import get_db, get_current_admin
from app.repositories.complaint_repo import ComplaintRepository
from app.models.complaint import Complaint, ComplaintStatus, ComplaintGroup
from app.models.user import User
from app.models.conversation import Conversation
from app.schemas.dashboard import (
    AdminDashboardResponse, DashboardStats, ComplaintsByStatus,
    ComplaintsByCategory, WeeklyTrend, MapDataResponse, ComplaintGroupResponse,
    ReportRequest
)
from app.services.ai_service import ai_service
from app.services.report_service import report_service
from app.models.municipality import Municipality
from pydantic import BaseModel
import urllib.parse

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/dashboard", response_model=AdminDashboardResponse)
async def get_dashboard(
    current_user=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    muni_id = current_user.municipality_id
    repo = ComplaintRepository(db)
    stats_raw = await repo.get_stats(muni_id)

    total = stats_raw["total"]
    resolved = stats_raw["resolved"]
    resolution_rate = (resolved / total * 100) if total > 0 else 0.0

    # NPS (memnuniyet)
    avg_sat = stats_raw.get("avg_satisfaction")
    nps_score = ((avg_sat - 3) / 2) * 100 if avg_sat else None  # 1-5 → -100 to +100

    # Aktif konuşmalar
    conv_result = await db.execute(
        select(func.count(Conversation.id)).where(
            Conversation.municipality_id == muni_id,
            Conversation.status.in_(["Açık", "AI Yanıtlıyor", "İnsan Devredildi"]),
        )
    )
    active_conversations = conv_result.scalar_one()

    dashboard_stats = DashboardStats(
        total_complaints=total,
        pending_complaints=stats_raw["pending"],
        resolved_complaints=resolved,
        resolution_rate=round(resolution_rate, 1),
        avg_resolution_hours=None,
        nps_score=round(nps_score, 1) if nps_score else None,
        active_conversations=active_conversations,
        urgent_complaints=stats_raw["urgent"],
    )

    # Duruma göre dağılım
    status_data = []
    for s in ComplaintStatus:
        count_r = await db.execute(
            select(func.count(Complaint.id)).where(
                Complaint.municipality_id == muni_id,
                Complaint.status == s,
            )
        )
        count = count_r.scalar_one()
        status_data.append(ComplaintsByStatus(
            status=s.value,
            count=count,
            percentage=round(count / total * 100, 1) if total > 0 else 0.0,
        ))

    # Kategoriye göre
    cat_counts = await repo.get_by_category_counts(muni_id)
    category_data = [
        ComplaintsByCategory(category=str(c) if c else "Diğer", count=n)
        for c, n in cat_counts[:8]
    ]

    # Haftalık trend (son 7 gün)
    weekly = []
    for i in range(6, -1, -1):
        day = datetime.now(timezone.utc) - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)

        day_total_r = await db.execute(
            select(func.count(Complaint.id)).where(
                and_(
                    Complaint.municipality_id == muni_id,
                    Complaint.created_at >= day_start,
                    Complaint.created_at < day_end,
                )
            )
        )
        day_resolved_r = await db.execute(
            select(func.count(Complaint.id)).where(
                and_(
                    Complaint.municipality_id == muni_id,
                    Complaint.status == ComplaintStatus.RESOLVED,
                    Complaint.updated_at >= day_start,
                    Complaint.updated_at < day_end,
                )
            )
        )
        weekly.append(WeeklyTrend(
            date=day.strftime("%d.%m"),
            complaints=day_total_r.scalar_one(),
            resolved=day_resolved_r.scalar_one(),
        ))

    # Acil şikayetler
    urgent = await repo.get_recent_urgent(muni_id, limit=5)
    urgent_data = [
        {
            "id": c.id,
            "description": c.description[:80],
            "urgency_score": c.ai_urgency_score,
            "status": c.status.value,
            "created_at": c.created_at.isoformat(),
        }
        for c in urgent
    ]

    # AI brifing (haftalık)
    ai_summary = None
    try:
        ai_summary = await ai_service.generate_weekly_briefing({
            "total": total,
            "resolved": resolved,
            "pending": stats_raw["pending"],
            "avg_satisfaction": avg_sat,
            "top_category": category_data[0].category if category_data else "Bilinmiyor",
        })
    except Exception:
        pass

    return AdminDashboardResponse(
        stats=dashboard_stats,
        by_status=status_data,
        by_category=category_data,
        weekly_trend=weekly,
        recent_urgent=urgent_data,
        ai_summary=ai_summary,
    )


@router.get("/map", response_model=MapDataResponse)
async def get_map_data(
    current_user=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    repo = ComplaintRepository(db)
    complaints = await repo.get_map_points(current_user.municipality_id)

    points = [
        {
            "id": c.id,
            "lat": c.latitude,
            "lng": c.longitude,
            "status": c.status.value,
            "category": c.category.value if c.category else None,
            "urgency": c.ai_urgency_score,
            "description": c.description[:60],
        }
        for c in complaints
    ]

    heatmap_data = [
        {"lat": c.latitude, "lng": c.longitude, "weight": (c.ai_urgency_score or 5) / 10}
        for c in complaints
        if c.latitude and c.longitude
    ]

    return MapDataResponse(points=points, heatmap_data=heatmap_data)


@router.get("/groups", response_model=List[ComplaintGroupResponse])
async def get_complaint_groups(
    current_user=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ComplaintGroup)
        .where(ComplaintGroup.municipality_id == current_user.municipality_id)
        .order_by(desc(ComplaintGroup.complaint_count))
    )
    return list(result.scalars().all())


@router.post("/report")
async def generate_report(
    request: ReportRequest,
    current_user=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    repo = ComplaintRepository(db)
    stats = await repo.get_stats(current_user.municipality_id, since=request.start_date)
    total = stats["total"]
    resolution_rate = (stats["resolved"] / total * 100) if total > 0 else 0.0

    # Şikayetleri al
    items, _ = await repo.get_list(
        municipality_id=current_user.municipality_id,
        page=1,
        page_size=100,
    )
    muni_result = await db.execute(
        sa_select(Municipality).where(Municipality.id == current_user.municipality_id)
    )
    municipality = muni_result.scalar_one_or_none()
    muni_name = municipality.name if municipality else "Belediye"

    # Rapor tipine göre filtreleme (items üzerinde)
    if request.report_type == "performance":
        items = [c for c in items if c.status == ComplaintStatus.RESOLVED]
    elif request.report_type == "urgent":
        items = [c for c in items if (c.ai_urgency_score or 0) >= 8]
    elif request.report_type == "satisfaction":
        items = [c for c in items if c.satisfaction_score is not None]

    complaints_data = [
        {
            "id": c.id,
            "description": c.description,
            "category": c.category.value if c.category else None,
            "status": c.status.value,
            "created_at": c.created_at.strftime("%d.%m.%Y") if c.created_at else "",
        }
        for c in items
    ]

    ai_summary = None
    if request.include_ai_summary:
        prompt_type = {
            "general": "genel belediye performansı ve şikayet trendleri",
            "performance": "çözüm hızları ve operasyonel verimlilik",
            "satisfaction": "vatandaş memnuniyeti ve NPS analizi",
            "urgent": "kritik güvenlik ve altyapı sorunları"
        }.get(request.report_type, "genel analiz")

        ai_summary = await ai_service.generate_weekly_briefing({
            "total": total,
            "resolved": stats["resolved"],
            "pending": stats["pending"],
            "avg_satisfaction": stats.get("avg_satisfaction"),
            "top_category": "Çeşitli",
            "context": f"Bu bir {prompt_type} raporudur."
        })

    stats_dict = {**stats, "resolution_rate": resolution_rate}
    try:
        safe_muni_name = urllib.parse.quote(muni_name)
        if request.format == "pdf":
            pdf_bytes = await report_service.generate_pdf_report(
                muni_name, stats_dict, complaints_data, ai_summary,
                request.start_date, request.end_date,
            )
            return Response(
                content=pdf_bytes,
                media_type="application/pdf",
                headers={"Content-Disposition": f"attachment; filename=rapor.pdf; filename*=UTF-8''rapor_{safe_muni_name}.pdf"},
            )
        elif request.format == "docx":
            docx_bytes = await report_service.generate_word_report(
                muni_name, stats_dict, complaints_data, ai_summary,
            )
            return Response(
                content=docx_bytes,
                media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                headers={"Content-Disposition": f"attachment; filename=rapor.docx; filename*=UTF-8''rapor_{safe_muni_name}.docx"},
            )
        else:
            raise HTTPException(status_code=400, detail="format 'pdf' veya 'docx' olmalıdır")
    except UnicodeEncodeError:
        # Fallback to simple filename if encoding fails
        if request.format == "pdf":
            return Response(
                content=pdf_bytes,
                media_type="application/pdf",
                headers={"Content-Disposition": "attachment; filename=report.pdf"},
            )
        else:
            return Response(
                content=docx_bytes,
                media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                headers={"Content-Disposition": "attachment; filename=report.docx"},
            )


@router.get("/logs")
async def get_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    current_user=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    from app.models.announcement import AuditLog
    offset = (page - 1) * page_size
    result = await db.execute(
        select(AuditLog)
        .where(AuditLog.user_id.isnot(None))
        .order_by(desc(AuditLog.created_at))
        .offset(offset)
        .limit(page_size)
    )
    logs = result.scalars().all()
    return [
        {
            "id": log.id,
            "action": log.action,
            "resource_type": log.resource_type,
            "resource_id": log.resource_id,
            "detail": log.detail,
            "ip_address": log.ip_address,
            "created_at": log.created_at.isoformat() if log.created_at else None,
        }
        for log in logs
    ]


@router.get("/users")
async def get_users(
    current_user=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User)
        .where(User.municipality_id == current_user.municipality_id)
        .order_by(desc(User.created_at))
        .limit(100)
    )
    users = result.scalars().all()
    return [
        {
            "id": u.id,
            "full_name": u.full_name,
            "email": u.email,
            "is_admin": u.is_admin,
            "is_active": u.is_active,
            "last_login": u.last_login.isoformat() if u.last_login else None,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in users
    ]


class MunicipalityUpdate(BaseModel):
    name: Optional[str] = None
    logo_url: Optional[str] = None
    mayor_name: Optional[str] = None


@router.get("/settings")
async def get_municipality_settings(
    current_user=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Municipality).where(Municipality.id == current_user.municipality_id)
    )
    muni = result.scalar_one_or_none()
    if not muni:
        raise HTTPException(status_code=404, detail="Belediye bulunamadı")
    return muni


@router.patch("/settings")
async def update_municipality_settings(
    data: MunicipalityUpdate,
    current_user=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Municipality).where(Municipality.id == current_user.municipality_id)
    )
    muni = result.scalar_one_or_none()
    if not muni:
        raise HTTPException(status_code=404, detail="Belediye bulunamadı")

    if data.name is not None:
        muni.name = data.name
    if data.logo_url is not None:
        muni.logo_url = data.logo_url
    if data.mayor_name is not None:
        muni.mayor_name = data.mayor_name

    await db.commit()
    await db.refresh(muni)
    return muni
