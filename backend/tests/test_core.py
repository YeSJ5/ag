from datetime import datetime, timedelta, timezone

import pytest

from app.detection.rules import (
    RuleConfig,
    check_impossible_climb_rate,
    check_position_jump,
)
from app.detection.service import DetectionService
from app.ingestion.service import OpenSkyIngestionService


# ---------------------------------------------------------------------------
# TC1: Functional - Valid ADS-B message is parsed and normalized correctly
# ---------------------------------------------------------------------------
class TestTC1ValidMessageParsing:
    """TC1: Functional verification of valid ADS-B state vector parsing and trust scoring."""

    def test_tc1_valid_adsb_state_vector_parsed_correctly(self):
        """Verify standard OpenSky 18-element state vector is accurately parsed and normalized."""
        service = OpenSkyIngestionService(db_session_maker=None)

        # Standard OpenSky state vector format
        valid_vector = [
            "4b1805",  # 0: icao24
            "SWR1886 ",  # 1: callsign (with trailing whitespace)
            "Switzerland",  # 2: origin_country
            1710000000,  # 3: time_position
            1710000005,  # 4: last_contact
            8.5555,  # 5: longitude
            47.4582,  # 6: latitude
            3200.0,  # 7: baro_altitude (m)
            False,  # 8: on_ground
            185.0,  # 9: velocity (m/s)
            240.0,  # 10: true_track (deg)
            -2.5,  # 11: vertical_rate (m/s)
            None,  # 12: sensors
            3250.0,  # 13: geo_altitude (m)
            "7000",  # 14: squawk
            False,  # 15: spi
            0,  # 16: position_source (0 = ADS-B)
            0,  # 17: category
        ]

        normalized = service.normalize_state(valid_vector)
        assert (
            normalized is not None
        ), "Valid vector should parse into normalized dictionary"
        assert normalized["icao24"] == "4b1805"
        assert normalized["callsign"] == "SWR1886"
        assert normalized["latitude"] == pytest.approx(47.4582)
        assert normalized["longitude"] == pytest.approx(8.5555)
        assert normalized["altitude_m"] == pytest.approx(3200.0)
        assert normalized["velocity_ms"] == pytest.approx(185.0)
        assert normalized["heading_deg"] == pytest.approx(240.0)
        assert normalized["vertical_rate_ms"] == pytest.approx(-2.5)
        assert normalized["on_ground"] is False
        assert "data_quality" in normalized

    def test_tc1_valid_dict_payload_normalization(self):
        """Verify dictionary-style ADS-B payload conforms to internal schema."""
        service = OpenSkyIngestionService(db_session_maker=None)
        valid_dict = {
            "icao24": "a1234b",
            "callsign": "UAL450",
            "origin_country": "United States",
            "time_position": 1710000000,
            "longitude": -122.375,
            "latitude": 37.618,
            "baro_altitude": 10500.0,
            "on_ground": False,
            "velocity": 230.0,
            "true_track": 180.0,
            "vertical_rate": 0.0,
            "position_source": 0,
        }
        normalized = service.normalize_state(valid_dict)
        assert normalized is not None
        assert normalized["icao24"] == "a1234b"
        assert normalized["callsign"] == "UAL450"
        assert normalized["latitude"] == 37.618
        assert normalized["longitude"] == -122.375

    def test_tc1_valid_kinematics_trust_score(self):
        """Verify physically plausible flight kinematics produce high trust (> 80.0) without alert."""
        detection_service = DetectionService(
            db_session_maker=None,
            ensemble_model=None,
            autoencoder_model=None,
        )
        now = datetime.now(timezone.utc)
        record = {
            "icao24": "4b1805",
            "callsign": "SWR1886",
            "latitude": 47.4582,
            "longitude": 8.5555,
            "altitude_m": 3200.0,
            "velocity_ms": 185.0,
            "heading_deg": 240.0,
            "vertical_rate_ms": -2.5,
            "on_ground": False,
            "received_at": now.isoformat(),
            "data_quality": {
                "observed_fields": [
                    "altitude",
                    "velocity",
                    "vertical_rate",
                    "on_ground",
                ]
            },
        }
        eval_result = detection_service.evaluate_record_instant(record)
        assert eval_result is not None
        assert eval_result.get("alert_triggered") is False
        assert eval_result.get("trust_score") >= 80.0


