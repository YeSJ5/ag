import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))
import asyncio
from app.core.database import async_session_maker
from app.models import User, AircraftState, AircraftAssessment
from sqlalchemy import select, func

async def main():
    async with async_session_maker() as session:
        res = await session.execute(select(User))
        users = res.scalars().all()
        print("Users in DB:", [(u.id, u.email, u.role) for u in users])
        
        count_states = (await session.execute(select(func.count(AircraftState.id)))).scalar()
        print(f"Total AircraftState count in DB: {count_states}")
        
        count_ass = (await session.execute(select(func.count(AircraftAssessment.id)))).scalar()
        print(f"Total AircraftAssessment count in DB: {count_ass}")

        res = await session.execute(select(AircraftState).order_by(AircraftState.received_at.desc()).limit(3))
        states = res.scalars().all()
        print("Latest states:", [(s.id, s.icao24, s.callsign, s.received_at) for s in states])

        res = await session.execute(select(AircraftAssessment).order_by(AircraftAssessment.assessed_at.desc()).limit(3))
        assessments = res.scalars().all()
        print("Latest assessments:")
        for a in assessments:
            print(f"  ID: {a.id}, ICAO24: {a.icao24}, Risk: {a.combined_risk_score}, Status: {a.status}, Signals: {a.signals}")

if __name__ == "__main__":
    asyncio.run(main())
