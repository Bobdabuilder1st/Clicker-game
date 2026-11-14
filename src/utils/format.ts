import Decimal, { type DecimalSource } from 'break_eternity.js';
import { MultiBuyAmount, NotationType } from '../types/game';

export { Decimal };
export type { DecimalSource };

export const D_ZERO = new Decimal(0);
export const D_ONE = new Decimal(1);
export const GOOGOL = Decimal.pow10(100);
const GOOGOL_CEIL = Decimal.pow10(103);

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
 * Safely hydrates any number, string, Decimal, or serialized component object into a valid Decimal.
 * Never imposes a 1e305 ceiling.
 */
export function toDec(val: unknown): Decimal {
  if (val instanceof Decimal) {
    return val.isNan() || !val.isFinite() ? D_ZERO : val;
  }
  if (typeof val === 'number') {
    if (Number.isNaN(val) || !Number.isFinite(val)) return D_ZERO;
    return new Decimal(val);
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return D_ZERO;
    try {
      const parsed = new Decimal(trimmed);
      return parsed.isNan() || !parsed.isFinite() ? D_ZERO : parsed;
    } catch {
      return D_ZERO;
    }
  }
  if (val && typeof val === 'object') {
    const maybe = val as { sign?: unknown; layer?: unknown; mag?: unknown };
    if (
      typeof maybe.sign === 'number' &&
      typeof maybe.layer === 'number' &&
      typeof maybe.mag === 'number'
    ) {
      const parsed = Decimal.fromComponents(maybe.sign, maybe.layer, maybe.mag);
      return parsed.isNan() || !parsed.isFinite() ? D_ZERO : parsed;
    }
  }
  return D_ZERO;
}

export function safeNum(n: DecimalSource): Decimal {
  return toDec(n);
}

export const clampGoogol = safeNum;

export function safePow(base: DecimalSource, exp: DecimalSource): Decimal {
  const b = toDec(base);
  const e = toDec(exp);
  if (b.lte(0)) return e.eq(0) ? D_ONE : D_ZERO;
  if (e.eq(0)) return D_ONE;
  const res = b.pow(e);
  return res.isNan() || !res.isFinite() ? D_ONE : res;
}

export function safeMul(a: DecimalSource, b: DecimalSource): Decimal {
  return safeNum(toDec(a).mul(toDec(b)));
}

export function progressPercent(current: DecimalSource, target: DecimalSource): number {
  const c = toDec(current);
  const t = toDec(target);
  if (t.lte(0) || c.gte(t)) return 100;
  if (c.lte(0)) return 0;
  const ratio = c.div(t).toNumber();
  if (!Number.isFinite(ratio) || Number.isNaN(ratio)) return 0;
  return Math.min(100, Math.max(0, ratio * 100));
}

/**
 * Enforces a smooth soft cap followed by an unbreakable hard cap using Decimal math.
 */
export function applySoftAndHardCap(
  rawValue: DecimalSource,
  softCap: DecimalSource,
  hardCap: DecimalSource,
  softPower = 0.5
): Decimal {
  const clean = Decimal.max(D_ZERO, toDec(rawValue));
  const soft = toDec(softCap);
  const hard = toDec(hardCap);
  if (clean.lte(soft)) return clean;
  if (hard.lte(soft)) return Decimal.min(clean, hard);

  const headroom = hard.sub(soft);
  const excessRatio = clean.sub(soft).div(headroom);
  const powered = excessRatio.pow(softPower);
  const diminished = powered.div(D_ONE.add(powered));
  return Decimal.min(hard, soft.add(headroom.mul(diminished)));
}

/**
 * Shared 3-phase boost curve:
 * 1) Exponential surge up to `surgePeak`
 * 2) Diminishing returns from `surgePeak` to `capCeiling` (1e+50 * 10^timeResets, uncapped by 1e305!)
 * 3) Hard cap at `capCeiling` (extra currency beyond cap gives 0 additional boost)
 */
