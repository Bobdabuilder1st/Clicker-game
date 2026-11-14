import React from 'react';
import {
  ActiveTab,
  AutomationState,
  IdealState,
  MultiBuyAmount,
  NotationType,
  SectionWaveState
} from '../../types/game';
import { D_ZERO, Decimal, formatNum, progressPercent, safeMul, safePow, toDec } from '../../utils/format';
import { IDEAL_COLORS } from '../../utils/gameData';
import { MultiBuyBar } from '../MultiBuyBar';
import { SectionWaveUpgrades } from '../SectionWaveUpgrades';

interface IdleBoosts {
  coins: Decimal;
  rp: Decimal;
  gems: Decimal;
  leaves: Decimal;
  essence: Decimal;
  tokens: Decimal;
  idleXp: Decimal;
}

interface IdealPanelProps {
  idealTabUnlocked: boolean;
  idealTabCost: Decimal;
  canUnlockIdealTab: boolean;
  timeTokens: Decimal;
  ideal: IdealState;
  idealXpPerSecond: Decimal;
  totalIdleXp: Decimal;
  availableIdleXp: Decimal;
  idleAutoTimeCost: Decimal;
  canBuyTimeAutoUpgrades: boolean;
  timeAutoTokenUpgradesUnlocked: boolean;
  hasAutoTimeUpgrades: boolean;
  automation: AutomationState;
  sectionWave: SectionWaveState;
  multiBuy: MultiBuyAmount;
  globalScaleReduction: number;
  hardCostMult: number;
  idleBoosts: IdleBoosts;
  notation: NotationType;
  adminFreeMode: boolean;
  onMultiBuyChange: (val: MultiBuyAmount) => void;
  onUnlockIdealTab: () => void;
  onBuyTimeAutoUpgrades: () => void;
  onBuyWaveUpgrade: (tab: ActiveTab, upgradeId: string) => void;
  onToggleAuto: (key: 'autoBuyTimeUpgrades' | 'autoBuyMax') => void;
}

