import React from 'react';
import { MultiBuyAmount, NotationType, TieredPerk } from '../../types/game';
import { formatNum } from '../../utils/format';
import { isTieredItemMaxed, previewTieredPurchase } from '../../hooks/useGameEngine';
import { MultiBuyBar } from '../MultiBuyBar';

interface PrestigePanelProps {
  rebirthPoints: number;
  prestigeLevel: number;
  prestigePoints: number;
  lifetimePrestigePoints: number;
  treePoints: number;
  tpToPpMultiplier: number;
  tpToPpPhase: 'exponential' | 'diminishing' | 'capped';
  essenceToPpMultiplier: number;
  boostCapCeiling: number;
  rpPerSecond: number;
  ppPerSecond: number;
  effectivePrestigeScale: number;
  prestigeBuyInfo: {
    count: number;
    totalCost: number;
    canAfford: boolean;
    nextSingleCost: number;
  };
  projectedPrestigePointsGain: number;
  prestigeUpgrades: TieredPerk[];
  multiBuy: MultiBuyAmount;
  globalScaleReduction: number;
  hardCostMult: number;
  notation: NotationType;
  adminFreeMode: boolean;
  onMultiBuyChange: (val: MultiBuyAmount) => void;
  onRequestPrestige: () => void;
  onBuyPrestigeUpgrade: (id: string) => void;
}

