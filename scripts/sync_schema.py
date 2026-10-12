import asyncio
import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from sqlalchemy import text
from app.core.database import engine, Base
import app.models

async def fix_schema():
    async with engine.begin() as conn:
        print("Ensuring all Base.metadata tables exist...")
        await conn.run_sync(Base.metadata.create_all)
        print("Ensuring alerts.status column and index exist...")
        await conn.execute(text("ALTER TABLE alerts ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'NEW';"))
        print("[SUCCESS] Database schema synchronized successfully!")

if __name__ == "__main__":
    asyncio.run(fix_schema())