export function computeCappedBoostCurve(
  amount: DecimalSource,
  capCeiling: DecimalSource,
  exponent = 0.65,
  factor = 0.25,
  maxMultSoft: DecimalSource = 1e8,
  maxMultHard: DecimalSource = 1e14
): { multiplier: Decimal; phase: 'exponential' | 'diminishing' | 'capped'; capCeiling: Decimal } {
  const amt = toDec(amount);
  const safeCap = Decimal.max(100_000, toDec(capCeiling));
  const surgePeak = Decimal.min(safeCap.mul(0.001), Decimal.max(100_000, safeCap.pow(0.38)));

  if (amt.lte(0)) {
    return { multiplier: D_ONE, phase: 'exponential', capCeiling: safeCap };
  }

  const peakRawBonus = safeMul(factor, safePow(surgePeak, exponent));

  if (amt.lte(surgePeak)) {
    const rawBonus = safeMul(factor, safePow(amt, exponent));
    const capped = applySoftAndHardCap(D_ONE.add(rawBonus), maxMultSoft, maxMultHard, 0.45);
    return { multiplier: capped, phase: 'exponential', capCeiling: safeCap };
  }

  if (amt.lt(safeCap)) {
    const logPeak = surgePeak.log10();
    const logCap = safeCap.log10();
    const denom = Decimal.max(D_ONE, logCap.sub(logPeak));
    const tRaw = amt.log10().sub(logPeak).div(denom).toNumber();
    const t = Math.min(1, Math.max(0, Number.isFinite(tRaw) ? tRaw : 0));
    const extraFraction = 1 - Math.pow(1 - t, 1.8);
    const rawBonus = peakRawBonus.mul(1 + extraFraction * 1.5);
    const capped = applySoftAndHardCap(D_ONE.add(rawBonus), maxMultSoft, maxMultHard, 0.45);
    return { multiplier: capped, phase: 'diminishing', capCeiling: safeCap };
  }

  const maxRawBonus = peakRawBonus.mul(2.5);
  const capped = applySoftAndHardCap(D_ONE.add(maxRawBonus), maxMultSoft, maxMultHard, 0.45);
  return { multiplier: capped, phase: 'capped', capCeiling: safeCap };
}

function formatExpInt(exp: number): string {
  if (exp < 100_000) return String(exp);
  return exp.toLocaleString('en-US');
}

export function formatNum(
  n: DecimalSource,
  notation: NotationType = 'standard',
  decimals = 2
): string {
  const d = toDec(n);
  if (d.eq(0)) return '0';

  const signStr = d.sign < 0 ? '-' : '';
  const abs = d.abs();

  if (abs.lt(1000)) {
    const num = abs.toNumber();
    if (Math.abs(Math.round(num) - num) < 0.001) return `${signStr}${Math.round(num)}`;
    return `${signStr}${num < 10 ? num.toFixed(decimals) : num.toFixed(1)}`;
  }

  if (notation === 'standard' && abs.lt(GOOGOL_CEIL)) {
    if (abs.gte(GOOGOL)) {
      const scaled = abs.div(GOOGOL).toNumber();
      return `${signStr}${scaled.toFixed(decimals)} Googol`;
    }

    const exp = Math.floor(abs.e);
    const tier = Math.floor(exp / 3);
    if (tier < SUFFIXES.length) {
      let scaled = abs.div(Decimal.pow10(tier * 3)).toNumber();
      if (scaled >= 999.995 && tier + 1 < SUFFIXES.length) {
        scaled /= 1000;
        return `${signStr}${scaled.toFixed(decimals)}${SUFFIXES[tier + 1]}`;
      }
      return `${signStr}${scaled.toFixed(decimals)}${SUFFIXES[tier]}`;
    }
  }

  // Scientific or >= 1e103 without any upper bound
  if (abs.layer <= 1 && abs.e < 1e9) {
    let exp = Math.floor(abs.e);
    let mantissa = abs.m;
    if (!Number.isFinite(mantissa) || mantissa <= 0) mantissa = 1;
    let mStr = mantissa.toFixed(decimals);
    if (Number(mStr) >= 10) {
      exp += 1;
      mStr = (1).toFixed(decimals);
    }
    return `${signStr}${mStr}e+${formatExpInt(exp)}`;
  }

  // Hyper-exponential scale (exponent >= 1e9 or tetrated layers)
  if (abs.layer <= 4) {
    return `${signStr}e${formatNum(abs.log10(), 'scientific', decimals)}`;
  }

  return `${signStr}10^^${abs.layer}(${abs.mag.toFixed(2)})`;
}

export function getEffectiveScale(baseScale: number, scaleReduction: number): number {
  const clampedReduction = Math.min(0.6, Math.max(0, scaleReduction));
  return Math.max(1.01, 1 + (baseScale - 1) * (1 - clampedReduction));
}

export function getLevelCost(
  baseCost: DecimalSource,
  effectiveScale: number,
  currentLevel: number,
  discountMult = 1
): Decimal {
  const scaled = safeMul(baseCost, safePow(effectiveScale, currentLevel));
  const raw = safeMul(scaled, discountMult).floor();
  return Decimal.max(D_ONE, raw);
}

