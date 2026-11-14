import React, { useState } from 'react';
import { AutomationState, MultiBuyAmount, NotationType } from '../../types/game';
import { formatNum } from '../../utils/format';
import { TIME_FLIP_MAX_LEVEL, TIME_TOKEN_BOOST_MAX_LEVEL } from '../../utils/gameData';
import { MultiBuyBar } from '../MultiBuyBar';

interface TimeResetPanelProps {
  singularityEssence: number;
  timeResetCount: number;
  timeTokens: number;
  lifetimeTimeTokens: number;
  timeTokenMult: number;
  boostCapCeiling: number;
  timeResetRequiredEssence: number;
  canTimeReset: boolean;
  projectedTimeTokens: number;
  timeFlipChanceLevel: number;
  timeFlipWinChance: number;
  timeFlipBuyInfo: {
    count: number;
    totalCost: number;
    canAfford: boolean;
    nextSingleCost: number;
  };
  timeTokenBoostLevel: number;
  timeTokenBoostMult: number;
  timeTokenBoostBuyInfo: {
    count: number;
    totalCost: number;
    canAfford: boolean;
    nextSingleCost: number;
  };
  timeAutoSingularityUnlocked: boolean;
  timeAutoSingularityCost: number;
  canBuyTimeAutoSingularity: boolean;
  hasAutoSingularity: boolean;
  idealTabUnlocked: boolean;
  idealTabCost: number;
  canUnlockIdealTab: boolean;
  automation: AutomationState;
  multiBuy: MultiBuyAmount;
  notation: NotationType;
  adminFreeMode: boolean;
  onMultiBuyChange: (val: MultiBuyAmount) => void;
  onTimeReset: (gambleFlip: boolean) => { won: boolean; awarded: number };
  onBuyTimeFlipUpgrade: () => void;
  onBuyTimeTokenBoost: () => void;
  onBuyTimeAutoSingularity: () => void;
  onUnlockIdealTab: () => void;
  onOpenIdealTab: () => void;
  onToggleAuto: (key: 'autoBuySingularityUpgrades' | 'autoBuyMax') => void;
}

