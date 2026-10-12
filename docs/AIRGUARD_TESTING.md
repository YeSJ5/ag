# AIRGUARD — COMPREHENSIVE TESTING & VALIDATION GUIDE

**Platform:** AirGuard — Airspace Trust & Threat Intelligence  
**Document:** Test Automation Architecture & Quality Assurance Execution  
**Date:** October 2026  

---

## 1. Automated Test Suites & Commands

### Backend Pytest Suite
```bash
# Run full 125-test backend verification suite
.venv\Scripts\python -m pytest backend/tests -v
```
- **Coverage:** API contract fuzzing (Schemathesis), JWT auth & RBAC, Autoencoder reconstruction, Random Forest + GBDT ensemble, Temporal Trust decay, Ingestion normalization, Redis Streams, Route detail, and Next-Level Intelligence endpoints.

### Cesium Motion Interpolation Suite
```bash
# Run 5-point kinematic motion and frame budget verification
node scripts/test_motion_interpolation.js
```
- **Coverage:** Multi-point SampledPositionProperty interpolation, consecutive zero-snapping checks, shortest-path North wrap (350° $\to$ 20° = 5.0°), speed-proportional fading polyline trails, and 60 FPS profile @ 300 aircraft.

### Dynamic Polyline Memory Stress Test
```bash
# Run 150,000+ render tick churn test
node scripts/test_polyline_stress.js
```
- **Coverage:** High-frequency entity add/remove/prune cycles ensuring zero undefined returns and zero memory leaks.

### Frontend Static & Production Checks
```bash
cd frontend
npm run lint   # ESLint with 0 errors and max-warnings 0
npm run build  # TypeScript tsc -b compilation + Vite production bundle
```

---

## 2. Failure Recovery Test Matrix

| Scenario | Injected Fault | Expected Behavior | Observed Result |
| :--- | :--- | :--- | :--- |
| **Redis Outage** | Process SIGTERM | System falls back to direct DB sync; logs warning; reconnects upon restore. | PASS |
| **PostgreSQL Outage** | Port closed | API returns clean 503 Service Unavailable without crashing worker process. | PASS |
| **OpenSky 429 Rate Limit** | HTTP 429 injection | Ingress client pauses until `Retry-After`; UI retains last valid snapshot. | PASS |
| **WebSocket Disconnect** | Network severance | React client auto-reconnects with exponential backoff without duplicating UI state. | PASS |
| **Missing Model File** | Unlink artifact | Engine flags tier as `INSUFFICIENT_DATA`; does not crash scoring pipeline. | PASS |
