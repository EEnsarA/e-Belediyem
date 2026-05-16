from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.dependencies import get_db, get_current_user, get_current_admin
from app.models.announcement import Announcement, AuditLog
from app.schemas.poll import AnnouncementCreate, AnnouncementResponse
from datetime import datetime, timezone

router = APIRouter(prefix="/announcements", tags=["Announcements"])


@router.get("", response_model=List[AnnouncementResponse])
async def list_announcements(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.municipality_id:
        return []

    result = await db.execute(
        select(Announcement)
        .where(
            Announcement.municipality_id == current_user.municipality_id,
            Announcement.is_active == True,
        )
        .order_by(Announcement.is_pinned.desc(), Announcement.created_at.desc())
    )
    return list(result.scalars().all())


@router.post("", response_model=AnnouncementResponse, status_code=status.HTTP_201_CREATED)
async def create_announcement(
    data: AnnouncementCreate,
    current_user=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    announcement = Announcement(
        municipality_id=current_user.municipality_id,
        title=data.title,
        content=data.content,
        category=data.category,
        is_pinned=data.is_pinned,
        expires_at=data.expires_at,
        created_by_id=current_user.id,
    )
    db.add(announcement)

    # AuditLog
    audit = AuditLog(
        user_id=current_user.id,
        action="announcement.created",
        resource_type="announcement",
        detail={"title": data.title},
    )
    db.add(audit)
    await db.commit()
    await db.refresh(announcement)
    return announcement


@router.delete("/{announcement_id}")
async def delete_announcement(
    announcement_id: int,
    current_user=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Announcement).where(Announcement.id == announcement_id))
    announcement = result.scalar_one_or_none()
    if not announcement or announcement.municipality_id != current_user.municipality_id:
        raise HTTPException(status_code=404, detail="Duyuru bulunamadı")

    announcement.is_active = False
    await db.commit()
    return {"message": "Duyuru silindi"}
