from typing import Any


def derive_trust_score(combined_risk_score: float | None) -> float | None:
    """Canonical derivation of Telemetry Trust Index (0-100 scale) from detector combined risk (0-1 scale).

    AirGuard Telemetry Trust Index semantics:
    - Trust Score is a detector-derived telemetry confidence index.
    - Inverse relationship: trust_score = clamp((1.0 - combined_risk_score) * 100, 0, 100).
    - Unassessed risk (None) yields None (unassessed trust).
    - It must NOT be interpreted as aircraft airworthiness, physical safety, collision probability,
      or absolute proof that an aircraft is genuine.
    """
    if combined_risk_score is None:
        return None
    try:
        val = float(combined_risk_score)
        return round(max(0.0, min(100.0, (1.0 - val) * 100.0)), 1)
    except (TypeError, ValueError):
        return None


def compute_weighted_rolling_trust(
    readings: list[dict[str, Any]], window: int = 10
) -> list[dict[str, Any]]:
    """Computes a rolling trust score (0-100) across a sequence of historical states.

    Derived from a weighted rolling average of combined_risk_score at each historical state
    (higher risk score = lower trust, normalized and smoothed over a configurable window).

    Each reading dict is expected to contain:
      - 'timestamp': datetime
      - 'risk_score': float (0.0 to 1.0)
      - 'reported_nic': Optional[int]
      - 'is_alert': bool

    Returns a list of dicts with:
      - 'timestamp': datetime
      - 'instantaneous_risk': float
      - 'trust_score': float (0.0 to 100.0)
      - 'is_alert': bool
      - 'reported_nic': Optional[int]
    """
    if not readings:
        return []

    # Ensure chronologically sorted
    sorted_readings = sorted(readings, key=lambda x: x["timestamp"])
    history_points = []

    for i in range(len(sorted_readings)):
        start_idx = max(0, i - window + 1)
        window_slice = sorted_readings[start_idx : i + 1]
        k = len(window_slice)

        # Linear weights: 1, 2, ..., k (most recent reading has weight k)
        weights = list(range(1, k + 1))
        sum_weights = sum(weights)

        weighted_risk_sum = sum(
            w * window_slice[j]["risk_score"] for j, w in enumerate(weights)
        )
        smoothed_risk = weighted_risk_sum / sum_weights if sum_weights > 0 else 0.0

        # Normalization: higher risk = lower trust (0 to 100)
        trust_score = round(max(0.0, min(100.0, (1.0 - smoothed_risk) * 100.0)), 1)
        curr = sorted_readings[i]

        history_points.append(
            {
                "timestamp": curr["timestamp"],
                "instantaneous_risk": round(float(curr["risk_score"]), 4),
                "trust_score": trust_score,
                "is_alert": bool(curr.get("is_alert", False)),
                "reported_nic": curr.get("reported_nic"),
            }
        )

    return history_points


def classify_trust_pattern(history_points: list[dict[str, Any]]) -> str:
    """Classifies the trust progression shape into 'STABLE', 'GRADUAL_DECLINE', or 'SUDDEN_DROP'.

    - 'SUDDEN_DROP': An abrupt plunge in trust score within 1-2 consecutive readings
      (e.g. >= 15 point drop in a single step, or >= 25 point drop over 2 steps).
    - 'GRADUAL_DECLINE': Sustained multi-step descent where trust drops steadily without sharp cliff drops.
    - 'STABLE': Minor or no degradation.
    """
    if len(history_points) < 2:
        return "STABLE"

    scores = [p["trust_score"] for p in history_points]
    max_single_drop = 0.0
    for i in range(1, len(scores)):
        drop = scores[i - 1] - scores[i]
        max_single_drop = max(max_single_drop, drop)

    max_two_step_drop = 0.0
    for i in range(2, len(scores)):
        drop2 = scores[i - 2] - scores[i]
        max_two_step_drop = max(max_two_step_drop, drop2)

    overall_drop = scores[0] - scores[-1]

    # In a 10-reading linear WMA, max theoretical single-step drop from 0 to 1 risk is ~18.2 points.
    # Therefore, a single-step drop >= 15.0 or 2-step drop >= 25.0 unambiguously signifies a sudden cliff drop.
    if max_single_drop >= 15.0 or max_two_step_drop >= 25.0:
        return "SUDDEN_DROP"

    # Significant overall drop achieved progressively via gentle steps (< 15 points per step)
    if overall_drop >= 20.0 or (scores[-1] < 70.0 and max_single_drop < 15.0):
        return "GRADUAL_DECLINE"

    return "STABLE"


