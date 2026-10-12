import React from 'react';
import type { AircraftDetailResponse, ShapFeatureValue } from '../../types';

interface ShapExplanationCenterProps {
  detail: AircraftDetailResponse;
}

export const ShapExplanationCenter: React.FC<ShapExplanationCenterProps> = ({ detail }) => {
  const { trust_status } = detail;
  const tech = trust_status?.technical_details || {};
  const shapData = (tech.shap as { top_features?: ShapFeatureValue[] }) || {};
  const topFeatures = shapData.top_features || [];

  const maxVal = topFeatures.reduce((m, f) => Math.max(m, Math.abs(f.value || 0)), 0.001);

  return (
    <div className="bg-[#0b1220] border border-slate-800 rounded-xl p-5 sm:p-6 text-slate-100 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-2">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-white tracking-tight uppercase font-mono">
            SHAP Explanation Center — Local Feature Attribution
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            TreeSHAP feature attributions explaining supervised ensemble anomaly probability
          </p>
        </div>
        <span className="self-start sm:self-center px-2.5 py-0.5 rounded text-xs font-mono font-semibold bg-slate-800/90 text-sky-400 border border-slate-700">
          TreeSHAP v0.46
        </span>
      </div>

      {topFeatures.length === 0 ? (
        <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center text-xs text-slate-400">
          No prominent SHAP feature outliers detected. All kinematic features fall within cross-validated nominal baseline bounds.
        </div>
      ) : (
        <div className="space-y-3">
          {topFeatures.slice(0, 5).map((f, idx) => {
            const featName = (f.feature || f.name || `Feature ${idx + 1}`).replace(/_/g, ' ').toUpperCase();
            const val = f.value || 0;
            const isAnomalyPush = val > 0;
            const pct = Math.min(100, Math.round((Math.abs(val) / maxVal) * 100));

            return (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[#0f172a]/90 border border-slate-800/80 hover:border-slate-700 transition-colors space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded ${
                        isAnomalyPush
                          ? 'bg-rose-950/60 text-rose-400 border border-rose-800/60'
                          : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                      }`}
                    >
                      {isAnomalyPush ? '↑ ANOMALY' : '↓ NOMINAL'}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-100 font-sans">
                      {featName}
                    </span>
                  </div>

                  <div className="text-xs font-mono font-bold text-slate-300">
                    <span className={isAnomalyPush ? 'text-rose-400' : 'text-emerald-400'}>
                      {val > 0 ? `+${val.toFixed(4)}` : val.toFixed(4)}
                    </span>
                    <span className="text-slate-400 ml-1 font-normal">SHAP impact</span>
                  </div>
                </div>

                {/* Magnitude Bar */}
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isAnomalyPush
                        ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                        : 'bg-gradient-to-r from-sky-500 to-emerald-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Interpretation Guide Box */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-sky-900/40 text-xs space-y-1">
        <div className="font-bold font-mono text-sky-400 uppercase text-[11px]">
          How to Interpret SHAP Attributions:
        </div>
        <p className="text-slate-300 leading-relaxed">
          SHAP values quantify the marginal contribution of each feature to the ensemble model&apos;s anomaly output.
          Features with <b className="text-rose-400">↑ (positive)</b> values pushed the score toward an anomaly finding; features with <b className="text-emerald-400">↓ (negative)</b> values reinforced normal flight consistency.
        </p>
      </div>
    </div>
  );
};