# ---------------------------------------------------------------------------
# TC2: Functional - Spoofed message gets low trust score and raises alert
# ---------------------------------------------------------------------------
class TestTC2SpoofedMessageDetection:
    """TC2: Verification that anomalous/spoofed kinematics trigger alerts and low trust scores."""

    def test_tc2_impossible_position_jump_teleportation(self):
        """Verify position jump teleportation (e.g. SFO to LAX in 60s) triggers rule alert."""
        config = RuleConfig(max_implied_speed_kmh=1200.0)
        now = datetime.now(timezone.utc)
        one_minute_ago = now - timedelta(seconds=60)

        # SFO to LAX: ~560 km in 60s -> implied speed ~33,600 km/h
        flagged, reason, evidence = check_position_jump(
            current_lat=34.0522,
            current_lon=-118.2437,
            current_time=now,
            prev_lat=37.7749,
            prev_lon=-122.4194,
            prev_time=one_minute_ago,
            config=config,
        )
        assert flagged is True, "Position teleportation must trigger anomaly flag"
        assert "Implied speed" in reason
        assert evidence["implied_speed_kmh"] > 30000.0

    def test_tc2_impossible_vertical_climb_rate(self):
        """Verify impossible vertical climb rate (> 60 m/s / ~12,000 fpm) triggers climb rule."""
        config = RuleConfig(max_climb_rate_ms=50.0)
        # Rocket climb: 180 m/s (~35,000 fpm)
        flagged, reason, evidence = check_impossible_climb_rate(
            vertical_rate_ms=180.0,
            config=config,
        )
        assert flagged is True
        assert "Vertical rate" in reason
        assert evidence["vertical_rate_ms"] == 180.0

    def test_tc2_spoofed_telemetry_evaluation_drops_trust_and_alerts(self):
        """Verify end-to-end evaluation of spoofed state lowers trust score and raises alert."""
        detection_service = DetectionService(
            db_session_maker=None,
            ensemble_model=None,
            autoencoder_model=None,
        )
        t0 = datetime.now(timezone.utc) - timedelta(seconds=30)
        t1 = datetime.now(timezone.utc)

        # First position: New York JFK (40.6413, -73.7781)
        rec1 = {
            "icao24": "sp00f1",
            "callsign": "GHOST1",
            "latitude": 40.6413,
            "longitude": -73.7781,
            "altitude_m": 8000.0,
            "velocity_ms": 220.0,
            "on_ground": False,
            "received_at": t0.isoformat(),
            "data_quality": {"observed_fields": ["altitude", "velocity", "on_ground"]},
        }
        res1 = detection_service.evaluate_record_instant(rec1)
        assert res1["alert_triggered"] is False

        # Second position 30s later: London Heathrow (51.4700, -0.4543) ~5500 km away!
        rec2 = {
            "icao24": "sp00f1",
            "callsign": "GHOST1",
            "latitude": 51.4700,
            "longitude": -0.4543,
            "altitude_m": 8000.0,
            "velocity_ms": 220.0,
            "on_ground": False,
            "received_at": t1.isoformat(),
            "data_quality": {"observed_fields": ["altitude", "velocity", "on_ground"]},
        }
        res2 = detection_service.evaluate_record_instant(rec2)
        assert (
            res2["alert_triggered"] is True
        ), "Trans-Atlantic teleportation must trigger alert"
        assert "rule_position_jump" in res2["rules_triggered"]
        assert (
            res2["trust_score"] <= 40.0
        ), f"Trust score must drop to low level, got {res2['trust_score']}"
        assert res2["combined_risk_score"] >= 0.6


