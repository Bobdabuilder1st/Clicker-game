import React from 'react';
import { IdealState, NotationType } from '../../types/game';
import { formatNum } from '../../utils/format';
import { IDEAL_COLORS, IDEAL_SQUARES_PER_COLOR, IDEAL_XP_GROWTH } from '../../utils/gameData';

interface IdealPanelProps {
  idealTabUnlocked: boolean;
  idealTabCost: number;
  canUnlockIdealTab: boolean;
  timeTokens: number;
  ideal: IdealState;
  idealXpPerSecond: number;
  notation: NotationType;
  adminUnlocked: boolean;
  adminFreeMode: boolean;
  onUnlockIdealTab: () => void;
}

const IdealPanel: React.FC<IdealPanelProps> = ({
  idealTabUnlocked,
  idealTabCost,
  canUnlockIdealTab,
  timeTokens,
  ideal,
  idealXpPerSecond,
  notation,
  adminUnlocked,
  adminFreeMode,
  onUnlockIdealTab
}) => {
  const isAccessible = idealTabUnlocked || adminUnlocked;
  const activeColor = IDEAL_COLORS[Math.min(IDEAL_COLORS.length - 1, ideal.colorIndex)];
  const xpProgress = Math.min(100, Math.max(0, (ideal.xp / Math.max(0.0001, ideal.xpNeeded)) * 100));
  const isFinalColor = ideal.colorIndex >= IDEAL_COLORS.length - 1;
  const nextColor = !isFinalColor ? IDEAL_COLORS[ideal.colorIndex + 1] : null;
  const totalSquares = Object.values(ideal.squares).reduce((sum, n) => sum + n, 0);

  if (!isAccessible) {
    return (
      <div className="rounded-3xl border border-fuchsia-500/40 bg-gradient-to-br from-slate-950 via-fuchsia-950/25 to-slate-900 p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-fuchsia-400/50 bg-fuchsia-500/20 text-4xl">
          🌈
        </div>
        <h2 className="mt-4 text-xl font-extrabold text-white">The Ideal Spectrum</h2>
        <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-slate-300">
          Unlock after reaching <strong className="text-amber-300">1,000,000 Time Tokens</strong>.
          Charge a prismatic XP bar from <strong className="text-red-300">Red</strong> through{' '}
          <strong className="text-violet-300">Violet</strong> — every level-up awards a colored
          square, increases XP gain by <strong className="text-emerald-300">+1 XP/s</strong>, and
          scales XP required by <strong className="text-cyan-300">×{IDEAL_XP_GROWTH}</strong>.
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
              ? 'Unlock Ideal (FREE)'
              : `Unlock Ideal (${formatNum(idealTabCost, notation)} 🪙)`
            : `Need ${formatNum(idealTabCost, notation)} Time Tokens`}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Active Color XP Progression Bar */}
      <div className={`rounded-3xl border ${activeColor.borderClass} bg-slate-900/90 p-5 shadow-2xl`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className={`text-xs font-bold uppercase tracking-widest ${activeColor.textClass}`}>
              Ideal Spectrum · Stage {ideal.colorIndex + 1}/{IDEAL_COLORS.length}: {activeColor.name}
            </div>
            <h2 className="mt-0.5 text-xl font-extrabold text-white">
              Total Colored Squares: {formatNum(totalSquares, notation, 0)}
            </h2>
            <p className="mt-1 text-xs text-slate-300">
              Generating{' '}
              <strong className="font-mono text-emerald-300 tabular-nums">
                +{formatNum(idealXpPerSecond, notation, 0)} XP/sec
              </strong>{' '}
              <span className="text-slate-400">
                (1 base + {ideal.totalLevels} levels + {ideal.colorIndex} color bonus)
              </span>
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 px-3.5 py-2 text-right">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {isFinalColor ? 'Final Color Reached' : `Next: ${nextColor?.name}`}
            </div>
            <div className="font-mono text-sm font-extrabold text-white tabular-nums">
              {isFinalColor
                ? `Lv.${ideal.levelInColor} (Infinite)`
                : `${ideal.levelInColor}/${IDEAL_SQUARES_PER_COLOR} Squares`}
            </div>
          </div>
        </div>

        {/* Main XP Bar */}
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className={`font-bold ${activeColor.textClass}`}>
              {activeColor.name} XP Progress
            </span>
            <span className="font-mono font-semibold text-white tabular-nums">
              {formatNum(ideal.xp, notation, 1)} / {formatNum(ideal.xpNeeded, notation, 2)} XP (
              {xpProgress.toFixed(1)}%)
            </span>
          </div>
          <div className="h-5 w-full overflow-hidden rounded-full border border-slate-700/80 bg-slate-950 p-0.5">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${activeColor.barClass} transition-all duration-200`}
              style={{ width: `${xpProgress}%` }}
            />
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between text-[11px] text-slate-400">
            <span>Each level-up grants 1 {activeColor.name} Square &amp; +1 XP/s</span>
            <span className="font-mono tabular-nums">
              Next Level XP Req: ×{IDEAL_XP_GROWTH} ({formatNum(ideal.xpNeeded * IDEAL_XP_GROWTH, notation, 2)} XP)
            </span>
          </div>
        </div>

        {/* Color Spectrum Track */}
        <div className="mt-4 grid grid-cols-7 gap-1.5">
          {IDEAL_COLORS.map((col, idx) => {
            const isCurrent = idx === ideal.colorIndex;
            const isCompleted = idx < ideal.colorIndex;
            return (
              <div
                key={col.id}
                className={`rounded-xl border px-2 py-1.5 text-center transition-all ${
                  isCurrent
                    ? `${col.borderClass} bg-slate-800/90 ring-1 ring-white/30`
                    : isCompleted
                      ? 'border-emerald-500/40 bg-emerald-950/25'
                      : 'border-slate-800 bg-slate-950/50 opacity-50'
                }`}
              >
                <div className={`mx-auto h-3 w-3 rounded-sm border ${col.squareClass}`} />
                <div className="mt-1 truncate text-[10px] font-bold text-slate-200">{col.name}</div>
                <div className="font-mono text-[10px] text-slate-400 tabular-nums">
                  +{idx} XP/s
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Colored Squares Vault */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/85 p-5">
        <div className="mb-3">
          <h3 className="text-sm font-bold text-white">Prismatic Square Vault</h3>
          <p className="text-xs text-slate-400">
            Every level-up mints one square of the active color. Advancing past 10 squares unlocks the
            next color and +1 bonus XP/sec!
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {IDEAL_COLORS.map((col, idx) => {
            const count = ideal.squares[col.id] ?? 0;
            const visualLimit = 40;
            const renderedSquares = Math.min(count, visualLimit);
            const overflow = count - renderedSquares;

            return (
              <div
                key={col.id}
                className={`rounded-2xl border p-3.5 ${
                  idx === ideal.colorIndex
                    ? `${col.borderClass} bg-slate-950/85`
                    : 'border-slate-800 bg-slate-950/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`inline-block h-3.5 w-3.5 rounded-sm border ${col.squareClass}`} />
                    <span className={`text-xs font-extrabold ${col.textClass}`}>{col.name}</span>
                    {idx === ideal.colorIndex && (
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-xs font-bold text-white tabular-nums">
                    ×{formatNum(count, notation, 0)}
                  </span>
                </div>

                <div className="mt-2.5 flex min-h-[24px] flex-wrap items-center gap-1">
                  {count === 0 ? (
                    <span className="text-[11px] text-slate-500">No squares collected yet</span>
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
      </div>
    </div>
  );
};

export default React.memo(IdealPanel);
