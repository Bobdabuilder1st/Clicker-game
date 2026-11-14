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

interface RebirthPanelProps {
  coins: Decimal;
  rebirthLevel: number;
  rebirthPoints: Decimal;
  prestigePoints: Decimal;
  ppToRpMultiplier: Decimal;
  ppToRpPhase: 'exponential' | 'diminishing' | 'capped';
  tpToRpMultiplier: Decimal;
  essenceToRpMultiplier: Decimal;
  rpPerSecond: Decimal;
  rpFormulaExponent: number;
  rpFormulaFactor: number;
  rpCoinMultiplier: Decimal;
  rpCurvePhase: 'exponential' | 'diminishing' | 'capped';
  boostCapCeiling: Decimal;
  effectiveRebirthScale: number;
  rebirthBuyInfo: {
    count: number;
    totalCost: Decimal;
    canAfford: boolean;
    nextSingleCost: Decimal;
  };
  projectedRebirthRpGain: Decimal;
  rebirthPerks: TieredPerk[];
  ascendedRebirthPerks: TieredPerk[];
  allBaseRebirthPerksMaxed: boolean;
  effectiveAscendedRebirthBaseCost: Decimal;
  sectionWave: SectionWaveState;
  allRebirthMaxed: boolean;
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
  hasAutoRebirth: boolean;
  adminUnlocked: boolean;
  adminFreeMode: boolean;
  automation: AutomationState;
  onMultiBuyChange: (val: MultiBuyAmount) => void;
  onRequestRebirth: () => void;
  onBuyPerk: (id: string) => void;
  onBuyAscendedPerk: (id: string) => void;
  onBuyWaveUpgrade: (tab: ActiveTab, upgradeId: string) => void;
  onBuyEssenceConvergenceUpgrade: (id: string, multiOverride?: MultiBuyAmount) => void;
  onToggleAuto: (key: 'autoBuyRebirthUpgrades' | 'autoBuyMax') => void;
}

