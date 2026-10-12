# AIRGUARD — SECURITY & ACCESS CONTROL ARCHITECTURE

**Platform:** AirGuard — Airspace Trust & Threat Intelligence  
**Document:** Security Hardening, Authentication, RBAC & Secret Management  
**Date:** October 2026  

---

## 1. Authentication & JWT Token Handling
- Passwords are encrypted using salted `bcrypt` with work factor 12.
- Authentication returns signed JWT bearer tokens using `HS256`.
- Token expiration is enforced at 24 hours.
- WebSocket connections authenticate via initial query parameter / header token handshake.

---

## 2. Role-Based Access Control (RBAC) Matrix

AirGuard enforces backend authorization on all endpoints through FastAPI security dependencies:

| Capability / Resource | `viewer` | `analyst` | `admin` |
| :--- | :---: | :---: | :---: |
| View Airspace 3D Map & Telemetry | ✅ | ✅ | ✅ |
| View Aircraft Trust Center & Explainability | ✅ | ✅ | ✅ |
| View Alerts & Detection Matrix | ✅ | ✅ | ✅ |
| Acknowledge / Transition Alerts (`NEW` → `ACK`) | ❌ | ✅ | ✅ |
| Advance Alert State (`INVESTIGATING`, `RESOLVED`, `DISMISSED`) | ❌ | ✅ | ✅ |
| Add / Delete Watchlist Items | ❌ | ✅ | ✅ |
| Create / Edit Analyst Notes | ❌ | ✅ | ✅ |
| Export PDF Investigation Dossier | ✅ | ✅ | ✅ |
| Manage System Users & Roles | ❌ | ❌ | ✅ |
| Modify Detection Rules & Thresholds | ❌ | ❌ | ✅ |
| View Security Audit Logs | ❌ | ❌ | ✅ |

---

## 3. Threat Mitigation & Hardening Measures

1. **SQL Injection:** 100% prevented via SQLAlchemy ORM parameterized queries and asyncpg binary protocols.
2. **Denial of Service & Rate Limiting:** Enforced via `slowapi` Redis-backed sliding window rate limiters across all public and authenticated routes.
3. **Cross-Origin Resource Sharing (CORS):** Strict explicit origin validation; wildcard headers rejected in production mode.
4. **Audit Trail Immutability:** State changes (`AlertTransition`, `AuditLog`) are append-only.
