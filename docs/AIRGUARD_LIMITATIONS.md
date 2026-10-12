# AIRGUARD — SYSTEM LIMITATIONS & NON-GOALS

**Platform:** AirGuard — Airspace Trust & Threat Intelligence  
**Document:** Research Integrity, Technical Boundaries & Disclaimers  
**Date:** October 2026  

---

## 1. Fundamental Scope & Disclaimers

1. **Telemetry Trust vs Aircraft Safety:**
   AirGuard evaluates the integrity and plausibility of received ADS-B broadcast messages. It does **not** evaluate airframe mechanical safety, certified navigation instruments, or pilot airmanship.

2. **No Claim of Intent Attribution:**
   Telemetry anomalies (such as rapid climbs or position jumps) can occur due to legitimate extreme maneuvers (e.g., military departures, emergency dives, TCAS Resolution Advisories) or antenna multipath reflection. AirGuard flags **anomalies**, never confirming "hostile attacks" without human analyst corroboration.

3. **Absence of Hardware Multilateration (MLAT):**
   Unless a distributed array of calibrated software-defined radios (SDRs) is physically connected, AirGuard operates solely on state-vector telemetry and does not perform raw RF Time Difference of Arrival (TDOA) multilateration.

---

## 2. Data Provider & Ingestion Limitations

- **OpenSky Network Rate Limits:** Public anonymous accounts are rate-limited to 1 request per 5–10 seconds. AirGuard utilizes snapshot retention to maintain continuity during rate-limit pauses.
- **Transponder Coverage Gaps:** Low-altitude aircraft below radar/receiver line-of-sight may exhibit intermittent signal loss that should not be misconstrued as active spoofing.
- **Provider Latency:** ADS-B state-vectors from public internet aggregators exhibit 2–10 seconds of transport latency compared to direct RF antenna reception.

---

## 3. Model Generalization Limitations

- Machine learning models (Autoencoder, Random Forest, GBDT) were trained and evaluated on civil commercial flight profiles. Atypical flight envelopes (aerobatic aircraft, supersonic military flights) may produce elevated reconstruction error and require analyst context.
