import React, { useEffect, useState, useCallback } from 'react';
import type { SourceHealthDetail, DataQualityMetrics } from '../../types';
import { fetchSourceHealthDetail, fetchDataQualityMetrics } from '../../services/api';

export const SourceHealthCenter: React.FC = () => {
  const [sourceHealth, setSourceHealth] = useState<SourceHealthDetail | null>(null);
  const [dataQuality, setDataQuality] = useState<DataQualityMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([fetchSourceHealthDetail(), fetchDataQualityMetrics()])
      .then(([src, qual]) => {
        setSourceHealth(src);
        setDataQuality(qual);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load source health metrics');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  const getFreshnessBadge = (status: string) => {
    switch (status) {
      case 'LIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/40 text-emerald-300 border border-emerald-800/80 text-xs font-bold font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> LIVE STREAM
          </span>
        );
      case 'REFRESHING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-950/40 text-sky-300 border border-sky-800/80 text-xs font-bold font-mono">
            <span>↻</span> REFRESHING
          </span>
        );
      case 'RECENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-950/40 text-sky-300 border border-sky-800/80 text-xs font-bold font-mono">
            <span>●</span> RECENT
          </span>
        );
      case 'STALE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-950/40 text-amber-300 border border-amber-800/80 text-xs font-bold font-mono">
            <span>⚠</span> STALE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-950/40 text-rose-300 border border-rose-800/80 text-xs font-bold font-mono">
            <span>✕</span> OFFLINE
          </span>
        );
    }
  };

  return (
    <div className="bg-[#0b1220] border border-slate-800 rounded-xl p-5 sm:p-6 text-slate-100 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight uppercase font-mono">
            Data Source Health & Telemetry Quality
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Production-grade source continuity, snapshot freshness, and vector normalization telemetry
          </p>
        </div>
        <button
          onClick={loadData}
          className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sky-300 text-xs font-mono font-semibold transition-colors shadow-sm self-start sm:self-center cursor-pointer"
        >
          ↻ Refresh Metrics
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
          <span>▲</span>
          <span>{error}</span>
        </div>
      )}

      {loading && !sourceHealth && (
        <div className="p-12 text-center text-xs text-slate-400">
          Polling surveillance source health telemetry...
        </div>
      )}

      {sourceHealth && (
        <div className="space-y-5">
          {/* Primary Source Provenance Card */}
          <div className="p-5 rounded-xl bg-[#0f172a]/90 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-mono font-semibold text-sky-400 uppercase tracking-wider block">
                  Primary Surveillance Source
                </span>
                <div className="text-lg font-bold text-white font-sans mt-0.5">
                  {sourceHealth.source_name} ({sourceHealth.provider_type})
                </div>
              </div>
              <div className="self-start sm:self-center">
                {getFreshnessBadge(sourceHealth.current_freshness)}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/60">
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] uppercase font-mono text-slate-500 block">Snapshot Age</span>
                <span className="text-sm font-bold font-mono text-slate-200">
                  {sourceHealth.snapshot_age_seconds !== null && sourceHealth.snapshot_age_seconds !== undefined
                    ? `${sourceHealth.snapshot_age_seconds.toFixed(1)}s`
                    : 'N/A'}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] uppercase font-mono text-slate-500 block">Request Status</span>
                <span className="text-sm font-bold font-mono text-emerald-400">
                  {sourceHealth.request_status}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] uppercase font-mono text-slate-500 block">Rate Limit State</span>
                <span className="text-sm font-bold font-mono text-slate-200">
                  {sourceHealth.rate_limit_remaining || 'NOMINAL'}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] uppercase font-mono text-slate-500 block">Connection</span>
                <span className="text-sm font-bold font-mono text-sky-400">
                  {sourceHealth.connection_status}
                </span>
              </div>
            </div>
          </div>

          {/* Telemetry Normalization & Quality Metrics */}
          {dataQuality && (
            <div className="p-5 rounded-xl bg-[#0f172a]/90 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase font-mono tracking-wider text-slate-300">
                  Vector Pipeline Telemetry & Filtering Integrity
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  Total Vectors Processed
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
                  <span className="text-[11px] font-mono uppercase text-slate-400 block">Received Vectors</span>
                  <span className="text-xl font-bold font-mono text-white mt-1 block">
                    {dataQuality.total_received_vectors?.toLocaleString()}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/70 border border-emerald-900/40">
                  <span className="text-[11px] font-mono uppercase text-emerald-400 block">Normalized Vectors</span>
                  <span className="text-xl font-bold font-mono text-emerald-300 mt-1 block">
                    {dataQuality.total_normalized_vectors?.toLocaleString()}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/70 border border-rose-900/40">
                  <span className="text-[11px] font-mono uppercase text-rose-400 block">Rejected Vectors</span>
                  <span className="text-xl font-bold font-mono text-rose-300 mt-1 block">
                    {dataQuality.total_rejected_vectors?.toLocaleString()}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/70 border border-purple-900/40">
                  <span className="text-[11px] font-mono uppercase text-purple-400 block">Ingestion Latency</span>
                  <span className="text-xl font-bold font-mono text-purple-300 mt-1 block">
                    {dataQuality.average_ingestion_latency_ms?.toFixed(1)} ms
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-400 leading-relaxed font-sans">
                <b>Source Integrity Notice:</b> Telemetry is strictly ingested as OpenSky State-Vector data. Raw radio / multilateration is only claimed when calibrated SDR receiver ground networks are connected.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
