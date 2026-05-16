from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.knowledge import KnowledgeBase

class KnowledgeRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_municipality(self, municipality_id: int) -> List[KnowledgeBase]:
        result = await self.db.execute(
            select(KnowledgeBase).where(
                KnowledgeBase.municipality_id == municipality_id,
                KnowledgeBase.is_active == True
            )
        )
        return list(result.scalars().all())

    async def create(self, **kwargs) -> KnowledgeBase:
        entry = KnowledgeBase(**kwargs)
        self.db.add(entry)
        await self.db.flush()
        await self.db.refresh(entry)
        return entry