def compute_weighted_rolling_risk(
    readings: list[dict[str, Any]], window: int = 10
) -> list[dict[str, Any]]:
    """Smooth observed detector risk without converting it into an aircraft trust rating."""
    if not readings:
        return []
    ordered = sorted(readings, key=lambda item: item["timestamp"])
    output = []
    for idx, current in enumerate(ordered):
        window_slice = ordered[max(0, idx - window + 1) : idx + 1]
        weights = range(1, len(window_slice) + 1)
        weighted_sum = sum(
            weight * item["risk_score"] for weight, item in zip(weights, window_slice)
        )
        weight_total = len(window_slice) * (len(window_slice) + 1) / 2
        output.append(
            {
                "timestamp": current["timestamp"],
                "risk_score": round(float(current["risk_score"]), 4),
                "smoothed_risk_score": round(weighted_sum / weight_total, 4),
                "is_alert": bool(current.get("is_alert", False)),
                "reported_nic": current.get("reported_nic"),
            }
        )
    return output


def classify_risk_pattern(history_points: list[dict[str, Any]]) -> str:
    """Describe changes in smoothed detector risk; this is not a threat classification."""
    if len(history_points) < 2:
        return "UNASSESSED"
    values = [point["smoothed_risk_score"] for point in history_points]
    max_rise = max(
        (values[i] - values[i - 1] for i in range(1, len(values))), default=0.0
    )
    max_two_point_rise = max(
        (values[i] - values[i - 2] for i in range(2, len(values))), default=0.0
    )
    net_rise = values[-1] - values[0]
    if max_rise >= 0.15 or max_two_point_rise >= 0.25:
        return "RISK_SPIKE"
    if net_rise >= 0.20 or (values[-1] >= 0.65 and max_rise < 0.15):
        return "RISK_RISING"
    return "STABLE"


# --- Next-Level Intelligence Functions ---


def classify_telemetry_trust_state(
    trust_score: float | None,
    evidence_confidence: float | None = None,
    assessment_status: str | None = None,
) -> str:
    """Classify overall telemetry trust state into formal analyst-grade categories.

    Categories:
    - 'INSUFFICIENT EVIDENCE': Accumulating history or unavailable detector layers (< 30% coverage).
    - 'HIGH RISK': High anomaly risk or explicit critical rule violation (Trust < 40 or REVIEW_REQUIRED).
    - 'SUSPICIOUS': Noticeable multi-signal anomaly or moderate model risk (Trust 40 - 69.9).
    - 'WATCH': Minor kinematic drift or single low-weight anomaly flag (Trust 70 - 84.9).
    - 'HIGH TRUST': Full or partial detector coverage with verified kinematic consistency (Trust >= 85).
    """
    if (
        trust_score is None
        or assessment_status == "INSUFFICIENT_EVIDENCE"
        or (evidence_confidence is not None and evidence_confidence < 0.30)
    ):
        return "INSUFFICIENT EVIDENCE"

    if assessment_status == "SUPPRESSED":
        return "HIGH TRUST"

    if trust_score < 40.0 or assessment_status == "REVIEW_REQUIRED":
        return "HIGH RISK"
    if trust_score < 70.0:
        return "SUSPICIOUS"
    if trust_score < 85.0:
        return "WATCH"
    return "HIGH TRUST"


