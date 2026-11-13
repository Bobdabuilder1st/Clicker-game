import React, { useState } from 'react';

interface AdminModalProps {
  isOpen: boolean;
  adminUnlocked: boolean;
  adminFreeMode: boolean;
  onClose: () => void;
  onSubmitCode: (code: string) => boolean;
  onToggleFreeMode: () => void;
  onGrantResources: () => void;
  onExitAdmin: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  adminUnlocked,
  adminFreeMode,
  onClose,
  onSubmitCode,
  onToggleFreeMode,
  onGrantResources,
  onExitAdmin
}) => {
  const [codeInput, setCodeInput] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = onSubmitCode(codeInput);
    if (ok) {
      setError(false);
      setCodeInput('');
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-white">🛠️ Admin Panel</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-xs font-bold text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>

        {!adminUnlocked ? (
          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
            <p className="text-xs text-slate-400">
              Enter the architect code to open all sections with zero cost. A Save State backup of
              your current game is created automatically before Admin mode activates.
            </p>
            <input
              type="text"
              value={codeInput}
              onChange={(e) => {
                setCodeInput(e.target.value);
                setError(false);
              }}
              placeholder="Enter admin code..."
              autoFocus
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-amber-400"
            />
            {error && <div className="text-xs font-semibold text-rose-400">Invalid code.</div>}
            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-amber-400 px-4 py-2 text-xs font-extrabold text-slate-950 hover:bg-amber-300 cursor-pointer"
              >
                Unlock Admin
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/25 p-3 text-xs text-emerald-200">
              Architect Mode Active — A Pre-Admin Save State backup was saved in{' '}
              <strong>Saves</strong> so you can return to your pre-admin run anytime.
            </div>

            <button
              type="button"
              onClick={onToggleFreeMode}
              className={`w-full rounded-xl px-4 py-2.5 text-xs font-extrabold cursor-pointer ${
                adminFreeMode
                  ? 'bg-emerald-400 text-slate-950'
                  : 'border border-slate-700 bg-slate-800 text-slate-200'
              }`}
            >
              No-Cost (Free Purchases): {adminFreeMode ? 'ON' : 'OFF'}
            </button>

            <button
              type="button"
              onClick={onGrantResources}
              className="w-full rounded-xl border border-amber-400/50 bg-amber-500/15 px-4 py-2.5 text-xs font-extrabold text-amber-200 hover:bg-amber-500/25 cursor-pointer"
            >
              Grant Sandbox Currencies (Coins, RP, PP, TP, Essence, Tokens)
            </button>

            <button
              type="button"
              onClick={() => {
                onExitAdmin();
                onClose();
              }}
              className="w-full rounded-xl border border-rose-500/40 bg-rose-950/30 px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-900/40 cursor-pointer"
            >
              Disable Admin Mode
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
