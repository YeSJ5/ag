# AIRGUARD — MULTI-TIER DETECTION & EXPLAINABILITY ENGINE

**Platform:** AirGuard — Airspace Trust & Threat Intelligence  
**Document:** Detection Specification & Mathematical Formulation  
**Date:** October 2026  

---

## 1. Multi-Tier Detection Architecture

AirGuard deploys a 4-tier hybrid detection stack that combines deterministic physical bounds, unsupervised deep anomaly detection, supervised soft-voting classification, and temporal trust decay.

```
                  ┌─────────────────────────────────────┐
                  │    Ingress Telemetry Observation    │
                  └──────────────────┬──────────────────┘
                                     │
          ┌──────────────────────────┼──────────────────────────┐
          ▼                          ▼                          ▼
   [TIER 1 RULES]             [TIER 2 AUTOENCODER]        [TIER 3 ENSEMBLE]
 Deterministic Physics       Unsupervised Reconstruction    Supervised Classifiers
 • Position Displacements    • PyTorch Deep Autoencoder    • Random Forest (100 est)
 • Max Climb/Descent         • MSE Reconstruction Loss     • GBDT (100 est)
 • Alt/Velocity Mismatch     • Latent Representation       • TreeSHAP Attributions
 • Nav Integrity (NIC)
          │                          │                          │
          └──────────────────────────┼──────────────────────────┘
                                     ▼
                      [TIER 4 TEMPORAL TRUST ENGINE]
                      • Exponential Moving Average (EMA)
                      • Historical Rolling Confidence
                      • Staleness & Latency Penalties
                                     │
                                     ▼
                      [MULTI-LAYER DETECTOR AGREEMENT]
                      • Consensus Ratio (e.g., 4/4 agree)
                      • Explicit Disagreement Handling
```

---

## 2. Detection Tier Specifications

### Tier 1: Deterministic Kinematic Rules
Evaluates physical plausibility using civil aviation performance envelopes:
1. **Position Jump Detection:** Computes orthodromic Haversine speed between consecutive observations $s = \frac{d_{\text{haversine}}(p_t, p_{t-1})}{\Delta t}$. Anomaly triggered if $s > 350\text{ m/s}$ ($> 680\text{ kt}$).
2. **Climb Rate Bounds:** Anomaly triggered if $|\dot{h}| > 50\text{ m/s}$ ($> 9,800\text{ ft/min}$).
3. **Altitude-Velocity Inconsistency:** Flags aircraft with cruise velocities ($> 150\text{ kt}$) reported on the ground or zero ground speed at cruise altitudes ($> 10,000\text{ ft}$).

### Tier 2: Unsupervised Deep Autoencoder
- **Architecture:** PyTorch Fully-Connected Autoencoder ($d_{\text{in}} \to 32 \to 16 \to 8 \to 16 \to 32 \to d_{\text{out}}$).
- **Loss:** Mean Squared Error (MSE) between raw feature vector $\mathbf{x}$ and reconstructed vector $\hat{\mathbf{x}}$:
$$\mathcal{L}_{\text{rec}} = \frac{1}{D} \sum_{i=1}^D (x_i - \hat{x}_i)^2$$
- High reconstruction error flags unseen trajectory maneuvers or synthetic trajectory injection.

### Tier 3: Supervised Soft-Voting Ensemble & SHAP
- **Classifiers:** Soft-voting ensemble combining Random Forest ($N=100$) and Gradient Boosted Decision Trees ($N=100$).
- **Output Probability:** $P_{\text{ensemble}} = \frac{1}{2}\left(P_{\text{RF}}(\text{anomaly}) + P_{\text{GBDT}}(\text{anomaly})\right)$.
- **Explainability:** TreeSHAP calculates exact additive Shapley values $\phi_i$ satisfying $\sum \phi_i = f(\mathbf{x}) - \mathbb{E}[f(\mathbf{x})]$.

### Tier 4: Temporal EMA Trust Engine
Trust score $T_t \in [0, 100]$ evolves temporally via Exponential Moving Average:
$$T_t = (1 - \alpha) T_{t-1} + \alpha \cdot \left(1.0 - R_{\text{combined}}\right) \times 100$$
where $\alpha = 0.15$ regulates responsiveness against transient signal noise.

---

## 3. Detector Agreement & Disagreement Principle

When detectors disagree (e.g., Rules trigger an alert while ML models score nominal), AirGuard **does not force artificial consensus**. 

Instead, the system explicitly displays:
> **"Detector Disagreement — Assessment Confidence Reduced"**

This prevents false confidence and alerts analysts to edge-case anomalies such as valid extreme maneuvers or sensor degradation.