def compute_detector_agreement(
    rule_flags: dict[str, bool] | None,
    autoencoder_score: float | None,
    ensemble_score: float | None,
    receiver_consistency_score: float | None,
    trust_score: float | None,
) -> dict[str, Any]:
    """Evaluate agreement across the 5 independent detection tiers.

    Returns:
      - 'layers': { 'kinematic_rules', 'autoencoder', 'ensemble', 'receiver_consistency', 'temporal_trust' }
      - 'evaluating_count': int
      - 'alerting_count': int
      - 'passing_count': int
      - 'agreement_ratio': float
      - 'agreement_summary': str
      - 'has_disagreement': bool
    """
    layers: dict[str, dict[str, Any]] = {}

    # 1. Kinematic Rules
    if rule_flags and isinstance(rule_flags, dict):
        has_rule_alert = any(v is True for v in rule_flags.values())
        layers["kinematic_rules"] = {
            "status": "ALERT" if has_rule_alert else "PASS",
            "score": 1.0 if has_rule_alert else 0.0,
            "label": "Kinematic Physics Rules",
            "details": f"{sum(1 for v in rule_flags.values() if v is True)} rule violations" if has_rule_alert else "Physics boundaries satisfied",
        }
    else:
        layers["kinematic_rules"] = {
            "status": "INSUFFICIENT_DATA",
            "score": None,
            "label": "Kinematic Physics Rules",
            "details": "Insufficient history for delta rules",
        }

    # 2. PyTorch Autoencoder (Reconstruction Loss)
    if autoencoder_score is not None:
        ae_val = float(autoencoder_score)
        ae_status = "ALERT" if ae_val >= 0.40 else ("WARN" if ae_val >= 0.20 else "PASS")
        layers["autoencoder"] = {
            "status": ae_status,
            "score": round(ae_val, 4),
            "label": "PyTorch Bottleneck Autoencoder",
            "details": f"Reconstruction error {ae_val:.4f} ({ae_status})",
        }
    else:
        layers["autoencoder"] = {
            "status": "INSUFFICIENT_DATA",
            "score": None,
            "label": "PyTorch Bottleneck Autoencoder",
            "details": "Accumulating rolling history (< 5 samples)",
        }

    # 3. Supervised Soft-Voting Ensemble (RF + GB)
    if ensemble_score is not None:
        ens_val = float(ensemble_score)
        ens_status = "ALERT" if ens_val >= 0.50 else ("WARN" if ens_val >= 0.25 else "PASS")
        layers["ensemble"] = {
            "status": ens_status,
            "score": round(ens_val, 4),
            "label": "Supervised Ensemble (RF + GB)",
            "details": f"Anomaly probability {ens_val * 100:.1f}%",
        }
    else:
        layers["ensemble"] = {
            "status": "INSUFFICIENT_DATA",
            "score": None,
            "label": "Supervised Ensemble (RF + GB)",
            "details": "Model artifact offline or insufficient features",
        }

    # 4. Spatial / Receiver Consistency
    if receiver_consistency_score is not None:
        rc_val = float(receiver_consistency_score)
        rc_status = "PASS" if rc_val >= 0.70 else ("WARN" if rc_val >= 0.40 else "ALERT")
        layers["receiver_consistency"] = {
            "status": rc_status,
            "score": round(rc_val, 4),
            "label": "Spatial Receiver Consistency",
            "details": f"Receiver geometry consistency {rc_val * 100:.1f}%",
        }
    else:
        layers["receiver_consistency"] = {
            "status": "INSUFFICIENT_DATA",
            "score": None,
            "label": "Spatial Receiver Consistency",
            "details": "Multi-receiver station sensor data not provided by feed",
        }

    # 5. Temporal Trust Engine
    if trust_score is not None:
        t_val = float(trust_score)
        t_status = "PASS" if t_val >= 80.0 else ("WARN" if t_val >= 50.0 else "ALERT")
        layers["temporal_trust"] = {
            "status": t_status,
            "score": round(t_val, 1),
            "label": "Temporal Bayesian Trust",
            "details": f"Telemetry trust index {t_val:.1f}%",
        }
    else:
        layers["temporal_trust"] = {
            "status": "INSUFFICIENT_DATA",
            "score": None,
            "label": "Temporal Bayesian Trust",
            "details": "Trust score uncomputed",
        }

    active_layers = [l for l in layers.values() if l["status"] != "INSUFFICIENT_DATA"]
    evaluating_count = len(active_layers)
    alerting_count = sum(1 for l in active_layers if l["status"] in ("ALERT", "WARN"))
    passing_count = sum(1 for l in active_layers if l["status"] == "PASS")

    has_disagreement = evaluating_count >= 2 and alerting_count > 0 and passing_count > 0

    if evaluating_count == 0:
        agreement_summary = "Insufficient data across detectors"
        agreement_ratio = 0.0
    elif has_disagreement:
        agreement_summary = f"{passing_count}/{evaluating_count} nominal vs {alerting_count}/{evaluating_count} flagged — Detector disagreement reduces assessment confidence"
        agreement_ratio = round(max(passing_count, alerting_count) / evaluating_count, 2)
    elif alerting_count > 0:
        agreement_summary = f"{alerting_count}/{evaluating_count} detectors in agreement (Anomaly corroborated)"
        agreement_ratio = 1.0
    else:
        agreement_summary = f"{evaluating_count}/{evaluating_count} detectors in agreement (Nominal verified)"
        agreement_ratio = 1.0

    return {
        "layers": layers,
        "evaluating_count": evaluating_count,
        "alerting_count": alerting_count,
        "passing_count": passing_count,
        "agreement_ratio": agreement_ratio,
        "agreement_summary": agreement_summary,
        "has_disagreement": has_disagreement,
    }


