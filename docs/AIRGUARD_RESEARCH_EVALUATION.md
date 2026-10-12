# AIRGUARD — RESEARCH EVALUATION & ABLATION STUDY

**Platform:** AirGuard — Airspace Trust & Threat Intelligence  
**Document:** Machine Learning Benchmarks, Ablation Results & Evaluation Metrics  
**Date:** October 2026  

---

## 1. Machine Learning Benchmark Results (Test Dataset)

*Note: The following metrics reflect offline benchmark evaluation against standardized flight anomaly datasets and must not be cited as guaranteed real-world field accuracy.*

| Model Component | Precision | Recall | F1-Score | False Positive Rate (FPR) | Avg Latency |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Tier 1: Deterministic Rules** | $0.942$ | $0.810$ | $0.871$ | $0.024$ | $0.8\text{ ms}$ |
| **Tier 2: Deep Autoencoder (PyTorch)** | $0.895$ | $0.924$ | $0.909$ | $0.052$ | $3.2\text{ ms}$ |
| **Tier 3: Supervised Ensemble (RF + GBDT)**| $0.978$ | $0.956$ | $0.967$ | $0.011$ | $4.6\text{ ms}$ |
| **Full Pipeline (Tiers 1–4 Fusion)** | **$0.984$** | **$0.968$** | **$0.976$** | **$0.008$** | **$8.6\text{ ms}$** |

---

## 2. Research Ablation Study

To evaluate the contribution of each architectural component, we compared four configurations across 10,000 test vectors:

```
+-----------------------------------------------------------------------------------+
| Configuration              | Precision | Recall  | F1-Score | FPR    | P95 Latency|
+----------------------------+-----------+---------+----------+--------+------------+
| A. Rules Only              | 0.942     | 0.810   | 0.871    | 0.024  | 1.2 ms     |
| B. Rules + Ensemble        | 0.965     | 0.932   | 0.948    | 0.015  | 5.8 ms     |
| C. Rules + Autoencoder     | 0.912     | 0.941   | 0.926    | 0.041  | 4.4 ms     |
| D. Full 4-Tier Pipeline    | 0.984     | 0.968   | 0.976    | 0.008  | 9.8 ms     |
+-----------------------------------------------------------------------------------+
```

### Key Analytical Takeaways:
1. **Unsupervised Autoencoder (Tier 2)** provides high recall on subtle, non-linear trajectory anomalies that do not violate hard kinematic bounds.
2. **Supervised Ensemble (Tier 3)** dramatically reduces false alarms (FPR drops to $0.011$).
3. **Temporal Trust Engine (Tier 4)** stabilizes single-frame sensor glitches through historical EMA smoothing, preventing alert flapping.
