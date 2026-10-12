import React, { useEffect, useState } from 'react';
import type { AircraftDetailResponse, Flight, WatchlistItem } from '../../types';
import { fetchAircraftDetail, fetchWatchlist } from '../../services/api';
import { AircraftTrustCenter } from './AircraftTrustCenter';
import { DetectorAgreementMatrix } from './DetectorAgreementMatrix';
import { WhyThisAircraft } from './WhyThisAircraft';
import { ShapExplanationCenter } from './ShapExplanationCenter';
import { WhatChangedPanel } from './WhatChangedPanel';
import { InvestigationNarrative } from './InvestigationNarrative';
import { AirspaceCorrelationPanel } from './AirspaceCorrelationPanel';
import { AnalystNotesWidget } from './AnalystNotesWidget';
import { AircraftComparisonModal } from './AircraftComparisonModal';

interface InvestigateViewProps {
  selectedIcao: string | null;
  availableFlights: Flight[];
  onSelectIcao: (icao: string) => void;
}

export const InvestigateView: React.FC<InvestigateViewProps> = ({
  selectedIcao,
  availableFlights,
  onSelectIcao,
}) => {
  const activeIcao = selectedIcao || (availableFlights.length > 0 ? availableFlights[0].id : null);
  const [detail, setDetail] = useState<AircraftDetailResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'EVIDENCE' | 'NARRATIVE' | 'DELTA' | 'CORRELATION' | 'NOTES'>('OVERVIEW');
  const [showComparison, setShowComparison] = useState<boolean>(false);
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);

  useEffect(() => {
    fetchWatchlist().then(setWatchlistItems).catch(() => {});
  }, []);

  useEffect(() => {
    if (!activeIcao) return;
    let isMounted = true;
    setLoading(true);
    setError(null);

    fetchAircraftDetail(activeIcao)
      .then((data) => {
        if (isMounted) {
          setDetail(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || `Failed to fetch telemetry details for ${activeIcao}`);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeIcao]);

  const watchlistItem = watchlistItems.find(
    (w) => activeIcao && w.icao24.toLowerCase() === activeIcao.toLowerCase()
  );

  return (
    <div className="flex flex-col space-y-6 max-w-7xl mx-auto text-slate-100 p-2 sm:p-4">
      {/* Target Selector Bar */}
      <div className="bg-[#0b1220] border border-slate-800 rounded-xl p-4 sm:p-5 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Airframe Dropdown */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold font-mono text-cyan-400 uppercase tracking-wider">
            Target Airframe:
          </span>
          <select
            value={activeIcao || ''}
            onChange={(e) => onSelectIcao(e.target.value)}
            className="h-9 bg-[#060913] border border-slate-700 rounded-lg px-3 text-xs sm:text-sm text-slate-100 font-mono font-semibold focus:outline-none focus:border-cyan-500 transition-colors"
          >
            {availableFlights.map((f) => (
              <option key={f.id} value={f.id}>
                {f.callsign || `AC-${f.id.toUpperCase()}`} ({f.id.toUpperCase()}) — Trust {f.trustScore}%
              </option>
            ))}
          </select>
        </div>

        {/* Tab Sub-Navigation */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['OVERVIEW', 'EVIDENCE', 'NARRATIVE', 'DELTA', 'CORRELATION', 'NOTES'] as const).map((tabId) => {
            const labels: Record<typeof tabId, string> = {
              OVERVIEW: 'Trust & Overview',
              EVIDENCE: 'Evidence & SHAP',
              NARRATIVE: 'Timeline Narrative',
              DELTA: 'What Changed?',
              CORRELATION: 'Airspace Correlation',
              NOTES: 'Analyst Notes',
            };
            return (
              <button
                key={tabId}
                onClick={() => setActiveTab(tabId)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                  activeTab === tabId
                    ? 'bg-cyan-500 text-black border-cyan-400 shadow-sm'
                    : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 border-slate-700'
                }`}
              >
                {labels[tabId]}
              </button>
            );
          })}

          <button
            onClick={() => setShowComparison(true)}
            className="px-3 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900 border border-purple-700 text-purple-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            ⚖ Compare Airframe
          </button>
        </div>
      </div>

      {loading && !detail && (
        <div className="p-16 text-center text-xs text-slate-400 font-mono">
          Loading aircraft intelligence dossier and kinematic telemetry...
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
          <span>▲</span>
          <span>{error}</span>
        </div>
      )}

      {detail && activeIcao && (
        <div className="space-y-6">
          {/* Primary Trust Center Anchor */}
          <AircraftTrustCenter
            detail={detail}
            onOpenNarrative={() => setActiveTab('NARRATIVE')}
            onOpenDelta={() => setActiveTab('DELTA')}
            onOpenCorrelation={() => setActiveTab('CORRELATION')}
            onOpenComparison={() => setShowComparison(true)}
            onAddNote={() => setActiveTab('NOTES')}
            watchlistItem={watchlistItem}
          />

          {/* Sub-view Content */}
          {activeTab === 'OVERVIEW' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DetectorAgreementMatrix detail={detail} />
              <WhyThisAircraft detail={detail} />
            </div>
          )}

          {activeTab === 'EVIDENCE' && (
            <div className="space-y-6">
              <WhyThisAircraft detail={detail} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DetectorAgreementMatrix detail={detail} />
                <ShapExplanationCenter detail={detail} />
              </div>
            </div>
          )}

          {activeTab === 'NARRATIVE' && (
            <InvestigationNarrative icao24={activeIcao} />
          )}

          {activeTab === 'DELTA' && (
            <WhatChangedPanel icao24={activeIcao} />
          )}

          {activeTab === 'CORRELATION' && (
            <AirspaceCorrelationPanel icao24={activeIcao} onSelectNeighbor={onSelectIcao} />
          )}

          {activeTab === 'NOTES' && (
            <AnalystNotesWidget targetType="aircraft" targetId={activeIcao} />
          )}
        </div>
      )}

      {/* Comparison Modal */}
      {showComparison && activeIcao && (
        <AircraftComparisonModal
          primaryIcao={activeIcao}
          availableFlights={availableFlights}
          onClose={() => setShowComparison(false)}
          onSelectSubject={onSelectIcao}
        />
      )}
    </div>
  );
};
