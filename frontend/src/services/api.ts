import type { AircraftDetailResponse, AlertApiResponse, Flight, AlertLog, HealthStats, ModelRunStats, User, AuditLog, RuleConfigState, AircraftTrustHistory } from '../types';

const VITE_ENV = import.meta.env;
const BACKEND_PORT = VITE_ENV.VITE_BACKEND_PORT || '8001';
const HOSTNAME = typeof window !== 'undefined' && window.location?.hostname
  ? (window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname)
  : '127.0.0.1';
const PAGE_PROTOCOL = typeof window !== 'undefined' ? window.location.protocol : 'http:';
const PAGE_ORIGIN = typeof window !== 'undefined' ? window.location.origin : `http://${HOSTNAME}:${BACKEND_PORT}`;
const API_SCHEME = PAGE_PROTOCOL === 'https:' ? 'https:' : 'http:';
const WS_SCHEME = PAGE_PROTOCOL === 'https:' ? 'wss:' : 'ws:';
const LOCAL_API_ORIGIN = `${API_SCHEME}//${HOSTNAME}:${BACKEND_PORT}`;
const LOCAL_WS_ORIGIN = `${WS_SCHEME}//${HOSTNAME}:${BACKEND_PORT}`;

// Vite development connects to the separate local API port. Built deployments
// use same-origin Nginx routes so HTTPS pages never make insecure API requests.
export const API_BASE = VITE_ENV.VITE_API_URL || (VITE_ENV.DEV ? LOCAL_API_ORIGIN : PAGE_ORIGIN);
export const WS_BASE = VITE_ENV.VITE_WS_URL || (VITE_ENV.DEV
  ? LOCAL_WS_ORIGIN
  : `${WS_SCHEME}//${typeof window !== 'undefined' ? window.location.host : `${HOSTNAME}:${BACKEND_PORT}`}`);

export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('airguard_token');
};

export const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(url, { ...options, headers });
};

// --- API Service Methods ---

export const fetchAircraft = async (limit?: number): Promise<Flight[]> => {
  const url = limit ? `${API_BASE}/api/v1/aircraft?limit=${limit}` : `${API_BASE}/api/v1/aircraft`;
  const res = await fetchWithAuth(url);
  if (!res.ok) throw new Error(`Failed to fetch aircraft: ${res.statusText}`);
  return res.json();
};

export const fetchAircraftDetail = async (icao24: string): Promise<AircraftDetailResponse> => {
  const res = await fetchWithAuth(`${API_BASE}/api/v1/aircraft/${icao24}/detail`);
  if (!res.ok) throw new Error(`Failed to fetch detail for ${icao24}: ${res.statusText}`);
  return res.json();
};

export const fetchAircraftTrustHistory = async (icao24: string, window = 10): Promise<AircraftTrustHistory> => {
  const res = await fetchWithAuth(`${API_BASE}/api/v1/aircraft/${icao24}/trust-history?window=${window}`);
  if (!res.ok) throw new Error(`Failed to fetch trust history for ${icao24}: ${res.statusText}`);
  return res.json();
};

export const fetchAlerts = async (limit = 100): Promise<AlertLog[]> => {
  const res = await fetchWithAuth(`${API_BASE}/api/v1/alerts?limit=${limit}`);
  if (!res.ok) throw new Error(`Failed to fetch alerts: ${res.statusText}`);
  return res.json();
};

export interface AirspaceEventCandidate {
  candidate_id: string;
  status: 'REVIEW_REQUIRED';
  start_time: string;
  end_time: string;
  center_latitude: number;
  center_longitude: number;
  aircraft_icao24: string[];
  alert_ids: number[];
  anomaly_types: string[];
  linked_alert_pairs: number;
  max_link_distance_km: number;
  time_window_minutes: number;
  radius_km: number;
  evidence: Array<{
    alert_id: number;
    icao24: string;
    callsign: string | null;
    observed_at: string;
    latitude: number;
    longitude: number;
    source: string;
    data_quality: Record<string, unknown>;
    rule_flags: string[];
    risk_score: number;
    reason_text: string;
  }>;
}

