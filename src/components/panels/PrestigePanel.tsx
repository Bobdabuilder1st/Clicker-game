import React from 'react';
import {
  ActiveTab,
  AutomationState,
  EssenceConvergenceUpgrade,
  MultiBuyAmount,
  NotationType,
  SectionWaveState,
  TieredPerk
} from '../../types/game';
import { Decimal, formatNum, progressPercent } from '../../utils/format';
import { isTieredItemMaxed, previewTieredPurchase } from '../../hooks/useGameEngine';
import { MultiBuyBar } from '../MultiBuyBar';
import { SectionWaveUpgrades } from '../SectionWaveUpgrades';

interface PrestigePanelProps {
  rebirthPoints: Decimal;
  prestigeLevel: number;
  prestigePoints: Decimal;
  lifetimePrestigePoints: Decimal;
  treePoints: Decimal;
  tpToPpMultiplier: Decimal;
  tpToPpPhase: 'exponential' | 'diminishing' | 'capped';
  essenceToPpMultiplier: Decimal;
  boostCapCeiling: Decimal;
  rpPerSecond: Decimal;
  ppPerSecond: Decimal;
  effectivePrestigeScale: number;
  prestigeBuyInfo: {
    count: number;
    totalCost: Decimal;
    canAfford: boolean;
    nextSingleCost: Decimal;
  };
  projectedPrestigePointsGain: Decimal;
  prestigeUpgrades: TieredPerk[];
  sectionWave: SectionWaveState;
  allPrestigeMaxed: boolean;
  essenceConvergenceOpen: boolean;
  essenceConvergenceUpgrades: EssenceConvergenceUpgrade[];
  essenceConvergenceProgress: {
    rebirthMaxed: number;
    rebirthTotal: number;
    prestigeMaxed: number;
    prestigeTotal: number;
    skillTreeMaxed: number;
    skillTreeTotal: number;
    allRebirthMaxed: boolean;
    allPrestigeMaxed: boolean;
    allSkillTreeMaxed: boolean;
  };
  multiBuy: MultiBuyAmount;
  globalScaleReduction: number;
  hardCostMult: number;
  notation: NotationType;
  hasAutoPrestige: boolean;
  adminFreeMode: boolean;
  automation: AutomationState;
  onMultiBuyChange: (val: MultiBuyAmount) => void;
  onRequestPrestige: () => void;
  onBuyPrestigeUpgrade: (id: string) => void;
  onBuyWaveUpgrade: (tab: ActiveTab, upgradeId: string) => void;
  onBuyEssenceConvergenceUpgrade: (id: string, multiOverride?: MultiBuyAmount) => void;
  onToggleAuto: (key: 'autoBuyPrestigeUpgrades' | 'autoBuyMax') => void;
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
  sectionWave,
  allPrestigeMaxed,
  essenceConvergenceOpen,
  essenceConvergenceUpgrades,
  essenceConvergenceProgress,
  multiBuy,
  globalScaleReduction,
  hardCostMult,
  notation,
  hasAutoPrestige,
  adminFreeMode,
  automation,
  onMultiBuyChange,
  onRequestPrestige,
  onBuyPrestigeUpgrade,
  onBuyWaveUpgrade,
  onBuyEssenceConvergenceUpgrade,
  onToggleAuto
}) => {
  const activePrestigeUpgrades = prestigeUpgrades.filter((u) => !isTieredItemMaxed(u));
  const maxedPrestigeCount = prestigeUpgrades.length - activePrestigeUpgrades.length;
  const gemEssenceUpg = essenceConvergenceUpgrades.find((u) => u.id === 'ec_gem_prism');
  const rpProgress = adminFreeMode
    ? 100
    : progressPercent(rebirthPoints, prestigeBuyInfo.nextSingleCost);

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
              {formatNum(prestigePoints, notation)} Gems 💎
            </h2>
            <p className="mt-1 text-xs text-slate-300">
              Lifetime Gems:{' '}
              <strong className="font-mono text-cyan-200 tabular-nums">
                {formatNum(lifetimePrestigePoints, notation)}
              </strong>{' '}
              · 1M Gems = 1 Leaf in Skill Tree.
              {rpPerSecond.gt(0) && (
                <span className="ml-1.5 text-emerald-300">
                  · Conduit: +{formatNum(rpPerSecond, notation)} RP/s
                </span>
              )}
              {ppPerSecond.gt(0) && (
                <span className="ml-1.5 text-cyan-300">
                  · +{formatNum(ppPerSecond, notation)} Gems/s
                </span>
              )}
            </p>
            <p className="mt-0.5 text-xs text-emerald-300/90">
              Leaves ({formatNum(treePoints, notation)} 🍃) → Gem Gain:{' '}
              <strong className="font-mono tabular-nums">
                ×{formatNum(tpToPpMultiplier, notation)}
              </strong>{' '}
              ({tpToPpPhase} · Cap {formatNum(boostCapCeiling, notation)})
              {essenceToPpMultiplier.gt(1) && (
                <span className="ml-1.5 text-rose-300">
                  · Essence → Gems: ×{formatNum(essenceToPpMultiplier, notation)}
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
            Resets Coins, Buildings, Upgrades, Coin Core, and Rebirth. Gems also boost RP!
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
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 px-1">
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

          {hasAutoPrestige && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onToggleAuto('autoBuyPrestigeUpgrades')}
                className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  automation.autoBuyPrestigeUpgrades
                    ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-300'
                    : 'border-slate-700 bg-slate-800 text-slate-400'
                }`}
              >
                Auto-Buy Prestige: {automation.autoBuyPrestigeUpgrades ? 'ON' : 'OFF'}
              </button>
              <button
                type="button"
                onClick={() => onToggleAuto('autoBuyMax')}
                className={`rounded-xl border px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  automation.autoBuyMax
                    ? 'border-amber-400/60 bg-amber-500/20 text-amber-300'
                    : 'border-slate-700 bg-slate-800 text-slate-300'
                }`}
              >
                Mode: {automation.autoBuyMax ? 'MAX' : '+1'}
              </button>
            </div>
          )}
        </div>

        {allPrestigeMaxed || activePrestigeUpgrades.length === 0 ? (
          <SectionWaveUpgrades
            tab="prestige"
            waveState={sectionWave}
            currency={prestigePoints}
            multiBuy={multiBuy}
            globalScaleReduction={globalScaleReduction}
            hardCostMult={hardCostMult}
            notation={notation}
            adminFreeMode={adminFreeMode}
            onBuyWaveUpgrade={onBuyWaveUpgrade}
          />
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
      {/* 50-Tier Singularity Essence Upgrade (Unlocked when all Rebirth, Prestige & Skill Tree upgrades are maxed) */}
      {(essenceConvergenceProgress.allPrestigeMaxed || essenceConvergenceOpen) &&
        gemEssenceUpg &&
        !isTieredItemMaxed(gemEssenceUpg) && (
        <div className="rounded-3xl border border-fuchsia-500/40 bg-gradient-to-br from-slate-900 via-fuchsia-950/25 to-rose-950/20 p-5 shadow-xl">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-fuchsia-200">
                🌌 50-Tier Singularity Essence Upgrade (Gems)
              </h3>
              <p className="text-xs text-slate-400">
                Unlocked once all Rebirth, Prestige &amp; Skill Tree upgrades are maxed! See all 4 in Singularity.
              </p>
            </div>
            {!essenceConvergenceOpen && (
              <span className="font-mono text-xs text-amber-300 tabular-nums">
                Rebirth {essenceConvergenceProgress.rebirthMaxed}/{essenceConvergenceProgress.rebirthTotal} · Skill Tree {essenceConvergenceProgress.skillTreeMaxed}/{essenceConvergenceProgress.skillTreeTotal}
              </span>
            )}
          </div>

          {essenceConvergenceOpen &&
            (() => {
              const maxed = isTieredItemMaxed(gemEssenceUpg);
              const preview = previewTieredPurchase(
                gemEssenceUpg,
                prestigePoints,
                multiBuy,
                globalScaleReduction,
                adminFreeMode,
                hardCostMult
              );
              return (
                <div className="flex flex-col justify-between gap-3 rounded-2xl border border-fuchsia-500/35 bg-slate-950/85 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-fuchsia-500/30 bg-fuchsia-950/40 text-xl">
                      {gemEssenceUpg.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-bold text-white">
                          {gemEssenceUpg.name}{' '}
                          <span className="text-fuchsia-300">
                            T{gemEssenceUpg.tier}/{gemEssenceUpg.maxTier}
                          </span>
                        </span>
                        <span className="font-mono text-xs font-semibold text-slate-300 tabular-nums shrink-0">
                          {gemEssenceUpg.level}/{gemEssenceUpg.tierMaxLevel}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-400">{gemEssenceUpg.description}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 text-[11px] text-slate-500">
                        <span>
                          Total:{' '}
                          <strong className="font-mono text-rose-200 tabular-nums">
                            +{formatNum(gemEssenceUpg.totalBonus, notation)} {gemEssenceUpg.bonusUnit}
                          </strong>
                        </span>
                        <span>·</span>
                        <span className="font-mono tabular-nums">
                          +{formatNum(gemEssenceUpg.bonusPerLevel, notation)}/lv
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={maxed || !preview.canAfford}
                    onClick={() => onBuyEssenceConvergenceUpgrade(gemEssenceUpg.id, multiBuy)}
                    className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                      maxed
                        ? 'cursor-default bg-emerald-500/20 text-emerald-300'
                        : preview.canAfford
                          ? 'bg-gradient-to-r from-fuchsia-500 to-rose-500 text-white hover:brightness-110 active:scale-[0.98]'
                          : 'cursor-not-allowed bg-slate-800 text-slate-500'
                    }`}
                  >
                    <span>
                      {maxed
                        ? 'MAXED (T50)'
                        : `Ascend +${preview.count}${preview.willEvolve ? ' (Evolves Tier!)' : ''}`}
                    </span>
                    {!maxed && (
                      <span className="font-mono tabular-nums">
                        {adminFreeMode ? 'FREE' : `${formatNum(preview.totalCost, notation)} 💎`}
                      </span>
                    )}
                  </button>
                </div>
              );
            })()}
        </div>
      )}
    </div>
  );
};

export default React.memo(PrestigePanel);
