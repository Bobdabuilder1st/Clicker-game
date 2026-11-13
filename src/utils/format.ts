import { MultiBuyAmount, NotationType } from '../types/game';

export const GOOGOL = 1e100;

const SUFFIXES = [
  '',
  'K',
  'M',
  'B',
  'T',
  'Qa',
  'Qi',
  'Sx',
  'Sp',
  'Oc',
  'No',
  'Dc',
  'Ud',
  'Dd',
  'Td',
  'Qad',
  'Qid',
  'Sxd',
  'Spd',
  'Ocd',
  'Nvd',
  'Vg',
  'Uvg',
  'Dvg',
  'Tvg',
  'Qavg',
  'Qivg',
  'Sxvg',
  'Spvg',
  'Ocvg',
  'Nvvg',
  'Tg',
  'Utg',
  'Dtg'
];

/**
 * Prevents Infinity or NaN anywhere in the math engine, capping strictly at a Googol (1e100).
 */
export function clampGoogol(n: number): number {
  if (Number.isNaN(n)) return 0;
  if (!Number.isFinite(n)) return n > 0 ? GOOGOL : 0;
  if (n >= GOOGOL) return GOOGOL;
  if (n <= -GOOGOL) return -GOOGOL;
  return n;
}

export function safePow(base: number, exp: number): number {
  if (base <= 0) return exp === 0 ? 1 : 0;
  if (exp === 0) return 1;
  // Prevent log10 overflow past Googol
  const logVal = exp * Math.log10(base);
  if (Number.isNaN(logVal)) return 1;
  if (logVal >= 100) return GOOGOL;
  if (logVal <= -100) return 0;
  return clampGoogol(Math.pow(base, exp));
}

export function safeMul(a: number, b: number): number {
  const res = a * b;
  return clampGoogol(res);
}

/**
 * Enforces a smooth soft cap followed by an unbreakable hard cap.
 * Exploits or stacked multipliers cannot exceed `hardCap`.
 */
export function applySoftAndHardCap(
  rawValue: number,
  softCap: number,
  hardCap: number,
  softPower = 0.5
): number {
  const clean = clampGoogol(Math.max(0, rawValue));
  if (clean <= softCap) return clean;
  if (hardCap <= softCap) return Math.min(clean, hardCap);

  const headroom = hardCap - softCap;
  const excessRatio = (clean - softCap) / headroom;
  // Asymptotic saturation strictly bounded inside [softCap, hardCap)
  const diminished = 1 - 1 / (1 + Math.pow(excessRatio, softPower));
  return Math.min(hardCap, softCap + headroom * diminished);
}

/**
 * Shared 3-phase boost curve:
 * 1) Exponential surge up to `surgePeak`
 * 2) Diminishing returns from `surgePeak` to `capCeiling` (100T * 10^timeResets)
 * 3) Hard cap at `capCeiling` (extra currency beyond cap gives 0 additional boost)
 */
export function computeCappedBoostCurve(
  amount: number,
  capCeiling: number,
  exponent = 0.65,
  factor = 0.25,
  maxMultSoft = 1e8,
  maxMultHard = 1e14
): { multiplier: number; phase: 'exponential' | 'diminishing' | 'capped'; capCeiling: number } {
  const safeCap = clampGoogol(Math.max(100_000, capCeiling));
  const surgePeak = Math.min(safeCap * 0.001, Math.max(100_000, Math.pow(safeCap, 0.38)));

  if (amount <= 0) {
    return { multiplier: 1, phase: 'exponential', capCeiling: safeCap };
  }

  const peakRawBonus = safeMul(factor, safePow(surgePeak, exponent));

  if (amount <= surgePeak) {
    const rawBonus = safeMul(factor, safePow(amount, exponent));
    const capped = applySoftAndHardCap(1 + rawBonus, maxMultSoft, maxMultHard, 0.45);
    return { multiplier: capped, phase: 'exponential', capCeiling: safeCap };
  }

  if (amount < safeCap) {
    const logPeak = Math.log10(surgePeak);
    const logCap = Math.log10(safeCap);
    const t = Math.min(1, Math.max(0, (Math.log10(amount) - logPeak) / Math.max(1, logCap - logPeak)));
    const extraFraction = 1 - Math.pow(1 - t, 1.8);
    const rawBonus = peakRawBonus * (1 + extraFraction * 1.5);
    const capped = applySoftAndHardCap(1 + rawBonus, maxMultSoft, maxMultHard, 0.45);
    return { multiplier: capped, phase: 'diminishing', capCeiling: safeCap };
  }

  const maxRawBonus = peakRawBonus * 2.5;
  const capped = applySoftAndHardCap(1 + maxRawBonus, maxMultSoft, maxMultHard, 0.45);
  return { multiplier: capped, phase: 'capped', capCeiling: safeCap };
}

export function formatNum(n: number, notation: NotationType = 'standard', decimals = 2): string {
  const safe = clampGoogol(n);
  if (safe === 0) return '0';

  const abs = Math.abs(safe);
  if (abs >= GOOGOL) {
    return notation === 'scientific' ? '1.00e+100' : '1.00 Googol';
  }

  if (abs < 1000) {
    if (Math.abs(Math.round(safe) - safe) < 0.001) return Math.round(safe).toString();
    return abs < 10 ? safe.toFixed(decimals) : safe.toFixed(1);
  }

  if (notation === 'scientific') {
    const exp = Math.floor(Math.log10(abs));
    const mantissa = safe / Math.pow(10, exp);
    return `${mantissa.toFixed(decimals)}e+${exp}`;
  }

  const tier = Math.floor(Math.log10(abs) / 3);
  if (tier < SUFFIXES.length) {
    const scaled = safe / Math.pow(10, tier * 3);
    return `${scaled.toFixed(decimals)}${SUFFIXES[tier]}`;
  }

  // Between 1e102 wouldn't happen since GOOGOL is 1e100, fallback cleanly
  const exp = Math.floor(Math.log10(abs));
  const mantissa = safe / Math.pow(10, exp);
  return `${mantissa.toFixed(decimals)}e+${exp}`;
}

