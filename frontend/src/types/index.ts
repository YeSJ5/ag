export interface TrailPosition {
  lat: number;
  lng: number;
}

export interface RuleFlags {
  positionJump?: boolean;
  duplicateIcao?: boolean;
  climbRate?: boolean;
  altVelMismatch?: boolean;
  lowSignalConfidence?: boolean;
  [key: string]: boolean | undefined;
}

export interface ShapValue {
  name: string;
  value: number;
}

export interface ShapFeatureValue {
  feature?: string;
  name?: string;
  value: number;
}

export interface AircraftApiState {
  icao24: string;
  callsign?: string | null;
  squawk?: string | null;
  latitude: number;
  longitude: number;
  altitude_m: number;
  velocity_ms: number;
  heading_deg: number;
  vertical_rate_ms: number;
  on_ground: boolean;
  received_at: string;
  source: string;
  reported_nic?: number | null;
  data_quality?: Flight['data_quality'];
  is_synthetic?: boolean;
  last_seen_seconds_ago?: number;
  staleness_status?: string;
  trust_score?: number | null;
  combined_risk_score?: number | null;
  evidence_confidence?: number | null;
  assessment_status?: string | null;
  route?: string;
}

export interface AlertApiResponse {
  id: number;
  icao24: string;
  callsign?: string | null;
  detected_at: string;
  reason_text: string;
  combined_risk_score: number;
  acknowledged?: boolean;
  is_synthetic?: boolean;
}

export interface AircraftDetailResponse {
  icao24: string;
  callsign?: string | null;
  live_state: AircraftApiState & { id: number };
  route: {
    icao24: string;
    session_id?: string;
    callsign?: string | null;
    est_departure_airport?: string | null;
    est_arrival_airport?: string | null;
    first_seen?: string | null;
    last_seen?: string | null;
    route_text: string;
    fetched_at?: string | null;
    dep_lat?: number | null;
    dep_lng?: number | null;
    arr_lat?: number | null;
    arr_lng?: number | null;
  };
  identity?: {
    registration?: string | null;
    typecode?: string | null;
    model?: string | null;
    operator?: string | null;
    country?: string | null;
    source: string;
  };
  trust_status?: {
    status_text: string;
    is_flagged: boolean;
    combined_risk_score: number | null;
    trust_score?: number | null;
    evidence_confidence?: number | null;
    assessment_status?: string | null;
    smoothed_risk_score: number | null;
    explanation: string;
    reasons: string[];
    rule_flags: Record<string, boolean>;
    technical_details: {
      rule_risk?: number | null;
      ensemble_score?: number | null;
      autoencoder_score?: number | null;
      receiver_consistency_score?: number | null;
      evidence_confidence?: number | null;
      assessment_status?: string | null;
      shap?: { top_features?: ShapFeatureValue[] };
      [key: string]: unknown;
    };
    unavailable_reasons?: string[];
    trilateration_stations: number | null;
    last_evaluated_at?: string | null;
  };
  staleness?: {
    status: string;
    is_stale: boolean;
    last_seen_seconds_ago: number;
    last_received_at: string;
    staleness_threshold_seconds: number;
    removal_threshold_seconds: number;
  };
  first_seen_session?: string | null;
}

export interface Flight {
  id: string; // ICAO24
  received_at?: string;
  callsign: string;
  squawk?: string | null;
  altitude: number; // ft or meters
  speed: number; // knots or m/s
  heading: number; // degrees
  verticalRate?: number; // m/s
  trustScore: number; // 0-100
  trust_score?: number | null;
  signalStrength?: number; // dBm
  status: 'normal' | 'suspicious' | 'critical' | 'unassessed';
  lat: number;
  lng: number;
  is_synthetic?: boolean;
  source?: string;
  history?: TrailPosition[];
  trilateration?: string;
  route?: string;
  estDepartureAirport?: string | null;
  estArrivalAirport?: string | null;
  firstSeen?: string | null;
  ruleFlags?: RuleFlags;
  shapValues?: ShapValue[];
  last_seen_seconds_ago?: number;
  staleness_status?: string;
  registration?: string | null;
  aircraftType?: string | null;
  operator?: string | null;
  country?: string | null;
  combined_risk_score?: number | null;
  evidence_confidence?: number | null;
  assessment_status?: string | null;
  unavailable_reasons?: string[];
  data_quality?: { observed_fields?: string[]; missing_fields?: string[] };
}


export interface AlertLog {
  id: string;
  timestamp: string;
  detected_at?: string;
  callsign: string;
  icao24: string;
  flightId?: string;
  airline?: string;
  operator?: string;
  type: string;
  severity: 'low' | 'medium' | 'high';
  scoreImpact: number;
  acknowledged: boolean;
  status?: 'NEW' | 'ACKNOWLEDGED' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';
  is_synthetic?: boolean;
  reason?: string;
  reason_text?: string;
  riskScore?: number;
  combined_risk_score?: number | null;
}


