import React, { useEffect, useState } from 'react';
import type { AircraftNarrative } from '../../types';
import { fetchAircraftNarrative } from '../../services/api';

interface InvestigationNarrativeProps {
  icao24: string;
}

export const InvestigationNarrative: React.FC<InvestigationNarrativeProps> = ({ icao24 }) => {
  const [narrative, setNarrative] = useState<AircraftNarrative | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    fetchAircraftNarrative(icao24, 60)
      .then((data) => {
        if (isMounted) {
          setNarrative(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to generate investigation narrative');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [icao24]);

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'ALERT':
        return (
          <span className="px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/80 text-[10px] font-bold font-mono">
            ALERT
          </span>
        );
      case 'TRUST':
        return (
          <span className="px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/80 text-[10px] font-bold font-mono">
            TRUST SHIFT
          </span>
        );
      case 'NOTE':
        return (
          <span className="px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/80 text-[10px] font-bold font-mono">
            ANALYST NOTE
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded bg-sky-950/60 text-sky-300 border border-sky-800/80 text-[10px] font-bold font-mono">
            TELEMETRY
          </span>
        );
    }
  };

  return (
    <div className="bg-[#0b1220] border border-slate-800 rounded-xl p-5 sm:p-6 text-slate-100 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-2">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-white tracking-tight uppercase font-mono">
            Investigation Mode — Chronological Event Narrative
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Event timeline synthesized from persisted telemetry records, detector triggers and notes
          </p>
        </div>
        {narrative && (
          <span className="px-2.5 py-0.5 rounded text-xs font-mono font-semibold bg-slate-800/90 text-sky-400 border border-slate-700 self-start sm:self-center">
            {narrative.total_events} Stored Events
          </span>
        )}
      </div>

      {loading && (
        <div className="p-12 text-center text-xs text-slate-400 font-mono">
          Constructing chronological event narrative...
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
          <span>▲</span>
          <span>{error}</span>
        </div>
      )}

      {narrative && !loading && (
        <div className="space-y-4">
          {/* Assessment Overview */}
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans">
            <b className="text-slate-100 font-mono uppercase">Surveillance Overview: </b>
            <span>{narrative.current_assessment_summary}</span>
          </div>

          {/* Timeline Events List */}
          <div className="relative pl-6 sm:pl-8 space-y-3.5 before:absolute before:left-2 sm:before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
            {narrative.events.map((ev, idx) => {
              const timeStr = new Date(ev.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });

              return (
                <div
                  key={idx}
                  className="relative p-3.5 rounded-xl bg-[#0f172a]/90 border border-slate-800 hover:border-slate-700 transition-colors space-y-1.5"
                >
                  {/* Timeline Marker Dot */}
                  <div
                    className={`absolute -left-[29px] sm:-left-[35px] top-4 w-3 h-3 rounded-full border-2 border-[#0b1220] ${
                      ev.severity === 'CRITICAL'
                        ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]'
                        : ev.severity === 'WARN'
                        ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                        : 'bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.6)]'
                    }`}
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-400 font-semibold">
                        {timeStr}
                      </span>
                      {getCategoryBadge(ev.category)}
                      <span className="text-xs sm:text-sm font-bold text-white font-sans">
                        {ev.title}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-normal">
                    {ev.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
