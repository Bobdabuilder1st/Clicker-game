import React from 'react';
import {
  AutomationState,
  MultiBuyAmount,
  NotationType,
  SingularityUpgrade
} from '../../types/game';
import { formatNum, safePow } from '../../utils/format';
import { ESSENCE_REACTOR_MAX_LEVEL } from '../../utils/gameData';
import { isTieredItemMaxed, previewTieredPurchase } from '../../hooks/useGameEngine';
import { MultiBuyBar } from '../MultiBuyBar';

interface SingularityPanelProps {
  treePoints: number;
  singularityCount: number;
  singularityCoreLevel: number;
  singularityEssence: number;
  singularityCost: number;
  canSingularity: boolean;
  projectedEssenceGain: number;
  coreCoinMult: number;
  coreRpMult: number;
  corePpMult: number;
  coreTpMult: number;
  effectiveCoreScale: number;
  singularityCoreBuyInfo: {
    count: number;
    totalCost: number;
    canAfford: boolean;
    nextSingleCost: number;
  };
  singularityUpgrades: SingularityUpgrade[];
  essenceReactorLevel: number;
  reactorUnlocked: boolean;
  reactorBuyInfo: {
    count: number;
    totalCost: number;
    canAfford: boolean;
    nextSingleCost: number;
  };
  essencePerSecond: number;
  tpPerSecond: number;
  hasAutoBuildings: boolean;
  hasAutoUpgrades: boolean;
  hasAutoRebirth: boolean;
  hasAutoClicker: boolean;
  automation: AutomationState;
  multiBuy: MultiBuyAmount;
  globalScaleReduction: number;
  notation: NotationType;
  adminFreeMode: boolean;
  onMultiBuyChange: (val: MultiBuyAmount) => void;
  onRequestSingularity: () => void;
  onLevelUpCore: () => void;
  onBuySingularityUpgrade: (id: string) => void;
  onBuyEssenceReactor: () => void;
  onToggleAuto: (
    key: 'autoBuyBuildings' | 'autoBuyUpgrades' | 'autoLevelClicker' | 'autoBuyRebirthUpgrades'
  ) => void;
}

