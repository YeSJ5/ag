import React, { useEffect, useState } from 'react';
import type { AirspaceCorrelation } from '../../types';
import { fetchAirspaceCorrelation } from '../../services/api';

interface AirspaceCorrelationPanelProps {
  icao24: string;
  onSelectNeighbor?: (icao24: string) => void;
}

export const AirspaceCorrelationPanel: React.FC<AirspaceCorrelationPanelProps> = ({ icao24, onSelectNeighbor }) => {
  const [correlation, setCorrelation] = useState<AirspaceCorrelation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [radiusKm, setRadiusKm] = useState<number>(150);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    fetchAirspaceCorrelation(icao24, radiusKm, 30)
      .then((data) => {
        if (isMounted) {
          setCorrelation(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to compute airspace correlation');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [icao24, radiusKm]);

  const getClassificationBadge = (cls: string) => {
    switch (cls) {
      case 'AIRSPACE_WIDE_ANOMALY_PATTERN':
        return (
          <span className="px-2.5 py-1 rounded bg-rose-950/60 text-rose-300 border border-rose-800 text-xs font-bold font-mono">
            ▲ AIRSPACE-WIDE ANOMALY PATTERN
          </span>
        );
      case 'CORRELATED_TELEMETRY_ANOMALY':
        return (
          <span className="px-2.5 py-1 rounded bg-amber-950/60 text-amber-300 border border-amber-800 text-xs font-bold font-mono">
            ⚠ CORRELATED TELEMETRY ANOMALY
          </span>
        );
      case 'AIRCRAFT_SPECIFIC':
        return (
          <span className="px-2.5 py-1 rounded bg-sky-950/60 text-sky-300 border border-sky-800 text-xs font-bold font-mono">
            ● AIRCRAFT-SPECIFIC ANOMALY
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800 text-xs font-bold font-mono">
            ✓ ISOLATED NOMINAL AIRSPACE
          </span>
        );
    }
  };

  return (
    <div className="bg-[#0b1220] border border-slate-800 rounded-xl p-5 sm:p-6 text-slate-100 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-3">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-white tracking-tight uppercase font-mono">
            Airspace Correlation Engine — Spatial Cluster Analysis
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluating neighboring air traffic within {radiusKm} km radius
          </p>
        </div>

        {/* Radius Selector */}
        <div className="flex items-center gap-1.5 self-start sm:self-center">
          {[50, 100, 150, 250, 400].map((r) => (
            <button
              key={r}
              onClick={() => setRadiusKm(r)}
              className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-colors cursor-pointer border ${
                radiusKm === r
                  ? 'bg-cyan-500 text-black border-cyan-400'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700'
              }`}
            >
              {r} km
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="p-12 text-center text-xs text-slate-400 font-mono">
          Calculating spatial correlation vectors across nearby air traffic...
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
          <span>▲</span>
          <span>{error}</span>
        </div>
      )}

      {correlation && !loading && (
        <div className="space-y-4">
          {/* Classification Banner */}
          <div className="p-4 rounded-xl bg-[#0f172a]/90 border border-slate-800 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-[11px] font-mono font-semibold uppercase text-slate-400">
                Spatial Cluster Classification
              </span>
              <div>{getClassificationBadge(correlation.correlation_classification)}</div>
            </div>

            <p className="text-xs sm:text-sm font-medium text-slate-100 leading-relaxed font-sans">
              {correlation.summary}
            </p>

            <div className="text-[11px] text-slate-500 font-mono pt-1 border-t border-slate-800/60">
              {correlation.nearby_aircraft_count} aircraft tracked within sector • {correlation.anomalous_nearby_count} exhibiting anomalies
            </div>
          </div>

          {/* Neighboring Aircraft Table */}
          {correlation.nearby_aircraft.length === 0 ? (
            <div className="p-8 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-400 font-sans">
              No other active aircraft observed within {radiusKm} km radius in the current surveillance window.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300 border-collapse">
                <thead>
                  <tr className="bg-slate-900/90 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
                    <th className="py-3 px-4">Aircraft / ICAO</th>
                    <th className="py-3 px-4">Distance</th>
                    <th className="py-3 px-4">Altitude</th>
                    <th className="py-3 px-4">Speed</th>
                    <th className="py-3 px-4">Trust</th>
                    <th className="py-3 px-4">Integrity Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-950/40 font-mono">
                  {correlation.nearby_aircraft.map((ac, idx) => (
                    <tr
                      key={idx}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        ac.is_anomaly ? 'bg-rose-950/20' : ''
                      } ${onSelectNeighbor ? 'cursor-pointer' : ''}`}
                      onClick={() => onSelectNeighbor && onSelectNeighbor(ac.icao24)}
                    >
                      <td className="py-3 px-4 font-bold text-slate-100 font-sans">
                        {ac.callsign || ac.icao24.toUpperCase()}
                        <span className="text-[10px] text-slate-500 ml-1.5 font-mono font-normal">
                          ({ac.icao24})
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{ac.distance_km} km</td>
                      <td className="py-3 px-4 text-slate-300">
                        {Math.round(ac.altitude_m * 3.28084).toLocaleString()} ft
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {Math.round(ac.velocity_ms * 1.94384)} kts
                      </td>
                      <td
                        className={`py-3 px-4 font-bold ${
                          (ac.trust_score ?? 100) < 70 ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {ac.trust_score !== null && ac.trust_score !== undefined
                          ? `${ac.trust_score}%`
                          : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        {ac.is_anomaly ? (
                          <span className="text-rose-400 text-xs font-semibold">
                            ▲ Anomalous ({ac.anomaly_reasons[0] || 'Flagged'})
                          </span>
                        ) : (
                          <span className="text-emerald-400 text-xs">✓ Nominal</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