export interface HealthStats {
  database_status?: 'CONNECTED' | 'DISCONNECTED' | 'UNKNOWN';
  redis_status?: 'CONNECTED' | 'DISCONNECTED' | 'UNKNOWN';
  poll_latency_ms: number | null;
  queue_depth: number | null;
  circuit_breaker_state: string;
  last_successful_poll: string | null;
  last_poll_records?: number;
  last_normalized_records?: number;
  last_poll_http_status?: number | null;
  rate_limit_remaining?: string | null;
  total_real_states?: number;
  total_synthetic_states?: number;
  upstream_status?: 'LIVE' | 'RATE_LIMITED' | 'UNAVAILABLE' | 'UNKNOWN' | 'STALE';
  feed_mode?: 'LIVE' | 'UNAVAILABLE' | 'UNKNOWN';
  max_allowed_poll_gap_seconds?: number;
  feed_source?: string;
  fallback_reason?: string | null;
  upstream_message?: string;
  live_continuity_status?: string;
  continuity_gap_detected?: boolean;
  continuity_message?: string;
    source_status?: string;
    source_name?: string;
    last_successful_update?: string | null;
    next_attempt_at?: string | null;
    retry_after?: string | null;
    snapshot_age_seconds?: number | null;
    snapshot_count?: number | null;
    consecutive_failures?: number;
    last_error?: string | null;
    refresh_in_progress?: boolean;
    manual_refresh_pending?: boolean;
    refresh_interval_seconds?: number;
}

export interface ModelRunStats {
  id: number;
  run_at: string;
  model_version: string;
  true_positives: number;
  false_positives: number;
  true_negatives: number;
  false_negatives: number;
  precision: number;
  recall: number;
  f1: number;
  notes: string;
}

export interface AblationMetric {
  name: string;
  configKey: string;
  f1: number;
  fpr: number;
  precision: number;
  recall: number;
  desc: string;
}

export interface User {
  id: number;
  email: string;
  role: 'admin' | 'analyst' | 'viewer';
  created_at?: string;
}

export interface AuditLog {
  id: number;
  user_id: number | null;
  action: string;
  target_type: string;
  target_id: string | null;
  timestamp: string;
  ip_address: string | null;
}

export interface IngestionPayload {
  icao24: string;
  latitude: number;
  longitude: number;
  altitude_m: number;
  velocity_ms: number;
  heading_deg: number;
  vertical_rate_ms?: number;
  callsign?: string;
  is_synthetic?: boolean;
  source?: string;
  route?: string;
  combined_risk_score?: number | null;
  assessment_status?: string | null;
  trust_score?: number | null;
  evidence_confidence?: number | null;
  is_alert_triggered?: boolean;
  squawk?: string | null;
  received_at?: string;
  last_seen_seconds_ago?: number;
  staleness_status?: 'LIVE' | 'STALE';
  data_quality?: { observed_fields?: string[]; missing_fields?: string[]; timestamp_source?: string };
}

export interface TrustHistoryPoint {
  timestamp: string;
  risk_score: number;
  smoothed_risk_score: number;
  is_alert: boolean;
  reported_nic?: number | null;
}

export interface AircraftTrustHistory {
  icao24: string;
  current_risk_score: number | null;
  window_size: number;
  pattern: 'STABLE' | 'RISK_RISING' | 'RISK_SPIKE' | 'UNASSESSED';
  caption: string;
  history: TrustHistoryPoint[];
}

export interface RuleConfigState {
  max_implied_speed_kmh: number;
  duplicate_icao_dist_km: number;
  max_vertical_rate_ms: number;
  max_ground_altitude_m: number;
  max_ground_speed_ms: number;
  min_flight_speed_ms: number;
  min_reliable_nic?: number;
  min_confidence_jump_km?: number;
}

export interface WatchlistItem {
  id: number;
  user_id: number;
  icao24: string;
  callsign?: string | null;
  priority: 'ROUTINE' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
  notes?: string | null;
  created_at: string;
  current_trust_score?: number | null;
  current_risk_score?: number | null;
  staleness_status: 'LIVE' | 'STALE' | 'LOST';
  last_event?: string | null;
}

export interface AnalystNote {
  id: number;
  target_type: 'aircraft' | 'alert' | 'event' | 'case';
  target_id: string;
  author_id: number;
  author_email: string;
  content: string;
  created_at: string;
}