/**
 * Computes effective scaling factor after global scaling reduction.
 */
export function getEffectiveScale(baseScale: number, scaleReduction: number): number {
  const clampedReduction = Math.min(0.6, Math.max(0, scaleReduction));
  return Math.max(1.01, 1 + (baseScale - 1) * (1 - clampedReduction));
}

/**
 * Calculates single-item cost at a given level/count, bounded by GOOGOL.
 */
export function getLevelCost(
  baseCost: number,
  effectiveScale: number,
  currentLevel: number,
  discountMult = 1
): number {
  const scaled = safeMul(baseCost, safePow(effectiveScale, currentLevel));
  const raw = safeMul(scaled, discountMult);
  return clampGoogol(Math.max(1, Math.floor(raw)));
}

/**
 * Exponentially harder Rebirth cost curve:
 * Each Rebirth increases the multiplier gap exponentially (super-exponential scaling).
 */
export function getRebirthLevelCost(
  baseCost: number,
  effectiveScale: number,
  rebirthLevel: number
): number {
  const quadExp = (rebirthLevel * (rebirthLevel + 1)) / 2;
  const linearPart = safePow(effectiveScale, rebirthLevel);
  const expAcceleration = safePow(1.42, quadExp);
  const raw = safeMul(baseCost, safeMul(linearPart, expAcceleration));
  return clampGoogol(Math.max(1, Math.floor(raw)));
}

export function calculateMultiBuyRebirth(
  coins: number,
  baseCost: number,
  effectiveScale: number,
  currentRebirthLevel: number,
  multiBuy: MultiBuyAmount,
  maxAllowed = 50
): { count: number; totalCost: number; canAfford: boolean; nextSingleCost: number } {
  const nextSingleCost = getRebirthLevelCost(baseCost, effectiveScale, currentRebirthLevel);
  if (maxAllowed <= 0) {
    return { count: 0, totalCost: nextSingleCost, canAfford: false, nextSingleCost };
  }
  if (multiBuy === 1) {
    return {
      count: 1,
      totalCost: nextSingleCost,
      canAfford: coins >= nextSingleCost && nextSingleCost < GOOGOL,
      nextSingleCost
    };
  }

  let totalCost = 0;
  let count = 0;
  const target = multiBuy === -1 ? maxAllowed : Math.min(multiBuy, maxAllowed);

  for (let i = 0; i < target; i++) {
    const stepCost = getRebirthLevelCost(baseCost, effectiveScale, currentRebirthLevel + i);
    if (stepCost >= GOOGOL) break;
    if (multiBuy === -1) {
      if (coins >= totalCost + stepCost) {
        totalCost = clampGoogol(totalCost + stepCost);
        count++;
      } else {
        break;
      }
    } else {
      totalCost = clampGoogol(totalCost + stepCost);
      count++;
    }
  }

  if (multiBuy === -1 && count === 0) {
    return { count: 1, totalCost: nextSingleCost, canAfford: false, nextSingleCost };
  }

  return {
    count,
    totalCost,
    canAfford: count > 0 && coins >= totalCost && totalCost < GOOGOL,
    nextSingleCost
  };
}

/**
 * Calculates multi-buy count and total cost for geometric cost progression.
 * Safely stops before GOOGOL so Infinity never appears.
 */
export function calculateMultiBuy(
  currency: number,
  baseCost: number,
  effectiveScale: number,
  currentLevel: number,
  multiBuy: MultiBuyAmount,
  maxAllowed = 1000,
  discountMult = 1
): { count: number; totalCost: number; canAfford: boolean; nextSingleCost: number } {
  const nextSingleCost = getLevelCost(baseCost, effectiveScale, currentLevel, discountMult);

  if (maxAllowed <= 0) {
    return { count: 0, totalCost: nextSingleCost, canAfford: false, nextSingleCost };
  }

  if (multiBuy === 1) {
    return {
      count: 1,
      totalCost: nextSingleCost,
      canAfford: currency >= nextSingleCost && nextSingleCost < GOOGOL,
      nextSingleCost
    };
  }

  let totalCost = 0;
  let count = 0;
  const target = multiBuy === -1 ? Math.min(maxAllowed, 100) : Math.min(multiBuy, maxAllowed);

  for (let i = 0; i < target; i++) {
    const stepCost = getLevelCost(baseCost, effectiveScale, currentLevel + i, discountMult);
    if (stepCost >= GOOGOL) break;

    if (multiBuy === -1) {
      if (currency >= totalCost + stepCost) {
        totalCost = clampGoogol(totalCost + stepCost);
        count++;
      } else {
        break;
      }
    } else {
      totalCost = clampGoogol(totalCost + stepCost);
      count++;
    }
  }

  if (multiBuy === -1 && count === 0) {
    return { count: 1, totalCost: nextSingleCost, canAfford: false, nextSingleCost };
  }

  return {
    count,
    totalCost,
    canAfford: count > 0 && currency >= totalCost && totalCost < GOOGOL,
    nextSingleCost
  };
}
