import pytest
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.api.deps import get_current_user, get_db
from app.models import User, AircraftState, AircraftAssessment, Alert, AlertTransition, WatchlistItem, AnalystNote
from app.detection.trust import (
    classify_telemetry_trust_state,
    compute_detector_agreement,
    classify_evidence_quadrant,
    generate_why_assessment,
    generate_alert_counter_evidence,
)


def test_trust_state_classification():
    assert classify_telemetry_trust_state(95.0, 0.90) == "HIGH TRUST"
    assert classify_telemetry_trust_state(75.0, 0.80) == "WATCH"
    assert classify_telemetry_trust_state(50.0, 0.85) == "SUSPICIOUS"
    assert classify_telemetry_trust_state(25.0, 0.90) == "HIGH RISK"
    assert classify_telemetry_trust_state(95.0, 0.20) == "INSUFFICIENT EVIDENCE"
    assert classify_telemetry_trust_state(None) == "INSUFFICIENT EVIDENCE"



def test_detector_agreement_computation():
    dag = compute_detector_agreement(
        rule_flags={"climbRate": False, "positionJump": False},
        autoencoder_score=0.1,
        ensemble_score=0.05,
        receiver_consistency_score=None,
        trust_score=92.0,
    )
    assert dag["agreeing_count"] == 4 if "agreeing_count" in dag else dag["passing_count"] == 4
    assert dag["has_disagreement"] is False
    assert dag["agreement_ratio"] == 1.0


def test_detector_disagreement_detection():
    # Rules trigger but ensemble is low -> disagreement
    dag = compute_detector_agreement(
        rule_flags={"climbRate": True},
        autoencoder_score=0.1,
        ensemble_score=0.05,
        receiver_consistency_score=None,
        trust_score=65.0,
    )
    assert dag["has_disagreement"] is True
    assert "disagreement" in dag["agreement_summary"].lower()


def test_evidence_quadrant_classification():
    state = {
        "latitude": 37.7749,
        "longitude": -122.4194,
        "altitude_m": 10000.0,
        "velocity_ms": 220.0,
        "heading_deg": 180.0,
        "vertical_rate_ms": 15.0,
        "source": "opensky",
    }
    assessment = {
        "combined_risk_score": 0.12,
        "signals": {
            "autoencoder_score": 0.08,
            "ensemble_score": 0.05,
        }
    }
    quads = classify_evidence_quadrant(
        state=state,
        assessment=assessment,
    )
    assert len(quads["observed"]) >= 4
    assert len(quads["derived"]) >= 1
    assert len(quads["model_inferred"]) >= 2
    assert len(quads["unknown"]) >= 1


def test_why_assessment_generation():
    why = generate_why_assessment(
        rule_flags={"positionJump": True, "climbRate": False},
        autoencoder_score=0.85,
        ensemble_score=0.78,
        trust_score=45.0,
        alert_reason="Kinematic envelope exceedance",
    )
    assert len(why["triggered_reasons"]) >= 3
    assert len(why["non_triggered_reasons"]) >= 1


def test_alert_counter_evidence():
    counter = generate_alert_counter_evidence(
        rule_flags=["climbRate"],
        combined_risk=0.45,
        ensemble_score=0.10,
        autoencoder_score=0.15,
    )
    assert len(counter) >= 1
    assert any("not corroborate" in c.lower() or "emergency" in c.lower() for c in counter)


@pytest.fixture
def mock_db():
    session = AsyncMock()
    session.add = MagicMock()
    session.commit = AsyncMock()
    session.refresh = AsyncMock()
    session.delete = AsyncMock()
    return session


@pytest.mark.asyncio
async def test_api_models_metadata_endpoint():
    viewer_user = User(id=1, email="analyst@airguard.org", role="viewer")
    app.dependency_overrides[get_current_user] = lambda: viewer_user

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/v1/models/metadata")
    assert res.status_code == 200
    data = res.json()
    assert "models" in data
    assert len(data["models"]) == 4
    assert "features" in data
    assert "active_detector_version" in data

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_api_ablation_study_endpoint():
    viewer_user = User(id=1, email="analyst@airguard.org", role="viewer")
    app.dependency_overrides[get_current_user] = lambda: viewer_user

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/v1/models/ablation")
    assert res.status_code == 200
    data = res.json()
    assert "configurations" in data
    assert len(data["configurations"]) == 4
    assert data["configurations"][-1]["precision"] > 0.99

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_api_system_latency_endpoint():
    viewer_user = User(id=1, email="analyst@airguard.org", role="viewer")
    app.dependency_overrides[get_current_user] = lambda: viewer_user

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/v1/system/latency")
    assert res.status_code == 200
    data = res.json()
    assert "total_pipeline_ms" in data
    assert "source_to_redis_ms" in data
    assert data["p95_latency_ms"] > 0

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_api_source_health_detail():
    viewer_user = User(id=1, email="analyst@airguard.org", role="viewer")
    app.dependency_overrides[get_current_user] = lambda: viewer_user

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/v1/sources/health")
    assert res.status_code == 200
    data = res.json()
    assert "OpenSky State-Vector Data" in data["provider_type"]
    assert "raw radio" in data["provenance_notice"].lower()

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_api_data_quality():
    viewer_user = User(id=1, email="analyst@airguard.org", role="viewer")
    app.dependency_overrides[get_current_user] = lambda: viewer_user

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/v1/data-quality")
    assert res.status_code == 200
    data = res.json()
    assert "data_quality_score" in data

    app.dependency_overrides.clear()
