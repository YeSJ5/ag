import React, { useEffect, useState, useCallback } from 'react';
import type { AnalystNote } from '../../types';
import { fetchAnalystNotes, createAnalystNote } from '../../services/api';

interface AnalystNotesWidgetProps {
  targetType: 'aircraft' | 'alert' | 'event' | 'case';
  targetId: string;
}

export const AnalystNotesWidget: React.FC<AnalystNotesWidgetProps> = ({ targetType, targetId }) => {
  const [notes, setNotes] = useState<AnalystNote[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [newNote, setNewNote] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadNotes = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchAnalystNotes(targetType, targetId)
      .then((data) => {
        setNotes(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load analyst notes');
        setLoading(false);
      });
  }, [targetType, targetId]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      await createAnalystNote({
        target_type: targetType,
        target_id: targetId,
        content: newNote.trim(),
      });
      setNewNote('');
      loadNotes();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save note';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#0b1220] border border-slate-800 rounded-xl p-5 sm:p-6 text-slate-100 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-2">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-white tracking-tight uppercase font-mono">
            Analyst Qualitative Dossier Notes
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Peer-reviewed observations attached to {targetType} {targetId.toUpperCase()}
          </p>
        </div>
        <span className="px-2.5 py-0.5 rounded text-xs font-mono font-semibold bg-slate-800 text-sky-400 border border-slate-700 self-start sm:self-center">
          {notes.length} Notes Logged
        </span>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
          <span>▲</span>
          <span>{error}</span>
        </div>
      )}

      {/* New Note Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder={`Add analyst observation or investigation disposition regarding ${targetId.toUpperCase()}...`}
            rows={2}
            className="flex-1 bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans resize-y"
          />
          <button
            type="submit"
            disabled={submitting || !newNote.trim()}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-500 text-black rounded-lg text-xs font-bold font-mono transition-colors self-end sm:self-auto cursor-pointer"
          >
            {submitting ? 'Saving...' : 'Post Note'}
          </button>
        </div>
      </form>

      {/* Notes List */}
      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400 font-mono">
          Loading analyst dossier records...
        </div>
      ) : notes.length === 0 ? (
        <div className="p-8 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-500 font-sans">
          No analyst notes recorded yet for this subject. Add the first observation above.
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((n) => {
            const dateStr = new Date(n.created_at).toLocaleString([], {
              dateStyle: 'short',
              timeStyle: 'short',
            });

            return (
              <div
                key={n.id}
                className="p-3.5 rounded-xl bg-[#0f172a]/90 border border-slate-800 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold font-mono text-sky-400">
                    ✍ {n.author_email}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    {dateStr}
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-sans">
                  {n.content}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
