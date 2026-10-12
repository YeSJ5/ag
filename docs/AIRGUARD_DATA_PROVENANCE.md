# AIRGUARD — DATA PROVENANCE & REAL-TIME FRESHNESS

**Platform:** AirGuard — Airspace Trust & Threat Intelligence  
**Document:** Telemetry Provenance, OpenSky Ingress, and Snapshot Continuity  
**Date:** October 2026  

---

## 1. Provenance Timestamp Chain

To prevent confusion between network latency and physical observation age, AirGuard tracks a multi-stage timestamp chain across every telemetry record:

```
[Aircraft ADS-B Broadcast] 
          │
          ▼
   t_obs: Observation Timestamp (OpenSky state-vector timestamp)
          │
          ▼
   t_ingest: Ingestion Timestamp (AirGuard client received time)
          │
          ▼
   t_norm: Normalization Timestamp (Validation and cleaning time)
          │
          ▼
   t_proc: Processing Timestamp (Detection worker completion time)
          │
          ▼
   t_persist: Database Persistence Timestamp (PostgreSQL commit time)
```

**Observation Freshness** is strictly computed as:
$$\text{Age}_{\text{observation}} = t_{\text{current}} - t_{\text{obs}}$$

---

## 2. Ingress Snapshot Continuity Rules

AirGuard enforces production-grade resilience on public API feeds:

1. **HTTP 200 (Success):** Replaces the active in-memory snapshot with fresh telemetry.
2. **HTTP 429 (Rate Limit):** Retains the last valid snapshot and schedules the next attempt according to the `Retry-After` header.
3. **HTTP Timeout / Network Disconnect:** Retains the last valid snapshot and marks status as `STALE` after threshold expiration.
4. **Empty / Malformed Response:** Does not overwrite the valid snapshot. Logs data quality rejection counter.

---

## 3. Real-Time Frontend Freshness States

| Status | Age Threshold | Visual Indicator | Meaning |
| :--- | :--- | :--- | :--- |
| **`LIVE`** | $\text{Age} \le 15\text{s}$ | Green Pulse | Streaming real-time updates. |
| **`REFRESHING`** | During active I/O | Blue Spin | Ingress request currently in-flight. |
| **`RECENT`** | $15\text{s} < \text{Age} \le 45\text{s}$ | Cyan | Normal polling cycle window. |
| **`STALE`** | $45\text{s} < \text{Age} \le 180\text{s}$ | Amber Warning | Upstream delay or rate-limit hold. |
| **`OFFLINE`** | $\text{Age} > 180\text{s}$ | Red Alert | Connection unavailable; retaining last known state. |

*Note: All countdowns and freshness indicators originate strictly from backend state metadata.*