export const fetchAirspaceEventCandidates = async (): Promise<AirspaceEventCandidate[]> => {
  const res = await fetchWithAuth(`${API_BASE}/api/v1/airspace/event-candidates`);
  if (!res.ok) throw new Error(`Failed to fetch airspace event candidates: ${res.statusText}`);
  return res.json();
};

export interface AirspaceEventCaseReview {
  id: number;
  reviewer_id: number | null;
  action: string;
  previous_status: string | null;
  new_status: string;
  previous_disposition: string | null;
  new_disposition: string | null;
  notes: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface AirspaceEventCase {
  id: number;
  candidate_id: string;
  title: string;
  status: 'OPEN' | 'IN_REVIEW' | 'CLOSED';
  disposition: 'CORRELATED' | 'NOT_CORRELATED' | 'INSUFFICIENT_EVIDENCE' | null;
  evidence_snapshot: AirspaceEventCandidate & { captured_at: string; correlation_method: string; causal_finding: null };
  created_by: number | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  reviews: AirspaceEventCaseReview[];
}

export const fetchAirspaceEventCases = async (): Promise<AirspaceEventCase[]> => {
  const res = await fetchWithAuth(`${API_BASE}/api/v1/airspace/event-cases?limit=100`);
  if (!res.ok) throw new Error(`Failed to fetch event cases: ${res.statusText}`);
  return res.json();
};

export const createAirspaceEventCase = async (candidate: AirspaceEventCandidate, title: string): Promise<AirspaceEventCase> => {
  const res = await fetchWithAuth(`${API_BASE}/api/v1/airspace/event-cases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      candidate_id: candidate.candidate_id,
      title,
      alert_ids: candidate.alert_ids,
      time_window_minutes: candidate.time_window_minutes,
      radius_km: candidate.radius_km,
    }),
  });
  if (!res.ok) throw new Error(`Failed to open event case: ${res.statusText}`);
  return res.json();
};

export const updateAirspaceEventCase = async (
  id: number,
  change: { status?: 'OPEN' | 'IN_REVIEW' | 'CLOSED'; disposition?: 'CORRELATED' | 'NOT_CORRELATED' | 'INSUFFICIENT_EVIDENCE' | null; notes?: string },
): Promise<AirspaceEventCase> => {
  const res = await fetchWithAuth(`${API_BASE}/api/v1/airspace/event-cases/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(change),
  });
  if (!res.ok) throw new Error(`Failed to update event case: ${res.statusText}`);
  return res.json();
};

