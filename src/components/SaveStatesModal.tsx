import React, { useState } from 'react';
import { SaveStateEntry } from '../types/game';

interface SaveStatesModalProps {
  isOpen: boolean;
  saveStates: SaveStateEntry[];
  onClose: () => void;
  onCreateSave: (name?: string) => void;
  onLoadSave: (id: string) => void;
  onDeleteSave: (id: string) => void;
}

export const SaveStatesModal: React.FC<SaveStatesModalProps> = ({
  isOpen,
  saveStates,
  onClose,
  onCreateSave,
  onLoadSave,
  onDeleteSave
}) => {
  const [saveName, setSaveName] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateSave(saveName || `Save #${saveStates.length + 1}`);
    setSaveName('');
    setStatusMessage('Save state created!');
    window.setTimeout(() => setStatusMessage(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-white">💾 Save States</h3>
            <p className="text-xs text-slate-400">
              Create snapshots at any point or restore pre-Admin backups.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2.5 py-1 text-xs font-bold text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-4 flex gap-2">
          <input
            type="text"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="Optional save name..."
            className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white outline-none focus:border-amber-400"
          />
          <button
            type="submit"
            className="rounded-xl bg-amber-400 px-4 py-2 text-xs font-extrabold text-slate-950 hover:bg-amber-300 cursor-pointer whitespace-nowrap shrink-0"
          >
            + Save State
          </button>
        </form>

        {statusMessage && (
          <div className="mt-2 rounded-xl border border-emerald-500/40 bg-emerald-950/30 px-3 py-1.5 text-xs font-semibold text-emerald-300">
            {statusMessage}
          </div>
        )}

        <div className="mt-4 flex-1 space-y-2.5 overflow-y-auto pr-1">
          {saveStates.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/50 p-6 text-center text-xs text-slate-400">
              No save states yet. Click <strong>+ Save State</strong> above or turn on Admin mode to
              auto-backup your progress!
            </div>
          ) : (
            saveStates.map((entry) => (
              <div
                key={entry.id}
                className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3.5 ${
                  entry.isAutoBackup
                    ? 'border-cyan-500/40 bg-cyan-950/20'
                    : 'border-slate-800 bg-slate-950/60'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-bold text-white">{entry.name}</span>
                    {entry.isAutoBackup && (
                      <span className="rounded-md bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-bold text-cyan-300">
                        Pre-Admin Backup
                      </span>
                    )}
                    {entry.data.hardMode && (
                      <span className="rounded-md bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-bold text-rose-300">
                        HARD 10x
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 font-mono text-[11px] text-slate-300">{entry.summary}</div>
                  <div className="mt-0.5 text-[10px] text-slate-500">
                    {new Date(entry.createdAt).toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      onLoadSave(entry.id);
                      onClose();
                    }}
                    className="rounded-xl bg-emerald-400 px-3 py-1.5 text-xs font-extrabold text-slate-950 hover:bg-emerald-300 cursor-pointer"
                  >
                    Load
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteSave(entry.id)}
                    className="rounded-xl border border-rose-500/40 bg-rose-950/30 px-2.5 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-900/40 cursor-pointer"
                    title="Delete save state"
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
