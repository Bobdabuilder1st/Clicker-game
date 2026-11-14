import React from 'react';
import {
  ActiveTab,
  MultiBuyAmount,
  NotationType,
  SectionWaveState
} from '../types/game';
import { D_ONE, Decimal, formatNum, safeMul } from '../utils/format';
import { SECTION_WAVE_CONFIGS, SECTION_WAVE_MAX_TIER } from '../utils/gameData';
import { isTieredItemMaxed, previewTieredPurchase } from '../hooks/useGameEngine';

interface SectionWaveUpgradesProps {
  tab: ActiveTab;
  waveState: SectionWaveState;
  currency: Decimal;
  multiBuy: MultiBuyAmount;
  globalScaleReduction: number;
  hardCostMult: number;
  notation: NotationType;
  adminFreeMode: boolean;
  onBuyWaveUpgrade: (tab: ActiveTab, upgradeId: string) => void;
}

const ACCENT_MAP: Record<
  ActiveTab,
  { border: string; bg: string; heading: string; badge: string; btn: string }
> = {
  buildings: {
    border: 'border-amber-500/40',
    bg: 'from-slate-900 via-amber-950/20 to-slate-900',
    heading: 'text-amber-200',
    badge: 'text-amber-300',
    btn: 'bg-amber-400 text-slate-950 hover:bg-amber-300'
  },
  upgrades: {
    border: 'border-emerald-500/40',
    bg: 'from-slate-900 via-emerald-950/25 to-slate-900',
    heading: 'text-emerald-200',
    badge: 'text-emerald-300',
    btn: 'bg-emerald-400 text-slate-950 hover:bg-emerald-300'
  },
  rebirth: {
    border: 'border-purple-500/40',
    bg: 'from-slate-900 via-purple-950/25 to-slate-900',
    heading: 'text-purple-200',
    badge: 'text-purple-300',
    btn: 'bg-purple-500 text-white hover:bg-purple-400'
  },
  prestige: {
    border: 'border-cyan-500/40',
    bg: 'from-slate-900 via-cyan-950/25 to-slate-900',
    heading: 'text-cyan-200',
    badge: 'text-cyan-300',
    btn: 'bg-cyan-400 text-slate-950 hover:bg-cyan-300'
  },
  skillTree: {
    border: 'border-emerald-400/40',
    bg: 'from-slate-900 via-teal-950/25 to-slate-900',
    heading: 'text-emerald-200',
    badge: 'text-emerald-300',
    btn: 'bg-emerald-400 text-slate-950 hover:bg-emerald-300'
  },
  singularity: {
    border: 'border-rose-500/45',
    bg: 'from-slate-950 via-rose-950/25 to-fuchsia-950/25',
    heading: 'text-rose-200',
    badge: 'text-rose-300',
    btn: 'bg-rose-500 text-white hover:bg-rose-400'
  },
  timeReset: {
    border: 'border-amber-400/45',
    bg: 'from-slate-950 via-amber-950/25 to-orange-950/20',
    heading: 'text-amber-200',
    badge: 'text-amber-300',
    btn: 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 hover:brightness-110'
  },
  ideal: {
    border: 'border-fuchsia-500/45',
    bg: 'from-slate-950 via-fuchsia-950/25 to-violet-950/25',
    heading: 'text-fuchsia-200',
    badge: 'text-fuchsia-300',
    btn: 'bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white hover:brightness-110'
  }
};

export const SectionWaveUpgrades: React.FC<SectionWaveUpgradesProps> = React.memo(({
  tab,
  waveState,
  currency,
  multiBuy,
  globalScaleReduction,
  hardCostMult,
  notation,
  adminFreeMode,
  onBuyWaveUpgrade
}) => {
  const cfg = SECTION_WAVE_CONFIGS[tab];
  const accent = ACCENT_MAP[tab];
  const activeUpgrades = waveState.upgrades.filter((u) => !isTieredItemMaxed(u));
  const maxedCount = waveState.upgrades.length - activeUpgrades.length;

  let currentWaveMult = waveState.completedWavesBonusMult;
  for (const u of waveState.upgrades) {
    currentWaveMult = safeMul(currentWaveMult, D_ONE.add(u.totalBonus.div(100)));
  }

  return (
    <div className={`rounded-3xl border ${accent.border} bg-gradient-to-br ${accent.bg} p-5 shadow-xl`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={`text-sm font-extrabold ${accent.heading}`}>
              ♾️ {cfg.title} · Wave {waveState.wave} ({SECTION_WAVE_MAX_TIER} Tiers)
            </h3>
            {maxedCount > 0 && (
              <span className="font-mono text-xs font-bold text-emerald-300 tabular-nums">
                {maxedCount}/{waveState.upgrades.length} Maxed
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Every upgrade has 30 tiers and boosts <strong className="text-slate-200">Everything</strong>.
            Maxing all upgrades replaces them with exponentially harder Wave {waveState.wave + 1} upgrades!
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-1.5 text-right">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Section Omni-Boost
          </div>
          <div className={`font-mono text-xs font-extrabold ${accent.badge} tabular-nums`}>
            ×{formatNum(currentWaveMult, notation)} All
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
        {activeUpgrades.map((upg) => {
          const preview = previewTieredPurchase(
            upg,
            currency,
            multiBuy,
            globalScaleReduction,
            adminFreeMode,
            hardCostMult
          );

          return (
            <div
              key={upg.id}
              className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/85 p-4 transition-colors hover:border-slate-600"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700/80 bg-slate-900 text-xl">
                  {upg.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-bold text-white">
                      {upg.name}{' '}
                      <span className={accent.badge}>
                        T{upg.tier}/{upg.maxTier}
                      </span>
                    </span>
                    <span className="font-mono text-xs font-semibold text-slate-300 tabular-nums shrink-0">
                      {upg.level}/{upg.tierMaxLevel}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">{upg.description}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-2 text-[11px] text-slate-500">
                    <span>
                      Total:{' '}
                      <strong className={`font-mono ${accent.badge} tabular-nums`}>
                        +{formatNum(upg.totalBonus, notation)} {upg.bonusUnit}
                      </strong>
                    </span>
                    <span>·</span>
                    <span className="font-mono tabular-nums">
                      +{formatNum(upg.bonusPerLevel, notation)}/lv
                    </span>
                    <span>·</span>
                    <span className="font-mono tabular-nums">
                      Scale {preview.effectiveScale.toFixed(2)}x
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={!preview.canAfford}
                onClick={() => onBuyWaveUpgrade(tab, upg.id)}
                className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                  preview.canAfford
                    ? `${accent.btn} active:scale-[0.98]`
                    : 'cursor-not-allowed bg-slate-800 text-slate-500'
                }`}
              >
                <span>
                  Upgrade +{preview.count}
                  {preview.willEvolve ? ' (Evolves Tier!)' : ''}
                </span>
                <span className="font-mono tabular-nums">
                  {adminFreeMode ? 'FREE' : `${formatNum(preview.totalCost, notation)} ${cfg.currencySymbol}`}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default SectionWaveUpgrades;
