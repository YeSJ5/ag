import React, { useEffect, useState } from 'react';
import type { AircraftDelta } from '../../types';
import { fetchAircraftDelta } from '../../services/api';

interface WhatChangedPanelProps {
  icao24: string;
}

export const WhatChangedPanel: React.FC<WhatChangedPanelProps> = ({ icao24 }) => {
  const [delta, setDelta] = useState<AircraftDelta | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [baselineSec, setBaselineSec] = useState<number>(30);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    fetchAircraftDelta(icao24, baselineSec)
      .then((data) => {
        if (isMounted) {
          setDelta(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to fetch telemetry delta');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [icao24, baselineSec]);

  return (
    <div className="bg-[#0b1220] border border-slate-800 rounded-xl p-5 sm:p-6 text-slate-100 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-3">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-white tracking-tight uppercase font-mono">
            What Changed? — Differential State Comparator
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Comparing current state against previous stable state {baselineSec}s prior
          </p>
        </div>

        {/* Baseline Selector */}
        <div className="flex items-center gap-1.5 self-start sm:self-center">
          {[15, 30, 60, 120, 300].map((sec) => (
            <button
              key={sec}
              onClick={() => setBaselineSec(sec)}
              className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-colors cursor-pointer border ${
                baselineSec === sec
                  ? 'bg-cyan-500 text-black border-cyan-400'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700'
              }`}
            >
              {sec < 60 ? `${sec}s` : `${sec / 60}m`}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="p-12 text-center text-xs text-slate-400 font-mono">
          Computing kinematic deltas across historical observations...
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
          <span>▲</span>
          <span>{error}</span>
        </div>
      )}

      {delta && !loading && (
        <div className="space-y-4">
          {/* Finding Callout */}
          <div
            className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
              delta.has_significant_changes
                ? 'bg-amber-950/30 border-amber-700/60 text-amber-200'
                : 'bg-emerald-950/30 border-emerald-700/60 text-emerald-200'
            }`}
          >
            <b className="font-mono uppercase">Differential Finding: </b>
            <span>{delta.summary}</span>
          </div>

          {/* Delta Field Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {delta.deltas.map((d, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl bg-[#0f172a]/90 border space-y-1.5 ${
                  d.is_abnormal
                    ? 'border-rose-800/80 ring-1 ring-rose-500/30'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase font-semibold text-slate-400">
                    {d.field}
                  </span>
                  {d.is_abnormal && (
                    <span className="px-1.5 py-0.5 rounded bg-rose-950/60 text-rose-400 border border-rose-800/60 text-[10px] font-bold font-mono">
                      ABNORMAL
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-base font-bold text-white font-mono">
                    {d.current_value} {d.unit}
                  </span>
                  <span
                    className={`text-xs font-mono font-semibold ${
                      d.is_abnormal ? 'text-rose-400' : 'text-cyan-400'
                    }`}
                  >
                    Δ {d.delta} {d.unit}
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 font-mono">
                  Baseline: {d.previous_value} {d.unit}
                </div>
              </div>
            ))}
          </div>

          {/* Overall Trust & Risk Shift Bar */}
          <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-slate-800/80 text-xs font-mono">
            <div>
              <span className="text-slate-400">Telemetry Trust Shift: </span>
              <b className={delta.trust_delta && delta.trust_delta < 0 ? 'text-rose-400' : 'text-emerald-400'}>
                {delta.trust_delta !== null && delta.trust_delta !== undefined
                  ? `${delta.trust_delta > 0 ? '+' : ''}${delta.trust_delta}%`
                  : 'Nominal'}
              </b>
            </div>

            <div>
              <span className="text-slate-400">Combined Risk Shift: </span>
              <b className={delta.risk_delta && delta.risk_delta > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                {delta.risk_delta !== null && delta.risk_delta !== undefined
                  ? `${delta.risk_delta > 0 ? '+' : ''}${delta.risk_delta.toFixed(4)}`
                  : 'Nominal'}
              </b>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