const SingularityPanel: React.FC<SingularityPanelProps> = ({
  treePoints,
  singularityCount,
  singularityCoreLevel,
  singularityEssence,
  singularityCost,
  canSingularity,
  projectedEssenceGain,
  coreCoinMult,
  coreRpMult,
  corePpMult,
  coreTpMult,
  effectiveCoreScale,
  singularityCoreBuyInfo,
  singularityUpgrades,
  essenceReactorLevel,
  reactorUnlocked,
  reactorBuyInfo,
  essencePerSecond,
  tpPerSecond,
  hasAutoBuildings,
  hasAutoUpgrades,
  hasAutoRebirth,
  hasAutoClicker,
  automation,
  multiBuy,
  globalScaleReduction,
  notation,
  adminFreeMode,
  onMultiBuyChange,
  onRequestSingularity,
  onLevelUpCore,
  onBuySingularityUpgrade,
  onBuyEssenceReactor,
  onToggleAuto
}) => {
  const tpProgress = adminFreeMode
    ? 100
    : Math.min(100, (treePoints / Math.max(1, singularityCost)) * 100);

  const activeUpgrades = singularityUpgrades.filter((u) => !isTieredItemMaxed(u));
  const anyAutoUnlocked = hasAutoBuildings || hasAutoUpgrades || hasAutoRebirth || hasAutoClicker;
  const reactorPerUnitRate = 10 * safePow(2, Math.floor(essenceReactorLevel / 5));

  return (
    <div className="flex flex-col gap-5">
      {/* Singularity Reset (1B Tree Points, 10x per purchase, ONLY 1 at a time!) */}
      <div className="relative overflow-hidden rounded-3xl border border-rose-500/45 bg-gradient-to-br from-slate-950 via-rose-950/35 to-fuchsia-950/30 p-5 shadow-2xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-rose-300">
              Singularity Layer · Ascension #{singularityCount}
            </div>
            <h2 className="mt-0.5 text-xl font-extrabold text-white">
              {formatNum(singularityEssence, notation)} Singularity Essence 🕳️
            </h2>
            <p className="mt-1 max-w-xl text-xs text-slate-300">
              Resets <strong className="text-rose-200">Coins, Rebirth, Prestige, and Skill Tree</strong>.
              Each Singularity gives <strong className="text-rose-200">+1 more Essence</strong> than
              the last (Next: +{projectedEssenceGain} 🕳️) and costs 10x more Tree Points!
              {tpPerSecond > 0 && (
                <span className="ml-1.5 text-emerald-300">
                  · +{formatNum(tpPerSecond, notation)} TP/s
                </span>
              )}
              {essencePerSecond > 0 && (
                <span className="ml-1.5 text-rose-300">
                  · +{formatNum(essencePerSecond, notation)} 🕳️/s
                </span>
              )}
            </p>
          </div>

          <MultiBuyBar value={multiBuy} onChange={onMultiBuyChange} compact />
        </div>

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              Singularity Cost (Starts at 1B TP · 10x each time · 1 at a time)
            </span>
            <span className="font-mono font-semibold text-rose-200 tabular-nums">
              {formatNum(treePoints, notation)} /{' '}
              {adminFreeMode ? 'FREE' : `${formatNum(singularityCost, notation)} 🌳`}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-900">
            <div
              className="h-full rounded-full bg-gradient-to-r from-rose-500 via-fuchsia-500 to-amber-400 transition-all duration-300"
              style={{ width: `${tpProgress}%` }}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            Can only purchase <strong>1 Singularity</strong> at a time. 1M Essence unlocks Time Reset.
          </div>
          <button
            type="button"
            disabled={!canSingularity}
            onClick={onRequestSingularity}
            className={`rounded-xl px-5 py-2.5 text-sm font-extrabold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              canSingularity
                ? 'bg-gradient-to-r from-rose-500 via-fuchsia-500 to-orange-500 text-white shadow-lg shadow-rose-500/30 hover:brightness-110 active:scale-95'
                : 'cursor-not-allowed bg-slate-800 text-slate-500'
            }`}
          >
            {canSingularity
              ? `Enter Singularity (+${projectedEssenceGain} 🕳️)`
              : `Need ${formatNum(singularityCost, notation)} 🌳`}
          </button>
        </div>
      </div>

      {/* Special Unlocked Upgrade: Primordial Essence Reactor (after every Singularity upgrade has been bought!) */}
      {reactorUnlocked && (
        <div className="rounded-3xl border border-amber-400/50 bg-gradient-to-r from-rose-950/40 via-amber-950/30 to-slate-900 p-5 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">☢️</span>
                <h3 className="text-base font-extrabold text-amber-200">
                  Primordial Essence Reactor (Tier 1 Only)
                </h3>
                <span className="font-mono text-xs font-bold text-amber-300 tabular-nums">
                  {essenceReactorLevel}/{ESSENCE_REACTOR_MAX_LEVEL}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-300">
                Unlocked after buying every Singularity upgrade! Base +10 Essence/sec per upgrade;{' '}
                <strong className="text-amber-200">every 5 upgrades doubles</strong> how much each
                gives!
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 text-xs">
                <span className="text-slate-300">
                  Per Upgrade:{' '}
                  <strong className="font-mono text-amber-300 tabular-nums">
                    +{formatNum(reactorPerUnitRate, notation)} 🕳️/s
                  </strong>
                </span>
                <span className="text-slate-300">
                  Total Output:{' '}
                  <strong className="font-mono text-rose-300 tabular-nums">
                    +{formatNum(essencePerSecond, notation)} 🕳️/s
                  </strong>
                </span>
                <span className="text-slate-400 font-mono">
                  Next 2x at {Math.min(100, (Math.floor(essenceReactorLevel / 5) + 1) * 5)}/100
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={essenceReactorLevel >= ESSENCE_REACTOR_MAX_LEVEL || !reactorBuyInfo.canAfford}
              onClick={onBuyEssenceReactor}
              className={`rounded-xl px-4 py-2.5 text-xs font-extrabold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                essenceReactorLevel >= ESSENCE_REACTOR_MAX_LEVEL
                  ? 'cursor-default bg-emerald-500/20 text-emerald-300'
                  : reactorBuyInfo.canAfford
                    ? 'bg-amber-400 text-slate-950 shadow-md hover:bg-amber-300 active:scale-95'
                    : 'cursor-not-allowed bg-slate-800 text-slate-500'
              }`}
            >
              {essenceReactorLevel >= ESSENCE_REACTOR_MAX_LEVEL ? (
                'MAXED (100/100)'
              ) : (
                <>
                  <div>Upgrade +{reactorBuyInfo.count}</div>
                  <div className="font-mono text-[11px] tabular-nums">
                    {adminFreeMode ? 'FREE' : `${formatNum(reactorBuyInfo.totalCost, notation)} 🕳️`}
                  </div>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Singularity Core Level-Up System */}
      <div className="rounded-3xl border border-fuchsia-500/40 bg-slate-900/85 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">💠</span>
              <h3 className="text-base font-extrabold text-white">Singularity Core Level-Up</h3>
              <span className="font-mono text-xs font-bold text-fuchsia-300 tabular-nums">
                Lv.{singularityCoreLevel}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Permanently multiplies Coins, RP, Prestige Points, and Tree Points across timelines.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              <span className="text-slate-300">
                Coins:{' '}
                <strong className="font-mono text-amber-300 tabular-nums">
                  ×{formatNum(coreCoinMult, notation)}
                </strong>
              </span>
              <span className="text-slate-300">
                RP:{' '}
                <strong className="font-mono text-purple-300 tabular-nums">
                  ×{formatNum(coreRpMult, notation)}
                </strong>
              </span>
              <span className="text-slate-300">
                PP:{' '}
                <strong className="font-mono text-cyan-300 tabular-nums">
                  ×{formatNum(corePpMult, notation)}
                </strong>
              </span>
              <span className="text-slate-300">
                TP:{' '}
                <strong className="font-mono text-emerald-300 tabular-nums">
                  ×{formatNum(coreTpMult, notation)}
                </strong>
              </span>
              <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                Scale {effectiveCoreScale.toFixed(2)}x/lv
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={!singularityCoreBuyInfo.canAfford}
            onClick={onLevelUpCore}
            className={`rounded-xl px-4 py-2.5 text-xs font-extrabold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              singularityCoreBuyInfo.canAfford
                ? 'bg-fuchsia-500 text-white shadow-md shadow-fuchsia-500/25 hover:bg-fuchsia-400 active:scale-95'
                : 'cursor-not-allowed bg-slate-800 text-slate-500'
            }`}
          >
            <div>Core Level +{singularityCoreBuyInfo.count}</div>
            <div className="font-mono text-[11px] tabular-nums">
              {adminFreeMode
                ? 'FREE'
                : `${formatNum(singularityCoreBuyInfo.totalCost, notation)} 🕳️`}
            </div>
          </button>
        </div>
      </div>

      {/* Separate Automation Controls */}
      {anyAutoUnlocked && (
        <div className="rounded-2xl border border-emerald-500/35 bg-emerald-950/20 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold text-emerald-300">🤖 Singularity Automation Modules</h3>
            <span className="text-xs text-slate-400">Per-building toggles in Buildings tab</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {hasAutoBuildings && (
              <button
                type="button"
                onClick={() => onToggleAuto('autoBuyBuildings')}
                className={`rounded-xl border px-3 py-1.5 text-xs font-bold cursor-pointer ${
                  automation.autoBuyBuildings
                    ? 'border-emerald-400 bg-emerald-500/25 text-emerald-200'
                    : 'border-slate-700 bg-slate-900 text-slate-400'
                }`}
              >
                Auto-Buy Buildings: {automation.autoBuyBuildings ? 'ON' : 'OFF'}
              </button>
            )}
            {hasAutoUpgrades && (
              <button
                type="button"
                onClick={() => onToggleAuto('autoBuyUpgrades')}
                className={`rounded-xl border px-3 py-1.5 text-xs font-bold cursor-pointer ${
                  automation.autoBuyUpgrades
                    ? 'border-emerald-400 bg-emerald-500/25 text-emerald-200'
                    : 'border-slate-700 bg-slate-900 text-slate-400'
                }`}
              >
                Auto-Buy Upgrades: {automation.autoBuyUpgrades ? 'ON' : 'OFF'}
              </button>
            )}
            {hasAutoRebirth && (
              <button
                type="button"
                onClick={() => onToggleAuto('autoBuyRebirthUpgrades')}
                className={`rounded-xl border px-3 py-1.5 text-xs font-bold cursor-pointer ${
                  automation.autoBuyRebirthUpgrades
                    ? 'border-emerald-400 bg-emerald-500/25 text-emerald-200'
                    : 'border-slate-700 bg-slate-900 text-slate-400'
                }`}
              >
                Auto-Buy Rebirth Upgrades: {automation.autoBuyRebirthUpgrades ? 'ON' : 'OFF'}
              </button>
            )}
            {hasAutoClicker && (
              <button
                type="button"
                onClick={() => onToggleAuto('autoLevelClicker')}
                className={`rounded-xl border px-3 py-1.5 text-xs font-bold cursor-pointer ${
                  automation.autoLevelClicker
                    ? 'border-emerald-400 bg-emerald-500/25 text-emerald-200'
                    : 'border-slate-700 bg-slate-900 text-slate-400'
                }`}
              >
                Auto-Level Coin Core: {automation.autoLevelClicker ? 'ON' : 'OFF'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Singularity Upgrades (All start at 1 Essence & increase 10x per purchase) */}
      <div>
        <div className="mb-2.5 px-1">
          <h3 className="text-sm font-bold text-white">Singularity Upgrades</h3>
          <p className="text-xs text-slate-400">
            All start at 1 Essence and increase 10x per purchase. Buying every upgrade unlocks the
            10 Essence/s Reactor!
          </p>
        </div>

        {activeUpgrades.length === 0 ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-6 text-center text-sm font-bold text-emerald-300">
            All Singularity Upgrades maxed!
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
            {activeUpgrades.map((upg) => {
              const preview = previewTieredPurchase(
                upg,
                singularityEssence,
                multiBuy,
                globalScaleReduction,
                adminFreeMode
              );

              return (
                <div
                  key={upg.id}
                  className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/85 p-4 transition-colors hover:border-rose-500/40"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-500/30 bg-rose-950/40 text-xl">
                      {upg.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-bold text-white">
                          {upg.name}{' '}
                          <span className="text-rose-300">
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
                          <strong className="font-mono text-rose-200 tabular-nums">
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
                    onClick={() => onBuySingularityUpgrade(upg.id)}
                    className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                      preview.canAfford
                        ? 'bg-rose-500 text-white hover:bg-rose-400 active:scale-[0.98]'
                        : 'cursor-not-allowed bg-slate-800 text-slate-500'
                    }`}
                  >
                    <span>
                      Buy +{preview.count}
                      {preview.willEvolve ? ' (Evolves Tier!)' : ''}
                    </span>
                    <span className="font-mono tabular-nums">
                      {adminFreeMode ? 'FREE' : `${formatNum(preview.totalCost, notation)} 🕳️`}
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

export default React.memo(SingularityPanel);
