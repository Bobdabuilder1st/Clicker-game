import React from 'react';
import { AutomationState, Building, MultiBuyAmount, NotationType } from '../../types/game';
import { calculateMultiBuy, formatNum, getEffectiveScale, safePow } from '../../utils/format';
import { MultiBuyBar } from '../MultiBuyBar';

interface BuildingsPanelProps {
  buildings: Building[];
  coins: number;
  lifetimeCoins: number;
  multiBuy: MultiBuyAmount;
  globalScaleReduction: number;
  buildingDiscountMult: number;
  hardCostMult: number;
  buildingCpsMap: Record<string, number>;
  notation: NotationType;
  hasAutoBuildings: boolean;
  adminUnlocked: boolean;
  adminFreeMode: boolean;
  automation: AutomationState;
  onMultiBuyChange: (val: MultiBuyAmount) => void;
  onBuyBuilding: (id: string) => void;
  onToggleAuto: (key: 'autoBuyBuildings') => void;
  onToggleBuildingAuto: (buildingId: string) => void;
  onSetAllBuildingsAuto: (enabled: boolean) => void;
}

export const BuildingsPanel: React.FC<BuildingsPanelProps> = React.memo(({
  buildings,
  coins,
  lifetimeCoins,
  multiBuy,
  globalScaleReduction,
  buildingDiscountMult,
  hardCostMult,
  buildingCpsMap,
  notation,
  hasAutoBuildings,
  adminUnlocked,
  adminFreeMode,
  automation,
  onMultiBuyChange,
  onBuyBuilding,
  onToggleAuto,
  onToggleBuildingAuto,
  onSetAllBuildingsAuto
}) => {
  let shownLockedPreview = false;
  const visibleBuildings = buildings.filter((b) => {
    if (adminUnlocked) return true;
    const unlocked = lifetimeCoins >= b.unlockCoins || b.count > 0;
    if (unlocked) return true;
    if (!shownLockedPreview) {
      shownLockedPreview = true;
      return true;
    }
    return false;
  });

  const hiddenCount = buildings.length - visibleBuildings.length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-2.5">
        <div>
          <h2 className="text-sm font-bold text-white">Production Buildings (18 Tiers)</h2>
          <p className="text-xs text-slate-400">
            Every 25 owned multiplies output by <strong className="text-amber-300">2x</strong>.
            {globalScaleReduction > 0 && (
              <span className="ml-1 text-cyan-300">
                (-{Math.round(globalScaleReduction * 100)}% scale reduction)
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasAutoBuildings && (
            <>
              <button
                type="button"
                onClick={() => onToggleAuto('autoBuyBuildings')}
                className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  automation.autoBuyBuildings
                    ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-300'
                    : 'border-slate-700 bg-slate-800 text-slate-400'
                }`}
              >
                Auto-Buy: {automation.autoBuyBuildings ? 'ON' : 'OFF'}
              </button>
              <button
                type="button"
                onClick={() => onSetAllBuildingsAuto(true)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] font-semibold text-slate-300 hover:bg-slate-700 cursor-pointer"
              >
                All On
              </button>
              <button
                type="button"
                onClick={() => onSetAllBuildingsAuto(false)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] font-semibold text-slate-300 hover:bg-slate-700 cursor-pointer"
              >
                All Off
              </button>
            </>
          )}
          <MultiBuyBar value={multiBuy} onChange={onMultiBuyChange} compact />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {visibleBuildings.map((b) => {
          const isUnlocked = adminUnlocked || lifetimeCoins >= b.unlockCoins || b.count > 0;
          const effScale = getEffectiveScale(b.scaleFactor, globalScaleReduction);
          const buyInfo = adminFreeMode
            ? { count: multiBuy === -1 ? 25 : multiBuy, totalCost: 0, canAfford: true }
            : calculateMultiBuy(
                coins,
                b.baseCost,
                effScale,
                b.count,
                multiBuy,
                250,
                buildingDiscountMult * hardCostMult
              );
          const unitCps = buildingCpsMap[b.id] ?? b.baseCps;
          const totalCps = unitCps * b.count;
          const bAutoEnabled = automation.buildingAutoBuyEnabled[b.id] !== false;
          const milestoneTier = Math.floor(b.count / 25);
          const milestoneMult = safePow(2, milestoneTier);
          const progressTo25 = b.count % 25;

          if (!isUnlocked) {
            return (
              <div
                key={b.id}
                className="flex items-center justify-between rounded-2xl border border-dashed border-slate-800/80 bg-slate-900/40 px-4 py-3 opacity-75"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-lg">
                    🔒
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-300">Next Structure</div>
                    <div className="text-xs text-slate-500">
                      Reach{' '}
                      <span className="font-mono text-slate-300 tabular-nums">
                        {formatNum(b.unlockCoins, notation)}
                      </span>{' '}
                      lifetime coins to unlock
                      {hiddenCount > 0 ? ` (+${hiddenCount} more beyond)` : ''}
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div
              key={b.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 transition-colors hover:border-slate-700"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-700/80 bg-slate-800/90 text-2xl">
                  {b.icon}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-bold text-white">{b.name}</span>
                    <span className="font-mono text-xs font-bold text-amber-300 tabular-nums">
                      ×{b.count}
                    </span>
                    {milestoneTier > 0 && (
                      <span className="font-mono text-[11px] font-bold text-fuchsia-300 tabular-nums">
                        (25-Bonus: ×{formatNum(milestoneMult, notation, 0)})
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-slate-400">
                    <span className="font-mono text-emerald-300 tabular-nums">
                      +{formatNum(unitCps, notation)}/s ea
                    </span>
                    {b.count > 0 && (
                      <>
                        <span className="text-slate-600">·</span>
                        <span className="font-mono text-slate-200 tabular-nums">
                          Total {formatNum(totalCps, notation)}/s
                        </span>
                      </>
                    )}
                    <span className="text-slate-600">·</span>
                    <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                      Next 2x: {progressTo25}/25
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                      Scale {effScale.toFixed(3)}x
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {hasAutoBuildings && (
                  <button
                    type="button"
                    onClick={() => onToggleBuildingAuto(b.id)}
                    className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
                      bAutoEnabled
                        ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
                        : 'border-slate-700 bg-slate-800 text-slate-500'
                    }`}
                    title={`Toggle Auto-Buy for ${b.name}`}
                  >
                    Auto: {bAutoEnabled ? 'ON' : 'OFF'}
                  </button>
                )}

                <button
                  type="button"
                  disabled={!buyInfo.canAfford}
                  onClick={() => onBuyBuilding(b.id)}
                  className={`rounded-xl px-3.5 py-2 text-right text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    buyInfo.canAfford
                      ? 'bg-amber-400 text-slate-950 shadow-sm shadow-amber-500/20 hover:bg-amber-300 active:scale-95'
                      : 'cursor-not-allowed bg-slate-800 text-slate-500'
                  }`}
                >
                  <div>Buy +{buyInfo.count}</div>
                  <div className="font-mono text-[11px] tabular-nums">
                    {adminFreeMode ? 'FREE' : `${formatNum(buyInfo.totalCost, notation)} 🪙`}
                  </div>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
