import React from 'react';
import { AutomationState, MultiBuyAmount, NotationType, TieredPerk } from '../../types/game';
import { formatNum } from '../../utils/format';
import { isTieredItemMaxed, previewTieredPurchase } from '../../hooks/useGameEngine';
import { MultiBuyBar } from '../MultiBuyBar';

interface RebirthPanelProps {
  coins: number;
  rebirthLevel: number;
  rebirthPoints: number;
  prestigePoints: number;
  ppToRpMultiplier: number;
  ppToRpPhase: 'exponential' | 'diminishing' | 'capped';
  tpToRpMultiplier: number;
  essenceToRpMultiplier: number;
  rpPerSecond: number;
  rpFormulaExponent: number;
  rpFormulaFactor: number;
  rpCoinMultiplier: number;
  rpCurvePhase: 'exponential' | 'diminishing' | 'capped';
  boostCapCeiling: number;
  effectiveRebirthScale: number;
  rebirthBuyInfo: {
    count: number;
    totalCost: number;
    canAfford: boolean;
    nextSingleCost: number;
  };
  projectedRebirthRpGain: number;
  rebirthPerks: TieredPerk[];
  multiBuy: MultiBuyAmount;
  globalScaleReduction: number;
  hardCostMult: number;
  notation: NotationType;
  hasAutoRebirth: boolean;
  adminFreeMode: boolean;
  automation: AutomationState;
  onMultiBuyChange: (val: MultiBuyAmount) => void;
  onRequestRebirth: () => void;
  onBuyPerk: (id: string) => void;
  onToggleAuto: (key: 'autoBuyRebirthUpgrades') => void;
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
  multiBuy,
  globalScaleReduction,
  hardCostMult,
  notation,
  hasAutoRebirth,
  adminFreeMode,
  automation,
  onMultiBuyChange,
  onRequestRebirth,
  onBuyPerk,
  onToggleAuto
}) => {
  const progressPct = adminFreeMode
    ? 100
    : Math.min(100, (coins / Math.max(1, rebirthBuyInfo.nextSingleCost)) * 100);
  const activePerks = rebirthPerks.filter((p) => !isTieredItemMaxed(p));
  const maxedCount = rebirthPerks.length - activePerks.length;

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
              {rpPerSecond > 0 && (
                <span className="ml-1.5 text-emerald-300">
                  · +{formatNum(rpPerSecond, notation)} RP/s
                </span>
              )}
            </p>
            <p className="mt-0.5 text-xs text-cyan-300/90">
              Prestige ({formatNum(prestigePoints, notation)} PP) → RP:{' '}
              <strong className="font-mono tabular-nums">
                ×{formatNum(ppToRpMultiplier, notation)}
              </strong>{' '}
              ({ppToRpPhase} · Cap {formatNum(boostCapCeiling, notation)})
              {tpToRpMultiplier > 1 && (
                <span className="ml-1.5 text-emerald-300">
                  · TP → RP: ×{formatNum(tpToRpMultiplier, notation)}
                </span>
              )}
              {essenceToRpMultiplier > 1 && (
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
            Upgrades evolve up to Tier 30 and disappear once maxed.
          </p>
        </div>

        {hasAutoRebirth && (
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
        )}
      </div>

      {activePerks.length === 0 ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-6 text-center text-sm font-bold text-emerald-300">
          All Rebirth Shop upgrades are maxed at Tier 30!
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
    </div>
  );
};

export default React.memo(RebirthPanel);