def classify_evidence_quadrant(
    state: dict[str, Any],
    alert: dict[str, Any] | None = None,
    assessment: dict[str, Any] | None = None,
) -> dict[str, list[str]]:
    """Classify investigation evidence into OBSERVED, DERIVED, MODEL-INFERRED, and UNKNOWN quadrants."""
    lat = state.get("latitude")
    lng = state.get("longitude")
    alt = state.get("altitude_m")
    vel = state.get("velocity_ms")
    hdg = state.get("heading_deg")
    vr = state.get("vertical_rate_ms")
    source = state.get("source", "opensky")

    observed = [
        f"Transponder coordinates: ({lat:.4f}°, {lng:.4f}°)" if lat is not None and lng is not None else "Coordinates reported",
        f"Barometric Altitude: {alt:.0f} m ({alt * 3.28084:.0f} ft)" if alt is not None else "Altitude reported",
        f"Ground Velocity: {vel:.1f} m/s ({vel * 1.94384:.0f} kts)" if vel is not None else "Ground speed reported",
        f"True Track Heading: {hdg:.1f}°" if hdg is not None else "Heading reported",
        f"Vertical Rate: {vr:+.1f} m/s ({vr * 196.85:+.0f} ft/min)" if vr is not None else "Vertical rate reported",
        f"Telemetry Ingestion Source: {source}",
    ]

    derived = []
    if vel is not None and alt is not None:
        alt_ft = alt * 3.28084
        vel_kts = vel * 1.94384
        derived.append(f"Kinematic regime: Cruise ({alt_ft:.0f} ft, {vel_kts:.0f} kts)" if alt_ft > 10000 else f"Low-altitude flight ({alt_ft:.0f} ft, {vel_kts:.0f} kts)")
    if vr is not None:
        derived.append(f"Climb vector: {vr * 196.85:+.0f} ft/min")

    model_inferred = []
    if assessment and isinstance(assessment, dict):
        comb_risk = assessment.get("combined_risk_score")
        if comb_risk is not None:
            model_inferred.append(f"Combined Detector Risk: {comb_risk:.4f}")
            model_inferred.append(f"Derived Telemetry Trust Score: {derive_trust_score(comb_risk)}%")
        signals = assessment.get("signals", {})
        if isinstance(signals, dict):
            if signals.get("autoencoder_score") is not None:
                model_inferred.append(f"Autoencoder Reconstruction Loss: {signals['autoencoder_score']:.4f}")
            if signals.get("ensemble_score") is not None:
                model_inferred.append(f"Ensemble Anomaly Probability: {signals['ensemble_score'] * 100:.1f}%")

    if alert and isinstance(alert, dict):
        reasons = alert.get("reason_text", "")
        if reasons:
            for r in reasons.split(";"):
                if r.strip():
                    model_inferred.append(f"Alert Trigger: {r.strip()}")

    unknown = [
        "Pilot navigation intent and flight deck FMC waypoints",
        "Whether trajectory deviation originates from malicious spoofing vs avionics/GPS sensor multipath",
        "Air traffic control tactical ATC radar vector directives",
        "Localized high-altitude wind shear, jet stream turbulence, or atmospheric microbursts",
    ]

    return {
        "observed": observed,
        "derived": derived,
        "model_inferred": model_inferred,
        "unknown": unknown,
    }