export function getRebirthLevelCost(
  baseCost: DecimalSource,
  effectiveScale: number,
  rebirthLevel: number
): Decimal {
  const quadExp = (rebirthLevel * (rebirthLevel + 1)) / 2;
  const linearPart = safePow(effectiveScale, rebirthLevel);
  const expAcceleration = safePow(1.42, quadExp);
  const raw = safeMul(baseCost, safeMul(linearPart, expAcceleration)).floor();
  return Decimal.max(D_ONE, raw);
}

export interface MultiBuyResult {
  count: number;
  totalCost: Decimal;
  canAfford: boolean;
  nextSingleCost: Decimal;
}

export function calculateMultiBuyRebirth(
  coins: DecimalSource,
  baseCost: DecimalSource,
  effectiveScale: number,
  currentRebirthLevel: number,
  multiBuy: MultiBuyAmount,
  maxAllowed = 50,
  costMult = 1
): MultiBuyResult {
  const coinsDec = toDec(coins);
  const nextSingleCost = Decimal.max(
    D_ONE,
    getRebirthLevelCost(baseCost, effectiveScale, currentRebirthLevel).mul(costMult).floor()
  );

  if (maxAllowed <= 0) {
    return { count: 0, totalCost: nextSingleCost, canAfford: false, nextSingleCost };
  }
  if (multiBuy === 1) {
    return {
      count: 1,
      totalCost: nextSingleCost,
      canAfford: coinsDec.gte(nextSingleCost),
      nextSingleCost
    };
  }
  if (multiBuy === -1 && coinsDec.lt(nextSingleCost)) {
    return { count: 1, totalCost: nextSingleCost, canAfford: false, nextSingleCost };
  }

  let totalCost = D_ZERO;
  let count = 0;
  const target = multiBuy === -1 ? maxAllowed : Math.min(multiBuy, maxAllowed);

  for (let i = 0; i < target; i++) {
    const stepCost =
      i === 0
        ? nextSingleCost
        : Decimal.max(
            D_ONE,
            getRebirthLevelCost(baseCost, effectiveScale, currentRebirthLevel + i).mul(costMult).floor()
          );

    if (multiBuy === -1) {
      const nextSum = totalCost.add(stepCost);
      if (coinsDec.gte(nextSum)) {
        totalCost = nextSum;
        count++;
      } else {
        break;
      }
    } else {
      totalCost = totalCost.add(stepCost);
      count++;
    }
  }

  if (multiBuy === -1 && count === 0) {
    return { count: 1, totalCost: nextSingleCost, canAfford: false, nextSingleCost };
  }

  return {
    count,
    totalCost,
    canAfford: count > 0 && coinsDec.gte(totalCost),
    nextSingleCost
  };
}

export function calculateMultiBuy(
  currency: DecimalSource,
  baseCost: DecimalSource,
  effectiveScale: number,
  currentLevel: number,
  multiBuy: MultiBuyAmount,
  maxAllowed = 1000,
  discountMult = 1
): MultiBuyResult {
  const curDec = toDec(currency);
  let rawScaled = safeMul(baseCost, safePow(effectiveScale, currentLevel));
  const nextSingleCost = Decimal.max(D_ONE, rawScaled.mul(discountMult).floor());

  if (maxAllowed <= 0) {
    return { count: 0, totalCost: nextSingleCost, canAfford: false, nextSingleCost };
  }

  if (multiBuy === 1) {
    return {
      count: 1,
      totalCost: nextSingleCost,
      canAfford: curDec.gte(nextSingleCost),
      nextSingleCost
    };
  }

  if (multiBuy === -1 && curDec.lt(nextSingleCost)) {
    return { count: 1, totalCost: nextSingleCost, canAfford: false, nextSingleCost };
  }

  let totalCost = D_ZERO;
  let count = 0;
  const target = multiBuy === -1 ? Math.min(maxAllowed, 100) : Math.min(multiBuy, maxAllowed);

  for (let i = 0; i < target; i++) {
    const stepCost =
      i === 0 ? nextSingleCost : Decimal.max(D_ONE, rawScaled.mul(discountMult).floor());

    if (multiBuy === -1) {
      const nextSum = totalCost.add(stepCost);
      if (curDec.gte(nextSum)) {
        totalCost = nextSum;
        count++;
      } else {
        break;
      }
    } else {
      totalCost = totalCost.add(stepCost);
      count++;
    }
    rawScaled = rawScaled.mul(effectiveScale);
  }

  if (multiBuy === -1 && count === 0) {
    return { count: 1, totalCost: nextSingleCost, canAfford: false, nextSingleCost };
  }

  return {
    count,
    totalCost,
    canAfford: count > 0 && curDec.gte(totalCost),
    nextSingleCost
  };
}
