# AIRGUARD — SYSTEM ARCHITECTURE & DESIGN

**Platform:** AirGuard — Airspace Trust & Threat Intelligence  
**Release Tag:** `AIRGUARD-FINAL`  
**Date:** October 2026  

---

## 1. High-Level Architectural Topology

```
+-----------------------------------------------------------------------------+
|                                DATA SOURCES                                 |
|  - OpenSky State-Vector API (Live Public ADS-B Stream)                      |
|  - Historical Synthetic / Playback Fixture Datasets (Isolated Replay)       |
+-----------------------------------------------------------------------------+
                                       │
                                       ▼
+-----------------------------------------------------------------------------+
|                          INGESTION & NORMALIZATION                          |
|  - `backend/app/ingestion/client.py`: Resilience, 429 retry, last-known snap|
|  - `backend/app/ingestion/normalizer.py`: Boundary clamps & provenance tags |
+-----------------------------------------------------------------------------+
                                       │
                                       ▼
+-----------------------------------------------------------------------------+
|                             REDIS DATA STREAM                               |
|  - Stream Key `telemetry:ingress` (High-throughput buffer)                  |
+-----------------------------------------------------------------------------+
                                       │
                                       ▼
+-----------------------------------------------------------------------------+
|                         DISTRIBUTED DETECTION WORKER                        |
|  - Multi-tier detection worker cluster (`backend/app/detection/worker.py`)  |
|                                                                             |
|  [TIER 1] Deterministic Kinematic Rule Engine                               |
|           • Position jump • Climb rate • Alt/Vel match • NIC bounds         |
|  [TIER 2] Unsupervised Deep Autoencoder (PyTorch)                           |
|           • Kinematic reconstruction error (MSE)                            |
|  [TIER 3] Supervised Soft-Voting Ensemble (Random Forest + GBDT)            |
|           • Soft probability voting + TreeSHAP feature attributions         |
|  [TIER 4] Temporal EMA Trust Engine                                         |
|           • Rolling weighted decay (alpha=0.15), multi-window history       |
|                                                                             |
|  [AIRSPACE CORRELATION ENGINE]                                              |
|           • Spatial proximity clustering (<= 50km) for correlated anomalies |
+-----------------------------------------------------------------------------+
                                       │
                    ┌──────────────────┴──────────────────┐
                    ▼                                     ▼
+------------------------------------+ +--------------------------------------+
|       POSTGRESQL PERSISTENCE       | |           REDIS PUB/SUB              |
|  - `aircraft_states`               | |  - Channel `telemetry:processed`     |
|  - `aircraft_assessments`          | +--------------------------------------+
|  - `alerts` & `alert_transitions`  |                    │
|  - `watchlist_items`               |                    ▼
|  - `analyst_notes`                 | +--------------------------------------+
|  - `audit_logs`                    | |          FASTAPI WEBSOCKET           |
+------------------------------------+ |  - JWT Auth + Stream Delivery        |
                                       +--------------------------------------+
                                                          │
                                                          ▼
+-----------------------------------------------------------------------------+
|                          FRONTEND ANALYST CONSOLE                           |
|  - Airspace 3D Map (CesiumJS with Smooth Interpolation & Fading Trails)     |
|  - Aircraft Trust Center (Trust 0-100, Operational States, Kinematics)      |
|  - 5-Layer Detector Agreement Matrix (With Disagreement Warnings)          |
|  - Why This Aircraft? & 4-Quadrant Evidence Classification                   |
|  - SHAP Explanation Center (TreeSHAP Attributions + Interpretation Guide)   |
|  - Investigation Mode & Narrative (Chronological Real Timeline)             |
|  - "What Changed?" State Diff (Historical Baseline Comparison)              |
|  - Threats Center (5-Stage State Machine + Counter-Evidence Reasoning)      |
|  - Watchlist Manager (Priority Tracking + Analyst Notes)                    |
|  - Source Health & Model Center (Provenance, Ablation, Pipeline Latencies)  |
|  - Formal PDF Investigation Dossier Export (ReportLab)                      |
+-----------------------------------------------------------------------------+
```

---

## 2. Core Service Boundaries

1. **API Layer (`backend/app/api/`):**
   - FastAPI modular router with dependency-injected database sessions and JWT authentication.
   - Rate limiting via `slowapi` on all endpoints.
   - Pydantic v2 validation models preventing malformed payloads.

2. **Detection Layer (`backend/app/detection/`):**
   - Pure mathematical, PyTorch, and Scikit-Learn inference pipelines.
   - Independent of transport protocol, fully testable in isolation.

3. **Storage Layer (`backend/app/models.py`):**
   - Normalized relational tables in PostgreSQL.
   - Foreign keys and composite indexes on `(icao24, received_at)`.

4. **Frontend Architecture (`frontend/src/`):**
   - Zustand global state store (`useAirGuardStore.ts`).
   - Resium / Cesium WebGL rendering engine.
   - Modular analyst tool components with full keyboard accessibility.
