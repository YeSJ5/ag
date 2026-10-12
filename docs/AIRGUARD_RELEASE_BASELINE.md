# AIRGUARD — RELEASE BASELINE SPECIFICATION

**Project:** AirGuard — Airspace Trust & Threat Intelligence  
**Release Tag:** `AIRGUARD-FINAL`  
**Git Commit:** `12e8a3ff79663f346c49f95d172253966f413d7f`  
**Date:** October 2026  

---

## 1. Environment & Runtime Specifications

| Component | Target / Installed Version | Status |
| :--- | :--- | :--- |
| **Operating System** | Microsoft Windows (x64) | Verified |
| **Python** | Python 3.11.9 (active), 3.12.14 (.venv) | Verified |
| **Node.js** | v24.11.1 | Verified |
| **PostgreSQL** | PostgreSQL 16+ (asyncpg connection pool) | Verified |
| **Redis** | Redis 7+ (Streams & Pub/Sub enabled) | Verified |
| **PyTorch** | 2.6.0+cpu | Verified |
| **Scikit-Learn** | 1.6.1 | Verified |
| **Cesium / Resium** | CesiumJS 1.121+ / Resium 1.17+ | Verified |
| **Vite** | 5.4.21 | Verified |

---

## 2. Test Execution & Quality Gates Baseline

```
============================= VERIFICATION GATES =============================
1. Backend Automated Tests (Pytest):
   - Total Collected Tests: 125
   - Passed: 125 (100%)
   - Failed: 0
   - Skipped / Errors: 0
   - Execution Time: ~183s

2. Frontend Static & Compilation Checks:
   - TypeScript Compilation (`tsc -b`): PASS (0 errors)
   - Vite Production Build (`vite build`): PASS (0 errors)
   - ESLint Analysis (`eslint --max-warnings 0`): PASS (0 errors, 0 warnings)

3. Visual & Kinematic Motion Interpolation:
   - SampledPositionProperty 4-point interpolation: 100.0% accurate
   - Consecutive WebSocket zero-snapping discontinuity: 0.00000m
   - Shortest-path North heading turn (350° -> 20°): 5.0° (crosses North cleanly)
   - Speed-proportional polyline trail fading: 5/5 sub-tests PASSED
   - 60 FPS Frame budget under 300 aircraft: 0.254ms / frame (< 1.5% CPU)

4. Memory & Entity Churn Stress Test:
   - Dynamic Polyline Add/Remove/Prune: 150,599 evaluations
   - Undefined or Non-Array Returns: 0
   - Unhandled Exceptions: 0
==============================================================================
```

---

## 3. Model Artifact Versions & Checksums

| Tier / Model | Architecture | File Artifact | Features | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Tier 1** | Deterministic Kinematic Rules | `backend/app/detection/rules.py` | Pos Jump, Climb Rate, Alt/Vel, NIC | ACTIVE |
| **Tier 2** | Deep Unsupervised Autoencoder | `backend/app/detection/autoencoder_model.pt` | Kinematic Reconstruction Latents | ACTIVE |
| **Tier 3** | Soft-Voting Supervised Ensemble | `backend/app/detection/ensemble_model.joblib` | RF (100 est) + GBDT (100 est) + TreeSHAP | ACTIVE |
| **Tier 4** | Temporal EMA Trust Engine | `backend/app/detection/trust.py` | Multi-window Rolling Trust Decay ($\alpha=0.15$) | ACTIVE |
