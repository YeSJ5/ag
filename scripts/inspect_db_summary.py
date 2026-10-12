import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))
import asyncio
from sqlalchemy import text
from app.core.database import engine

async def inspect_db():
    async with engine.connect() as conn:
        res = await conn.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        """))
        tables = [r[0] for r in res.fetchall()]
        print("=== AIRGUARD DATABASE TABLES & ROW COUNTS ===")
        for t in tables:
            try:
                cnt_res = await conn.execute(text(f'SELECT count(*) FROM "{t}"'))
                cnt = cnt_res.scalar()
                print(f"• {t:30} : {cnt:,} rows")
            except Exception as e:
                print(f"• {t:30} : Error ({e})")

if __name__ == "__main__":
    asyncio.run(inspect_db())
