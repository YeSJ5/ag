import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))
import asyncio
from sqlalchemy import text
from app.core.database import engine

async def sample_db():
    async with engine.connect() as conn:
        print("\n--- SAMPLE: AIRCRAFT_STATES (Latest 2 Records) ---")
        res = await conn.execute(text("""
            SELECT id, icao24, callsign, latitude, longitude, altitude_m, velocity_ms, heading_deg, source, received_at 
            FROM aircraft_states 
            ORDER BY id DESC 
            LIMIT 2;
        """))
        for row in res.mappings():
            print(dict(row))

        print("\n--- SAMPLE: ALERTS (Latest 2 Alerts) ---")
        res = await conn.execute(text("""
            SELECT id, icao24, rule_flags, combined_risk_score, reason_text, detected_at, status 
            FROM alerts 
            ORDER BY id DESC 
            LIMIT 2;
        """))
        for row in res.mappings():
            print(dict(row))

        print("\n--- SAMPLE: USERS ---")
        res = await conn.execute(text("SELECT id, email, role, created_at FROM users;"))
        for row in res.mappings():
            print(dict(row))

if __name__ == "__main__":
    asyncio.run(sample_db())
