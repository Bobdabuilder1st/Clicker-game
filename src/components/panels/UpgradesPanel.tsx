import React, { useMemo, useState } from 'react';
import {
  ActiveTab,
  AutomationState,
  Building,
  MultiBuyAmount,
  NotationType,
  SectionWaveState,
  UpgradeTrackState
} from '../../types/game';
import {
  D_ONE,
  D_ZERO,
  Decimal,
  applySoftAndHardCap,
  calculateMultiBuy,
  formatNum,
  getEffectiveScale,
  safePow
} from '../../utils/format';
import { UPGRADE_MAX_TIER } from '../../utils/gameData';
import { MultiBuyBar } from '../MultiBuyBar';
import { SectionWaveUpgrades } from '../SectionWaveUpgrades';

interface UpgradesPanelProps {
  upgradeTracks: UpgradeTrackState[];
  buildings: Building[];
  buildingCpsMap: Record<string, Decimal>;
  coinsPerSecond: Decimal;
  coinsPerClick: Decimal;
  totalBuildingsOwned: number;
  lifetimeCoins: Decimal;
  coins: Decimal;
  completedUpgradeCount: number;
  sectionWave: SectionWaveState;
  allUpgradeTracksMaxed: boolean;
  multiBuy: MultiBuyAmount;
  globalScaleReduction: number;
  hardCostMult: number;
  notation: NotationType;
  hasAutoUpgrades: boolean;
  adminUnlocked: boolean;
  adminFreeMode: boolean;
  automation: AutomationState;
  onMultiBuyChange: (val: MultiBuyAmount) => void;
  onBuyUpgrade: (id: string) => void;
  onBuyWaveUpgrade: (tab: ActiveTab, upgradeId: string) => void;
  onToggleAuto: (key: 'autoBuyUpgrades' | 'autoBuyMax') => void;
}

type FilterCat = 'all' | 'click' | 'building' | 'global' | 'synergy' | 'omni';