const RebirthPanel: React.FC<RebirthPanelProps> = ({
  coins,
  rebirthLevel,
  rebirthPoints,
  prestigePoints,
  ppToRpMultiplier,
  ppToRpPhase,
  tpToRpMultiplier,
  essenceToRpMultiplier,
  rpPerSecond,
  rpFormulaExponent,
  rpFormulaFactor,
  rpCoinMultiplier,
  rpCurvePhase,
  boostCapCeiling,
  effectiveRebirthScale,
  rebirthBuyInfo,
  projectedRebirthRpGain,
  rebirthPerks,
  ascendedRebirthPerks,
  allBaseRebirthPerksMaxed,
  effectiveAscendedRebirthBaseCost,
  sectionWave,
  allRebirthMaxed,
  essenceConvergenceOpen,
  essenceConvergenceUpgrades,
  essenceConvergenceProgress,
  multiBuy,
  globalScaleReduction,
  hardCostMult,
  notation,
  hasAutoRebirth,
  adminUnlocked,
  adminFreeMode,
  automation,
  onMultiBuyChange,
  onRequestRebirth,
  onBuyPerk,
  onBuyAscendedPerk,
  onBuyWaveUpgrade,
  onBuyEssenceConvergenceUpgrade,
  onToggleAuto
}) => {
  const progressPct = adminFreeMode
    ? 100
    : progressPercent(coins, rebirthBuyInfo.nextSingleCost);
  const activePerks = rebirthPerks.filter((p) => !isTieredItemMaxed(p));
  const maxedCount = rebirthPerks.length - activePerks.length;
  const showAscendedShop = (allBaseRebirthPerksMaxed || adminUnlocked) && !allRebirthMaxed;
  const activeAscendedPerks = ascendedRebirthPerks.filter((p) => !isTieredItemMaxed(p));
  const rpEssenceUpg = essenceConvergenceUpgrades.find((u) => u.id === 'ec_rp_syphon');

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-3xl border border-purple-500/40 bg-gradient-to-br from-slate-900 via-purple-950/35 to-slate-900 p-5 shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-purple-300">
              Rebirth Ascension · Level {rebirthLevel}
            </div>
            <h2 className="mt-0.5 text-xl font-extrabold text-white">
              {formatNum(rebirthPoints, notation)} Rebirth Points
            </h2>
            <p className="mt-1 text-xs text-slate-300">
              RP → Coins:{' '}
              <strong className="font-mono text-purple-200 tabular-nums">
                ×{formatNum(rpCoinMultiplier, notation)}
              </strong>{' '}
              ({rpCurvePhase} · Cap {formatNum(boostCapCeiling, notation)} RP)
              {rpPerSecond.gt(0) && (
                <span className="ml-1.5 text-emerald-300">
                  · +{formatNum(rpPerSecond, notation)} RP/s
                </span>
              )}
            </p>
            <p className="mt-0.5 text-xs text-cyan-300/90">
              Gems ({formatNum(prestigePoints, notation)} 💎) → RP:{' '}
              <strong className="font-mono tabular-nums">
                ×{formatNum(ppToRpMultiplier, notation)}
              </strong>{' '}
              ({ppToRpPhase} · Cap {formatNum(boostCapCeiling, notation)})
              {tpToRpMultiplier.gt(1) && (
                <span className="ml-1.5 text-emerald-300">
                  · Leaves → RP: ×{formatNum(tpToRpMultiplier, notation)}
                </span>
              )}
              {essenceToRpMultiplier.gt(1) && (
                <span className="ml-1.5 text-rose-300">
                  · Essence → RP: ×{formatNum(essenceToRpMultiplier, notation)}
                </span>
              )}
            </p>
          </div>

          <MultiBuyBar value={multiBuy} onChange={onMultiBuyChange} compact />
        </div>

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              Super-Exponential Cost (Scale {effectiveRebirthScale.toFixed(2)}x + Accel) · Formula 1
              + RP^{rpFormulaExponent} × {rpFormulaFactor}
            </span>
            <span className="font-mono font-semibold text-purple-200 tabular-nums">
              {formatNum(coins, notation)} /{' '}
              {adminFreeMode ? 'FREE' : `${formatNum(rebirthBuyInfo.totalCost, notation)} 🪙`}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800/90">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-400 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            Resets coins, buildings, upgrades & Coin Core. Surplus coins grant bonus RP.
          </div>
          <button
            type="button"
            disabled={!rebirthBuyInfo.canAfford}
            onClick={onRequestRebirth}
            className={`rounded-xl px-5 py-2.5 text-sm font-extrabold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              rebirthBuyInfo.canAfford
                ? 'bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white shadow-lg shadow-purple-500/25 hover:brightness-110 active:scale-95'
                : 'cursor-not-allowed bg-slate-800 text-slate-500'
            }`}
          >
            {rebirthBuyInfo.canAfford
              ? `Rebirth +${rebirthBuyInfo.count} (+${formatNum(projectedRebirthRpGain, notation)} RP)`
              : `Need ${formatNum(rebirthBuyInfo.nextSingleCost, notation)} 🪙`}
          </button>
        </div>
      </div>

      {/* Rebirth Shop */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div>
          <h3 className="text-sm font-bold text-white">
            Rebirth Shop (Max Tier 30)
            {maxedCount > 0 && (
              <span className="ml-2 font-mono text-xs text-emerald-300">
                {maxedCount}/{rebirthPerks.length} Maxed
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-400">
            Upgrades evolve up to Tier 30 and disappear once maxed. Maxing all unlocks Ascended RP &amp; Gem Upgrades!
          </p>
        </div>

        {hasAutoRebirth && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleAuto('autoBuyRebirthUpgrades')}
              className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                automation.autoBuyRebirthUpgrades
                  ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-300'
                  : 'border-slate-700 bg-slate-800 text-slate-400'
              }`}
            >
              Auto-Buy Rebirth: {automation.autoBuyRebirthUpgrades ? 'ON' : 'OFF'}
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

      {allRebirthMaxed ? (
        <SectionWaveUpgrades
          tab="rebirth"
          waveState={sectionWave}
          currency={rebirthPoints}
          multiBuy={multiBuy}
          globalScaleReduction={globalScaleReduction}
          hardCostMult={hardCostMult}
          notation={notation}
          adminFreeMode={adminFreeMode}
          onBuyWaveUpgrade={onBuyWaveUpgrade}
        />
      ) : activePerks.length === 0 ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5 text-center text-sm font-bold text-emerald-300">
          All Rebirth Shop upgrades are maxed at Tier 30! Ascended Rebirth Upgrades unlocked below.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
          {activePerks.map((perk) => {
            const preview = previewTieredPurchase(
              perk,
              rebirthPoints,
              multiBuy,
              globalScaleReduction,
              adminFreeMode,
              hardCostMult
            );

            return (
              <div
                key={perk.id}
                className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 transition-colors hover:border-purple-500/40"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-950/40 text-xl">
                    {perk.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-bold text-white">
                        {perk.name}{' '}
                        <span className="text-purple-300">
                          T{perk.tier}/{perk.maxTier}
                        </span>
                      </span>
                      <span className="font-mono text-xs font-semibold text-slate-300 tabular-nums shrink-0">
                        {perk.level}/{perk.tierMaxLevel}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">{perk.description}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 text-[11px] text-slate-500">
                      <span>
                        Total:{' '}
                        <strong className="font-mono text-purple-200 tabular-nums">
                          +{formatNum(perk.totalBonus, notation)} {perk.bonusUnit}
                        </strong>
                      </span>
                      <span>·</span>
                      <span className="font-mono tabular-nums">
                        +{formatNum(perk.bonusPerLevel, notation)}/lv
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
                  onClick={() => onBuyPerk(perk.id)}
                  className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                    preview.canAfford
                      ? 'bg-purple-500 text-white hover:bg-purple-400 active:scale-[0.98]'
                      : 'cursor-not-allowed bg-slate-800 text-slate-500'
                  }`}
                >
                  <span>
                    Upgrade +{preview.count}
                    {preview.willEvolve ? ' (Evolves Tier!)' : ''}
                  </span>
                  <span className="font-mono tabular-nums">
                    {adminFreeMode ? 'FREE' : `${formatNum(preview.totalCost, notation)} RP`}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Ascended Rebirth Upgrades (Unlocked after maxing all Rebirth Shop perks!) */}
      {showAscendedShop && activeAscendedPerks.length > 0 && (
        <div className="mt-2 rounded-3xl border border-cyan-500/40 bg-gradient-to-br from-slate-900 via-fuchsia-950/20 to-cyan-950/20 p-5 shadow-xl">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-cyan-200">
                Ascended Rebirth Upgrades (RP &amp; Gems)
              </h3>
              <p className="text-xs text-slate-400">
                Anchored at your final Rebirth upgrade buy price ({formatNum(effectiveAscendedRebirthBaseCost, notation)} RP) · Boosts Rebirth Points &amp; Gems!
              </p>
            </div>
            <span className="font-mono text-xs font-bold text-purple-300 tabular-nums">
              {ascendedRebirthPerks.length - activeAscendedPerks.length}/{ascendedRebirthPerks.length} Maxed
            </span>
          </div>

          {activeAscendedPerks.length === 0 ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5 text-center text-sm font-bold text-emerald-300">
              All Ascended Rebirth Upgrades maxed at Tier 30!
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
              {activeAscendedPerks.map((perk) => {
                const displayPerk =
                  perk.baseCost.gt(0)
                    ? perk
                    : { ...perk, baseCost: effectiveAscendedRebirthBaseCost };
                const preview = previewTieredPurchase(
                  displayPerk,
                  rebirthPoints,
                  multiBuy,
                  globalScaleReduction,
                  adminFreeMode,
                  hardCostMult
                );

                return (
                  <div
                    key={perk.id}
                    className="flex flex-col justify-between gap-3 rounded-2xl border border-cyan-500/30 bg-slate-950/80 p-4 transition-colors hover:border-cyan-400/60"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-950/40 text-xl">
                        {perk.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-bold text-white">
                            {perk.name}{' '}
                            <span className="text-cyan-300">
                              T{perk.tier}/{perk.maxTier}
                            </span>
                          </span>
                          <span className="font-mono text-xs font-semibold text-slate-300 tabular-nums shrink-0">
                            {perk.level}/{perk.tierMaxLevel}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-400">{perk.description}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 text-[11px] text-slate-500">
                          <span>
                            Total:{' '}
                            <strong className="font-mono text-cyan-200 tabular-nums">
                              +{formatNum(perk.totalBonus, notation)} {perk.bonusUnit}
                            </strong>
                          </span>
                          <span>·</span>
                          <span className="font-mono tabular-nums">
                            +{formatNum(perk.bonusPerLevel, notation)}/lv
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
                      onClick={() => onBuyAscendedPerk(perk.id)}
                      className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                        preview.canAfford
                          ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white hover:brightness-110 active:scale-[0.98]'
                          : 'cursor-not-allowed bg-slate-800 text-slate-500'
                      }`}
                    >
                      <span>
                        Ascend +{preview.count}
                        {preview.willEvolve ? ' (Evolves Tier!)' : ''}
                      </span>
                      <span className="font-mono tabular-nums">
                        {adminFreeMode ? 'FREE' : `${formatNum(preview.totalCost, notation)} RP`}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      {/* 50-Tier Singularity Essence Upgrade (Unlocked when all Rebirth, Prestige & Skill Tree upgrades are maxed) */}
      {(essenceConvergenceProgress.allRebirthMaxed || essenceConvergenceOpen) &&
        rpEssenceUpg &&
        !isTieredItemMaxed(rpEssenceUpg) && (
        <div className="mt-2 rounded-3xl border border-fuchsia-500/40 bg-gradient-to-br from-slate-900 via-fuchsia-950/25 to-rose-950/20 p-5 shadow-xl">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-fuchsia-200">
                🌌 50-Tier Singularity Essence Upgrade (RP)
              </h3>
              <p className="text-xs text-slate-400">
                Unlocked once all Rebirth, Prestige &amp; Skill Tree upgrades are maxed! See all 4 in Singularity.
              </p>
            </div>
            {!essenceConvergenceOpen && (
              <span className="font-mono text-xs text-amber-300 tabular-nums">
                Prestige {essenceConvergenceProgress.prestigeMaxed}/{essenceConvergenceProgress.prestigeTotal} · Skill Tree {essenceConvergenceProgress.skillTreeMaxed}/{essenceConvergenceProgress.skillTreeTotal}
              </span>
            )}
          </div>

          {essenceConvergenceOpen &&
            (() => {
              const maxed = isTieredItemMaxed(rpEssenceUpg);
              const preview = previewTieredPurchase(
                rpEssenceUpg,
                rebirthPoints,
                multiBuy,
                globalScaleReduction,
                adminFreeMode,
                hardCostMult
              );
              return (
                <div className="flex flex-col justify-between gap-3 rounded-2xl border border-fuchsia-500/35 bg-slate-950/85 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-fuchsia-500/30 bg-fuchsia-950/40 text-xl">
                      {rpEssenceUpg.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-bold text-white">
                          {rpEssenceUpg.name}{' '}
                          <span className="text-fuchsia-300">
                            T{rpEssenceUpg.tier}/{rpEssenceUpg.maxTier}
                          </span>
                        </span>
                        <span className="font-mono text-xs font-semibold text-slate-300 tabular-nums shrink-0">
                          {rpEssenceUpg.level}/{rpEssenceUpg.tierMaxLevel}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-400">{rpEssenceUpg.description}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 text-[11px] text-slate-500">
                        <span>
                          Total:{' '}
                          <strong className="font-mono text-rose-200 tabular-nums">
                            +{formatNum(rpEssenceUpg.totalBonus, notation)} {rpEssenceUpg.bonusUnit}
                          </strong>
                        </span>
                        <span>·</span>
                        <span className="font-mono tabular-nums">
                          +{formatNum(rpEssenceUpg.bonusPerLevel, notation)}/lv
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={maxed || !preview.canAfford}
                    onClick={() => onBuyEssenceConvergenceUpgrade(rpEssenceUpg.id, multiBuy)}
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
                        {adminFreeMode ? 'FREE' : `${formatNum(preview.totalCost, notation)} RP`}
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

export default React.memo(RebirthPanel);
