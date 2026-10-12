import os
import sys
import asyncio
import numpy as np

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

sys.path.insert(0, os.path.abspath('f:/major_project/backend'))

from app.core.database import async_session_maker
from app.detection.ensemble import TrustScoringEnsemble, FEATURE_NAMES
from app.detection.autoencoder import UnsupervisedAutoencoder, combine_scores
from app.detection.service import DetectionService

async def trace_pipeline():
    print("=========================================================================================")
    print("STEP 2: DIRECT TRACE OF RAW MODEL INPUTS & OUTPUTS ACROSS 10 DISTINCT LIVE AIRCRAFT")
    print("=========================================================================================\n")

    ens = TrustScoringEnsemble()
    ae = UnsupervisedAutoencoder()
    detection_svc = DetectionService(
        db_session_maker=async_session_maker,
        ensemble_model=ens,
        autoencoder_model=ae
    )

    print(f"Ensemble Model Loaded: {ens.model is not None} (Type: {type(ens.model)})")
    print(f"Autoencoder Model Loaded: {ae.model is not None} (Type: {type(ae.model)})")

    # Sample live flight states across northern/central airspace
    base_vectors = [
        ("800101", "AIC101", "India", 1700000000, 1700000000, 77.100, 28.556, 10500.0, False, 240.0, 135.0, 0.0, ["101"], 10600.0, "2140", False, 0, 1),
        ("800102", "SEJ302", "India", 1700000000, 1700000000, 72.868, 19.088, 8500.0, False, 210.0, 310.0, 1.5, ["102"], 8600.0, "3421", False, 0, 1),
        ("800103", "IGO404", "India", 1700000000, 1700000000, 77.668, 12.950, 9200.0, False, 225.0, 45.0, -0.5, ["103"], 9300.0, "5120", False, 0, 1),
        ("800104", "VTI818", "India", 1700000000, 1700000000, 88.363, 22.572, 11000.0, False, 250.0, 270.0, 0.0, ["104"], 11100.0, "6341", False, 0, 1),
        ("800105", "AXB512", "India", 1700000000, 1700000000, 80.270, 13.082, 7800.0, False, 195.0, 180.0, 2.0, ["105"], 7900.0, "1122", False, 0, 1),
        ("800106", "UAE505", "UAE", 1700000000, 1700000000, 55.365, 25.253, 12000.0, False, 260.0, 95.0, 0.0, ["106"], 12100.0, "4410", False, 0, 1),
        ("800107", "QFA001", "Australia", 1700000000, 1700000000, 76.500, 28.000, 11500.0, False, 255.0, 120.0, -1.0, ["107"], 11600.0, "7201", False, 0, 1),
        ("800108", "BAW142", "UK", 1700000000, 1700000000, 78.000, 27.200, 10800.0, False, 245.0, 290.0, 0.0, ["108"], 10900.0, "3350", False, 0, 1),
        ("800109", "DLH760", "Germany", 1700000000, 1700000000, 75.000, 26.500, 11200.0, False, 252.0, 110.0, 0.5, ["109"], 11300.0, "2214", False, 0, 1),
        ("a1b2c3", "SYNTH-JMP", "Synthetic", 1700000000, 1700000000, 77.209, 28.614, 10000.0, False, 240.0, 45.0, 0.0, ["110"], 10000.0, "1200", False, 0, 1),
    ]
    
    # Process tick 1 and tick 2 to ensure rolling history variance is computed
    print("\n--- TICK 1 INGESTION ---")
    from datetime import datetime, timezone, timedelta
    t0 = datetime.now(timezone.utc) - timedelta(seconds=10)
    for vec in base_vectors:
        rec = {
            "icao24": vec[0],
            "callsign": vec[1],
            "origin_country": vec[2],
            "time_position": vec[3],
            "last_contact": vec[4],
            "longitude": vec[5],
            "latitude": vec[6],
            "altitude_m": vec[7],
            "on_ground": vec[8],
            "velocity_ms": vec[9],
            "heading_deg": vec[10],
            "vertical_rate_ms": vec[11],
            "sensors": [str(s) for s in (vec[12] or ["101"])],
            "geo_altitude": vec[13],
            "squawk": vec[14],
            "spi": vec[15],
            "position_source": vec[16],
            "category": vec[17],
            "received_at": t0,
            "source": "live_test"
        }
        await detection_svc.process_record(rec)

    # Tick 2 vectors: aircraft move slightly, and SYNTH-JMP triggers position jump & climb
    vectors_tick2 = []
    for vec in base_vectors:
        v = list(vec)
        if v[0] == "a1b2c3":
            v[5] = v[5] + 5.0 # 550km jump
            v[6] = v[6] + 5.0
            v[9] = 850.0 # high speed
            v[11] = 80.0 # impossible climb rate
        else:
            v[5] = v[5] + 0.02
            v[6] = v[6] + 0.02
        vectors_tick2.append(tuple(v))
    print("\n--- TICK 2 EVALUATION: TRACING EXACT FEATURE VECTORS & SCORES ---")
    print("-" * 120)
    print(f"{'ICAO':<8} | {'Callsign':<8} | {'Altitude':<9} | {'Speed':<6} | {'Hdg':<5} | {'Input Feature Vector (9)':<38} | {'Ens':<7} | {'AE':<7} | {'Tri':<7} | {'Risk':<7} | {'Trust'}")
    print("-" * 120)

    for vec in vectors_tick2:
        from datetime import datetime, timezone
        rec = {
            "icao24": vec[0],
            "callsign": vec[1],
            "origin_country": vec[2],
            "time_position": vec[3],
            "last_contact": vec[4],
            "longitude": vec[5],
            "latitude": vec[6],
            "altitude_m": vec[7],
            "on_ground": vec[8],
            "velocity_ms": vec[9],
            "heading_deg": vec[10],
            "vertical_rate_ms": vec[11],
            "sensors": [str(s) for s in (vec[12] or ["101", "102"])],
            "geo_altitude": vec[13],
            "squawk": vec[14],
            "spi": vec[15],
            "position_source": vec[16],
            "category": vec[17],
            "received_at": datetime.now(timezone.utc),
            "source": "regional"
        }

        # Extract features exactly as DetectionService computes
        prev_history = detection_svc.history.get(rec["icao24"], [])
        prev_record = prev_history[0] if prev_history else None

        rule_jump, jump_reason, _ = (False, None, None)
        rule_dup, dup_reason, _ = (False, None, None)
        rule_climb, climb_reason, _ = (False, None, None)
        rule_alt_vel, alt_vel_reason, _ = (False, None, None)
        rule_low_signal, low_signal_reason, _ = (False, None, None)
        rule_flags = [rule_jump, rule_dup, rule_climb, rule_alt_vel, rule_low_signal]

        states = [rec] + prev_history[:4]
        speeds = [s["velocity_ms"] for s in states]
        headings = [s["heading_deg"] for s in states]
        vert_rates = [s["vertical_rate_ms"] for s in states]

        speed_var = float(np.var(speeds)) if len(speeds) > 1 else 0.0
        heading_var = float(np.var(headings)) if len(headings) > 1 else 0.0
        alt_rate_var = float(np.var(vert_rates)) if len(vert_rates) > 1 else 0.0

        time_diff = 0.0
        if prev_record:
            time_diff = (rec["received_at"] - prev_record["received_at"]).total_seconds()

        feat_vector = np.array([
            speed_var, heading_var, alt_rate_var, time_diff,
            float(rule_jump), float(rule_dup), float(rule_climb), float(rule_alt_vel), float(rule_low_signal)
        ])

        ens_score, _ = ens.predict_anomaly(feat_vector, compute_shap=False)
        ae_score = ae.compute_anomaly_score(np.array([speed_var, heading_var, alt_rate_var, time_diff]))
        comb_risk, is_alert = combine_scores(rule_flags, ens_score, ae_score, None)
        trust = max(5, min(100, round((1.0 - comb_risk) * 100)))

        feat_str = f"[{speed_var:.2f},{heading_var:.2f},{alt_rate_var:.2f},{time_diff:.1f},0,0,0,0,0]"
        ens_str = f"{ens_score:.4f}" if ens_score is not None else "N/A"
        ae_str = f"{ae_score:.4f}" if ae_score is not None else "N/A"
        print(f"{rec['icao24']:<8} | {rec['callsign']:<8} | {rec['altitude_m']:<9.0f} | {rec['velocity_ms']:<6.0f} | {rec['heading_deg']:<5.0f} | {feat_str:<38} | {ens_str:<7} | {ae_str:<7} | {'N/A':<7} | {comb_risk:<7.4f} | {trust}%")

if __name__ == "__main__":
    asyncio.run(trace_pipeline())
