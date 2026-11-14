import React from 'react';
import { AchievementsState } from '../types/game';

interface AchievementsModalProps {
  isOpen: boolean;
  achievements: AchievementsState;
  codeClickerUnlocked: boolean;
  onClose: () => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  isOpen,
  achievements,
  codeClickerUnlocked,
  onClose
}) => {
  if (!isOpen) return null;

  const list = [
    {
      id: 'firstRebirth',
      title: 'First Rebirth',
      description: 'Ascend through Rebirth for the very first time.',
      icon: '🔄',
      unlocked: achievements.firstRebirth,
      rewardText: achievements.firstRebirth
        ? codeClickerUnlocked
          ? 'Reward Claimed: Auto-Clicker unlocked (Code: clicker)'
          : 'Secret Code Revealed: clicker (Enter in Codes!)'
        : 'Unlocks a secret Auto-Clicker code upon completion'
    },
    {
      id: 'firstPrestige',
      title: 'First Prestige',
      description: 'Reach 1,000,000 RP and complete your first Cosmic Prestige.',
      icon: '💎',
      unlocked: achievements.firstPrestige,
      rewardText: 'Marks entry into exponential Prestige scaling'
    },
    {
      id: 'firstSkillTree',
      title: 'First Skill Tree',
      description: 'Reach 1,000,000 Gems and harvest your first Leaf.',
      icon: '🍃',
      unlocked: achievements.firstSkillTree,
      rewardText: 'Marks awakening of the World Skill Tree'
    }
  ];

  const unlockedCount = list.filter((a) => a.unlocked).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-white">🏆 Achievements</h3>
            <p className="text-xs text-slate-400">
              {unlockedCount}/{list.length} Completed
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

        <div className="mt-4 space-y-3">
          {list.map((ach) => (
            <div
              key={ach.id}
              className={`flex items-start gap-3 rounded-2xl border p-3.5 ${
                ach.unlocked
                  ? 'border-amber-400/50 bg-amber-950/25'
                  : 'border-slate-800 bg-slate-950/60 opacity-65'
              }`}
            >
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-2xl ${
                  ach.unlocked
                    ? 'border-amber-400/50 bg-amber-500/20'
                    : 'border-slate-800 bg-slate-900'
                }`}
              >
                {ach.unlocked ? ach.icon : '🔒'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-white">{ach.title}</span>
                  <span
                    className={`text-[10px] font-extrabold uppercase ${
                      ach.unlocked ? 'text-emerald-300' : 'text-slate-500'
                    }`}
                  >
                    {ach.unlocked ? 'Unlocked' : 'Locked'}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-400">{ach.description}</p>
                <p className="mt-1 font-mono text-[11px] text-amber-300">{ach.rewardText}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface FirstRebirthPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onRedeemClickerNow: () => void;
}

export const FirstRebirthPopup: React.FC<FirstRebirthPopupProps> = ({
  isOpen,
  onClose,
  onRedeemClickerNow
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-purple-400/60 bg-gradient-to-br from-slate-900 via-purple-950/50 to-slate-900 p-6 text-center shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-400/50 bg-amber-500/20 text-4xl shadow-lg">
          🏆
        </div>
        <div className="mt-3 text-xs font-extrabold uppercase tracking-widest text-purple-300">
          Achievement Unlocked!
        </div>
        <h3 className="mt-1 text-xl font-extrabold text-white">First Rebirth</h3>
        <p className="mt-2 text-xs leading-relaxed text-slate-300">
          Congratulations on your first Rebirth! You have unlocked a special code that grants a free{' '}
          <strong className="text-amber-300">Auto-Clicker (+100 clicks/sec)</strong>:
        </p>

        <div className="mt-4 rounded-2xl border border-amber-400/50 bg-slate-950/90 px-4 py-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Secret Auto-Clicker Code
          </div>
          <div className="mt-1 font-mono text-2xl font-black tracking-wider text-amber-300 select-all">
            clicker
          </div>
        </div>

        <div className="mt-5 flex items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              onRedeemClickerNow();
              onClose();
            }}
            className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-2.5 text-xs font-extrabold text-slate-950 shadow-lg hover:brightness-110 cursor-pointer"
          >
            Redeem &ldquo;clicker&rdquo; Now
          </button>
        </div>
      </div>
    </div>
  );
};
