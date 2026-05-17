import asyncio
import sys
import os

sys.path.insert(0, os.path.abspath("."))
from app.db.session import async_session_factory
from app.models.municipality import Municipality
# pyrefly: ignore [missing-import]
from sqlalchemy import select

async def main():
    logos = {
        "Kadıköy": "/logos/kadikoy.png",
        "Çankaya": "/logos/cankaya.jpg",
        "Konak": "/logos/konak.png"
    }
    
    async with async_session_factory() as db:
        res = await db.execute(select(Municipality))
        muns = res.scalars().all()
        for m in muns:
            if m.district in logos:
                m.logo_url = logos[m.district]
        
        await db.commit()
        print("Logolar başarıyla eklendi!")

if __name__ == "__main__":
    asyncio.run(main())
