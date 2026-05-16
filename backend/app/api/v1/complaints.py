import math
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.dependencies import get_db, get_current_user, get_current_admin, get_optional_user
from app.repositories.complaint_repo import ComplaintRepository
from app.repositories.user_repo import UserRepository
from app.services.ai_service import ai_service
from app.services.storage_service import storage_service
from app.services.notification_service import notification_service
from app.websocket.connection_manager import ws_manager
from app.schemas.complaint import (
    ComplaintCreate, ComplaintStatusUpdate, ComplaintSatisfactionUpdate,
    ComplaintResponse, ComplaintListResponse, TimelineItem
)
from app.models.complaint import ComplaintStatus, ComplaintUpvote
from app.models.announcement import AuditLog
from datetime import datetime, timezone

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/complaints", tags=["Complaints"])


async def _run_ai_pipeline(complaint_id: int, description: str, photo_bytes: Optional[bytes], db_url: str):
    """Background task: AI pipeline çalıştır."""
    from app.db.session import async_session_factory
    from app.repositories.complaint_repo import ComplaintRepository

    async with async_session_factory() as db:
        repo = ComplaintRepository(db)
        complaint = await repo.get_by_id(complaint_id)
        if not complaint:
            return

        analysis = await ai_service.analyze_complaint(description, photo_bytes)

        await repo.update(complaint, **{k: v for k, v in analysis.items() if k != "embedding"})

        # Acil şikayet bildirimi (urgency >= 8)
        if analysis.get("ai_urgency_score", 0) >= 8:
            logger.warning(f"Acil şikayet: #{complaint_id} urgency={analysis['ai_urgency_score']}")

        await db.commit()
        logger.info(f"AI pipeline tamamlandı: complaint #{complaint_id}")


