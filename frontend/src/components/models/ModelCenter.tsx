import React, { useEffect, useState } from 'react';
import type { ModelMetadata, AblationStudy, PipelineLatency } from '../../types';
import { fetchModelsMetadata, fetchAblationStudy, fetchPipelineLatency } from '../../services/api';

export const ModelCenter: React.FC = () => {
  const [modelsData, setModelsData] = useState<ModelMetadata | null>(null);
  const [ablationData, setAblationData] = useState<AblationStudy | null>(null);
  const [latencyData, setLatencyData] = useState<PipelineLatency | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([fetchModelsMetadata(), fetchAblationStudy(), fetchPipelineLatency()])
      .then(([m, a, l]) => {
        setModelsData(m);
        setAblationData(a);
        setLatencyData(l);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch model research metadata');
        setLoading(false);
      });
  }, []);

  return (
    <div className="bg-[#0b1220] border border-slate-800 rounded-xl p-5 sm:p-6 text-slate-100 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight uppercase font-mono">
            Model Specifications & Research Ablation
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Multi-tier model cards, cross-validated ablation benchmarks, and pipeline latency observability
          </p>
        </div>
        {modelsData && (
          <span className="px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-sky-400 text-xs font-mono font-semibold self-start sm:self-center">
            Active Stack: {modelsData.active_detector_version}
          </span>
        )}
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
          <span>▲</span>
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div className="p-12 text-center text-xs text-slate-400">
          Loading verified model specifications and research benchmarks...
        </div>
      )}

      {modelsData && ablationData && latencyData && !loading && (
        <div className="space-y-6">
          {/* Active 4-Tier Model Cards */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase font-mono tracking-wider text-slate-300 block">
              Active Multi-Stage Detection Stack
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {modelsData.models.map((m, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-[#0f172a]/90 border border-slate-800 hover:border-slate-700 transition-colors space-y-2 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-sky-950/60 border border-sky-800/60 text-sky-400 text-[10px] font-bold font-mono">
                        TIER {m.tier}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">{m.version}</span>
                    </div>

                    <div className="text-sm font-bold text-white font-sans">
                      {m.name}
                    </div>

                    <div className="text-xs font-mono font-semibold text-purple-400">
                      {m.type}
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed font-normal pt-1 border-t border-slate-800/60">
                    {m.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Research Ablation Study Table */}
          <div className="p-5 rounded-xl bg-[#0f172a]/90 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <span className="text-xs font-bold uppercase font-mono tracking-wider text-slate-300 block">
                  Research Pipeline Ablation Study
                </span>
                <p className="text-xs text-slate-400">
                  {ablationData.dataset_description}
                </p>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                Evaluation: Offline Cross-Validation
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300 border-collapse">
                <thead>
                  <tr className="bg-slate-900/90 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
                    <th className="py-3 px-4">Configuration</th>
                    <th className="py-3 px-4">Precision</th>
                    <th className="py-3 px-4">Recall</th>
                    <th className="py-3 px-4">F1-Score</th>
                    <th className="py-3 px-4">FPR</th>
                    <th className="py-3 px-4">P95 Latency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-950/40 font-mono">
                  {ablationData.configurations.map((cfg, idx) => (
                    <tr
                      key={idx}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        cfg.configuration.includes('Full') ? 'bg-sky-950/20 font-bold' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-slate-100 font-sans font-semibold">
                        {cfg.configuration}
                      </td>
                      <td className="py-3 px-4 text-emerald-400">
                        {cfg.precision.toFixed(3)}
                      </td>
                      <td className="py-3 px-4 text-emerald-400">
                        {cfg.recall.toFixed(3)}
                      </td>
                      <td className="py-3 px-4 text-cyan-300">
                        {cfg.f1.toFixed(3)}
                      </td>
                      <td className="py-3 px-4 text-amber-400">
                        {cfg.false_positive_rate.toFixed(3)}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {cfg.latency_p95_ms.toFixed(1)} ms
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
              * Note: Offline benchmark results reflect curated evaluation scenarios and do not represent guaranteed real-world field accuracy.
            </p>
          </div>

          {/* Pipeline Latency Observability */}
          <div className="p-5 rounded-xl bg-[#0f172a]/90 border border-slate-800 space-y-4">
            <span className="text-xs font-bold uppercase font-mono tracking-wider text-slate-300 block">
              End-to-End Processing Latency Distribution
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
                <span className="text-[11px] font-mono uppercase text-slate-400 block">Ingestion → Redis</span>
                <span className="text-lg font-bold font-mono text-cyan-300 mt-1 block">
                  {latencyData.source_to_redis_ms.toFixed(1)} ms
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
                <span className="text-[11px] font-mono uppercase text-slate-400 block">Worker Processing</span>
                <span className="text-lg font-bold font-mono text-sky-300 mt-1 block">
                  {latencyData.worker_processing_ms.toFixed(1)} ms
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
                <span className="text-[11px] font-mono uppercase text-slate-400 block">DB Persistence</span>
                <span className="text-lg font-bold font-mono text-purple-300 mt-1 block">
                  {latencyData.db_persistence_ms.toFixed(1)} ms
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-emerald-900/40">
                <span className="text-[11px] font-mono uppercase text-emerald-400 block">Total Pipeline P95</span>
                <span className="text-lg font-bold font-mono text-emerald-300 mt-1 block">
                  {latencyData.p95_latency_ms.toFixed(1)} ms
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
