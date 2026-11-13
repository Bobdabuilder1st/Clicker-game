import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FloatingNumber, MultiBuyAmount, NotationType, ClickerEvolution } from '../types/game';
import { formatNum } from '../utils/format';
import { MultiBuyBar } from '../components/MultiBuyBar';

interface ClickerSectionProps {
  coinsPerClick: number;
  coinsPerSecond: number;
  autoClicksPerSecond: number;
  rpPerSecond: number;
  rebirthPoints: number;
  rpFormulaExponent: number;
  rpFormulaFactor: number;
  rpCoinMultiplier: number;
  rpCurvePhase: 'exponential' | 'diminishing' | 'capped';
  boostCapCeiling: number;
  critChance: number;
  critMultiplier: number;
  clickerLevel: number;
  clickerEvolution: ClickerEvolution;
  nextClickerEvolution: ClickerEvolution | null;
  clickerTotalPowerMult: number;
  clickerGlobalCoinBoost: number;
  effectiveClickerScale: number;
  coinCoreMultiBuy: MultiBuyAmount;
  clickerBuyInfo: {
    count: number;
    totalCost: number;
    canAfford: boolean;
    nextSingleCost: number;
  };
  notation: NotationType;
  adminFreeMode: boolean;
  onManualClick: () => { amount: number; isCrit: boolean };
  onLevelUpClicker: () => void;
  onCoinCoreMultiChange: (val: MultiBuyAmount) => void;
}

