import React from 'react';
import {
  ActiveTab,
  AutomationState,
  EssenceConvergenceUpgrade,
  MultiBuyAmount,
  NotationType,
  SectionWaveState,
  SingularityUpgrade
} from '../../types/game';
import { Decimal, formatNum, progressPercent, safePow, toDec } from '../../utils/format';
import { ESSENCE_REACTOR_MAX_LEVEL, SINGULARITY_CORE_MAX_LEVEL } from '../../utils/gameData';
import { isTieredItemMaxed, previewTieredPurchase } from '../../hooks/useGameEngine';
import { MultiBuyBar } from '../MultiBuyBar';
import { SectionWaveUpgrades } from '../SectionWaveUpgrades';

interface SingularityPanelProps {
  rebirthPoints: Decimal;
  prestigePoints: Decimal;
  treePoints: Decimal;
  singularityCount: number;
  singularityCoreLevel: number;
  singularityEssence: Decimal;
  singularityCost: Decimal;
  canSingularity: boolean;
  projectedEssenceGain: Decimal;
  coreCoinMult: Decimal;
  coreRpMult: Decimal;
  corePpMult: Decimal;
  coreTpMult: Decimal;
  effectiveCoreScale: number;
  singularityCoreBuyInfo: {
    count: number;
    totalCost: Decimal;
    canAfford: boolean;
    nextSingleCost: Decimal;
  };
  singularityUpgrades: SingularityUpgrade[];
  sectionWave: SectionWaveState;
  allSingularityUpgradesMaxed: boolean;
  essenceConvergenceOpen: boolean;
  essenceConvergenceMult: Decimal;
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
  essenceReactorLevel: number;
  reactorUnlocked: boolean;
  reactorBuyInfo: {
    count: number;
    totalCost: Decimal;
    canAfford: boolean;
    nextSingleCost: Decimal;
  };
  billionEssenceOpen: boolean;
  billionEssenceThreshold: number;
  billionEssenceUpgrades: SingularityUpgrade[];
  hasAutoBillionEssence: boolean;
  essencePerSecond: Decimal;
  tpPerSecond: Decimal;
  hasAutoBuildings: boolean;
  hasAutoUpgrades: boolean;
  hasAutoRebirth: boolean;
  hasAutoPrestige: boolean;
  hasAutoSkillTree: boolean;
  hasAutoSingularity: boolean;
  hasAutoTimeUpgrades: boolean;
  hasAutoClicker: boolean;
  automation: AutomationState;
  multiBuy: MultiBuyAmount;
  globalScaleReduction: number;
  hardCostMult: number;
  notation: NotationType;
  adminFreeMode: boolean;
  onMultiBuyChange: (val: MultiBuyAmount) => void;
  onRequestSingularity: () => void;
  onLevelUpCore: () => void;
  onBuySingularityUpgrade: (id: string) => void;
  onBuyWaveUpgrade: (tab: ActiveTab, upgradeId: string) => void;
  onBuyEssenceConvergenceUpgrade: (id: string, multiOverride?: MultiBuyAmount) => void;
  onBuyEssenceReactor: () => void;
  onBuyBillionEssenceUpgrade: (id: string) => void;
  onToggleAuto: (
    key:
      | 'autoBuyBuildings'
      | 'autoBuyUpgrades'
      | 'autoLevelClicker'
      | 'autoBuyRebirthUpgrades'
      | 'autoBuyPrestigeUpgrades'
      | 'autoBuySkillTree'
      | 'autoBuySingularityUpgrades'
      | 'autoBuyTimeUpgrades'
      | 'autoBuyBillionEssence'
      | 'autoBuyMax'
  ) => void;
}

