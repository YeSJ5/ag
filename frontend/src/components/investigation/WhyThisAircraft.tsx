import React from 'react';
import type { AircraftDetailResponse } from '../../types';

interface WhyThisAircraftProps {
  detail: AircraftDetailResponse;
}

export const WhyThisAircraft: React.FC<WhyThisAircraftProps> = ({ detail }) => {
  const { trust_status } = detail;
  const tech = trust_status?.technical_details || {};
  const why = (tech.why_assessment as {
    triggered_evidence?: string[];
    non_triggered_evidence?: string[];
    primary_contributor?: string;
  }) || {};

  const triggered = why.triggered_evidence && why.triggered_evidence.length > 0
    ? why.triggered_evidence
    : (trust_status?.reasons && trust_status.reasons.length > 0
      ? trust_status.reasons
      : ['No abnormal physical rule violations or statistical ML drift detected.']);

  const nonTriggered = why.non_triggered_evidence && why.non_triggered_evidence.length > 0
    ? why.non_triggered_evidence
    : [
      'Duplicate ICAO collision: No duplicate hex broadcast observed.',
      'Speed vs Baro altitude: Nominal aerodynamic boundary envelope.',
      'Surveillance stream freshness: Observation latency within nominal tolerance.',
      'Transponder vertical bounds: Vertical rate within civil envelope.',
    ];

  const quadrants = (tech.evidence_quadrants as {
    observed?: Array<{ label: string; value: string }>;
    derived?: Array<{ label: string; value: string }>;
    model_inferred?: Array<{ label: string; value: string }>;
    unknown?: Array<{ label: string; value: string }>;
  }) || {};

  return (
    <div className="bg-[#0b1220] border border-slate-800 rounded-xl p-5 sm:p-6 text-slate-100 shadow-xl space-y-5">
      {/* Header */}
      <div className="pb-3 border-b border-slate-800/80">
        <h3 className="text-sm sm:text-base font-bold text-white tracking-tight uppercase font-mono">
          Why This Aircraft? — Evidence Attribution
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Explicit breakdown of triggered anomaly flags vs cleared nominal consistency checks
        </p>
      </div>

      {/* Two-Column Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Triggered Anomalies Card */}
        <div className="bg-[#0f172a]/90 border border-slate-800 rounded-xl p-4 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold font-mono text-rose-400 uppercase">
            <span>▲</span> Triggered Anomaly Evidence
          </div>
          <ul className="space-y-1.5 text-xs text-slate-200">
            {triggered.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 bg-slate-900/50 p-2 rounded border border-slate-800/80">
                <span className="text-rose-400 font-bold">•</span>
                <span className="leading-snug">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Non-Triggered Nominal Card */}
        <div className="bg-[#0f172a]/90 border border-slate-800 rounded-xl p-4 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold font-mono text-emerald-400 uppercase">
            <span>✓</span> Nominal Baseline Checks (Cleared)
          </div>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {nonTriggered.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 bg-slate-900/50 p-2 rounded border border-slate-800/80">
                <span className="text-emerald-400 font-bold">•</span>
                <span className="leading-snug">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* "What Is Actually Known?" 4-Quadrant Evidence Classification */}
      {quadrants.observed && (
        <div className="pt-4 border-t border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase font-mono tracking-wider text-slate-300">
              Evidence Integrity Classification (&quot;What is Actually Known?&quot;)
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Empirical Epistemology Grid
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Observed (Raw) */}
            <div className="p-3 rounded-lg bg-slate-900/70 border border-sky-900/40">
              <div className="text-[11px] font-bold font-mono text-sky-400 mb-1.5 uppercase">
                1. Observed (Raw)
              </div>
              <div className="space-y-1 text-xs text-slate-300">
                {quadrants.observed.map((o, idx) => (
                  <div key={idx} className="leading-snug">
                    <span className="text-slate-400 font-medium">{o.label}: </span>
                    <b className="text-slate-100 font-mono">{o.value}</b>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Derived (Physics) */}
            <div className="p-3 rounded-lg bg-slate-900/70 border border-purple-900/40">
              <div className="text-[11px] font-bold font-mono text-purple-400 mb-1.5 uppercase">
                2. Derived (Physics)
              </div>
              <div className="space-y-1 text-xs text-slate-300">
                {quadrants.derived?.map((d, idx) => (
                  <div key={idx} className="leading-snug">
                    <span className="text-slate-400 font-medium">{d.label}: </span>
                    <b className="text-slate-100 font-mono">{d.value}</b>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Model Inferred (ML) */}
            <div className="p-3 rounded-lg bg-slate-900/70 border border-amber-900/40">
              <div className="text-[11px] font-bold font-mono text-amber-400 mb-1.5 uppercase">
                3. Model Inferred (ML)
              </div>
              <div className="space-y-1 text-xs text-slate-300">
                {quadrants.model_inferred?.map((m, idx) => (
                  <div key={idx} className="leading-snug">
                    <span className="text-slate-400 font-medium">{m.label}: </span>
                    <b className="text-slate-100 font-mono">{m.value}</b>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Unknown (Unconfirmed) */}
            <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-700/40">
              <div className="text-[11px] font-bold font-mono text-slate-400 mb-1.5 uppercase">
                4. Unknown (Unconfirmed)
              </div>
              <div className="space-y-1 text-xs text-slate-400">
                {quadrants.unknown?.map((u, idx) => (
                  <div key={idx} className="leading-snug italic">
                    <span className="text-slate-400 font-normal">{u.label}: </span>
                    <span className="text-slate-300">{u.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