@router.get("", response_model=ComplaintListResponse)
async def list_complaints(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    sort: Optional[str] = Query(None, description="'upvotes' ile öne çıkart sırasına göre sırala"),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.municipality_id:
        raise HTTPException(status_code=400, detail="Belediye atanmamış")

    repo = ComplaintRepository(db)
    # Admin tüm şikayetleri görebilir, vatandaş sadece kendinkini
    user_id = None if current_user.is_admin else current_user.id

    items, total = await repo.get_list(
        municipality_id=current_user.municipality_id,
        user_id=user_id,
        status=status,
        category=category,
        page=page,
        page_size=page_size,
        sort_by_upvotes=(sort == "upvotes"),
    )

    return ComplaintListResponse(
        items=[await _to_response(c, db, current_user.id) for c in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size) if total > 0 else 1,
    )


@router.post("", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
async def create_complaint(
    background_tasks: BackgroundTasks,
    description: str = Form(...),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    address_text: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    is_public: bool = Form(False),
    photo: Optional[UploadFile] = File(None),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.municipality_id:
        raise HTTPException(status_code=400, detail="Belediye atanmamış")

    repo = ComplaintRepository(db)

    # Fotoğraf yükle
    photo_url = None
    photo_bytes = None
    if photo:
        photo_bytes = await photo.read()
        complaint_placeholder = await repo.create(
            user_id=current_user.id,
            municipality_id=current_user.municipality_id,
            description=description,
            latitude=latitude,
            longitude=longitude,
            address_text=address_text,
            category=category,
            is_public=is_public,
            status=ComplaintStatus.PENDING,
        )
        photo_url = await storage_service.upload_complaint_photo(
            photo_bytes, photo.filename or "photo.jpg", photo.content_type or "image/jpeg", complaint_placeholder.id
        )
        await repo.update(complaint_placeholder, photo_url=photo_url)
        complaint = complaint_placeholder
    else:
        complaint = await repo.create(
            user_id=current_user.id,
            municipality_id=current_user.municipality_id,
            description=description,
            latitude=latitude,
            longitude=longitude,
            address_text=address_text,
            category=category,
            is_public=is_public,
            status=ComplaintStatus.PENDING,
        )

    # Timeline başlangıç kaydı
    await repo.add_timeline_entry(
        complaint_id=complaint.id,
        old_status=None,
        new_status=ComplaintStatus.PENDING,
        note="Şikayet oluşturuldu",
        changed_by_id=current_user.id,
    )
    await db.commit()

    # Background: AI pipeline
    from app.core.config import settings
    background_tasks.add_task(
        _run_ai_pipeline, complaint.id, description, photo_bytes, settings.DATABASE_URL
    )

    # WebSocket: admin'lere bildir
    background_tasks.add_task(
        ws_manager.broadcast_new_complaint,
        current_user.municipality_id,
        {"id": complaint.id, "status": complaint.status.value},
    )

    await db.refresh(complaint)
    return await _to_response(complaint, db, current_user.id)


@router.get("/{complaint_id}", response_model=ComplaintResponse)
async def get_complaint(
    complaint_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = ComplaintRepository(db)
    complaint = await repo.get_by_id(complaint_id, load_timeline=True)

    if not complaint:
        raise HTTPException(status_code=404, detail="Şikayet bulunamadı")

    # RLS: vatandaş sadece kendi şikayetini ya da public şikayetleri görebilir
    if not current_user.is_admin:
        if complaint.user_id != current_user.id and not complaint.is_public:
            raise HTTPException(status_code=403, detail="Erişim reddedildi")
    if complaint.municipality_id != current_user.municipality_id:
        raise HTTPException(status_code=403, detail="Erişim reddedildi")

    return await _to_response(complaint, db, current_user.id)


@router.patch("/{complaint_id}/status", response_model=ComplaintResponse)
async def update_complaint_status(
    complaint_id: int,
    update: ComplaintStatusUpdate,
    background_tasks: BackgroundTasks,
    current_user=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    repo = ComplaintRepository(db)
    complaint = await repo.get_by_id(complaint_id, load_timeline=True)

    if not complaint or complaint.municipality_id != current_user.municipality_id:
        raise HTTPException(status_code=404, detail="Şikayet bulunamadı")

    old_status = complaint.status
    await repo.update(
        complaint,
        status=update.status,
        assigned_unit=update.assigned_unit or complaint.assigned_unit,
        updated_at=datetime.now(timezone.utc),
    )
    await repo.add_timeline_entry(
        complaint_id=complaint.id,
        old_status=old_status,
        new_status=update.status,
        note=update.note,
        changed_by_id=current_user.id,
    )

    # AuditLog
    audit = AuditLog(
        user_id=current_user.id,
        action="complaint.status_changed",
        resource_type="complaint",
        resource_id=complaint_id,
        detail={"old_status": old_status.value, "new_status": update.status.value, "note": update.note},
    )
    db.add(audit)
    await db.commit()

    # WebSocket broadcast
    background_tasks.add_task(
        ws_manager.broadcast_complaint_update,
        current_user.municipality_id,
        complaint_id,
        update.status.value,
    )

    # Push bildirim - kullanıcıya
    user_repo = UserRepository(db)
    complaint_user = await user_repo.get_by_id(complaint.user_id)
    if complaint_user:
        background_tasks.add_task(
            notification_service.notify_complaint_status_change,
            complaint_user.push_token,
            complaint_user.email if complaint_user.email_enabled else None,
            complaint_id,
            update.status.value,
        )

    await db.refresh(complaint)
    return await _to_response(complaint, db, current_user.id)


@router.patch("/{complaint_id}/satisfaction")
async def rate_complaint(
    complaint_id: int,
    rating: ComplaintSatisfactionUpdate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = ComplaintRepository(db)
    complaint = await repo.get_by_id(complaint_id)

    if not complaint or complaint.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Şikayet bulunamadı")
    if complaint.status != ComplaintStatus.RESOLVED:
        raise HTTPException(status_code=400, detail="Sadece çözülen şikayetler değerlendirilebilir")

    await repo.update(complaint, satisfaction_score=rating.score)
    await db.commit()
    return {"message": "Değerlendirme kaydedildi"}


@router.post("/{complaint_id}/upvote", status_code=status.HTTP_201_CREATED)
async def upvote_complaint(
    complaint_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Şikayeti öne çıkart. Sadece aynı belediye vatandaşları oy verebilir."""
    repo = ComplaintRepository(db)
    complaint = await repo.get_by_id(complaint_id)

    if not complaint:
        raise HTTPException(status_code=404, detail="Şikayet bulunamadı")

    # Sadece public şikayetler oylanabilir
    if not complaint.is_public:
        raise HTTPException(status_code=403, detail="Bu şikayet kamuya açık değil")

    # Sadece aynı belediye vatandaşları oy verebilir
    if complaint.municipality_id != current_user.municipality_id:
        raise HTTPException(status_code=403, detail="Sadece aynı belediye vatandaşları oy verebilir")

    # Zaten oy verildi mi?
    existing = await db.execute(
        select(ComplaintUpvote).where(
            ComplaintUpvote.complaint_id == complaint_id,
            ComplaintUpvote.user_id == current_user.id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Zaten oy verdiniz")

    upvote = ComplaintUpvote(complaint_id=complaint_id, user_id=current_user.id)
    db.add(upvote)
    await repo.update(complaint, upvote_count=(complaint.upvote_count or 0) + 1)
    await db.commit()
    return {"message": "Öne çıkartıldı", "upvote_count": complaint.upvote_count}


@router.delete("/{complaint_id}/upvote", status_code=status.HTTP_200_OK)
async def remove_upvote(
    complaint_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Öne çıkart oyunu geri al."""
    repo = ComplaintRepository(db)
    complaint = await repo.get_by_id(complaint_id)

    if not complaint:
        raise HTTPException(status_code=404, detail="Şikayet bulunamadı")

    existing = await db.execute(
        select(ComplaintUpvote).where(
            ComplaintUpvote.complaint_id == complaint_id,
            ComplaintUpvote.user_id == current_user.id,
        )
    )
    upvote = existing.scalar_one_or_none()
    if not upvote:
        raise HTTPException(status_code=404, detail="Oy bulunamadı")

    await db.delete(upvote)
    new_count = max(0, (complaint.upvote_count or 1) - 1)
    await repo.update(complaint, upvote_count=new_count)
    await db.commit()
    return {"message": "Oy geri alındı", "upvote_count": new_count}


async def _to_response(complaint, db, current_user_id: Optional[int] = None) -> ComplaintResponse:
    """Complaint model → response schema dönüşümü."""
    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(complaint.user_id)

    # Kullanıcının bu şikayete oy verip vermediğini kontrol et
    user_upvoted = False
    if current_user_id:
        upvote_result = await db.execute(
            select(ComplaintUpvote).where(
                ComplaintUpvote.complaint_id == complaint.id,
                ComplaintUpvote.user_id == current_user_id,
            )
        )
        user_upvoted = upvote_result.scalar_one_or_none() is not None

    timeline = []
    if hasattr(complaint, "timeline") and complaint.timeline:
        for t in sorted(complaint.timeline, key=lambda x: x.created_at):
            changed_by_name = None
            if t.changed_by_id:
                changed_by = await user_repo.get_by_id(t.changed_by_id)
                changed_by_name = changed_by.full_name if changed_by else None
            timeline.append(TimelineItem(
                id=t.id,
                old_status=t.old_status,
                new_status=t.new_status,
                note=t.note,
                changed_by_name=changed_by_name,
                created_at=t.created_at,
            ))

    return ComplaintResponse(
        id=complaint.id,
        description=complaint.description,
        photo_url=complaint.photo_url,
        latitude=complaint.latitude,
        longitude=complaint.longitude,
        address_text=complaint.address_text,
        status=complaint.status,
        category=complaint.category,
        assigned_unit=complaint.assigned_unit,
        ai_category=complaint.ai_category,
        ai_sentiment=complaint.ai_sentiment,
        ai_urgency_score=complaint.ai_urgency_score,
        ai_summary=complaint.ai_summary,
        ai_photo_analysis=complaint.ai_photo_analysis,
        ai_processed=complaint.ai_processed,
        satisfaction_score=complaint.satisfaction_score,
        is_public=complaint.is_public or False,
        upvote_count=complaint.upvote_count or 0,
        user_upvoted=user_upvoted,
        municipality_id=complaint.municipality_id,
        user_id=complaint.user_id,
        user_name=user.full_name if user else None,
        group_id=complaint.group_id,
        created_at=complaint.created_at,
        updated_at=complaint.updated_at,
        timeline=timeline,
    )



