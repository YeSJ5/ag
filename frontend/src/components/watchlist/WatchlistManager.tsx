import React, { useEffect, useState, useCallback } from 'react';
import type { WatchlistItem } from '../../types';
import { fetchWatchlist, addToWatchlist, removeFromWatchlist } from '../../services/api';

interface WatchlistManagerProps {
  onSelectAircraft: (icao24: string) => void;
}

export const WatchlistManager: React.FC<WatchlistManagerProps> = ({ onSelectAircraft }) => {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [newIcao, setNewIcao] = useState<string>('');
  const [newCallsign, setNewCallsign] = useState<string>('');
  const [newPriority, setNewPriority] = useState<string>('HIGH');
  const [newNotes, setNewNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  const loadWatchlist = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchWatchlist()
      .then((data) => {
        setItems(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch watchlist');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadWatchlist();
  }, [loadWatchlist]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIcao.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      await addToWatchlist({
        icao24: newIcao.trim().toLowerCase(),
        callsign: newCallsign.trim() || undefined,
        priority: newPriority,
        notes: newNotes.trim() || undefined,
      });
      setNewIcao('');
      setNewCallsign('');
      setNewNotes('');
      setShowAddForm(false);
      loadWatchlist();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add aircraft to watchlist';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (icao: string) => {
    try {
      await removeFromWatchlist(icao);
      loadWatchlist();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to remove aircraft';
      setError(msg);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return (
          <span className="px-2 py-0.5 rounded bg-rose-950/40 text-rose-300 border border-rose-800 text-[10px] font-bold font-mono">
            CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-800 text-[10px] font-bold font-mono">
            HIGH
          </span>
        );
      case 'ELEVATED':
        return (
          <span className="px-2 py-0.5 rounded bg-sky-950/40 text-sky-300 border border-sky-800 text-[10px] font-bold font-mono">
            ELEVATED
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-medium font-mono">
            ROUTINE
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
            Priority Watchlist & Monitored Targets
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Operator-curated high-priority target queue with persistent surveillance tagging
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddForm((prev) => !prev)}
            className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold font-mono transition-colors shadow-sm cursor-pointer"
          >
            {showAddForm ? '✕ Close Form' : '+ Add Target'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
          <span>▲</span>
          <span>{error}</span>
        </div>
      )}

      {/* Add Target Form Modal / Collapsible */}
      {showAddForm && (
        <form onSubmit={handleAdd} className="p-5 rounded-xl bg-[#0f172a] border border-slate-700 space-y-4 animate-fadeIn">
          <div className="text-xs font-bold uppercase font-mono text-slate-300 pb-2 border-b border-slate-800">
            Enlist Target Airframe
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                ICAO 24-Bit Hex
              </label>
              <input
                type="text"
                required
                placeholder="e.g. a26454"
                value={newIcao}
                onChange={(e) => setNewIcao(e.target.value)}
                className="w-full h-9 bg-[#060913] border border-slate-700 rounded-lg px-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                Callsign / Flight ID
              </label>
              <input
                type="text"
                placeholder="e.g. N250AA"
                value={newCallsign}
                onChange={(e) => setNewCallsign(e.target.value)}
                className="w-full h-9 bg-[#060913] border border-slate-700 rounded-lg px-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                Priority Level
              </label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                className="w-full h-9 bg-[#060913] border border-slate-700 rounded-lg px-3 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
              >
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="ELEVATED">ELEVATED</option>
                <option value="ROUTINE">ROUTINE</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
              Surveillance Justification Note
            </label>
            <input
              type="text"
              placeholder="e.g. Erratic altitude oscillations reported in sector Bravo..."
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              className="w-full h-9 bg-[#060913] border border-slate-700 rounded-lg px-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 bg-slate-800 text-slate-400 rounded-lg text-xs font-medium hover:bg-slate-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg text-xs font-bold font-mono transition-colors cursor-pointer"
            >
              {submitting ? 'Enlisting...' : 'Enlist Aircraft'}
            </button>
          </div>
        </form>
      )}

      {/* Target Queue Table */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">
          Loading monitored targets...
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 rounded-xl bg-slate-900/40 border border-slate-800 text-center space-y-2">
          <div className="text-slate-300 font-semibold text-sm">Watchlist Empty</div>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No target aircraft currently on your watchlist. Click &quot;+ Add Target&quot; above or select an aircraft from the 3D Airspace Map.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-900/90 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Aircraft</th>
                <th className="py-3 px-4">ICAO Hex</th>
                <th className="py-3 px-4">Surveillance Notes</th>
                <th className="py-3 px-4">Enlisted</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-[#0f172a]/60">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-4 whitespace-nowrap">
                    {getPriorityBadge(item.priority)}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-100 whitespace-nowrap font-sans">
                    {item.callsign || item.icao24.toUpperCase()}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                    {item.icao24.toUpperCase()}
                  </td>
                  <td className="py-3 px-4 max-w-xs truncate text-slate-400">
                    {item.notes || '—'}
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                    <button
                      onClick={() => onSelectAircraft(item.icao24)}
                      className="px-2.5 py-1 bg-sky-950/60 hover:bg-sky-900 border border-sky-800/80 text-sky-300 rounded text-xs font-medium transition-colors cursor-pointer"
                    >
                      Focus Target →
                    </button>
                    <button
                      onClick={() => handleRemove(item.icao24)}
                      className="px-2.5 py-1 bg-rose-950/40 hover:bg-rose-900 border border-rose-800/60 text-rose-400 rounded text-xs font-medium transition-colors cursor-pointer"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