export const ClickerSection: React.FC<ClickerSectionProps> = React.memo(({
  coinsPerClick,
  coinsPerSecond,
  autoClicksPerSecond,
  rpPerSecond,
  rebirthPoints,
  rpFormulaExponent,
  rpFormulaFactor,
  rpCoinMultiplier,
  rpCurvePhase,
  boostCapCeiling,
  critChance,
  critMultiplier,
  clickerLevel,
  clickerEvolution,
  nextClickerEvolution,
  clickerTotalPowerMult,
  clickerGlobalCoinBoost,
  effectiveClickerScale,
  coinCoreMultiBuy,
  clickerBuyInfo,
  notation,
  adminFreeMode,
  onManualClick,
  onLevelUpClicker,
  onCoinCoreMultiChange
}) => {
  const [floatingNumbers, setFloatingNumbers] = useState<FloatingNumber[]>([]);
  const [isPressed, setIsPressed] = useState(false);
  const floatIdRef = useRef(0);
  const orbRef = useRef<HTMLButtonElement>(null);

  const spawnFloat = useCallback((x: number, y: number, amount: number, isCrit: boolean) => {
    const id = ++floatIdRef.current;
    setFloatingNumbers((prev) => [
      ...prev.slice(-14),
      {
        id,
        x,
        y,
        text: `${isCrit ? 'CRIT ' : ''}+${formatNum(amount, notation, 1)}`,
        isCrit
      }
    ]);
    window.setTimeout(() => {
      setFloatingNumbers((prev) => prev.filter((f) => f.id !== id));
    }, 800);
  }, [notation]);

  const handleOrbClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left + (Math.random() * 24 - 12);
    const y = e.clientY - rect.top - 10;
    const { amount, isCrit } = onManualClick();
    spawnFloat(x, y, amount, isCrit);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === 'Space' &&
        document.activeElement?.tagName !== 'BUTTON' &&
        document.activeElement?.tagName !== 'INPUT'
      ) {
        e.preventDefault();
        setIsPressed(true);
        const { amount, isCrit } = onManualClick();
        const rect = orbRef.current?.getBoundingClientRect();
        const x = rect ? rect.width / 2 + (Math.random() * 36 - 18) : 110;
        const y = rect ? rect.height / 3 : 80;
        spawnFloat(x, y, amount, isCrit);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') setIsPressed(false);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [onManualClick, spawnFloat]);

  const companionIndices = Array.from({ length: clickerEvolution.companionCount }, (_, i) => i);
  const evoProgress = nextClickerEvolution
    ? Math.min(
        100,
        Math.max(
          0,
          ((clickerLevel - clickerEvolution.minLevel) /
            (nextClickerEvolution.minLevel - clickerEvolution.minLevel)) *
            100
        )
      )
    : 100;

  return (
    <div className="flex flex-col gap-4">
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/75 p-6 shadow-2xl">
        <div
          className={`pointer-events-none absolute inset-0 bg-radial ${clickerEvolution.glowColor} to-transparent`}
        />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="text-xs font-semibold uppercase tracking-widest text-amber-300/90">
            Lv.{clickerLevel} · {clickerEvolution.name}
          </div>
          <div className="mt-0.5 text-xs text-slate-400">{clickerEvolution.subtitle}</div>

          <div className="relative my-5 flex h-52 w-52 items-center justify-center">
            {companionIndices.map((idx) => {
              const angle = (idx / Math.max(1, companionIndices.length)) * 360;
              return (
                <div
                  key={idx}
                  className="pointer-events-none absolute inset-0 animate-spin"
                  style={{ animationDuration: `${8 + idx * 1.2}s` }}
                >
                  <div
                    className="absolute left-1/2 top-0 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-amber-300/60 bg-slate-900/90 text-sm shadow-lg shadow-amber-500/20"
                    style={{ transform: `rotate(${angle}deg)` }}
                  >
                    🪙
                  </div>
                </div>
              );
            })}

            <button
              ref={orbRef}
              type="button"
              onClick={handleOrbClick}
              onMouseDown={() => setIsPressed(true)}
              onMouseUp={() => setIsPressed(false)}
              onMouseLeave={() => setIsPressed(false)}
              aria-label="Click to mint coins"
              className={`group relative flex h-44 w-44 cursor-pointer select-none items-center justify-center rounded-full border-4 ${
                clickerEvolution.ringColor
              } bg-gradient-to-br ${
                clickerEvolution.gradient
              } shadow-[0_0_50px_rgba(251,191,36,0.28)] transition-transform duration-75 hover:scale-[1.03] active:scale-95 ${
                isPressed ? 'scale-95' : ''
              }`}
            >
              <div className="pointer-events-none absolute inset-2 rounded-full border border-white/30" />
              <span className="pointer-events-none text-6xl drop-shadow-md transition-transform group-hover:scale-105">
                🪙
              </span>
            </button>

            {floatingNumbers.map((fn) => (
              <span
                key={fn.id}
                style={{ left: fn.x, top: fn.y }}
                className={`pointer-events-none absolute z-20 -translate-x-1/2 font-mono font-extrabold tabular-nums drop-shadow-md animate-float-up ${
                  fn.isCrit ? 'text-lg text-rose-300' : 'text-sm text-amber-200'
                }`}
              >
                {fn.text}
              </span>
            ))}
          </div>

          <div className="grid w-full grid-cols-2 gap-2.5 text-left">
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2">
              <div className="text-[11px] font-medium text-slate-400">Per Click</div>
              <div className="font-mono text-base font-bold text-amber-300 tabular-nums">
                +{formatNum(coinsPerClick, notation)}
              </div>
              {critChance > 0 && (
                <div className="text-[10px] text-rose-300">
                  {Math.round(critChance * 100)}% Crit ({formatNum(critMultiplier, notation, 1)}x)
                </div>
              )}
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2">
              <div className="text-[11px] font-medium text-slate-400">Passive CPS</div>
              <div className="font-mono text-base font-bold text-emerald-300 tabular-nums">
                +{formatNum(coinsPerSecond + autoClicksPerSecond * coinsPerClick, notation)}/s
              </div>
              {rpPerSecond > 0 && (
                <div className="text-[10px] font-mono text-purple-300 tabular-nums">
                  +{formatNum(rpPerSecond, notation)} RP/s
                </div>
              )}
            </div>
          </div>

          <div className="mt-2 text-[11px] text-slate-500">
            Click orb or hold/tap <span className="font-mono text-slate-300">Spacebar</span>
          </div>
        </div>
      </div>

      {/* Coin Core Level-Up Card (Own Multi-Buy UI, 1.1x scale, Uncapped!) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <span>🪙 Coin Core Level-Up</span>
            <span className="font-mono text-xs text-amber-300 tabular-nums">Lv.{clickerLevel}</span>
          </div>
          <MultiBuyBar value={coinCoreMultiBuy} onChange={onCoinCoreMultiChange} compact />
        </div>

        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs text-slate-400">
              Click Mult:{' '}
              <span className="font-mono font-semibold text-amber-300 tabular-nums">
                {formatNum(clickerTotalPowerMult, notation)}x
              </span>{' '}
              · Coin Boost:{' '}
              <span className="font-mono font-semibold text-emerald-300 tabular-nums">
                {formatNum(clickerGlobalCoinBoost, notation)}x
              </span>
            </div>
            <div className="mt-0.5 text-[11px] text-slate-500">
              Scale:{' '}
              <span className="font-mono text-slate-300 tabular-nums">
                {effectiveClickerScale.toFixed(3)}x/lv
              </span>{' '}
              · Uncapped · Companions:{' '}
              <span className="font-mono text-slate-300 tabular-nums">
                {clickerEvolution.companionCount}
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={!clickerBuyInfo.canAfford}
            onClick={onLevelUpClicker}
            className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              clickerBuyInfo.canAfford
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 hover:bg-amber-300 active:scale-95'
                : 'cursor-not-allowed bg-slate-800 text-slate-500'
            }`}
          >
            <div>Upgrade +{clickerBuyInfo.count}</div>
            <div className="font-mono text-[11px] tabular-nums">
              {adminFreeMode ? 'FREE' : `${formatNum(clickerBuyInfo.totalCost, notation)} 🪙`}
            </div>
          </button>
        </div>

        {nextClickerEvolution ? (
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-[11px] text-slate-400">
              <span>
                Next Form: <strong className="text-slate-200">{nextClickerEvolution.name}</strong> (Lv.
                {nextClickerEvolution.minLevel})
              </span>
              <span className="font-mono tabular-nums">
                {clickerEvolution.coinBoostMultiplier}x → {nextClickerEvolution.coinBoostMultiplier}x
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-300"
                style={{ width: `${evoProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="mt-2 text-[11px] font-semibold text-fuchsia-300">
            Singularity Heart Reached — Infinite Coin Core leveling unlocked!
          </div>
        )}
      </div>

      {/* Live RP -> Coins Curve Card (100T Cap * 10^timeResets) */}
      <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
            RP → Coins Curve
          </span>
          <span className="font-mono text-sm font-extrabold text-purple-200 tabular-nums">
            ×{formatNum(rpCoinMultiplier, notation)} Coins
          </span>
        </div>
        <div className="mt-2 rounded-lg bg-slate-950/80 px-3 py-2 font-mono text-xs text-slate-300 tabular-nums">
          Mult = 1 + (RP<sup>{rpFormulaExponent}</sup> × {rpFormulaFactor})
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[11px]">
          <span className="text-slate-400">
            Cap:{' '}
            <strong className="font-mono text-purple-200 tabular-nums">
              {formatNum(boostCapCeiling, notation)} RP
            </strong>
          </span>
          <span
            className={
              rpCurvePhase === 'exponential'
                ? 'text-emerald-300'
                : rpCurvePhase === 'diminishing'
                  ? 'text-amber-300'
                  : 'text-rose-300'
            }
          >
            {rpCurvePhase === 'exponential' && 'Exponential Surge'}
            {rpCurvePhase === 'diminishing' && 'Diminishing Returns'}
            {rpCurvePhase === 'capped' && 'Hard Cap (0 extra/RP)'}
          </span>
        </div>
      </div>
    </div>
  );
});
