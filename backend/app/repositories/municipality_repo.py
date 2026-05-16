from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.models.municipality import Municipality


class MunicipalityRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, municipality_id: int) -> Optional[Municipality]:
        result = await self.db.execute(
            select(Municipality).where(Municipality.id == municipality_id)
        )
        return result.scalar_one_or_none()

    async def get_by_district(self, district: str) -> Optional[Municipality]:
        result = await self.db.execute(
            select(Municipality).where(
                Municipality.district.ilike(f"%{district}%"),
                Municipality.is_active == True,
            )
        )
        return result.scalar_one_or_none()

    async def get_all_active(self) -> List[Municipality]:
        result = await self.db.execute(
            select(Municipality).where(Municipality.is_active == True)
        )
        return list(result.scalars().all())

    async def create(self, **kwargs) -> Municipality:
        municipality = Municipality(**kwargs)
        self.db.add(municipality)
        await self.db.flush()
        await self.db.refresh(municipality)
        return municipality