export const acknowledgeAlert = async (id: string | number): Promise<AlertApiResponse> => {
  const res = await fetchWithAuth(`${API_BASE}/api/v1/alerts/${id}/acknowledge`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error(`Failed to acknowledge alert ${id}: ${res.statusText}`);
  return res.json();
};

export const fetchSystemHealth = async (strict = false): Promise<HealthStats> => {
  const res = await fetchWithAuth(`${API_BASE}/api/v1/system-health${strict ? '?strict=true' : ''}`);
  if (!res.ok) throw new Error(`System health failed: ${res.statusText}`);
  return res.json();
};

export const fetchConfig = async (): Promise<RuleConfigState> => {
  const res = await fetchWithAuth(`${API_BASE}/api/v1/config`);
  if (!res.ok) throw new Error(`Failed to fetch config: ${res.statusText}`);
  return res.json();
};

export const updateConfig = async (payload: RuleConfigState): Promise<RuleConfigState> => {
  const res = await fetchWithAuth(`${API_BASE}/api/v1/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`Failed to update config: ${res.statusText}`);
  return res.json();
};

export const replaySessionValidation = async (): Promise<ModelRunStats> => {
  const res = await fetchWithAuth(`${API_BASE}/api/v1/model-runs/replay`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error(`Failed to execute replay: ${res.statusText}`);
  return res.json();
};

export const fetchModelRuns = async (limit = 50): Promise<ModelRunStats[]> => {
  const res = await fetchWithAuth(`${API_BASE}/api/v1/model-runs?limit=${limit}`);
  if (!res.ok) throw new Error(`Failed to fetch model runs: ${res.statusText}`);
  return res.json();
};

export const fetchAuditLogs = async (action?: string, limit = 100): Promise<AuditLog[]> => {
  const url = action 
    ? `${API_BASE}/api/v1/admin/audit-logs?action=${action}&limit=${limit}` 
    : `${API_BASE}/api/v1/admin/audit-logs?limit=${limit}`;
  const res = await fetchWithAuth(url);
  if (!res.ok) throw new Error(`Failed to fetch audit logs: ${res.statusText}`);
  return res.json();
};

export const fetchAdminUsers = async (): Promise<User[]> => {
  const res = await fetchWithAuth(`${API_BASE}/api/v1/admin/users`);
  if (!res.ok) throw new Error(`Failed to fetch users: ${res.statusText}`);
  return res.json();
};

export const createAdminUser = async (user: Partial<User> & { password?: string }): Promise<User> => {
  const res = await fetchWithAuth(`${API_BASE}/api/v1/admin/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to create user');
  }
  return res.json();
};

export const deleteAdminUser = async (id: number): Promise<{ status: 'deleted' }> => {
  const res = await fetchWithAuth(`${API_BASE}/api/v1/admin/users/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error(`Failed to delete user: ${res.statusText}`);
  return res.json();
};

// --- Next-Level Intelligence & Investigation Services ---

export const fetchAircraftDelta = async (icao24: string, baselineSeconds = 30): Promise<import('../types').AircraftDelta> => {
  const res = await fetchWithAuth(`${API_BASE}/api/v1/aircraft/${icao24}/delta?baseline_seconds=${baselineSeconds}`);
  if (!res.ok) throw new Error(`Failed to fetch delta for ${icao24}: ${res.statusText}`);
  return res.json();
};

export const fetchAircraftNarrative = async (icao24: string, limit = 50): Promise<import('../types').AircraftNarrative> => {
  const res = await fetchWithAuth(`${API_BASE}/api/v1/aircraft/${icao24}/narrative?limit=${limit}`);
  if (!res.ok) throw new Error(`Failed to fetch narrative for ${icao24}: ${res.statusText}`);
  return res.json();
};

export const fetchAirspaceCorrelation = async (
  icao24: string,
  radiusKm = 150,
  windowMinutes = 30,
): Promise<import('../types').AirspaceCorrelation> => {
  const res = await fetchWithAuth(
    `${API_BASE}/api/v1/airspace/correlation/${icao24}?radius_km=${radiusKm}&window_minutes=${windowMinutes}`,
  );
  if (!res.ok) throw new Error(`Failed to fetch airspace correlation for ${icao24}: ${res.statusText}`);
  return res.json();
};

export const fetchAirspaceRiskGrid = async (
  windowMinutes = 30,
  gridStepDeg = 4.0,
): Promise<import('../types').AirspaceRiskGrid> => {
  const res = await fetchWithAuth(
    `${API_BASE}/api/v1/airspace/risk-grid?window_minutes=${windowMinutes}&grid_step_deg=${gridStepDeg}`,
  );
  if (!res.ok) throw new Error(`Failed to fetch risk grid: ${res.statusText}`);
  return res.json();
};

export const compareAircraft = async (icaoA: string, icaoB: string): Promise<import('../types').AircraftComparison> => {
  const res = await fetchWithAuth(
    `${API_BASE}/api/v1/aircraft/compare?icao_a=${encodeURIComponent(icaoA)}&icao_b=${encodeURIComponent(icaoB)}`,
  );
  if (!res.ok) throw new Error(`Failed to compare aircraft ${icaoA} and ${icaoB}: ${res.statusText}`);
  return res.json();
};

export const updateAlertStatus = async (
  id: number | string,
  status: 'NEW' | 'ACKNOWLEDGED' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED',
  notes?: string,
): Promise<AlertLog> => {
  const res = await fetchWithAuth(`${API_BASE}/api/v1/alerts/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, notes }),
  });
  if (!res.ok) throw new Error(`Failed to update alert ${id} status: ${res.statusText}`);
  return res.json();
};

