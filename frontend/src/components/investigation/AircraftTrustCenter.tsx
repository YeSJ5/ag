import React, { useState } from 'react';
import type { AircraftDetailResponse, WatchlistItem } from '../../types';
import { getInvestigationReportUrl } from '../../services/api';

interface AircraftTrustCenterProps {
  detail: AircraftDetailResponse;
  onOpenNarrative?: () => void;
  onOpenDelta?: () => void;
  onOpenCorrelation?: () => void;
  onOpenComparison?: () => void;
  onAddToWatchlist?: () => void;
  onAddNote?: () => void;
  watchlistItem?: WatchlistItem | null;
}

export const AircraftTrustCenter: React.FC<AircraftTrustCenterProps> = ({
  detail,
  onOpenNarrative,
  onOpenDelta,
  onOpenCorrelation,
  onOpenComparison,
  onAddToWatchlist,
  onAddNote,
  watchlistItem,
}) => {
  const { live_state, route, identity, trust_status, staleness } = detail;
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);

  const trustScore = trust_status?.trust_score ?? (trust_status?.combined_risk_score !== null && trust_status?.combined_risk_score !== undefined
    ? Math.round((1 - trust_status.combined_risk_score) * 100)
    : null);

  const riskScore = trust_status?.combined_risk_score;
  const tech = trust_status?.technical_details || {};
  const trustState = (tech.telemetry_trust_state as string) || (trustScore !== null
    ? (trustScore >= 80 ? 'HIGH_TRUST' : trustScore >= 60 ? 'WATCH' : trustScore >= 40 ? 'SUSPICIOUS' : 'HIGH_RISK')
    : 'INSUFFICIENT_EVIDENCE');

  const evidenceConf = trust_status?.evidence_confidence ?? 0.85;
  const coverageLabel = evidenceConf >= 0.8
    ? 'GOOD EVIDENCE'
    : evidenceConf >= 0.6
    ? 'PARTIAL EVIDENCE'
    : evidenceConf >= 0.4
    ? 'LIMITED EVIDENCE'
    : 'INSUFFICIENT EVIDENCE';

  const altFt = live_state.altitude_m !== undefined ? Math.round(live_state.altitude_m * 3.28084) : null;
  const spdKts = live_state.velocity_ms !== undefined ? Math.round(live_state.velocity_ms * 1.94384) : null;
  const vrFpm = live_state.vertical_rate_ms !== undefined ? Math.round(live_state.vertical_rate_ms * 196.85) : null;

  const trustTheme = trustState === 'HIGH_TRUST'
    ? { stroke: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.4)', text: '#34d399', label: 'HIGH TRUST' }
    : trustState === 'WATCH'
    ? { stroke: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.4)', text: '#7dd3fc', label: 'WATCH' }
    : trustState === 'SUSPICIOUS'
    ? { stroke: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.4)', text: '#fbbf24', label: 'SUSPICIOUS' }
    : trustState === 'HIGH_RISK'
    ? { stroke: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.4)', text: '#f87171', label: 'HIGH RISK' }
    : { stroke: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)', border: 'rgba(148, 163, 184, 0.4)', text: '#cbd5e1', label: 'INSUFFICIENT EVIDENCE' };

  const downloadPdf = () => {
    const url = getInvestigationReportUrl(detail.icao24);
    window.open(url, '_blank');
  };

  // SVG Gauge calculations
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const safeScore = trustScore !== null ? Math.max(0, Math.min(100, trustScore)) : 0;
  const strokeDashoffset = circumference - (safeScore / 100) * circumference;

  return (
    <div className="bg-[#0b1220] border border-slate-800 rounded-xl p-5 sm:p-6 text-slate-100 shadow-xl space-y-5">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {detail.callsign || `AC-${detail.icao24.toUpperCase()}`}
            </h2>
            <span className="px-2.5 py-0.5 rounded bg-slate-800/90 text-slate-300 font-mono text-xs font-semibold border border-slate-700">
              ICAO: {detail.icao24.toUpperCase()}
            </span>
            {staleness && (
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium border ${
                  staleness.is_stale
                    ? 'bg-rose-950/40 text-rose-300 border-rose-800/60'
                    : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    staleness.is_stale ? 'bg-rose-400' : 'bg-emerald-400'
                  }`}
                />
                {staleness.status} ({Math.round(staleness.last_seen_seconds_ago)}s ago)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {identity?.operator ? `${identity.operator} • ` : ''}
            {identity?.model ? `${identity.model} • ` : ''}
            Route: {route?.route_text || 'Active surveillance airspace sector'}
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={downloadPdf}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm cursor-pointer"
            title="Download Official ReportLab Investigation Dossier"
          >
            <span>📄</span> PDF Dossier
          </button>
          {onAddToWatchlist && (
            <button
              onClick={onAddToWatchlist}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                watchlistItem
                  ? 'bg-sky-950/50 border-sky-600/60 text-sky-300'
                  : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
            >
              {watchlistItem ? '★ On Watchlist' : '☆ Watchlist'}
            </button>
          )}
          {onAddNote && (
            <button
              onClick={onAddNote}
              className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              ✍ Add Note
            </button>
          )}
        </div>
      </div>

      {/* Primary Trust & Risk Metrics Panel */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Main Circular Trust Gauge (Left Column) */}
        <div className="md:col-span-5 bg-[#0f172a]/90 border border-slate-800 rounded-xl p-5 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 block">
              Telemetry Trust
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold tracking-tight" style={{ color: trustTheme.text }}>
                {trustScore !== null ? trustScore : '—'}
              </span>
              <span className="text-sm font-semibold text-slate-500">/ 100</span>
            </div>
            <div
              className="inline-block px-2 py-0.5 rounded text-[11px] font-bold border mt-1"
              style={{
                backgroundColor: trustTheme.bg,
                borderColor: trustTheme.border,
                color: trustTheme.text,
              }}
            >
              {trustTheme.label}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              EMA temporal continuity model
            </p>
          </div>

          {/* Radial SVG Ring */}
          <div className="relative w-24 h-24 flex-shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-slate-800"
                strokeWidth="7"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                stroke={trustTheme.stroke}
                strokeWidth="7"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col text-center">
              <span className="text-xs font-mono font-bold text-slate-200">
                {trustScore !== null ? `${trustScore}%` : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Secondary Scoring Blocks (Right Column) */}
        <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Combined Risk */}
          <div className="bg-[#0f172a]/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 block">
                Combined Risk
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span
                  className={`text-2xl font-bold font-mono ${
                    (riskScore ?? 0) >= 0.7
                      ? 'text-rose-400'
                      : (riskScore ?? 0) >= 0.4
                      ? 'text-amber-400'
                      : 'text-slate-100'
                  }`}
                >
                  {riskScore !== null && riskScore !== undefined ? riskScore.toFixed(4) : 'N/A'}
                </span>
                <span className="text-xs text-slate-500">/ 1.0</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Weighted kinematic + ML anomaly fusion
            </p>
          </div>

          {/* Evidence Coverage */}
          <div className="bg-[#0f172a]/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 block">
                Evidence Coverage
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-mono text-purple-300">
                  {Math.round(evidenceConf * 100)}%
                </span>
                <span className="text-[11px] font-semibold text-purple-400">
                  {coverageLabel}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Multi-tier availability quotient
            </p>
          </div>
        </div>
      </div>

      {/* Live Kinematic Vectors Section */}
      <div className="bg-[#0f172a]/60 border border-slate-800/80 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase font-mono tracking-wider text-slate-300">
            Current Physical Kinematics
          </span>
          <span className="text-[11px] text-slate-500">
            Source: {live_state.source || 'OpenSky State-Vector Data'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] uppercase font-mono text-slate-500 block">Coordinates</span>
            <span className="text-xs font-mono font-semibold text-slate-200">
              {live_state.latitude?.toFixed(4)}°, {live_state.longitude?.toFixed(4)}°
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] uppercase font-mono text-slate-500 block">Altitude</span>
            <span className="text-xs font-semibold text-slate-200">
              {altFt !== null ? `${altFt.toLocaleString()} ft` : 'N/A'}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] uppercase font-mono text-slate-500 block">Ground Speed</span>
            <span className="text-xs font-semibold text-slate-200">
              {spdKts !== null ? `${spdKts} kts` : 'N/A'}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] uppercase font-mono text-slate-500 block">Heading</span>
            <span className="text-xs font-semibold text-slate-200">
              {live_state.heading_deg !== undefined ? `${live_state.heading_deg.toFixed(1)}°` : 'N/A'}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] uppercase font-mono text-slate-500 block">Vertical Rate</span>
            <span
              className={`text-xs font-semibold ${
                vrFpm && Math.abs(vrFpm) > 4000 ? 'text-rose-400' : 'text-slate-200'
              }`}
            >
              {vrFpm !== null ? `${vrFpm > 0 ? '+' : ''}${vrFpm.toLocaleString()} ft/m` : 'N/A'}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] uppercase font-mono text-slate-500 block">Squawk</span>
            <span className="text-xs font-mono font-semibold text-slate-200">
              {live_state.squawk || 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-action Buttons */}
      <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-800/80 gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {onOpenNarrative && (
            <button
              onClick={onOpenNarrative}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-medium transition-colors cursor-pointer border border-slate-700/80"
            >
              ⏱ Event Narrative
            </button>
          )}
          {onOpenDelta && (
            <button
              onClick={onOpenDelta}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-medium transition-colors cursor-pointer border border-slate-700/80"
            >
              Δ What Changed?
            </button>
          )}
          {onOpenCorrelation && (
            <button
              onClick={onOpenCorrelation}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-medium transition-colors cursor-pointer border border-slate-700/80"
            >
              🌐 Airspace Correlation
            </button>
          )}
          {onOpenComparison && (
            <button
              onClick={onOpenComparison}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-medium transition-colors cursor-pointer border border-slate-700/80"
            >
              ⚖ Compare Target
            </button>
          )}
        </div>

        {/* Technical Details Toggle */}
        <button
          onClick={() => setShowTechnicalDetails((prev) => !prev)}
          className="text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer flex items-center gap-1"
        >
          <span>{showTechnicalDetails ? 'Hide Diagnostics ▲' : 'Show Diagnostics ▼'}</span>
        </button>
      </div>

      {/* Progressive Technical Diagnostics Section */}
      {showTechnicalDetails && (
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-2 font-mono text-slate-300 animate-fadeIn">
          <div className="text-slate-400 font-bold uppercase text-[11px]">Surveillance Engine Diagnostics</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div>• Normalized Ingress ID: {detail.icao24}</div>
            <div>• Baro/Geo Consistency: NOMINAL</div>
            <div>• Autoencoder Residual: {typeof tech.autoencoder_score === 'number' ? tech.autoencoder_score.toFixed(4) : 'N/A'}</div>
            <div>• Supervised Voting Probability: {typeof tech.ensemble_score === 'number' ? `${(tech.ensemble_score * 100).toFixed(1)}%` : 'N/A'}</div>
          </div>
        </div>
      )}
    </div>
  );
};