const IdealPanel: React.FC<IdealPanelProps> = ({
  idealTabUnlocked,
  idealTabCost,
  canUnlockIdealTab,
  timeTokens,
  ideal,
  idealXpPerSecond,
  totalIdleXp,
  availableIdleXp,
  idleAutoTimeCost,
  canBuyTimeAutoUpgrades,
  timeAutoTokenUpgradesUnlocked,
  hasAutoTimeUpgrades,
  automation,
  sectionWave,
  multiBuy,
  globalScaleReduction,
  hardCostMult,
  idleBoosts,
  notation,
  adminFreeMode,
  onMultiBuyChange,
  onUnlockIdealTab,
  onBuyTimeAutoUpgrades,
  onBuyWaveUpgrade,
  onToggleAuto
}) => {
  const totalSquares = IDEAL_COLORS.reduce(
    (sum, col) => sum + (ideal.tracks?.[col.id]?.squares ?? ideal.squares[col.id] ?? 0),
    0
  );
  const unlockedColorsCount = IDEAL_COLORS.filter((col) => ideal.tracks?.[col.id]?.unlocked).length;

  if (!idealTabUnlocked) {
    return (
      <div className="rounded-3xl border border-fuchsia-500/40 bg-gradient-to-br from-slate-950 via-fuchsia-950/25 to-slate-900 p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-fuchsia-400/50 bg-fuchsia-500/20 text-4xl">
          🌈
        </div>
        <h2 className="mt-4 text-xl font-extrabold text-white">The Idle Spectrum</h2>
        <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-slate-300">
          Requires <strong className="text-amber-300">1,000,000 Time Tokens</strong> to unlock the
          Idle area. Each color (<strong className="text-red-300">Red</strong> through{' '}
          <strong className="text-violet-300">Violet</strong>) runs on its own bar, unlocks the
          next color at <strong className="text-emerald-300">Level 10</strong>, and its squares
          permanently boost game currencies!
        </p>

        <div className="mt-4 font-mono text-xs text-slate-400 tabular-nums">
          Your Time Tokens: {formatNum(timeTokens, notation)} /{' '}
          {adminFreeMode ? 'FREE' : `${formatNum(idealTabCost, notation)} 🪙`}
        </div>

        <button
          type="button"
          disabled={!canUnlockIdealTab}
          onClick={onUnlockIdealTab}
          className={`mt-5 rounded-xl px-6 py-3 text-sm font-extrabold transition-all cursor-pointer ${
            canUnlockIdealTab
              ? 'bg-gradient-to-r from-rose-500 via-amber-400 to-violet-500 text-slate-950 shadow-lg hover:brightness-110 active:scale-95'
              : 'cursor-not-allowed bg-slate-800 text-slate-500'
          }`}
        >
          {canUnlockIdealTab
            ? adminFreeMode
              ? 'Unlock Idle Area (FREE)'
              : `Unlock Idle Area (${formatNum(idealTabCost, notation)} 🪙)`
            : `Need ${formatNum(idealTabCost, notation)} Time Tokens`}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Overview Summary & Active Square Bonuses */}
      <div className="rounded-3xl border border-fuchsia-500/40 bg-gradient-to-br from-slate-900 via-slate-900 to-violet-950/30 p-5 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-fuchsia-300">
              Idle Spectrum · {unlockedColorsCount}/{IDEAL_COLORS.length} Colors Active
            </div>
            <h2 className="mt-0.5 text-xl font-extrabold text-white">
              Total Colored Squares: {formatNum(totalSquares, notation, 0)}
            </h2>
            <p className="mt-1 text-xs text-slate-300">
              All unlocked colors advance simultaneously using the full{' '}
              <strong className="text-emerald-300">Combined XP Rate</strong>, grant{' '}
              <strong className="text-amber-300">+5%</strong> per square,{' '}
              <strong className="text-fuchsia-300">2x XP/lv every 5 levels</strong> &amp;{' '}
              <strong className="text-amber-200">5x XP/lv every 20 levels</strong>!
            </p>
          </div>

          {/* Combined XP Rate & Total Idle XP Side-by-Side */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-right">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Combined XP Rate
              </div>
              <div className="font-mono text-base font-extrabold text-emerald-300 tabular-nums">
                +{formatNum(idealXpPerSecond, notation, 1)} XP/s
              </div>
            </div>

            <div className="rounded-2xl border border-fuchsia-500/35 bg-slate-950/80 px-4 py-2.5 text-right">
              <div className="text-[10px] font-bold uppercase tracking-wider text-fuchsia-300">
                Total Idle XP
              </div>
              <div className="font-mono text-base font-extrabold text-white tabular-nums">
                {formatNum(availableIdleXp, notation, 0)} XP
              </div>
              {!totalIdleXp.eq(availableIdleXp) && (
                <div className="font-mono text-[10px] text-slate-400 tabular-nums">
                  Lifetime: {formatNum(totalIdleXp, notation, 0)} XP
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Auto-Buy Time Token Upgrades Milestone Card (1,000,000 Idle XP) */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-400/35 bg-slate-950/75 p-3.5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-400/40 bg-amber-950/40 text-xl">
              ⏱️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">Auto-Buy Time Token Upgrades</span>
                <span className="font-mono text-xs text-amber-300">
                  {timeAutoTokenUpgradesUnlocked ? 'UNLOCKED' : '1,000,000 Idle XP'}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-400">
                Automatically buys Coin Odds, Chrono Token Amplifier, and Auto-Singularity in Time Reset whenever you have Time Tokens.
              </p>
            </div>
          </div>

          {hasAutoTimeUpgrades ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onToggleAuto('autoBuyTimeUpgrades')}
                className={`rounded-xl border px-3.5 py-2 text-xs font-extrabold cursor-pointer whitespace-nowrap shrink-0 ${
                  automation.autoBuyTimeUpgrades
                    ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
                    : 'border-slate-700 bg-slate-800 text-slate-300'
                }`}
              >
                Auto-Buy Time: {automation.autoBuyTimeUpgrades ? 'ON' : 'OFF'}
              </button>
              <button
                type="button"
                onClick={() => onToggleAuto('autoBuyMax')}
                className={`rounded-xl border px-2.5 py-2 text-xs font-bold cursor-pointer whitespace-nowrap shrink-0 ${
                  automation.autoBuyMax
                    ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                    : 'border-slate-700 bg-slate-800 text-slate-300'
                }`}
              >
                Mode: {automation.autoBuyMax ? 'MAX' : '+1'}
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={!canBuyTimeAutoUpgrades}
              onClick={onBuyTimeAutoUpgrades}
              className={`rounded-xl px-4 py-2 text-xs font-extrabold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                canBuyTimeAutoUpgrades
                  ? 'bg-amber-400 text-slate-950 shadow-md hover:bg-amber-300 active:scale-95'
                  : 'cursor-not-allowed bg-slate-800 text-slate-500'
              }`}
            >
              <div>Unlock Auto-Time Upgrades</div>
              <div className="font-mono text-[11px] tabular-nums">
                {adminFreeMode ? 'FREE' : `${formatNum(idleAutoTimeCost, notation, 0)} Idle XP`}
              </div>
            </button>
          )}
        </div>

        {/* Live Square Currency Multipliers */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2">
            <div className="text-[10px] font-semibold uppercase text-amber-300">Coins Boost</div>
            <div className="font-mono text-sm font-extrabold text-white tabular-nums">
              ×{formatNum(idleBoosts.coins, notation, 2)}
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2">
            <div className="text-[10px] font-semibold uppercase text-purple-300">RP Boost</div>
            <div className="font-mono text-sm font-extrabold text-white tabular-nums">
              ×{formatNum(idleBoosts.rp, notation, 2)}
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2">
            <div className="text-[10px] font-semibold uppercase text-cyan-300">Gems Boost</div>
            <div className="font-mono text-sm font-extrabold text-white tabular-nums">
              ×{formatNum(idleBoosts.gems, notation, 2)}
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2">
            <div className="text-[10px] font-semibold uppercase text-emerald-300">Leaves Boost</div>
            <div className="font-mono text-sm font-extrabold text-white tabular-nums">
              ×{formatNum(idleBoosts.leaves, notation, 2)}
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2">
            <div className="text-[10px] font-semibold uppercase text-rose-300">Essence Boost</div>
            <div className="font-mono text-sm font-extrabold text-white tabular-nums">
              ×{formatNum(idleBoosts.essence, notation, 2)}
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2">
            <div className="text-[10px] font-semibold uppercase text-yellow-300">Tokens Boost</div>
            <div className="font-mono text-sm font-extrabold text-white tabular-nums">
              ×{formatNum(idleBoosts.tokens, notation, 2)}
            </div>
          </div>
        </div>
      </div>

      {/* 7 Independent Color Bars + Square Collections */}
      <div className="flex flex-col gap-3">
        {IDEAL_COLORS.map((col, idx) => {
          const track = ideal.tracks?.[col.id];
          const unlocked = track?.unlocked ?? idx === 0;
          const level = track?.level ?? 0;
          const xp = track?.xp ?? D_ZERO;
          const xpNeeded = track?.xpNeeded ?? toDec(col.baseXpNeeded);
          const squaresCount = track?.squares ?? 0;
          const milestone5Tier = Math.floor(level / 5);
          const milestone20Tier = Math.floor(level / 20);
          const milestone5Mult = safePow(2, milestone5Tier);
          const milestone20Mult = safePow(5, milestone20Tier);
          const totalMilestoneMult = safeMul(milestone5Mult, milestone20Mult);
          const xpPerLevel = safeMul(col.baseXpPerSec, totalMilestoneMult);
          const contribRate = safeMul(safeMul(1 + level, xpPerLevel), idleBoosts.idleXp);
          const colorSquareMult = 1 + squaresCount * 0.05;
          const next5MilestoneLv = (milestone5Tier + 1) * 5;
          const next20MilestoneLv = (milestone20Tier + 1) * 20;

          const prevCol = idx > 0 ? IDEAL_COLORS[idx - 1] : null;
          const prevLevel = prevCol ? (ideal.tracks?.[prevCol.id]?.level ?? 0) : 0;
          const unlockPct =
            col.unlockPrevLevel > 0
              ? Math.min(100, Math.max(0, (prevLevel / col.unlockPrevLevel) * 100))
              : 100;
          const barPct = progressPercent(xp, xpNeeded);

          const visualLimit = 36;
          const renderedSquares = Math.min(squaresCount, visualLimit);
          const overflow = squaresCount - renderedSquares;

          if (!unlocked) {
            return (
              <div
                key={col.id}
                className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/60 p-4 opacity-85"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className={`inline-block h-4 w-4 rounded-sm border opacity-50 ${col.squareClass}`} />
                    <span className="text-sm font-bold text-slate-300">🔒 {col.name}</span>
                    <span className="text-[11px] text-slate-400">{col.boostSummary}</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-300 tabular-nums">
                    {prevCol?.name} Lv.{prevLevel} / {col.unlockPrevLevel}
                  </span>
                </div>

                <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-900">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${col.barClass} opacity-60 transition-all duration-200`}
                    style={{ width: `${unlockPct}%` }}
                  />
                </div>
                <div className="mt-1.5 flex flex-wrap items-center justify-between text-[11px] text-slate-500">
                  <span>
                    Unlocks automatically when{' '}
                    <strong className={prevCol?.textClass}>
                      {prevCol?.name} reaches Level {col.unlockPrevLevel}
                    </strong>
                  </span>
                  <span className="font-mono">
                    Starts at {formatNum(col.baseXpNeeded, notation, 0)} XP · Scale ×{col.xpGrowth}/lv
                  </span>
                </div>
              </div>
            );
          }

          return (
            <div
              key={col.id}
              className={`rounded-2xl border ${col.borderClass} bg-slate-900/85 p-4 shadow-lg`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className={`inline-block h-4 w-4 rounded-sm border shadow ${col.squareClass}`} />
                  <span className={`text-sm font-extrabold ${col.textClass}`}>{col.name}</span>
                  <span className="font-mono text-xs font-bold text-white tabular-nums">
                    Lv.{level}
                  </span>
                  <span className="font-mono text-xs font-semibold text-emerald-300 tabular-nums">
                    +{formatNum(idealXpPerSecond, notation, 1)} XP/s
                  </span>
                  {milestone5Tier > 0 && (
                    <span className="font-mono text-[11px] font-bold text-fuchsia-300 tabular-nums">
                      (5-Lv: ×{formatNum(milestone5Mult, notation, 0)})
                    </span>
                  )}
                  {milestone20Tier > 0 && (
                    <span className="font-mono text-[11px] font-bold text-amber-300 tabular-nums">
                      (20-Lv: ×{formatNum(milestone20Mult, notation, 0)})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="font-mono font-semibold text-amber-200 tabular-nums">
                    ×{colorSquareMult.toFixed(2)} Boost
                  </span>
                  <span className="font-mono font-extrabold text-white tabular-nums">
                    ×{formatNum(squaresCount, notation, 0)} Squares
                  </span>
                </div>
              </div>

              <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300">
                <span>{col.boostSummary}</span>
                <span className="font-mono text-slate-400 tabular-nums">
                  Adds +{formatNum(contribRate, notation, 1)} XP/s to Combined
                </span>
              </div>

              {/* Independent Color XP Progress Bar */}
              <div className="mt-2">
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <span className="text-slate-400">
                    Scale ×{col.xpGrowth}/lv · +{formatNum(xpPerLevel, notation, 0)} XP/s per level (2x at Lv.{next5MilestoneLv} · 5x at Lv.{next20MilestoneLv})
                  </span>
                  <span className="font-mono font-semibold text-slate-200 tabular-nums">
                    {formatNum(xp, notation, 1)} / {formatNum(xpNeeded, notation, 2)} XP ({barPct.toFixed(1)}%)
                  </span>
                </div>
                <div className="h-3.5 w-full overflow-hidden rounded-full border border-slate-700/70 bg-slate-950 p-0.5">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${col.barClass} transition-all duration-200`}
                    style={{ width: `${barPct}%` }}
                  />
                </div>
              </div>

              {/* Earned Colored Squares Row */}
              <div className="mt-2.5 flex min-h-[20px] flex-wrap items-center gap-1">
                {squaresCount === 0 ? (
                  <span className="text-[11px] text-slate-500">Charging first {col.name} square...</span>
                ) : (
                  <>
                    {Array.from({ length: renderedSquares }).map((_, i) => (
                      <span
                        key={i}
                        className={`inline-block h-3.5 w-3.5 rounded-[3px] border shadow-sm ${col.squareClass}`}
                      />
                    ))}
                    {overflow > 0 && (
                      <span className="ml-1 font-mono text-[11px] font-bold text-slate-300 tabular-nums">
                        +{formatNum(overflow, notation, 0)}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-end px-1">
          <MultiBuyBar value={multiBuy} onChange={onMultiBuyChange} compact />
        </div>
        <SectionWaveUpgrades
          tab="ideal"
          waveState={sectionWave}
          currency={availableIdleXp}
          multiBuy={multiBuy}
          globalScaleReduction={globalScaleReduction}
          hardCostMult={hardCostMult}
          notation={notation}
          adminFreeMode={adminFreeMode}
          onBuyWaveUpgrade={onBuyWaveUpgrade}
        />
      </div>
    </div>
  );
};

export default React.memo(IdealPanel);