export const fetchWatchlist = async (): Promise<import('../types').WatchlistItem[]> => {
  const res = await fetchWithAuth(`${API_BASE}/api/v1/watchlist`);
  if (!res.ok) throw new Error(`Failed to fetch watchlist: ${res.statusText}`);
  return res.json();
};

export const addToWatchlist = async (payload: {
  icao24: string;
  callsign?: string;
  priority?: string;
  notes?: string;
}): Promise<import('../types').WatchlistItem> => {
  const res = await fetchWithAuth(`${API_BASE}/api/v1/watchlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to add to watchlist');
  }
  return res.json();
};

export const removeFromWatchlist = async (icao24: string): Promise<{ status: string; icao24: string }> => {
  const res = await fetchWithAuth(`${API_BASE}/api/v1/watchlist/${icao24}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to remove ${icao24} from watchlist: ${res.statusText}`);
  return res.json();
};

export const fetchAnalystNotes = async (
  targetType: 'aircraft' | 'alert' | 'event' | 'case',
  targetId: string,
): Promise<import('../types').AnalystNote[]> => {
  const res = await fetchWithAuth(
    `${API_BASE}/api/v1/notes?target_type=${encodeURIComponent(targetType)}&target_id=${encodeURIComponent(targetId)}`,
  );
  if (!res.ok) throw new Error(`Failed to fetch analyst notes: ${res.statusText}`);
  return res.json();
};

export const createAnalystNote = async (payload: {
  target_type: 'aircraft' | 'alert' | 'event' | 'case';
  target_id: string;
  content: string;
}): Promise<import('../types').AnalystNote> => {
  const res = await fetchWithAuth(`${API_BASE}/api/v1/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to create analyst note: ${res.statusText}`);
  return res.json();
};

export const fetchSourceHealthDetail = async (): Promise<import('../types').SourceHealthDetail> => {
  const res = await fetchWithAuth(`${API_BASE}/api/v1/sources/health`);
  if (!res.ok) throw new Error(`Failed to fetch source health: ${res.statusText}`);
  return res.json();
};

export const fetchDataQualityMetrics = async (): Promise<import('../types').DataQualityMetrics> => {
  const res = await fetchWithAuth(`${API_BASE}/api/v1/data-quality`);
  if (!res.ok) throw new Error(`Failed to fetch data quality metrics: ${res.statusText}`);
  return res.json();
};

export const fetchModelsMetadata = async (): Promise<import('../types').ModelMetadata> => {
  const res = await fetchWithAuth(`${API_BASE}/api/v1/models/metadata`);
  if (!res.ok) throw new Error(`Failed to fetch model metadata: ${res.statusText}`);
  return res.json();
};

export const fetchAblationStudy = async (): Promise<import('../types').AblationStudy> => {
  const res = await fetchWithAuth(`${API_BASE}/api/v1/models/ablation`);
  if (!res.ok) throw new Error(`Failed to fetch ablation study: ${res.statusText}`);
  return res.json();
};

export const fetchPipelineLatency = async (): Promise<import('../types').PipelineLatency> => {
  const res = await fetchWithAuth(`${API_BASE}/api/v1/system/latency`);
  if (!res.ok) throw new Error(`Failed to fetch pipeline latency: ${res.statusText}`);
  return res.json();
};

export const getInvestigationReportUrl = (icao24: string): string => {
  const token = getAuthToken();
  const url = `${API_BASE}/api/v1/reports/investigation/${encodeURIComponent(icao24)}`;
  return token ? `${url}?token=${encodeURIComponent(token)}` : url;
};