export interface AlertTransition {
  id: number;
  alert_id: number;
  user_id: number;
  user_email: string;
  previous_status: string;
  new_status: string;
  notes?: string | null;
  created_at: string;
}

export interface KinematicDeltaItem {
  field: string;
  current_value: string;
  previous_value: string;
  delta: string;
  unit: string;
  is_abnormal: boolean;
}

export interface AircraftDelta {
  icao24: string;
  callsign?: string | null;
  current_time: string;
  baseline_time?: string | null;
  time_delta_seconds: number;
  deltas: KinematicDeltaItem[];
  risk_delta?: number | null;
  trust_delta?: number | null;
  has_significant_changes: boolean;
  summary: string;
}

export interface NarrativeEventItem {
  timestamp: string;
  category: 'TELEMETRY' | 'TRUST' | 'ALERT' | 'NOTE' | 'SYSTEM';
  title: string;
  description: string;
  severity: 'INFO' | 'WARN' | 'CRITICAL';
  data?: Record<string, unknown>;
}

export interface AircraftNarrative {
  icao24: string;
  callsign?: string | null;
  first_observed: string;
  last_observed: string;
  total_events: number;
  events: NarrativeEventItem[];
  current_assessment_summary: string;
}

export interface CorrelatedAircraftItem {
  icao24: string;
  callsign?: string | null;
  distance_km: number;
  altitude_m: number;
  velocity_ms: number;
  trust_score?: number | null;
  combined_risk_score?: number | null;
  is_anomaly: boolean;
  anomaly_reasons: string[];
}

export interface AirspaceCorrelation {
  target_icao24: string;
  radius_km: number;
  time_window_minutes: number;
  nearby_aircraft_count: number;
  anomalous_nearby_count: number;
  is_correlated_event: boolean;
  correlation_classification: 'ISOLATED_NOMINAL' | 'AIRCRAFT_SPECIFIC' | 'CORRELATED_TELEMETRY_ANOMALY' | 'AIRSPACE_WIDE_ANOMALY_PATTERN';
  summary: string;
  nearby_aircraft: CorrelatedAircraftItem[];
}

export interface AirspaceRiskCell {
  lat_min: number;
  lat_max: number;
  lng_min: number;
  lng_max: number;
  aircraft_count: number;
  anomaly_count: number;
  average_risk: number;
  risk_density: number;
}

export interface AirspaceRiskGrid {
  window_minutes: number;
  total_active_aircraft: number;
  total_anomalies: number;
  max_risk_density: number;
  cells: AirspaceRiskCell[];
}

export interface AircraftComparison {
  aircraft_a: AircraftDetailResponse;
  aircraft_b: AircraftDetailResponse;
  spatial_separation_km: number;
  altitude_difference_m: number;
  speed_difference_ms: number;
  trust_difference?: number | null;
  risk_difference?: number | null;
  comparison_findings: string[];
}

export interface SourceHealthDetail {
  source_name: string;
  connection_status: string;
  last_successful_update?: string | null;
  snapshot_age_seconds?: number | null;
  next_attempt_at?: string | null;
  retry_after?: number | null;
  request_status: string;
  rate_limit_remaining: string;
  records_received: number;
  records_normalized: number;
  records_rejected: number;
  current_freshness: 'LIVE' | 'REFRESHING' | 'RECENT' | 'STALE' | 'OFFLINE';
  refresh_in_progress: boolean;
  manual_refresh_pending: boolean;
  provider_type: string;
  provenance_notice: string;
}

export interface DataQualityMetrics {
  total_received_vectors: number;
  total_normalized_vectors: number;
  total_rejected_vectors: number;
  missing_altitude_count: number;
  missing_velocity_count: number;
  missing_heading_count: number;
  duplicate_icao_instances: number;
  stale_observations_count: number;
  average_ingestion_latency_ms: number;
  data_quality_score: number;
}

export interface ModelLayerInfo {
  name: string;
  version: string;
  tier: number;
  type: string;
  metrics: Record<string, unknown>;
  description: string;
}

export interface ModelMetadata {
  models: ModelLayerInfo[];
  active_detector_version: string;
  features: string[];
}

export interface AblationConfiguration {
  configuration: string;
  precision: number;
  recall: number;
  f1: number;
  false_positive_rate: number;
  latency_p95_ms: number;
  notes: string;
}

export interface AblationStudy {
  configurations: AblationConfiguration[];
  dataset_description: string;
  methodology_notes: string;
}

export interface PipelineLatency {
  source_to_redis_ms: number;
  redis_to_worker_ms: number;
  worker_processing_ms: number;
  db_persistence_ms: number;
  websocket_delivery_ms: number;
  total_pipeline_ms: number;
  p50_latency_ms: number;
  p95_latency_ms: number;
  p99_latency_ms: number;
}

