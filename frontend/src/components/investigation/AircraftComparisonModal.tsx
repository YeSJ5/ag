import React, { useEffect, useState } from 'react';
import type { AircraftComparison, Flight } from '../../types';
import { compareAircraft } from '../../services/api';

interface AircraftComparisonModalProps {
  primaryIcao: string;
  availableFlights: Flight[];
  onClose: () => void;
  onSelectSubject?: (icao24: string) => void;
}

export const AircraftComparisonModal: React.FC<AircraftComparisonModalProps> = ({
  primaryIcao,
  availableFlights,
  onClose,
}) => {
  const otherFlights = availableFlights.filter((f) => f.id.toLowerCase() !== primaryIcao.toLowerCase());
  const [selectedSecondaryIcao, setSelectedSecondaryIcao] = useState<string>(
    otherFlights.length > 0 ? otherFlights[0].id : ''
  );
  const [comparison, setComparison] = useState<AircraftComparison | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedSecondaryIcao) return;
    let isMounted = true;
    setLoading(true);
    setError(null);

    compareAircraft(primaryIcao, selectedSecondaryIcao)
      .then((data) => {
        if (isMounted) {
          setComparison(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to compare aircraft');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [primaryIcao, selectedSecondaryIcao]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="bg-[#0b1220] border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 text-slate-100 shadow-2xl space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white uppercase font-mono tracking-tight">
              Cross-Airframe Telemetry Comparison
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Differential kinematic analysis isolating aircraft-specific vs airspace-wide anomalies
            </p>
          </div>

          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            ✕ Close
          </button>
        </div>

        {/* Secondary Target Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3.5 rounded-xl bg-[#0f172a] border border-slate-800">
          <label className="text-xs font-semibold text-slate-300">
            Compare Subject <b className="text-cyan-400 font-mono">{primaryIcao.toUpperCase()}</b> against target:
          </label>
          <select
            value={selectedSecondaryIcao}
            onChange={(e) => setSelectedSecondaryIcao(e.target.value)}
            className="h-9 bg-[#060913] border border-slate-700 rounded-lg px-3 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
          >
            {otherFlights.map((f) => (
              <option key={f.id} value={f.id}>
                {f.callsign || f.id.toUpperCase()} ({f.id}) — Trust {f.trustScore}%
              </option>
            ))}
          </select>
        </div>

        {loading && (
          <div className="p-12 text-center text-xs text-slate-400 font-mono">
            Loading comparative telemetry vectors...
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
            <span>▲</span>
            <span>{error}</span>
          </div>
        )}

        {comparison && !loading && (
          <div className="space-y-5">
            {/* Analytical Findings Box */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-sky-900/40 space-y-2">
              <div className="text-xs font-bold font-mono text-sky-400 uppercase">
                Analytical Differential Findings:
              </div>
              <ul className="space-y-1 text-xs text-slate-300 list-disc pl-5 leading-relaxed font-sans">
                {comparison.comparison_findings.map((f, idx) => (
                  <li key={idx}>{f}</li>
                ))}
              </ul>
            </div>

            {/* Side-by-Side Target Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Aircraft A */}
              <div className="p-4 rounded-xl bg-[#0f172a]/90 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-sm font-bold text-cyan-300 font-sans">
                    {comparison.aircraft_a.callsign || comparison.aircraft_a.icao24.toUpperCase()} (Subject)
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    ICAO: {comparison.aircraft_a.icao24.toUpperCase()}
                  </span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Telemetry Trust:</span>
                    <b className="text-emerald-400">{comparison.aircraft_a.trust_status?.trust_score ?? 'N/A'}%</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Combined Risk:</span>
                    <b className="text-slate-200">{comparison.aircraft_a.trust_status?.combined_risk_score?.toFixed(4) ?? 'N/A'}</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Altitude:</span>
                    <span className="text-slate-200">{Math.round(comparison.aircraft_a.live_state.altitude_m * 3.28084).toLocaleString()} ft</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ground Speed:</span>
                    <span className="text-slate-200">{Math.round(comparison.aircraft_a.live_state.velocity_ms * 1.94384)} kts</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Heading:</span>
                    <span className="text-slate-200">{comparison.aircraft_a.live_state.heading_deg.toFixed(1)}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Vertical Rate:</span>
                    <span className="text-slate-200">{(comparison.aircraft_a.live_state.vertical_rate_ms * 196.85).toFixed(0)} ft/m</span>
                  </div>
                </div>
              </div>

              {/* Aircraft B */}
              <div className="p-4 rounded-xl bg-[#0f172a]/90 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-sm font-bold text-purple-300 font-sans">
                    {comparison.aircraft_b.callsign || comparison.aircraft_b.icao24.toUpperCase()} (Neighbor)
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    ICAO: {comparison.aircraft_b.icao24.toUpperCase()}
                  </span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Telemetry Trust:</span>
                    <b className="text-emerald-400">{comparison.aircraft_b.trust_status?.trust_score ?? 'N/A'}%</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Combined Risk:</span>
                    <b className="text-slate-200">{comparison.aircraft_b.trust_status?.combined_risk_score?.toFixed(4) ?? 'N/A'}</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Altitude:</span>
                    <span className="text-slate-200">{Math.round(comparison.aircraft_b.live_state.altitude_m * 3.28084).toLocaleString()} ft</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ground Speed:</span>
                    <span className="text-slate-200">{Math.round(comparison.aircraft_b.live_state.velocity_ms * 1.94384)} kts</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Heading:</span>
                    <span className="text-slate-200">{comparison.aircraft_b.live_state.heading_deg.toFixed(1)}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Vertical Rate:</span>
                    <span className="text-slate-200">{(comparison.aircraft_b.live_state.vertical_rate_ms * 196.85).toFixed(0)} ft/m</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Metrics Differential Strip */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono text-center">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Spatial Separation</span>
                <b className="text-white text-sm">{comparison.spatial_separation_km} km</b>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Altitude Difference</span>
                <b className="text-white text-sm">{Math.round(comparison.altitude_difference_m * 3.28084).toLocaleString()} ft</b>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Speed Difference</span>
                <b className="text-white text-sm">{Math.round(comparison.speed_difference_ms * 1.94384)} kts</b>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Trust Differential</span>
                <b className="text-cyan-300 text-sm">{comparison.trust_difference !== null && comparison.trust_difference !== undefined ? `Δ ${comparison.trust_difference}%` : 'N/A'}</b>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
