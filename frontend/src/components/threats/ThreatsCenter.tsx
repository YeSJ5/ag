import React, { useState, useMemo } from 'react';
import type { AlertLog } from '../../types';
import { updateAlertStatus } from '../../services/api';

interface ThreatsCenterProps {
  alerts: AlertLog[];
  onSelectAircraft: (icao24: string) => void;
  onRefreshAlerts?: () => void;
  onExportCsv?: () => void;
  onExportPdf?: () => void;
}

export const ThreatsCenter: React.FC<ThreatsCenterProps> = ({
  alerts,
  onSelectAircraft,
  onRefreshAlerts,
  onExportCsv,
  onExportPdf,
}) => {
  const [selectedAlertId, setSelectedAlertId] = useState<string | number | null>(
    alerts.length > 0 ? alerts[0].id : null
  );
  const [transitioning, setTransitioning] = useState<boolean>(false);
  const [analystNote, setAnalystNote] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'OPERATIONS' | 'FULL_TABLE'>('OPERATIONS');

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      const icao = (a.icao24 || a.flightId || '').toLowerCase();
      const callsign = (a.callsign || '').toLowerCase();
      const reason = (a.reason || a.reason_text || a.type || '').toLowerCase();
      const query = searchTerm.toLowerCase();

      const matchesSearch = !query || icao.includes(query) || callsign.includes(query) || reason.includes(query);
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'UNACK' && !a.acknowledged) ||
        (statusFilter === 'CRITICAL' && a.severity === 'high') ||
        (statusFilter === 'SUSPICIOUS' && a.severity === 'medium') ||
        (a.status || 'NEW').toUpperCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [alerts, searchTerm, statusFilter]);

  const selectedAlert = useMemo(() => {
    return alerts.find((a) => String(a.id) === String(selectedAlertId)) || filteredAlerts[0] || alerts[0];
  }, [alerts, selectedAlertId, filteredAlerts]);

  const handleStatusChange = async (newStatus: 'NEW' | 'ACKNOWLEDGED' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED') => {
    if (!selectedAlert) return;
    setTransitioning(true);
    setError(null);
    try {
      await updateAlertStatus(selectedAlert.id, newStatus, analystNote.trim() || undefined);
      setAnalystNote('');
      if (onRefreshAlerts) onRefreshAlerts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to transition alert status';
      setError(msg);
    } finally {
      setTransitioning(false);
    }
  };

  const getStatusBadge = (status?: string, acknowledged?: boolean) => {
    const s = status || (acknowledged ? 'ACKNOWLEDGED' : 'NEW');
    switch (s) {
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-700/70 text-[11px] font-bold font-mono">
            <span>✓</span> RESOLVED
          </span>
        );
      case 'INVESTIGATING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-950/60 text-sky-300 border border-sky-700/70 text-[11px] font-bold font-mono">
            <span>⚙</span> INVESTIGATING
          </span>
        );
      case 'ACKNOWLEDGED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-700/70 text-[11px] font-bold font-mono">
            <span>●</span> ACKNOWLEDGED
          </span>
        );
      case 'DISMISSED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[11px] font-medium font-mono">
            <span>✕</span> DISMISSED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-950/70 text-rose-300 border border-rose-700/80 text-[11px] font-bold font-mono animate-pulse">
            <span>▲</span> NEW
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full bg-[#0b1220] border border-slate-800 rounded-xl p-4 sm:p-6 text-slate-100 shadow-xl space-y-4 overflow-hidden">
      {/* Header with Title and View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight uppercase font-mono">
              Airspace Threat & Anomaly Operations
            </h2>
            <span className="px-3 py-0.5 rounded-full bg-rose-950/60 border border-rose-700/70 text-rose-300 text-xs font-mono font-bold">
              {alerts.length} Total Alerts
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time security alert queue, state machine lifecycle management & counter-evidence triage
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onExportCsv && (
            <button
              onClick={onExportCsv}
              className="bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 font-bold text-xs py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>📊 EXPORT CSV</span>
            </button>
          )}
          {onExportPdf && (
            <button
              onClick={onExportPdf}
              className="bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>📄 SESSION PDF</span>
            </button>
          )}
          <div className="flex bg-[#060913] border border-slate-800 rounded-lg p-0.5 text-xs font-mono">
            <button
              onClick={() => setViewMode('OPERATIONS')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                viewMode === 'OPERATIONS'
                  ? 'bg-cyan-500 text-black font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Triage Workspace
            </button>
            <button
              onClick={() => setViewMode('FULL_TABLE')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                viewMode === 'FULL_TABLE'
                  ? 'bg-cyan-500 text-black font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Full Audit Table
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#060913] border border-slate-800 rounded-xl p-3 shrink-0">
        <div className="flex flex-1 min-w-[260px] items-center gap-2 bg-[#040710] px-3 py-1.5 rounded-lg border border-slate-800">
          <span className="text-slate-500 text-xs">🔍</span>
          <input
            type="text"
            placeholder="Search by flight callsign, airline, ICAO hex, or anomaly reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-0 text-xs text-slate-100 placeholder-slate-500 focus:outline-none font-sans"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-slate-500 hover:text-slate-300 text-xs">
              ✕
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            ALL ({alerts.length})
          </button>
          <button
            onClick={() => setStatusFilter('CRITICAL')}
            className={`px-3 py-1 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === 'CRITICAL'
                ? 'bg-rose-950/80 text-rose-300 border-rose-600'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            🔴 CRITICAL ({alerts.filter((a) => a.severity === 'high').length})
          </button>
          <button
            onClick={() => setStatusFilter('SUSPICIOUS')}
            className={`px-3 py-1 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === 'SUSPICIOUS'
                ? 'bg-amber-950/80 text-amber-300 border-amber-600'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            🟡 SUSPICIOUS ({alerts.filter((a) => a.severity === 'medium').length})
          </button>
          <button
            onClick={() => setStatusFilter('UNACK')}
            className={`px-3 py-1 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === 'UNACK'
                ? 'bg-sky-950/80 text-sky-300 border-sky-600'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            ⚠️ UNACKNOWLEDGED ({alerts.filter((a) => !a.acknowledged).length})
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2 shrink-0">
          <span>▲</span>
          <span>{error}</span>
        </div>
      )}

      {/* Main Content Area */}
      {viewMode === 'OPERATIONS' ? (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-0 overflow-hidden">
          {/* Left Threat Queue List (5 Cols, Scrollable) */}
          <div className="lg:col-span-5 bg-[#0f172a]/90 border border-slate-800 rounded-xl p-4 flex flex-col min-h-0 h-full overflow-hidden">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80 shrink-0">
              <span className="text-xs font-bold uppercase font-mono tracking-wider text-slate-300">
                Threat Queue ({filteredAlerts.length})
              </span>
              <span className="text-[11px] text-slate-500 font-mono">Sort: Recency</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1.5 min-h-0">
              {filteredAlerts.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">No alerts match the active filter criteria.</div>
              ) : (
                filteredAlerts.map((a) => {
                  const isSelected = String(a.id) === String(selectedAlert?.id);
                  const timeStr = new Date(a.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });
                  const icao = a.icao24 || a.flightId || 'UNKNOWN';
                  const reason = a.reason || a.reason_text || a.type || 'Telemetry Anomaly';
                  const risk =
                    typeof a.riskScore === 'number'
                      ? a.riskScore
                      : typeof a.combined_risk_score === 'number'
                      ? a.combined_risk_score
                      : a.scoreImpact
                      ? a.scoreImpact / 100
                      : 0.5;

                  return (
                    <div
                      key={a.id}
                      onClick={() => setSelectedAlertId(a.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 ${
                        isSelected
                          ? 'bg-slate-800/90 border-cyan-500 shadow-lg ring-1 ring-cyan-500/40'
                          : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-100 text-sm font-sans">
                            {a.callsign || icao.toUpperCase()}
                          </span>
                          <span className="text-[11px] font-mono text-cyan-400 font-bold">
                            {icao.toUpperCase()}
                          </span>
                        </div>
                        {getStatusBadge(a.status, a.acknowledged)}
                      </div>

                      <div className="text-xs text-slate-300 leading-snug line-clamp-2 font-normal">
                        {reason}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1.5 border-t border-slate-800/60">
                        <span>Time: {timeStr}</span>
                        <span>
                          Risk:{' '}
                          <b className={risk >= 0.7 ? 'text-rose-400' : 'text-amber-400'}>
                            {risk.toFixed(3)}
                          </b>
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Threat Triage & Action Drawer (7 Cols, Scrollable) */}
          <div className="lg:col-span-7 bg-[#0f172a]/90 border border-slate-800 rounded-xl p-5 sm:p-6 flex flex-col min-h-0 h-full overflow-y-auto space-y-5">
            {selectedAlert ? (() => {
              const sIcao = selectedAlert.icao24 || selectedAlert.flightId || 'UNKNOWN';
              const sReason = selectedAlert.reason || selectedAlert.reason_text || selectedAlert.type || 'Telemetry Anomaly';

              return (
                <div className="space-y-4">
                  {/* Selected Alert Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-2">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl font-bold text-white font-sans">
                          {selectedAlert.callsign || sIcao.toUpperCase()}
                        </span>
                        <span className="px-2.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-xs border border-slate-700 font-bold">
                          ICAO: {sIcao.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 mt-1 block">
                        Observed Event: {new Date(selectedAlert.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <button
                      onClick={() => onSelectAircraft(sIcao)}
                      className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold font-mono transition-colors shadow-md self-start sm:self-center cursor-pointer"
                    >
                      Open Investigation →
                    </button>
                  </div>

                  {/* Anomaly Description Block */}
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                    <span className="text-[11px] font-mono font-semibold uppercase text-slate-400 block">
                      Detection Attribution Summary
                    </span>
                    <p className="text-xs text-slate-100 leading-relaxed font-sans">
                      {sReason}
                    </p>
                  </div>

                  {/* State Machine Transition Actions */}
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase font-mono text-slate-300">
                        Lifecycle State Transition
                      </span>
                      <div>Current: {getStatusBadge(selectedAlert.status, selectedAlert.acknowledged)}</div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        disabled={transitioning}
                        onClick={() => handleStatusChange('ACKNOWLEDGED')}
                        className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-amber-800/60 text-amber-300 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Acknowledge
                      </button>
                      <button
                        disabled={transitioning}
                        onClick={() => handleStatusChange('INVESTIGATING')}
                        className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-sky-800/60 text-sky-300 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Set Investigating
                      </button>
                      <button
                        disabled={transitioning}
                        onClick={() => handleStatusChange('RESOLVED')}
                        className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-emerald-800/60 text-emerald-300 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Resolve Alert
                      </button>
                      <button
                        disabled={transitioning}
                        onClick={() => handleStatusChange('DISMISSED')}
                        className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Dismiss (False Positive)
                      </button>
                    </div>

                    <input
                      type="text"
                      placeholder="Optional justification note for audit log..."
                      value={analystNote}
                      onChange={(e) => setAnalystNote(e.target.value)}
                      className="w-full h-10 bg-[#060913] border border-slate-700 rounded-lg px-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors font-sans"
                    />
                  </div>

                  {/* Alternative Reasoning & Counter-Evidence */}
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-sky-900/40 text-xs space-y-2">
                    <div className="font-bold font-mono text-sky-400 uppercase text-[11px]">
                      Why This May NOT Represent a Threat (Counter-Evidence):
                    </div>
                    <ul className="space-y-1.5 text-slate-300 pl-4 list-disc text-xs leading-relaxed">
                      <li>Transient surveillance network packet loss or antenna handover jitter.</li>
                      <li>Standard operational maneuver (steep tactical descent, TCAS RA advisory).</li>
                      <li>Single-layer detector outlier while remaining ensemble tiers evaluate nominal.</li>
                      <li>Ground receiver multipath reflection or terrain masking.</li>
                    </ul>
                  </div>
                </div>
              );
            })() : (
              <div className="p-12 text-center text-slate-500 text-xs">Select an alert from the left queue to view details and triage.</div>
            )}
          </div>
        </div>
      ) : (
        /* Full Audit Table View */
        <div className="flex-1 bg-[#04070e]/80 border border-slate-800 rounded-xl overflow-y-auto min-h-0">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-slate-900/95 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider z-10 backdrop-blur-sm">
              <tr>
                <th className="py-3 px-4 font-bold">Timestamp</th>
                <th className="py-3 px-4 font-bold">Aircraft / Callsign</th>
                <th className="py-3 px-4 font-bold">Anomaly & Detection Rationale</th>
                <th className="py-3 px-4 font-bold">Severity</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredAlerts.map((a) => {
                const icao = a.icao24 || a.flightId || 'UNKNOWN';
                const reason = a.reason || a.reason_text || a.type || 'Telemetry Anomaly';
                return (
                  <tr key={a.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                      {new Date(a.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-100">{a.callsign || icao.toUpperCase()}</div>
                      <div className="text-[10px] text-cyan-400 font-mono">{icao.toUpperCase()}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-md">
                      {reason}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        a.severity === 'high' ? 'bg-rose-950/70 text-rose-300 border border-rose-800' : 'bg-amber-950/70 text-amber-300 border border-amber-800'
                      }`}>
                        {(a.severity || 'HIGH').toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getStatusBadge(a.status, a.acknowledged)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => onSelectAircraft(icao)}
                        className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-mono font-bold transition-colors"
                      >
                        INVESTIGATE
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