export const UpgradesPanel: React.FC<UpgradesPanelProps> = React.memo(({
  upgradeTracks,
  buildings,
  buildingCpsMap,
  coinsPerSecond,
  coinsPerClick,
  totalBuildingsOwned,
  lifetimeCoins,
  coins,
  completedUpgradeCount,
  sectionWave,
  allUpgradeTracksMaxed,
  multiBuy,
  globalScaleReduction,
  hardCostMult,
  notation,
  hasAutoUpgrades,
  adminUnlocked,
  adminFreeMode,
  automation,
  onMultiBuyChange,
  onBuyUpgrade,
  onBuyWaveUpgrade,
  onToggleAuto
}) => {
  const [filter, setFilter] = useState<FilterCat>('all');

  const buildingMap = useMemo(() => new Map(buildings.map((b) => [b.id, b])), [buildings]);

  const unlockedBuildingIds = useMemo(
    () =>
      new Set(
        buildings
          .filter((b) => adminUnlocked || lifetimeCoins.gte(b.unlockCoins) || b.count > 0)
          .map((b) => b.id)
      ),
    [buildings, adminUnlocked, lifetimeCoins]
  );

  const visibleTracks = useMemo(
    () =>
      upgradeTracks
        .filter((u) => {
          if (u.tier >= u.maxTier) return false;
          if (u.targetBuildingId && !unlockedBuildingIds.has(u.targetBuildingId)) return false;
          return filter === 'all' || u.category === filter;
        })
        .map((u) => {
          const effScale = getEffectiveScale(u.costScale, globalScaleReduction);
          const remaining = Math.max(0, u.maxTier - u.tier);
          const buyInfo = adminFreeMode
            ? {
                count: Math.min(remaining, multiBuy === -1 ? 10 : multiBuy),
                totalCost: D_ZERO,
                canAfford: remaining > 0,
                nextSingleCost: D_ZERO
              }
            : calculateMultiBuy(coins, u.baseCost, effScale, u.tier - 1, multiBuy, remaining, hardCostMult);
          return { track: u, effScale, buyInfo };
        })
        .sort((a, b) => a.buyInfo.nextSingleCost.cmp(b.buyInfo.nextSingleCost)),
    [upgradeTracks, unlockedBuildingIds, filter, globalScaleReduction, adminFreeMode, multiBuy, coins, hardCostMult]
  );

  const cats: { id: FilterCat; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'click', label: 'Click' },
    { id: 'building', label: 'Buildings' },
    { id: 'global', label: 'Global' },
    { id: 'synergy', label: 'Synergy' },
    { id: 'omni', label: 'Omni (All)' }
  ];

  const computeCpsDeltaLabel = (track: UpgradeTrackState, buyCount: number): string => {
    const prevEff = applySoftAndHardCap(track.tier - 1, 15, UPGRADE_MAX_TIER, 0.45);
    const nextEff = applySoftAndHardCap(track.tier - 1 + buyCount, 15, UPGRADE_MAX_TIER, 0.45);
    const prevPow = Decimal.max(D_ONE, safePow(track.effectMultiplier, prevEff));
    const nextPow = safePow(track.effectMultiplier, nextEff);
    const ratio = nextPow.div(prevPow);

    if (track.category === 'click') {
      const deltaClick = coinsPerClick.mul(ratio.sub(D_ONE));
      return `+${formatNum(deltaClick, notation)}/click`;
    }
    if (track.category === 'global') {
      const deltaCps = coinsPerSecond.mul(ratio.sub(D_ONE));
      return `+${formatNum(deltaCps, notation)}/s`;
    }
    if (track.category === 'omni') {
      return `×${formatNum(ratio, notation)} Everything`;
    }
    if (track.category === 'synergy') {
      const stepBldgs = Math.floor(totalBuildingsOwned / 10);
      const prevMult = Decimal.max(
        D_ONE,
        applySoftAndHardCap(D_ONE.add(prevEff.mul(0.05 * stepBldgs)), 10, 100, 0.45)
      );
      const nextMult = applySoftAndHardCap(D_ONE.add(nextEff.mul(0.05 * stepBldgs)), 10, 100, 0.45);
      const deltaCps = coinsPerSecond.mul(nextMult.div(prevMult).sub(D_ONE));
      return `+${formatNum(deltaCps, notation)}/s`;
    }
    if (track.targetBuildingId) {
      const b = buildingMap.get(track.targetBuildingId);
      const bUnitCps = buildingCpsMap[track.targetBuildingId] ?? D_ZERO;
      const bTotalCps = bUnitCps.mul(b?.count ?? 0);
      const deltaCps = bTotalCps.mul(ratio.sub(D_ONE));
      return `+${formatNum(deltaCps, notation)}/s`;
    }
    return '';
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-2.5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white">Evolving Upgrades</h2>
            <span className="font-mono text-xs text-emerald-300 tabular-nums">
              {completedUpgradeCount} cleared
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Shows live CPS/s or Click gain for every upgrade. Soft cap T15, ends at Tier 30.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasAutoUpgrades && (
            <>
              <button
                type="button"
                onClick={() => onToggleAuto('autoBuyUpgrades')}
                className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  automation.autoBuyUpgrades
                    ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-300'
                    : 'border-slate-700 bg-slate-800 text-slate-400'
                }`}
              >
                Auto-Buy: {automation.autoBuyUpgrades ? 'ON' : 'OFF'}
              </button>
              <button
                type="button"
                onClick={() => onToggleAuto('autoBuyMax')}
                className={`rounded-xl border px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  automation.autoBuyMax
                    ? 'border-amber-400/60 bg-amber-500/20 text-amber-300'
                    : 'border-slate-700 bg-slate-800 text-slate-300'
                }`}
                title="Switch all auto-buyers between Max Buy and +1"
              >
                Mode: {automation.autoBuyMax ? 'MAX' : '+1'}
              </button>
            </>
          )}
          <MultiBuyBar value={multiBuy} onChange={onMultiBuyChange} compact />
        </div>
      </div>

      {allUpgradeTracksMaxed ? (
        <SectionWaveUpgrades
          tab="upgrades"
          waveState={sectionWave}
          currency={coins}
          multiBuy={multiBuy}
          globalScaleReduction={globalScaleReduction}
          hardCostMult={hardCostMult}
          notation={notation}
          adminFreeMode={adminFreeMode}
          onBuyWaveUpgrade={onBuyWaveUpgrade}
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-1.5">
            {cats.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setFilter(c.id)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  filter === c.id
                    ? 'bg-slate-100 text-slate-950'
                    : 'border border-slate-800 bg-slate-900/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {visibleTracks.map(({ track, effScale, buyInfo }) => {
              const effTiers = applySoftAndHardCap(track.tier - 1, 15, UPGRADE_MAX_TIER, 0.45);
              const currentMult =
                track.category === 'synergy'
                  ? `${(effTiers.toNumber() * 5).toFixed(1)}% / 10 bldgs`
                  : `${formatNum(safePow(track.effectMultiplier, effTiers), notation)}x`;
              const cpsImpact = computeCpsDeltaLabel(track, buyInfo.count);

              return (
                <div
                  key={track.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 transition-colors hover:border-slate-700"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-700/80 bg-slate-800/90 text-2xl">
                      {track.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-bold text-white">
                          {track.name} <span className="text-amber-300">T{track.tier}/{track.maxTier}</span>
                        </span>
                        {track.tier > 15 && (
                          <span className="text-[10px] font-bold text-amber-400">
                            {track.tier >= UPGRADE_MAX_TIER ? 'MAX T30' : 'SOFT CAP'}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-400">{track.description}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-slate-500">
                        <span>
                          Current:{' '}
                          <strong className="font-mono text-emerald-300 tabular-nums">{currentMult}</strong>
                        </span>
                        {cpsImpact && (
                          <>
                            <span>·</span>
                            <span className="font-mono font-semibold text-amber-300 tabular-nums">
                              Adds {cpsImpact}
                            </span>
                          </>
                        )}
                        <span>·</span>
                        <span className="font-mono tabular-nums">Scale {effScale.toFixed(2)}x/tier</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={!buyInfo.canAfford}
                    onClick={() => onBuyUpgrade(track.id)}
                    className={`rounded-xl px-3.5 py-2 text-right text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                      buyInfo.canAfford
                        ? 'bg-emerald-400 text-slate-950 shadow-sm shadow-emerald-500/20 hover:bg-emerald-300 active:scale-95'
                        : 'cursor-not-allowed bg-slate-800 text-slate-500'
                    }`}
                  >
                    <div>Buy +{buyInfo.count} Tier</div>
                    <div className="font-mono text-[11px] tabular-nums">
                      {adminFreeMode ? 'FREE' : `${formatNum(buyInfo.totalCost, notation)} 🪙`}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
});

export default UpgradesPanel;
