from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, and_, or_
from sqlalchemy.orm import selectinload
from app.models.complaint import Complaint, ComplaintTimeline, ComplaintGroup, ComplaintStatus
from datetime import datetime


class ComplaintRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, complaint_id: int, load_timeline: bool = False) -> Optional[Complaint]:
        query = select(Complaint).where(Complaint.id == complaint_id)
        if load_timeline:
            query = query.options(selectinload(Complaint.timeline))
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_list(
        self,
        municipality_id: int,
        user_id: Optional[int] = None,
        status: Optional[str] = None,
        category: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
        sort_by_upvotes: bool = False,
    ) -> Tuple[List[Complaint], int]:
        base_query = select(Complaint).where(
            Complaint.municipality_id == municipality_id,
            Complaint.is_hidden == False,
        )
        if user_id:
            base_query = base_query.where(Complaint.user_id == user_id)
        if status:
            base_query = base_query.where(Complaint.status == status)
        if category:
            base_query = base_query.where(
                or_(Complaint.category == category, Complaint.ai_category == category)
            )

        count_query = select(func.count()).select_from(base_query.subquery())
        total = (await self.db.execute(count_query)).scalar_one()

        offset = (page - 1) * page_size

        if sort_by_upvotes:
            order_clause = [desc(Complaint.upvote_count), desc(Complaint.created_at)]
        else:
            order_clause = [desc(Complaint.created_at)]

        items_query = (
            base_query
            .options(selectinload(Complaint.timeline))
            .order_by(*order_clause)
            .offset(offset)
            .limit(page_size)
        )
        items = list((await self.db.execute(items_query)).scalars().all())
        return items, total


    async def create(self, **kwargs) -> Complaint:
        complaint = Complaint(**kwargs)
        self.db.add(complaint)
        await self.db.flush()
        await self.db.refresh(complaint)
        return complaint

    async def update(self, complaint: Complaint, **kwargs) -> Complaint:
        for key, value in kwargs.items():
            setattr(complaint, key, value)
        await self.db.flush()
        await self.db.refresh(complaint)
        return complaint

    async def add_timeline_entry(
        self,
        complaint_id: int,
        old_status: Optional[ComplaintStatus],
        new_status: ComplaintStatus,
        note: Optional[str],
        changed_by_id: Optional[int],
    ) -> ComplaintTimeline:
        entry = ComplaintTimeline(
            complaint_id=complaint_id,
            old_status=old_status,
            new_status=new_status,
            note=note,
            changed_by_id=changed_by_id,
        )
        self.db.add(entry)
        await self.db.flush()
        return entry

    async def get_map_points(self, municipality_id: int) -> List[Complaint]:
        result = await self.db.execute(
            select(Complaint).where(
                Complaint.municipality_id == municipality_id,
                Complaint.is_hidden == False,
            )
        )
        return list(result.scalars().all())


    async def get_stats(self, municipality_id: int, since: Optional[datetime] = None):
        base = and_(Complaint.municipality_id == municipality_id, Complaint.is_hidden == False)
        if since:
            base = and_(base, Complaint.created_at >= since)

        total = (await self.db.execute(select(func.count(Complaint.id)).where(base))).scalar_one()
        resolved = (
            await self.db.execute(
                select(func.count(Complaint.id)).where(and_(base, Complaint.status == ComplaintStatus.RESOLVED))
            )
        ).scalar_one()
        pending = (
            await self.db.execute(
                select(func.count(Complaint.id)).where(and_(base, Complaint.status == ComplaintStatus.PENDING))
            )
        ).scalar_one()
        urgent = (
            await self.db.execute(
                select(func.count(Complaint.id)).where(and_(base, Complaint.ai_urgency_score >= 8))
            )
        ).scalar_one()
        avg_satisfaction = (
            await self.db.execute(
                select(func.avg(Complaint.satisfaction_score)).where(
                    and_(base, Complaint.satisfaction_score.isnot(None))
                )
            )
        ).scalar_one()

        return {
            "total": total,
            "resolved": resolved,
            "pending": pending,
            "urgent": urgent,
            "avg_satisfaction": float(avg_satisfaction) if avg_satisfaction else None,
        }

    async def get_by_category_counts(self, municipality_id: int) -> List[tuple]:
        result = await self.db.execute(
            select(Complaint.category, func.count(Complaint.id))
            .where(Complaint.municipality_id == municipality_id, Complaint.is_hidden == False)
            .group_by(Complaint.category)
            .order_by(desc(func.count(Complaint.id)))
        )
        return list(result.all())

    async def get_recent_urgent(self, municipality_id: int, limit: int = 5) -> List[Complaint]:
        result = await self.db.execute(
            select(Complaint)
            .where(
                Complaint.municipality_id == municipality_id,
                Complaint.ai_urgency_score >= 8,
                Complaint.status != ComplaintStatus.RESOLVED,
            )
            .order_by(desc(Complaint.ai_urgency_score), desc(Complaint.created_at))
            .limit(limit)
        )
        return list(result.scalars().all())