def generate_why_assessment(
    rule_flags: dict[str, bool] | None,
    autoencoder_score: float | None,
    ensemble_score: float | None,
    trust_score: float | None,
    alert_reason: str | None = None,
) -> dict[str, Any]:
    """Build structured 'WHY THIS AIRCRAFT?' breakdown separating what triggered vs what did not."""
    triggered: list[str] = []
    not_triggered: list[str] = []

    # Check kinematic rules
    rule_map = {
        "positionJump": "Position jump exceeding civil kinematic envelope",
        "position_jump": "Position jump exceeding civil kinematic envelope",
        "climbRate": "Vertical climb/descent rate exceeding physical aircraft limits (> 8,000 ft/min)",
        "climb_rate": "Vertical climb/descent rate exceeding physical aircraft limits (> 8,000 ft/min)",
        "duplicateIcao": "Duplicate ICAO address reported from divergent spatial coordinates",
        "duplicate_icao": "Duplicate ICAO address reported from divergent spatial coordinates",
        "altVelMismatch": "Altitude and ground speed physically inconsistent",
        "alt_vel_mismatch": "Altitude and ground speed physically inconsistent",
        "lowSignalConfidence": "Low signal confidence with unverified position displacement",
        "low_signal_confidence": "Low signal confidence with unverified position displacement",
    }

    if rule_flags:
        for k, v in rule_flags.items():
            name = rule_map.get(k, k)
            if v is True:
                triggered.append(f"Rule Triggered: {name}")
            elif v is False:
                not_triggered.append(f"Rule Nominal: {name}")

    if not rule_flags:
        not_triggered.append("Kinematic physics rules: All nominal within operational bounds")

    # Autoencoder
    if autoencoder_score is not None:
        if autoencoder_score >= 0.30:
            triggered.append(f"Autoencoder: Multivariate reconstruction residual spiked to {autoencoder_score:.4f}")
        else:
            not_triggered.append(f"Autoencoder: Normal kinematic latent pattern (residual {autoencoder_score:.4f} <= 0.30)")

    # Ensemble
    if ensemble_score is not None:
        if ensemble_score >= 0.50:
            triggered.append(f"Supervised Ensemble: Anomaly probability reached {ensemble_score * 100:.1f}%")
        else:
            not_triggered.append(f"Supervised Ensemble: Nominal classification (anomaly probability {ensemble_score * 100:.1f}% < 50%)")

    # Trust Score
    if trust_score is not None:
        if trust_score < 70.0:
            triggered.append(f"Trust Engine: Telemetry trust degraded to {trust_score:.1f}%")
        else:
            not_triggered.append(f"Trust Engine: Telemetry trust sustained at {trust_score:.1f}%")

    if alert_reason and alert_reason not in triggered:
        triggered.append(f"Flagged Condition: {alert_reason}")

    summary = (
        f"{len(triggered)} anomaly signals triggered; {len(not_triggered)} nominal checks verified."
        if triggered
        else "All telemetry integrity checks nominal. No anomalous kinematic deviations observed."
    )

    return {
        "triggered_reasons": triggered,
        "non_triggered_reasons": not_triggered,
        "summary": summary,
    }


def generate_alert_counter_evidence(
    rule_flags: list[str] | None,
    combined_risk: float | None,
    ensemble_score: float | None,
    autoencoder_score: float | None,
) -> list[str]:
    """Generate objective counter-evidence explaining why an alert may NOT represent a malicious threat."""
    counter_reasons = []

    if ensemble_score is not None and ensemble_score < 0.40:
        counter_reasons.append(
            "Supervised Ensemble ML model did not corroborate malicious spoofing pattern (predicted probability < 40%)."
        )

    if autoencoder_score is not None and autoencoder_score < 0.20:
        counter_reasons.append(
            "Autoencoder reconstruction loss is within normal operational noise bounds."
        )

    if rule_flags and len(rule_flags) == 1:
        single_rule = rule_flags[0]
        if "climb" in single_rule.lower():
            counter_reasons.append(
                "High vertical rate may reflect valid emergency descent, TCAS resolution advisory, or military combat departure."
            )
        elif "jump" in single_rule.lower():
            counter_reasons.append(
                "Position displacement may be caused by ground receiver handoff delay, temporary ADS-B transponder packet loss, or NTP clock desync."
            )
        elif "duplicate" in single_rule.lower():
            counter_reasons.append(
                "Duplicate ICAO may result from transponder maintenance squawk testing or ground station repeater echoing."
            )

    counter_reasons.append(
        "Surveillance feed latency or intermittent upstream state-vector packet drop may cause artificial kinematic jumps."
    )

    return counter_reasons

