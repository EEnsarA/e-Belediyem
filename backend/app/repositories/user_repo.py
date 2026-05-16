from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.user import User
from app.models.municipality import Municipality


class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, user_id: int) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> Optional[User]:
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_all_by_municipality(self, municipality_id: int) -> List[User]:
        result = await self.db.execute(
            select(User).where(User.municipality_id == municipality_id)
        )
        return list(result.scalars().all())

    async def create(self, **kwargs) -> User:
        user = User(**kwargs)
        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)
        return user

    async def update(self, user: User, **kwargs) -> User:
        for key, value in kwargs.items():
            setattr(user, key, value)
        await self.db.flush()
        await self.db.refresh(user)
        return user

    async def count_by_municipality(self, municipality_id: int) -> int:
        result = await self.db.execute(
            select(func.count(User.id)).where(User.municipality_id == municipality_id)
        )
        return result.scalar_one()

    async def find_by_tckn_hash_candidates(self, municipality_id: Optional[int] = None) -> List[User]:
        """Tüm kullanıcıları döndür - TCKN match için service katmanında verify edilecek."""
        query = select(User)
        if municipality_id:
            query = query.where(User.municipality_id == municipality_id)
        result = await self.db.execute(query)
        return list(result.scalars().all())
