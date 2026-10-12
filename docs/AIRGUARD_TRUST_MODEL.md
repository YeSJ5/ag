# AIRGUARD — TEMPORAL TELEMETRY TRUST MODEL

**Platform:** AirGuard — Airspace Trust & Threat Intelligence  
**Document:** Mathematical Trust Formulation, State Boundaries & Evidence Coverage  
**Date:** October 2026  

---

## 1. Operational Trust Definition

In AirGuard, **Trust** is strictly defined as **"Telemetry Trust"** (the empirical consistency, continuity, and multi-detector corroboration of received ADS-B broadcast messages).

AirGuard explicitly does **not** claim to authenticate the physical aircraft hardware or guarantee flight safety.

---

## 2. Discrete Operational Trust States

| State | Trust Range | Definition | Analyst Action |
| :--- | :--- | :--- | :--- |
| **`HIGH TRUST`** | $[85, 100]$ | Full kinematic, autoencoder, and ensemble consensus. Stable historical trajectory. | Routine surveillance. |
| **`WATCH`** | $[70, 84]$ | Minor telemetry inconsistencies, single-tier warning, or slight age degradation. | Monitored by watchlist queue. |
| **`SUSPICIOUS`** | $[45, 69]$ | Multiple detectors triggered or sudden significant trust decline. | Immediate analyst triage recommended. |
| **`HIGH RISK`** | $[0, 44]$ | Major kinematic violation or strong ensemble anomaly agreement. | Active security alert generated. |
| **`INSUFFICIENT EVIDENCE`** | N/A | Fewer than required observations, missing vectors, or uncalibrated receiver coverage. | Defer classification until further vectors arrive. |

---

## 3. Evidence Coverage Formulation

Evidence coverage measures the percentage of required assessment inputs currently available:

$$C_{\text{evidence}} = \frac{\sum_{k \in \mathcal{K}_{\text{available}}} w_k}{\sum_{k \in \mathcal{K}_{\text{total}}} w_k} \times 100\%$$

| Evidence Factor | Weight $w_k$ | Condition |
| :--- | :--- | :--- |
| Kinematic History ($\ge 3$ points) | $0.30$ | Allows position jump & climb derivative checks |
| Autoencoder Latent Evaluation | $0.25$ | Deep reconstruction loss computed |
| Supervised Ensemble Evaluation | $0.25$ | RF + GBDT soft-voting probability computed |
| Spatial / Receiver Neighbors | $0.20$ | Localized proximity context ($\le 50\text{km}$) |

### Classification Levels:
- **`GOOD EVIDENCE`**: $C_{\text{evidence}} \ge 80\%$
- **`PARTIAL EVIDENCE`**: $60\% \le C_{\text{evidence}} < 80\%$
- **`LIMITED EVIDENCE`**: $40\% \le C_{\text{evidence}} < 60\%$
- **`INSUFFICIENT EVIDENCE`**: $C_{\text{evidence}} < 40\%$
