import React from 'react';
import type { AircraftDetailResponse } from '../../types';

interface DetectorAgreementMatrixProps {
  detail: AircraftDetailResponse;
}

export const DetectorAgreementMatrix: React.FC<DetectorAgreementMatrixProps> = ({ detail }) => {
  const { trust_status } = detail;
  const tech = trust_status?.technical_details || {};
  const dag = (tech.detector_agreement as Record<string, unknown>) || {};
  const layers = (dag.layers as Record<string, { label?: string; status?: string; score?: number | null; details?: string }>) || {};

  const agreeingCount = (dag.agreeing_count as number) ?? 4;
  const activeCount = (dag.active_detector_count as number) ?? 4;
  const hasDisagreement = Boolean(dag.has_disagreement);
  const summary = (dag.agreement_summary as string) || `${agreeingCount}/${activeCount} Detectors Aligned`;

  const fallbackLayers: Record<string, { label: string; status: string; score: number | null; details: string }> = {
    tier1_rules: {
      label: 'Tier 1: Deterministic Kinematic Rules',
      status: trust_status?.reasons && trust_status.reasons.length > 0 ? 'ALERT' : 'PASS',
      score: (tech.rule_risk as number) ?? 0.0,
      details: trust_status?.reasons?.length ? trust_status.reasons.join(', ') : 'All kinematic envelope bounds nominal (Mach, Climb, Speed)',
    },
    tier2_autoencoder: {
      label: 'Tier 2: Deep Multivariate Autoencoder',
      status: (tech.autoencoder_score as number) >= 0.70 ? 'ALERT' : (tech.autoencoder_score as number) >= 0.35 ? 'WARN' : 'PASS',
      score: (tech.autoencoder_score as number) ?? null,
      details: (tech.autoencoder_score as number) !== undefined
        ? `Reconstruction loss MSE: ${((tech.autoencoder_score as number) || 0).toFixed(4)}`
        : 'Continuous multivariate latent error monitoring',
    },
    tier3_ensemble: {
      label: 'Tier 3: Supervised Voting Ensemble',
      status: (tech.ensemble_score as number) >= 0.70 ? 'ALERT' : (tech.ensemble_score as number) >= 0.35 ? 'WARN' : 'PASS',
      score: (tech.ensemble_score as number) ?? null,
      details: (tech.ensemble_score as number) !== undefined
        ? `Ensemble anomaly probability: ${(((tech.ensemble_score as number) || 0) * 100).toFixed(1)}%`
        : 'Soft-voting Random Forest + Gradient Boosting',
    },
    tier4_trust: {
      label: 'Tier 4: Temporal Trust Engine',
      status: (trust_status?.trust_score ?? 100) < 50 ? 'ALERT' : (trust_status?.trust_score ?? 100) < 75 ? 'WARN' : 'PASS',
      score: trust_status?.trust_score ?? null,
      details: `Temporal EMA trust score: ${trust_status?.trust_score ?? 'N/A'}%`,
    },
  };

  const displayLayers = Object.keys(layers).length > 0 ? layers : fallbackLayers;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PASS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/40 text-emerald-300 border border-emerald-800/80 text-xs font-bold font-mono">
            <span>✓</span> PASS
          </span>
        );
      case 'WARN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-950/40 text-amber-300 border border-amber-800/80 text-xs font-bold font-mono">
            <span>⚠</span> WARN
          </span>
        );
      case 'ALERT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-950/40 text-rose-300 border border-rose-800/80 text-xs font-bold font-mono">
            <span>▲</span> ALERT
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-xs font-medium font-mono">
            <span>—</span> INSUFFICIENT DATA
          </span>
        );
    }
  };

  return (
    <div className="bg-[#0b1220] border border-slate-800 rounded-xl p-5 sm:p-6 text-slate-100 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-2">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight uppercase font-mono">
              Detector Evidence & Consensus Matrix
            </h3>
            <span
              className={`px-2.5 py-0.5 rounded text-xs font-bold font-mono border ${
                hasDisagreement
                  ? 'bg-amber-950/40 border-amber-800 text-amber-300'
                  : 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
              }`}
            >
              {agreeingCount}/{activeCount} Aligned
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {summary}
          </p>
        </div>
      </div>

      {/* Disagreement Warning Callout */}
      {hasDisagreement && (
        <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-700/60 text-amber-200 text-xs flex items-start gap-3">
          <span className="text-amber-400 text-base leading-none">⚠</span>
          <div>
            <div className="font-bold font-mono text-amber-300">DETECTOR DISAGREEMENT DETECTED</div>
            <p className="text-amber-200/90 mt-0.5 leading-relaxed">
              Independent detection tiers produced conflicting results. Assessment confidence has been reduced to prevent false certainty.
            </p>
          </div>
        </div>
      )}

      {/* Layer Consensus Cards */}
      <div className="space-y-2.5">
        {Object.entries(displayLayers).map(([key, layer]) => (
          <div
            key={key}
            className="p-3.5 rounded-xl bg-[#0f172a]/90 border border-slate-800/80 hover:border-slate-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="space-y-0.5">
              <div className="text-xs sm:text-sm font-semibold text-slate-100 font-sans">
                {layer.label || key}
              </div>
              <div className="text-xs text-slate-400 font-normal">
                {layer.details || 'Continuous anomaly monitoring'}
              </div>
            </div>
            <div className="flex-shrink-0 self-start sm:self-center">
              {getStatusBadge(layer.status || 'PASS')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