const SingularityPanel: React.FC<SingularityPanelProps> = ({
  rebirthPoints,
  prestigePoints,
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
  sectionWave,
  allSingularityUpgradesMaxed,
  essenceConvergenceOpen,
  essenceConvergenceMult,
  essenceConvergenceUpgrades,
  essenceConvergenceProgress,
  essenceReactorLevel,
  reactorUnlocked,
  reactorBuyInfo,
  billionEssenceOpen,
  billionEssenceThreshold,
  billionEssenceUpgrades,
  hasAutoBillionEssence,
  essencePerSecond,
  tpPerSecond,
  hasAutoBuildings,
  hasAutoUpgrades,
  hasAutoRebirth,
  hasAutoPrestige,
  hasAutoSkillTree,
  hasAutoSingularity,
  hasAutoTimeUpgrades,
  hasAutoClicker,
  automation,
  multiBuy,
  globalScaleReduction,
  hardCostMult,
  notation,
  adminFreeMode,
  onMultiBuyChange,
  onRequestSingularity,
  onLevelUpCore,
  onBuySingularityUpgrade,
  onBuyWaveUpgrade,
  onBuyEssenceConvergenceUpgrade,
  onBuyEssenceReactor,
  onBuyBillionEssenceUpgrade,
  onToggleAuto
}) => {
  const coreMaxed = singularityCoreLevel >= SINGULARITY_CORE_MAX_LEVEL;
  const tpProgress = adminFreeMode
    ? 100
    : progressPercent(treePoints, singularityCost);

  const activeUpgrades = singularityUpgrades.filter((u) => !isTieredItemMaxed(u));
  const activeEcUpgrades = essenceConvergenceUpgrades.filter((u) => !isTieredItemMaxed(u));
  const activeBillionUpgrades = billionEssenceOpen
    ? billionEssenceUpgrades.filter((u) => !isTieredItemMaxed(u))
    : [];
  const maxedBillionCount = billionEssenceUpgrades.length - activeBillionUpgrades.length;
  const billionProgress = adminFreeMode
    ? 100
    : progressPercent(singularityEssence, billionEssenceThreshold);

  const anyAutoUnlocked =
    hasAutoBuildings ||
    hasAutoUpgrades ||
    hasAutoRebirth ||
    hasAutoPrestige ||
    hasAutoSkillTree ||
    hasAutoSingularity ||
    hasAutoTimeUpgrades ||
    hasAutoBillionEssence ||
    hasAutoClicker;
  const reactorPerUnitRate = toDec(10).mul(safePow(2, Math.floor(essenceReactorLevel / 5)));

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
              the last (Next: +{formatNum(projectedEssenceGain, notation, 0)} 🕳️) and costs 10x more Leaves!
              {tpPerSecond.gt(0) && (
                <span className="ml-1.5 text-emerald-300">
                  · +{formatNum(tpPerSecond, notation)} Leaves/s
                </span>
              )}
              {essencePerSecond.gt(0) && (
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
              Singularity Cost (Starts at 1M Leaves · 10x each time · 1 at a time)
            </span>
            <span className="font-mono font-semibold text-rose-200 tabular-nums">
              {formatNum(treePoints, notation)} /{' '}
              {adminFreeMode ? 'FREE' : `${formatNum(singularityCost, notation)} 🍃`}
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
              ? `Enter Singularity (+${formatNum(projectedEssenceGain, notation, 0)} 🕳️)`
              : `Need ${formatNum(singularityCost, notation)} 🍃`}
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

      {/* Singularity Core Level-Up System (Max Level 100) */}
      <div className="rounded-3xl border border-fuchsia-500/40 bg-slate-900/85 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">💠</span>
              <h3 className="text-base font-extrabold text-white">Singularity Core Level-Up</h3>
              <span className="font-mono text-xs font-bold text-fuchsia-300 tabular-nums">
                Lv.{singularityCoreLevel}/{SINGULARITY_CORE_MAX_LEVEL}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Permanently multiplies Coins, RP, Gems, and Leaves (max Level 100).
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
                Gems:{' '}
                <strong className="font-mono text-cyan-300 tabular-nums">
                  ×{formatNum(corePpMult, notation)}
                </strong>
              </span>
              <span className="text-slate-300">
                Leaves:{' '}
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
            disabled={coreMaxed || !singularityCoreBuyInfo.canAfford}
            onClick={onLevelUpCore}
            className={`rounded-xl px-4 py-2.5 text-xs font-extrabold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              coreMaxed
                ? 'cursor-default bg-emerald-500/20 text-emerald-300'
                : singularityCoreBuyInfo.canAfford
                  ? 'bg-fuchsia-500 text-white shadow-md shadow-fuchsia-500/25 hover:bg-fuchsia-400 active:scale-95'
                  : 'cursor-not-allowed bg-slate-800 text-slate-500'
            }`}
          >
            {coreMaxed ? (
              'MAXED (Lv.100)'
            ) : (
              <>
                <div>Core Level +{singularityCoreBuyInfo.count}</div>
                <div className="font-mono text-[11px] tabular-nums">
                  {adminFreeMode
                    ? 'FREE'
                    : `${formatNum(singularityCoreBuyInfo.totalCost, notation)} 🕳️`}
                </div>
              </>
            )}
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
            <button
              type="button"
              onClick={() => onToggleAuto('autoBuyMax')}
              className={`rounded-xl border px-3 py-1.5 text-xs font-bold cursor-pointer ${
                automation.autoBuyMax
                  ? 'border-amber-400 bg-amber-500/25 text-amber-200'
                  : 'border-slate-700 bg-slate-900 text-slate-300'
              }`}
              title="Toggle whether auto-buyers buy MAX or +1 per tick"
            >
              Auto-Buy Mode: {automation.autoBuyMax ? 'MAX' : '+1'}
            </button>
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
                Auto-Buy Rebirth: {automation.autoBuyRebirthUpgrades ? 'ON' : 'OFF'}
              </button>
            )}
            {hasAutoPrestige && (
              <button
                type="button"
                onClick={() => onToggleAuto('autoBuyPrestigeUpgrades')}
                className={`rounded-xl border px-3 py-1.5 text-xs font-bold cursor-pointer ${
                  automation.autoBuyPrestigeUpgrades
                    ? 'border-emerald-400 bg-emerald-500/25 text-emerald-200'
                    : 'border-slate-700 bg-slate-900 text-slate-400'
                }`}
              >
                Auto-Buy Prestige: {automation.autoBuyPrestigeUpgrades ? 'ON' : 'OFF'}
              </button>
            )}
            {hasAutoSkillTree && (
              <button
                type="button"
                onClick={() => onToggleAuto('autoBuySkillTree')}
                className={`rounded-xl border px-3 py-1.5 text-xs font-bold cursor-pointer ${
                  automation.autoBuySkillTree
                    ? 'border-emerald-400 bg-emerald-500/25 text-emerald-200'
                    : 'border-slate-700 bg-slate-900 text-slate-400'
                }`}
              >
                Auto-Buy Skill Tree: {automation.autoBuySkillTree ? 'ON' : 'OFF'}
              </button>
            )}
            {hasAutoSingularity && (
              <button
                type="button"
                onClick={() => onToggleAuto('autoBuySingularityUpgrades')}
                className={`rounded-xl border px-3 py-1.5 text-xs font-bold cursor-pointer ${
                  automation.autoBuySingularityUpgrades
                    ? 'border-emerald-400 bg-emerald-500/25 text-emerald-200'
                    : 'border-slate-700 bg-slate-900 text-slate-400'
                }`}
              >
                Auto-Buy Singularity: {automation.autoBuySingularityUpgrades ? 'ON' : 'OFF'}
              </button>
            )}
            {hasAutoTimeUpgrades && (
              <button
                type="button"
                onClick={() => onToggleAuto('autoBuyTimeUpgrades')}
                className={`rounded-xl border px-3 py-1.5 text-xs font-bold cursor-pointer ${
                  automation.autoBuyTimeUpgrades
                    ? 'border-emerald-400 bg-emerald-500/25 text-emerald-200'
                    : 'border-slate-700 bg-slate-900 text-slate-400'
                }`}
              >
                Auto-Buy Time: {automation.autoBuyTimeUpgrades ? 'ON' : 'OFF'}
              </button>
            )}
            {hasAutoBillionEssence && (
              <button
                type="button"
                onClick={() => onToggleAuto('autoBuyBillionEssence')}
                className={`rounded-xl border px-3 py-1.5 text-xs font-bold cursor-pointer ${
                  automation.autoBuyBillionEssence
                    ? 'border-amber-400 bg-amber-500/25 text-amber-200'
                    : 'border-slate-700 bg-slate-900 text-slate-400'
                }`}
              >
                Auto-Buy Astral: {automation.autoBuyBillionEssence ? 'ON' : 'OFF'}
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

      {/* Singularity Upgrades OR Infinite Event Horizon Waves */}
      {allSingularityUpgradesMaxed || activeUpgrades.length === 0 ? (
        <SectionWaveUpgrades
          tab="singularity"
          waveState={sectionWave}
          currency={singularityEssence}
          multiBuy={multiBuy}
          globalScaleReduction={globalScaleReduction}
          hardCostMult={hardCostMult}
          notation={notation}
          adminFreeMode={adminFreeMode}
          onBuyWaveUpgrade={onBuyWaveUpgrade}
        />
      ) : (
        <div>
          <div className="mb-2.5 px-1">
            <h3 className="text-sm font-bold text-white">Singularity Upgrades</h3>
            <p className="text-xs text-slate-400">
              All start at 1 Essence. Buying every upgrade unlocks the 10 Essence/s Reactor; maxing
              all unlocks infinite 30-tier Event Horizon Waves!
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
            {activeUpgrades.map((upg) => {
              const preview = previewTieredPurchase(
                upg,
                singularityEssence,
                multiBuy,
                globalScaleReduction,
                adminFreeMode,
                hardCostMult
              );
              const isTreeGen = upg.id === 'su_tree_gen';

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
                          {isTreeGen ? 'Live Output:' : 'Total:'}{' '}
                          <strong className="font-mono text-rose-200 tabular-nums">
                            {isTreeGen
                              ? `+${formatNum(tpPerSecond, notation)} Leaves/s`
                              : `+${formatNum(upg.totalBonus, notation)} ${upg.bonusUnit}`}
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
        </div>
      )}
      {/* 50-Tier Singularity Essence Convergence Upgrades (Unlocked when Rebirth, Prestige & Skill Tree are all maxed) */}
      {(!essenceConvergenceOpen || activeEcUpgrades.length > 0) && (
      <div className="rounded-3xl border border-fuchsia-500/40 bg-gradient-to-br from-slate-900 via-fuchsia-950/20 to-rose-950/20 p-5 shadow-xl">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-extrabold text-fuchsia-200">
              🌌 Singularity Essence Convergence (50 Tiers)
            </h3>
            <p className="text-xs text-slate-400">
              Unlocks once all Rebirth, Prestige &amp; Skill Tree upgrades are maxed · Boosts Singularity Essence gain from Resets &amp; Reactor!
            </p>
          </div>
          {essenceConvergenceOpen && (
            <span className="font-mono text-xs font-extrabold text-rose-200 tabular-nums">
              Total Essence Mult: ×{formatNum(essenceConvergenceMult, notation)}
            </span>
          )}
        </div>

        {!essenceConvergenceOpen ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div
              className={`rounded-2xl border p-3 text-xs ${
                essenceConvergenceProgress.allRebirthMaxed
                  ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
                  : 'border-slate-800 bg-slate-950/70 text-slate-300'
              }`}
            >
              <div className="font-bold">Rebirth Upgrades</div>
              <div className="mt-1 font-mono text-sm font-extrabold tabular-nums">
                {essenceConvergenceProgress.rebirthMaxed}/{essenceConvergenceProgress.rebirthTotal} Maxed
              </div>
            </div>
            <div
              className={`rounded-2xl border p-3 text-xs ${
                essenceConvergenceProgress.allPrestigeMaxed
                  ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
                  : 'border-slate-800 bg-slate-950/70 text-slate-300'
              }`}
            >
              <div className="font-bold">Prestige Upgrades</div>
              <div className="mt-1 font-mono text-sm font-extrabold tabular-nums">
                {essenceConvergenceProgress.prestigeMaxed}/{essenceConvergenceProgress.prestigeTotal} Maxed
              </div>
            </div>
            <div
              className={`rounded-2xl border p-3 text-xs ${
                essenceConvergenceProgress.allSkillTreeMaxed
                  ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
                  : 'border-slate-800 bg-slate-950/70 text-slate-300'
              }`}
            >
              <div className="font-bold">Skill Tree Upgrades</div>
              <div className="mt-1 font-mono text-sm font-extrabold tabular-nums">
                {essenceConvergenceProgress.skillTreeMaxed}/{essenceConvergenceProgress.skillTreeTotal} Maxed
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
            {activeEcUpgrades.map((upg) => {
              const currencyBalance =
                upg.currency === 'rebirthPoints'
                  ? rebirthPoints
                  : upg.currency === 'prestigePoints'
                    ? prestigePoints
                    : upg.currency === 'treePoints'
                      ? treePoints
                      : singularityEssence;
              const currencySymbol =
                upg.currency === 'rebirthPoints'
                  ? 'RP'
                  : upg.currency === 'prestigePoints'
                    ? '💎'
                    : upg.currency === 'treePoints'
                      ? '🍃'
                      : '🕳️';

              const maxed = isTieredItemMaxed(upg);
              const preview = previewTieredPurchase(
                upg,
                currencyBalance,
                multiBuy,
                globalScaleReduction,
                adminFreeMode,
                hardCostMult
              );

              return (
                <div
                  key={upg.id}
                  className="flex flex-col justify-between gap-3 rounded-2xl border border-fuchsia-500/35 bg-slate-950/85 p-4 transition-colors hover:border-rose-400/60"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-fuchsia-500/30 bg-fuchsia-950/40 text-xl">
                      {upg.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-bold text-white">
                          {upg.name}{' '}
                          <span className="text-fuchsia-300">
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
                    disabled={maxed || !preview.canAfford}
                    onClick={() => onBuyEssenceConvergenceUpgrade(upg.id, multiBuy)}
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
                        {adminFreeMode
                          ? 'FREE'
                          : `${formatNum(preview.totalCost, notation)} ${currencySymbol}`}
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
      )}

      {/* Astral Horizon Upgrades (Unlocked at 1 Billion Singularity Essence) */}
      <div className="rounded-3xl border border-amber-400/40 bg-gradient-to-br from-slate-950 via-amber-950/20 to-rose-950/25 p-5 shadow-xl">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-extrabold text-amber-200">
              🌠 Astral Horizon Upgrades (1B+ Singularity Essence)
            </h3>
            <p className="text-xs text-slate-400">
              Unlocks upon reaching {formatNum(billionEssenceThreshold, notation)} Singularity Essence 🕳️ ·
              Stays unlocked through Singularity Resets!
            </p>
          </div>
          {billionEssenceOpen && (
            <span className="font-mono text-xs font-bold text-amber-300 tabular-nums">
              {maxedBillionCount}/{billionEssenceUpgrades.length} Maxed
            </span>
          )}
        </div>

        {!billionEssenceOpen ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">
                🔒 Reach {formatNum(billionEssenceThreshold, notation)} Singularity Essence to unlock
              </span>
              <span className="font-mono font-bold text-amber-300 tabular-nums">
                {formatNum(singularityEssence, notation)} / {formatNum(billionEssenceThreshold, notation)} 🕳️
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-900">
              <div
                className="h-full rounded-full bg-gradient-to-r from-rose-500 via-amber-400 to-yellow-300 transition-all duration-300"
                style={{ width: `${billionProgress}%` }}
              />
            </div>
          </div>
        ) : activeBillionUpgrades.length === 0 ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5 text-center text-sm font-bold text-emerald-300">
            All Astral Horizon Upgrades maxed!
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
            {activeBillionUpgrades.map((upg) => {
              const preview = previewTieredPurchase(
                upg,
                singularityEssence,
                multiBuy,
                globalScaleReduction,
                adminFreeMode,
                hardCostMult
              );

              return (
                <div
                  key={upg.id}
                  className="flex flex-col justify-between gap-3 rounded-2xl border border-amber-500/35 bg-slate-950/85 p-4 transition-colors hover:border-amber-400/70"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/35 bg-amber-950/40 text-xl">
                      {upg.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-bold text-white">
                          {upg.name}{' '}
                          <span className="text-amber-300">
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
                          <strong className="font-mono text-amber-200 tabular-nums">
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
                    onClick={() => onBuyBillionEssenceUpgrade(upg.id)}
                    className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                      preview.canAfford
                        ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 hover:brightness-110 active:scale-[0.98]'
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
