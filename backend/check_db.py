import asyncio
import sys
import os

sys.path.insert(0, os.path.abspath("."))
from app.db.session import async_session_factory
from app.models.municipality import Municipality
from sqlalchemy import select

async def main():
    async with async_session_factory() as db:
        res = await db.execute(select(Municipality))
        muns = res.scalars().all()
        print(f"Total municipalities: {len(muns)}")
        for m in muns:
            print(f"- {m.name} (is_active: {m.is_active})")

if __name__ == "__main__":
    asyncio.run(main())