const PrestigePanel: React.FC<PrestigePanelProps> = ({
  rebirthPoints,
  prestigeLevel,
  prestigePoints,
  lifetimePrestigePoints,
  treePoints,
  tpToPpMultiplier,
  tpToPpPhase,
  essenceToPpMultiplier,
  boostCapCeiling,
  rpPerSecond,
  ppPerSecond,
  effectivePrestigeScale,
  prestigeBuyInfo,
  projectedPrestigePointsGain,
  prestigeUpgrades,
  multiBuy,
  globalScaleReduction,
  hardCostMult,
  notation,
  adminFreeMode,
  onMultiBuyChange,
  onRequestPrestige,
  onBuyPrestigeUpgrade
}) => {
  const activePrestigeUpgrades = prestigeUpgrades.filter((u) => !isTieredItemMaxed(u));
  const maxedPrestigeCount = prestigeUpgrades.length - activePrestigeUpgrades.length;
  const rpProgress = adminFreeMode
    ? 100
    : Math.min(100, (rebirthPoints / Math.max(1, prestigeBuyInfo.nextSingleCost)) * 100);

  return (
    <div className="flex flex-col gap-5">
      {/* Prestige Portal (Costs 1,000,000 Rebirth Points) */}
      <div className="rounded-3xl border border-cyan-500/40 bg-gradient-to-br from-slate-900 via-cyan-950/35 to-slate-900 p-5 shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-cyan-300">
              Cosmic Prestige · Tier {prestigeLevel}
            </div>
            <h2 className="mt-0.5 text-xl font-extrabold text-white">
              {formatNum(prestigePoints, notation)} Prestige Points 💎
            </h2>
            <p className="mt-1 text-xs text-slate-300">
              Lifetime PP:{' '}
              <strong className="font-mono text-cyan-200 tabular-nums">
                {formatNum(lifetimePrestigePoints, notation)}
              </strong>{' '}
              · 1B PP = 1 Tree Point in Skill Tree.
              {rpPerSecond > 0 && (
                <span className="ml-1.5 text-emerald-300">
                  · Conduit: +{formatNum(rpPerSecond, notation)} RP/s
                </span>
              )}
              {ppPerSecond > 0 && (
                <span className="ml-1.5 text-cyan-300">
                  · +{formatNum(ppPerSecond, notation)} PP/s
                </span>
              )}
            </p>
            <p className="mt-0.5 text-xs text-emerald-300/90">
              Tree Points ({formatNum(treePoints, notation)} TP) → PP Gain:{' '}
              <strong className="font-mono tabular-nums">
                ×{formatNum(tpToPpMultiplier, notation)}
              </strong>{' '}
              ({tpToPpPhase} · Cap {formatNum(boostCapCeiling, notation)})
              {essenceToPpMultiplier > 1 && (
                <span className="ml-1.5 text-rose-300">
                  · Essence → PP: ×{formatNum(essenceToPpMultiplier, notation)}
                </span>
              )}
            </p>
          </div>

          <MultiBuyBar value={multiBuy} onChange={onMultiBuyChange} compact />
        </div>

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              Prestige Threshold (Starts at 1,000,000 RP · Scale {effectivePrestigeScale.toFixed(2)}x)
            </span>
            <span className="font-mono font-semibold text-cyan-200 tabular-nums">
              {formatNum(rebirthPoints, notation)} /{' '}
              {adminFreeMode ? 'FREE' : `${formatNum(prestigeBuyInfo.totalCost, notation)} RP`}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800/90">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-sky-500 transition-all duration-300"
              style={{ width: `${rpProgress}%` }}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            Resets Coins, Buildings, Upgrades, Coin Core, and Rebirth. Prestige Points also boost RP!
          </div>

          <button
            type="button"
            disabled={!prestigeBuyInfo.canAfford}
            onClick={onRequestPrestige}
            className={`rounded-xl px-5 py-2.5 text-sm font-extrabold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              prestigeBuyInfo.canAfford
                ? 'bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950 shadow-lg shadow-cyan-500/25 hover:brightness-110 active:scale-95'
                : 'cursor-not-allowed bg-slate-800 text-slate-500'
            }`}
          >
            {prestigeBuyInfo.canAfford
              ? `Prestige +${prestigeBuyInfo.count} (+${formatNum(projectedPrestigePointsGain, notation)} 💎)`
              : `Need ${formatNum(prestigeBuyInfo.nextSingleCost, notation)} RP`}
          </button>
        </div>
      </div>

      {/* Prestige Upgrades (Max Tier 30, 10x surge in upper tiers) */}
      <div>
        <div className="mb-2.5 flex items-center justify-between px-1">
          <div>
            <h3 className="text-sm font-bold text-white">
              Prestige Upgrades (Max Tier 30)
              {maxedPrestigeCount > 0 && (
                <span className="ml-2 font-mono text-xs text-emerald-300">
                  {maxedPrestigeCount}/{prestigeUpgrades.length} Maxed
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              Upper tiers scale exponentially by 10x per tier. Maxed Tier 30 upgrades disappear.
            </p>
          </div>
        </div>

        {activePrestigeUpgrades.length === 0 ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-6 text-center text-sm font-bold text-emerald-300">
            All Prestige Upgrades are maxed at Tier 30!
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
            {activePrestigeUpgrades.map((upg) => {
              const preview = previewTieredPurchase(
                upg,
                prestigePoints,
                multiBuy,
                globalScaleReduction,
                adminFreeMode,
                hardCostMult
              );
              const isConduit = upg.id === 'pu_conduit';

              return (
                <div
                  key={upg.id}
                  className={`flex flex-col justify-between gap-3 rounded-2xl border p-4 transition-colors ${
                    isConduit
                      ? 'border-emerald-500/45 bg-emerald-950/20'
                      : 'border-slate-800 bg-slate-900/80 hover:border-cyan-500/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-950/40 text-xl">
                      {upg.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-bold text-white">
                          {upg.name}{' '}
                          <span className="text-cyan-300">
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
                          <strong className="font-mono text-cyan-200 tabular-nums">
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
                    onClick={() => onBuyPrestigeUpgrade(upg.id)}
                    className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                      preview.canAfford
                        ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300 active:scale-[0.98]'
                        : 'cursor-not-allowed bg-slate-800 text-slate-500'
                    }`}
                  >
                    <span>
                      Upgrade +{preview.count}
                      {preview.willEvolve ? ' (Evolves Tier!)' : ''}
                    </span>
                    <span className="font-mono tabular-nums">
                      {adminFreeMode ? 'FREE' : `${formatNum(preview.totalCost, notation)} 💎`}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(PrestigePanel);