const TimeResetPanel: React.FC<TimeResetPanelProps> = ({
  singularityEssence,
  timeResetCount,
  timeTokens,
  lifetimeTimeTokens,
  timeTokenMult,
  boostCapCeiling,
  timeResetRequiredEssence,
  canTimeReset,
  projectedTimeTokens,
  timeFlipChanceLevel,
  timeFlipWinChance,
  timeFlipBuyInfo,
  timeTokenBoostLevel,
  timeTokenBoostMult,
  timeTokenBoostBuyInfo,
  timeAutoSingularityUnlocked,
  timeAutoSingularityCost,
  canBuyTimeAutoSingularity,
  hasAutoSingularity,
  idealTabUnlocked,
  idealTabCost,
  canUnlockIdealTab,
  automation,
  multiBuy,
  notation,
  adminFreeMode,
  onMultiBuyChange,
  onTimeReset,
  onBuyTimeFlipUpgrade,
  onBuyTimeTokenBoost,
  onBuyTimeAutoSingularity,
  onUnlockIdealTab,
  onOpenIdealTab,
  onToggleAuto
}) => {
  const [flipBanner, setFlipBanner] = useState<{ won: boolean; awarded: number; gambled: boolean } | null>(
    null
  );

  const essenceProgress = adminFreeMode
    ? 100
    : Math.min(100, (singularityEssence / Math.max(1, timeResetRequiredEssence)) * 100);
  const coinOddsMaxed = timeFlipChanceLevel >= TIME_FLIP_MAX_LEVEL;
  const tokenBoostMaxed = timeTokenBoostLevel >= TIME_TOKEN_BOOST_MAX_LEVEL;

  const handleReset = (gambleFlip: boolean) => {
    const result = onTimeReset(gambleFlip);
    setFlipBanner({ won: result.won, awarded: result.awarded, gambled: gambleFlip });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Time Reset Portal */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-400/50 bg-gradient-to-br from-slate-950 via-amber-950/30 to-indigo-950/40 p-5 shadow-2xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-amber-300">
              Time Reset Layer · Timeline #{timeResetCount}
            </div>
            <h2 className="mt-0.5 text-xl font-extrabold text-white">
              {formatNum(timeTokens, notation)} Time Tokens 🪙
            </h2>
            <p className="mt-1 max-w-xl text-xs text-slate-300">
              Each Time Token gives a{' '}
              <strong className="text-amber-200">+1% boost</strong> to everything before Time Reset
              (currently{' '}
              <strong className="font-mono text-amber-300 tabular-nums">
                ×{formatNum(timeTokenMult, notation)}
              </strong>
              ). Every Time Reset also increases RP, Gem, Leaf, and Essence boost caps by{' '}
              <strong className="text-cyan-300">10x</strong> (current cap:{' '}
              <strong className="font-mono text-cyan-200 tabular-nums">
                {formatNum(boostCapCeiling, notation)}
              </strong>
              ).
            </p>
            <div className="mt-1 text-[11px] text-slate-400">
              Lifetime Time Tokens: {formatNum(lifetimeTimeTokens, notation)}
            </div>
          </div>

          <MultiBuyBar value={multiBuy} onChange={onMultiBuyChange} compact />
        </div>

        {/* Essence Progress */}
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              Time Reset Requirement ({formatNum(timeResetRequiredEssence || 1_000_000, notation)}{' '}
              Singularity Essence)
            </span>
            <span className="font-mono font-semibold text-amber-200 tabular-nums">
              {formatNum(singularityEssence, notation)} /{' '}
              {adminFreeMode ? 'FREE' : `${formatNum(timeResetRequiredEssence, notation)} 🕳️`}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-900">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-cyan-400 transition-all duration-300"
              style={{ width: `${essenceProgress}%` }}
            />
          </div>
        </div>

        {/* Coin Flip Gamble Result Banner */}
        {flipBanner && (
          <div
            className={`mt-4 rounded-2xl border px-4 py-3 text-xs font-bold ${
              flipBanner.won
                ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-200'
                : 'border-rose-500/50 bg-rose-950/40 text-rose-200'
            }`}
          >
            {flipBanner.gambled
              ? flipBanner.won
                ? `COIN FLIP WON! Your Time Tokens doubled to +${formatNum(flipBanner.awarded, notation)} 🪙!`
                : 'COIN FLIP LOST! The Temporal Coin vanished — +0 Time Tokens gained, but caps rose 10x!'
              : `Safely claimed +${formatNum(flipBanner.awarded, notation)} Time Tokens 🪙 and raised all caps 10x!`}
          </div>
        )}

        {/* Reset & Coin Flip Options */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="text-xs text-slate-300">
            Completely resets <strong className="text-rose-300">everything</strong> before Time Reset.
            Base gain:{' '}
            <strong className="font-mono text-amber-300 tabular-nums">
              +{formatNum(projectedTimeTokens, notation)} 🪙
            </strong>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={!canTimeReset}
              onClick={() => handleReset(false)}
              className={`rounded-xl px-4 py-2.5 text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                canTimeReset
                  ? 'border border-amber-400/50 bg-slate-900 text-amber-200 hover:bg-slate-800 active:scale-95'
                  : 'cursor-not-allowed bg-slate-800 text-slate-500'
              }`}
            >
              Keep Safely (+{formatNum(projectedTimeTokens, notation)} 🪙)
            </button>

            <button
              type="button"
              disabled={!canTimeReset}
              onClick={() => handleReset(true)}
              className={`rounded-xl px-4 py-2.5 text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                canTimeReset
                  ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/25 hover:brightness-110 active:scale-95'
                  : 'cursor-not-allowed bg-slate-800 text-slate-500'
              }`}
            >
              Flip Coin ({Math.round(timeFlipWinChance * 100)}% for +
              {formatNum(projectedTimeTokens * 2, notation)} 🪙 / 0)
            </button>
          </div>
        </div>
      </div>

      {/* Time Vault Upgrades */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/85 p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white">Time Vault Upgrades</h3>
            <p className="text-xs text-slate-400">
              Upgrade Coin Flip Odds, Token Yield, Singularity Auto-Buy, and unlock the Ideal Tab.
            </p>
          </div>

          {hasAutoSingularity && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onToggleAuto('autoBuySingularityUpgrades')}
                className={`rounded-xl border px-3 py-1.5 text-xs font-bold cursor-pointer ${
                  automation.autoBuySingularityUpgrades
                    ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
                    : 'border-slate-700 bg-slate-800 text-slate-400'
                }`}
              >
                Auto-Buy Singularity: {automation.autoBuySingularityUpgrades ? 'ON' : 'OFF'}
              </button>
              <button
                type="button"
                onClick={() => onToggleAuto('autoBuyMax')}
                className={`rounded-xl border px-2.5 py-1.5 text-xs font-bold cursor-pointer ${
                  automation.autoBuyMax
                    ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                    : 'border-slate-700 bg-slate-800 text-slate-300'
                }`}
              >
                Mode: {automation.autoBuyMax ? 'MAX' : '+1'}
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {/* 1. Coin Odds */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-500/30 bg-slate-950/70 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-950/40 text-2xl">
                🎲
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">Coin Odds</span>
                  <span className="font-mono text-xs text-amber-300 tabular-nums">
                    Lv.{timeFlipChanceLevel}/{TIME_FLIP_MAX_LEVEL}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-400">
                  Increases Time Reset Coin Flip win odds by +5% per level (50% → 80% max).
                </p>
                <div className="mt-1 text-[11px] font-mono text-amber-200 tabular-nums">
                  Current Odds: {Math.round(timeFlipWinChance * 100)}% · Cost Scale 10.00x
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={coinOddsMaxed || !timeFlipBuyInfo.canAfford}
              onClick={onBuyTimeFlipUpgrade}
              className={`rounded-xl px-4 py-2.5 text-xs font-extrabold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                coinOddsMaxed
                  ? 'cursor-default bg-emerald-500/20 text-emerald-300'
                  : timeFlipBuyInfo.canAfford
                    ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 active:scale-95'
                    : 'cursor-not-allowed bg-slate-800 text-slate-500'
              }`}
            >
              {coinOddsMaxed ? (
                'MAXED (80% Odds)'
              ) : (
                <>
                  <div>Upgrade +{timeFlipBuyInfo.count}</div>
                  <div className="font-mono text-[11px] tabular-nums">
                    {adminFreeMode ? 'FREE' : `${formatNum(timeFlipBuyInfo.totalCost, notation)} 🪙`}
                  </div>
                </>
              )}
            </button>
          </div>

          {/* 2. Time Token Multiplier */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-cyan-500/30 bg-slate-950/70 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-950/40 text-2xl">
                ⏳
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">Chrono Token Amplifier</span>
                  <span className="font-mono text-xs text-cyan-300 tabular-nums">
                    Lv.{timeTokenBoostLevel}/{TIME_TOKEN_BOOST_MAX_LEVEL}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-400">
                  Doubles Time Tokens gained from every Time Reset (2x per level).
                </p>
                <div className="mt-1 text-[11px] font-mono text-cyan-200 tabular-nums">
                  Current Bonus: ×{formatNum(timeTokenBoostMult, notation)} Tokens · Cost Scale 10.00x
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={tokenBoostMaxed || !timeTokenBoostBuyInfo.canAfford}
              onClick={onBuyTimeTokenBoost}
              className={`rounded-xl px-4 py-2.5 text-xs font-extrabold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                tokenBoostMaxed
                  ? 'cursor-default bg-emerald-500/20 text-emerald-300'
                  : timeTokenBoostBuyInfo.canAfford
                    ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300 active:scale-95'
                    : 'cursor-not-allowed bg-slate-800 text-slate-500'
              }`}
            >
              {tokenBoostMaxed ? (
                `MAXED (Lv.${TIME_TOKEN_BOOST_MAX_LEVEL})`
              ) : (
                <>
                  <div>Upgrade +{timeTokenBoostBuyInfo.count}</div>
                  <div className="font-mono text-[11px] tabular-nums">
                    {adminFreeMode
                      ? 'FREE'
                      : `${formatNum(timeTokenBoostBuyInfo.totalCost, notation)} 🪙`}
                  </div>
                </>
              )}
            </button>
          </div>

          {/* 3. Auto-Buy Singularity Upgrades */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-rose-500/30 bg-slate-950/70 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-rose-500/30 bg-rose-950/40 text-2xl">
                🕳️
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">Auto-Buy Singularity Upgrades</span>
                  <span className="font-mono text-xs text-rose-300">
                    {timeAutoSingularityUnlocked ? 'UNLOCKED' : '1-Time'}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-400">
                  Automatically purchases Singularity Upgrades whenever you have Singularity Essence.
                </p>
              </div>
            </div>

            {timeAutoSingularityUnlocked ? (
              <button
                type="button"
                onClick={() => onToggleAuto('autoBuySingularityUpgrades')}
                className={`rounded-xl border px-4 py-2.5 text-xs font-extrabold cursor-pointer whitespace-nowrap shrink-0 ${
                  automation.autoBuySingularityUpgrades
                    ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
                    : 'border-slate-700 bg-slate-800 text-slate-300'
                }`}
              >
                Auto-Buy: {automation.autoBuySingularityUpgrades ? 'ON' : 'OFF'}
              </button>
            ) : (
              <button
                type="button"
                disabled={!canBuyTimeAutoSingularity}
                onClick={onBuyTimeAutoSingularity}
                className={`rounded-xl px-4 py-2.5 text-xs font-extrabold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  canBuyTimeAutoSingularity
                    ? 'bg-rose-500 text-white hover:bg-rose-400 active:scale-95'
                    : 'cursor-not-allowed bg-slate-800 text-slate-500'
                }`}
              >
                <div>Unlock Auto-Singularity</div>
                <div className="font-mono text-[11px] tabular-nums">
                  {adminFreeMode ? 'FREE' : `${formatNum(timeAutoSingularityCost, notation)} 🪙`}
                </div>
              </button>
            )}
          </div>

          {/* 4. Unlock Ideal Tab (1,000,000 Time Tokens) */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-fuchsia-500/40 bg-gradient-to-r from-slate-950 via-fuchsia-950/30 to-slate-950 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-fuchsia-400/40 bg-fuchsia-950/50 text-2xl">
                🌈
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">Unlock &ldquo;Ideal&rdquo; Tab</span>
                  <span className="font-mono text-xs text-fuchsia-300">
                    {idealTabUnlocked ? 'UNLOCKED' : '1,000,000 🪙'}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-400">
                  Opens the prismatic Ideal XP bar (Red → Orange → Yellow → Green → Blue → Purple →
                  Violet), awarding colored squares every level-up!
                </p>
              </div>
            </div>

            {idealTabUnlocked ? (
              <button
                type="button"
                onClick={onOpenIdealTab}
                className="rounded-xl bg-gradient-to-r from-rose-500 via-amber-400 to-violet-500 px-4 py-2.5 text-xs font-extrabold text-slate-950 shadow-md hover:brightness-110 cursor-pointer whitespace-nowrap shrink-0"
              >
                Open Ideal Tab →
              </button>
            ) : (
              <button
                type="button"
                disabled={!canUnlockIdealTab}
                onClick={onUnlockIdealTab}
                className={`rounded-xl px-4 py-2.5 text-xs font-extrabold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  canUnlockIdealTab
                    ? 'bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white shadow-lg shadow-fuchsia-500/25 hover:brightness-110 active:scale-95'
                    : 'cursor-not-allowed bg-slate-800 text-slate-500'
                }`}
              >
                <div>Unlock Ideal Tab</div>
                <div className="font-mono text-[11px] tabular-nums">
                  {adminFreeMode ? 'FREE' : `${formatNum(idealTabCost, notation)} 🪙`}
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(TimeResetPanel);