# ---------------------------------------------------------------------------
# TC3: Reliability - Malformed or incomplete messages don't crash the system
# ---------------------------------------------------------------------------
class TestTC3MalformedAndIncompleteResilience:
    """TC3: Robustness and fault tolerance under malformed inputs, missing keys, and illegal types."""

    @pytest.fixture
    def ingestion_service(self):
        return OpenSkyIngestionService(db_session_maker=None)

    @pytest.fixture
    def detection_service(self):
        return DetectionService(
            db_session_maker=None,
            ensemble_model=None,
            autoencoder_model=None,
        )

    def test_tc3_empty_dicts_and_lists_do_not_crash(
        self, ingestion_service, detection_service
    ):
        """Verify empty dictionaries and lists return None/empty safely without exceptions."""
        assert ingestion_service.normalize_state({}) is None
        assert ingestion_service.normalize_state([]) is None
        assert detection_service.evaluate_record_instant({}) == {}

    def test_tc3_none_payload_handling_vulnerability(self, ingestion_service):
        """BUG-01 Identification: Verify whether passing None payload is safely handled or crashes."""
        try:
            res = ingestion_service.normalize_state(None)
            assert res is None
        except TypeError as exc:
            # Document and assert the exact bug found: len() called on NoneType in raw(index)
            pytest.fail(
                f"BUG-01 CONFIRMED: normalize_state(None) raised unhandled TypeError: {exc}"
            )

    def test_tc3_none_and_missing_fields_gracefully_handled(self, ingestion_service):
        """Verify vector with None coordinates is dropped gracefully without crash."""
        incomplete_vector = [
            "4b1805",
            None,
            "Switzerland",
            1710000000,
            1710000005,
            None,  # lon is None
            None,  # lat is None
            None,  # alt is None
            False,
            None,
            None,
            None,
            None,
            None,
            None,
            False,
            0,
            0,
        ]
        result = ingestion_service.normalize_state(incomplete_vector)
        assert (
            result is None
        ), "Incomplete message missing coordinates should safely return None"

    def test_tc3_invalid_data_types_resilience(self, ingestion_service):
        """Verify illegal types (strings in numeric fields, bools in coordinates) don't crash."""
        corrupted_vector = [
            "4b1805",
            12345,  # callsign integer instead of string
            "Country",
            "not_a_time",  # epoch string
            1710000005,
            "invalid_lon",  # string instead of float
            47.4582,
            "corrupted_alt",
            "not_bool",
            "not_velocity",
            None,
            None,
            None,
            None,
            None,
            False,
            0,
            0,
        ]
        result = ingestion_service.normalize_state(corrupted_vector)
        assert (
            result is None
        ), "Corrupted numeric fields must fail validation gracefully"

    def test_tc3_illegal_icao_formatting(self, ingestion_service):
        """Verify non-hex or oversized ICAO24 identifiers are rejected gracefully."""
        bad_icaos = ["", "xyz123", "4B1805Z", "   ", "!!@@##", "12345"]
        for bad_icao in bad_icaos:
            vector = [
                bad_icao,
                "TEST",
                "US",
                100,
                100,
                10.0,
                20.0,
                1000.0,
                False,
                100.0,
                0.0,
                0.0,
                None,
                1000.0,
                "1200",
                False,
                0,
                0,
            ]
            assert ingestion_service.normalize_state(vector) is None

    def test_tc3_nan_and_infinite_values(self, ingestion_service, detection_service):
        """Verify float('nan') and float('inf') are sanitized and do not propagate arithmetic errors."""
        nan_vector = [
            "4b1805",
            "TEST",
            "US",
            100,
            100,
            float("nan"),
            float("inf"),
            float("nan"),
            False,
            float("inf"),
            0.0,
            0.0,
            None,
            1000.0,
            "1200",
            False,
            0,
            0,
        ]
        assert ingestion_service.normalize_state(nan_vector) is None

        # Dirty record with NaN reaching detection service should not raise unhandled exception
        dirty_record = {
            "icao24": "4b1805",
            "latitude": float("nan"),
            "longitude": float("nan"),
            "altitude_m": float("inf"),
            "velocity_ms": float("nan"),
            "on_ground": False,
            "received_at": "invalid_date_format",
        }
        res = detection_service.evaluate_record_instant(dirty_record)
        assert isinstance(res, dict)
