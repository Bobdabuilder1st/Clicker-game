import React, { useState } from 'react';

interface CodesModalProps {
  isOpen: boolean;
  hardMode: boolean;
  codeClickerUnlocked: boolean;
  adminUnlocked: boolean;
  onClose: () => void;
  onRedeemCode: (code: string) => { ok: boolean; type?: 'hard' | 'clicker' | 'admin'; message: string };
}

export const CodesModal: React.FC<CodesModalProps> = ({
  isOpen,
  hardMode,
  codeClickerUnlocked,
  adminUnlocked,
  onClose,
  onRedeemCode
}) => {
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const res = onRedeemCode(input);
    setFeedback({ ok: res.ok, message: res.message });
    if (res.ok) setInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-white">🎟️ Redeem Codes</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2.5 py-1 text-xs font-bold text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>

        <p className="mt-2 text-xs text-slate-400">
          Enter secret or challenge codes below (e.g. challenge modes, achievement codes, or admin).
        </p>

        <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setFeedback(null);
            }}
            placeholder="Type code (e.g. HARD, clicker)..."
            autoFocus
            className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-amber-400"
          />
          <button
            type="submit"
            className="rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-extrabold text-slate-950 hover:bg-amber-300 cursor-pointer whitespace-nowrap shrink-0"
          >
            Redeem
          </button>
        </form>

        {feedback && (
          <div
            className={`mt-3 rounded-xl border px-3.5 py-2 text-xs font-semibold ${
              feedback.ok
                ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300'
                : 'border-rose-500/40 bg-rose-950/30 text-rose-300'
            }`}
          >
            {feedback.message}
          </div>
        )}

        <div className="mt-4 space-y-2 rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5 text-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Active Modifiers
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-300">HARD Mode (10x All Costs)</span>
            <span className={hardMode ? 'font-bold text-rose-400' : 'text-slate-500'}>
              {hardMode ? 'ACTIVE' : 'Inactive'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-300">Code Auto-Clicker (+5/s)</span>
            <span className={codeClickerUnlocked ? 'font-bold text-emerald-300' : 'text-slate-500'}>
              {codeClickerUnlocked ? 'UNLOCKED' : 'Locked'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-300">Admin Panel</span>
            <span className={adminUnlocked ? 'font-bold text-cyan-300' : 'text-slate-500'}>
              {adminUnlocked ? 'UNLOCKED' : 'Locked'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
