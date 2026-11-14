import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  ActiveTab,
  EssenceConvergenceUpgrade,
  GameState,
  IdealColor,
  IdealState,
  IdleColorTrack,
  MultiBuyAmount,
  MultiBuySection,
  SaveStateEntry,
  SectionWaveState,
  SkillNode,
  SingularityUpgrade,
  TieredPerk
} from '../types/game';
import {
  SECTION_WAVE_CONFIGS,
  SECTION_WAVE_MAX_TIER,
  createWaveUpgradesForTab,
  BASE_BOOST_CAP,
  BILLION_ESSENCE_THRESHOLD,
  CLICKER_BASE_COST,
  CLICKER_COST_SCALE,
  ESSENCE_REACTOR_BASE_COST,
  ESSENCE_REACTOR_COST_SCALE,
  ESSENCE_REACTOR_MAX_LEVEL,
  IDEAL_BASE_XP,
  IDEAL_COLORS,
  IDEAL_TAB_COST,
  IDEAL_XP_GROWTH,
  IDLE_AUTO_TIME_COST,
  INITIAL_ASCENDED_REBIRTH_PERKS,
  INITIAL_BILLION_ESSENCE_UPGRADES,
  INITIAL_BUILDINGS,
  INITIAL_ESSENCE_CONVERGENCE_UPGRADES,
  INITIAL_PRESTIGE_UPGRADES,
  INITIAL_REBIRTH_PERKS,
  INITIAL_SINGULARITY_UPGRADES,
  INITIAL_SKILL_NODES,
  INITIAL_UPGRADE_TRACKS,
  LAYER_PERK_MAX_TIER,
  PRESTIGE_BASE_RP_COST,
  PRESTIGE_RP_SCALE,
  REBIRTH_BASE_COST,
  REBIRTH_COST_SCALE,
  SINGULARITY_BASE_TP_COST,
  SINGULARITY_CORE_MAX_LEVEL,
  SINGULARITY_TP_SCALE,
  TIME_AUTO_SINGULARITY_COST,
  TIME_FLIP_BASE_COST,
  TIME_FLIP_COST_SCALE,
  TIME_FLIP_MAX_LEVEL,
  TIME_RESET_ESSENCE_COST,
  TIME_TOKEN_BOOST_BASE_COST,
  TIME_TOKEN_BOOST_COST_SCALE,
  TIME_TOKEN_BOOST_MAX_LEVEL,
  TREE_POINT_BASE_PP_COST,
  TREE_POINT_PP_SCALE,
  UPGRADE_MAX_TIER,
  getClickerEvolution,
  getNextClickerEvolution
} from '../utils/gameData';
import {
  D_ONE,
  D_ZERO,
  Decimal,
  type DecimalSource,
  applySoftAndHardCap,
  calculateMultiBuy,
  calculateMultiBuyRebirth,
  computeCappedBoostCurve,
  formatNum,
  getEffectiveScale,
  getLevelCost,
  getRebirthLevelCost,
  safeMul,
  safeNum,
  safePow,
  toDec
} from '../utils/format';
import { sounds } from '../utils/audio';

const STORAGE_KEY = 'cascade_infinity_time_v5';
const SAVE_STATES_KEY = 'cascade_infinity_save_states_v1';

function createDefaultBuildingAutoMap(): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  for (const b of INITIAL_BUILDINGS) map[b.id] = true;
  return map;
}

function createDefaultMultiBuyMap(): Record<MultiBuySection, MultiBuyAmount> {
  return {
    coinCore: 1,
    buildings: 1,
    upgrades: 1,
    rebirth: 1,
    prestige: 1,
    skillTree: 1,
    singularity: 1,
    timeReset: 1
  };
}

function createInitialIdealTracks(): Record<IdealColor, IdleColorTrack> {
  const tracks = {} as Record<IdealColor, IdleColorTrack>;
  for (let i = 0; i < IDEAL_COLORS.length; i++) {
    const col = IDEAL_COLORS[i];
    tracks[col.id] = {
      id: col.id,
      unlocked: i === 0,
      xp: D_ZERO,
      xpNeeded: toDec(col.baseXpNeeded),
      totalXp: D_ZERO,
      level: 0,
      squares: 0
    };
  }
  return tracks;
}

function createInitialIdealState(): IdealState {
  return {
    colorIndex: 0,
    xp: D_ZERO,
    xpNeeded: toDec(IDEAL_BASE_XP),
    levelInColor: 0,
    totalLevels: 0,
    squares: {
      red: 0,
      orange: 0,
      yellow: 0,
      green: 0,
      blue: 0,
      purple: 0,
      violet: 0
    },
    tracks: createInitialIdealTracks()
  };
}

const ALL_TABS: ActiveTab[] = [
  'buildings',
  'upgrades',
  'rebirth',
  'prestige',
  'skillTree',
  'singularity',
  'timeReset',
  'ideal'
];

function createInitialSectionWaveForTab(tab: ActiveTab): SectionWaveState {
  const cfg = SECTION_WAVE_CONFIGS[tab];
  return {
    wave: cfg.initialWave,
    completedWavesBonusMult: D_ONE,
    upgrades: createWaveUpgradesForTab(tab, cfg.initialWave)
  };
}

function createInitialSectionWaves(): Record<ActiveTab, SectionWaveState> {
  const out = {} as Record<ActiveTab, SectionWaveState>;
  for (const tab of ALL_TABS) {
    out[tab] = createInitialSectionWaveForTab(tab);
  }
  return out;
}

function normalizeSectionWaves(
  saved: Partial<Record<ActiveTab, SectionWaveState>> | undefined
): Record<ActiveTab, SectionWaveState> {
  const out = createInitialSectionWaves();
  if (!saved) return out;
  for (const tab of ALL_TABS) {
    const entry = saved[tab];
    if (!entry || !Array.isArray(entry.upgrades) || entry.upgrades.length === 0) continue;
    const cfg = SECTION_WAVE_CONFIGS[tab];
    const waveNum = Math.max(cfg.initialWave, entry.wave ?? cfg.initialWave);
    const freshTemplate = createWaveUpgradesForTab(tab, waveNum);
    const savedMap = new Map(entry.upgrades.map((u) => [u.id, u]));
    out[tab] = {
      wave: waveNum,
      completedWavesBonusMult: Decimal.max(D_ONE, toDec(entry.completedWavesBonusMult ?? 1)),
      upgrades: freshTemplate.map((def) => {
        const existing = savedMap.get(def.id);
        if (!existing) return def;
        return {
          ...def,
          ...existing,
          baseCost: existing.baseCost !== undefined ? Decimal.max(D_ONE, toDec(existing.baseCost)) : def.baseCost,
          totalBonus: toDec(existing.totalBonus ?? 0),
          bonusPerLevel: existing.bonusPerLevel !== undefined ? Decimal.max(D_ONE, toDec(existing.bonusPerLevel)) : def.bonusPerLevel,
          maxTier: SECTION_WAVE_MAX_TIER,
          tier: Math.min(SECTION_WAVE_MAX_TIER, Math.max(1, existing.tier ?? 1))
        };
      })
    };
  }
  return out;
}

function createInitialState(): GameState {
  return {
    version: 8,
    coins: D_ZERO,
    lifetimeCoins: D_ZERO,
    totalClicks: 0,
    clickerLevel: 1,
    rebirthLevel: 0,
    rebirthPoints: D_ZERO,
    lifetimeRebirthPoints: D_ZERO,
    rebirthPerks: INITIAL_REBIRTH_PERKS.map((p) => ({ ...p })),
    lastRebirthPerkCost: D_ZERO,
    ascendedRebirthPerks: INITIAL_ASCENDED_REBIRTH_PERKS.map((p) => ({ ...p })),
    prestigeLevel: 0,
    prestigePoints: D_ZERO,
    lifetimePrestigePoints: D_ZERO,
    prestigeUpgrades: INITIAL_PRESTIGE_UPGRADES.map((p) => ({ ...p })),
    treeResetCount: 0,
    treePoints: D_ZERO,
    lifetimeTreePoints: D_ZERO,
    skillNodes: INITIAL_SKILL_NODES.map((s) => ({ ...s, requires: [...s.requires] })),
    singularityCount: 0,
    singularityCoreLevel: 0,
    singularityEssence: D_ZERO,
    lifetimeSingularityEssence: D_ZERO,
    singularityUpgrades: INITIAL_SINGULARITY_UPGRADES.map((u) => ({ ...u })),
    essenceReactorLevel: 0,
    essenceConvergenceUnlocked: false,
    essenceConvergenceUpgrades: INITIAL_ESSENCE_CONVERGENCE_UPGRADES.map((u) => ({ ...u })),
    billionEssenceUnlocked: false,
    billionEssenceUpgrades: INITIAL_BILLION_ESSENCE_UPGRADES.map((u) => ({ ...u })),
    timeResetCount: 0,
    timeTokens: D_ZERO,
    lifetimeTimeTokens: D_ZERO,
    timeFlipChanceLevel: 0,
    timeTokenBoostLevel: 0,
    timeAutoSingularityUnlocked: false,
    timeAutoTokenUpgradesUnlocked: false,
    idealTabUnlocked: false,
    idleXpSpent: D_ZERO,
    ideal: createInitialIdealState(),
    buildings: INITIAL_BUILDINGS.map((b) => ({ ...b })),
    upgradeTracks: INITIAL_UPGRADE_TRACKS.map((u) => ({ ...u })),
    sectionWaves: createInitialSectionWaves(),
    completedUpgradeCount: 0,
    completedPerkTiersCount: 0,
    automation: {
      autoBuyBuildings: true,
      autoBuyUpgrades: true,
      autoLevelClicker: true,
      autoBuyRebirthUpgrades: true,
      autoBuyPrestigeUpgrades: true,
      autoBuySkillTree: true,
      autoBuySingularityUpgrades: true,
      autoBuyBillionEssence: true,
      autoBuyTimeUpgrades: true,
      autoBuyMax: false,
      buildingAutoBuyEnabled: createDefaultBuildingAutoMap()
    },
    multiBuyBySection: createDefaultMultiBuyMap(),
    notation: 'standard',
    soundEnabled: true,
    hardMode: false,
    codeClickerUnlocked: false,
    codeClickerEnabled: true,
    achievements: {
      firstRebirth: false,
      firstPrestige: false,
      firstSkillTree: false
    },
    firstRebirthPopupShown: false,
    adminUnlocked: false,
    adminFreeMode: false
  };
}

function mergeById<T extends { id: string }>(defaults: T[], saved: T[] | undefined): T[] {
  if (!Array.isArray(saved)) return defaults.map((d) => ({ ...d }));
  const map = new Map(saved.map((item) => [item.id, item]));
  return defaults.map((def) => {
    const existing = map.get(def.id);
    if (!existing) return { ...def };
    const merged: Record<string, unknown> = { ...def, ...existing };
    const defAny = def as unknown as Record<string, unknown>;
    const exAny = existing as unknown as Record<string, unknown>;

    if ('maxTier' in defAny) {
      const defaultMaxTier = (defAny.maxTier as number) ?? LAYER_PERK_MAX_TIER;
      const savedTier = (exAny.tier as number) ?? 1;
      merged.maxTier = defaultMaxTier;
      merged.tier = Math.min(defaultMaxTier, Math.max(1, savedTier));
    }
    if ('baseCost' in defAny) {
      merged.baseCost = exAny.baseCost !== undefined ? toDec(exAny.baseCost) : defAny.baseCost;
    }
    if ('baseCps' in defAny) {
      merged.baseCps = defAny.baseCps;
    }
    if ('unlockCoins' in defAny) {
      merged.unlockCoins = defAny.unlockCoins;
    }
    if ('totalBonus' in defAny) {
      merged.totalBonus = toDec(exAny.totalBonus ?? 0);
    }
    if ('bonusPerLevel' in defAny) {
      merged.bonusPerLevel =
        exAny.bonusPerLevel !== undefined ? toDec(exAny.bonusPerLevel) : defAny.bonusPerLevel;
    }
    return merged as unknown as T;
  });
}

function normalizeState(parsed: Partial<GameState>): GameState {
  const def = createInitialState();
  const rebirthLevel = Math.max(0, parsed.rebirthLevel ?? 0);
  const prestigeLevel = Math.max(0, parsed.prestigeLevel ?? 0);
  const treeResetCount = Math.max(0, parsed.treeResetCount ?? 0);
  const singEssence = toDec(parsed.singularityEssence ?? 0);
  const lifeSingEssence = toDec(parsed.lifetimeSingularityEssence ?? 0);

  return {
    ...def,
    ...parsed,
    version: 8,
    coins: toDec(parsed.coins ?? 0),
    lifetimeCoins: toDec(parsed.lifetimeCoins ?? 0),
    rebirthLevel,
    rebirthPoints: toDec(parsed.rebirthPoints ?? 0),
    lifetimeRebirthPoints: toDec(parsed.lifetimeRebirthPoints ?? 0),
    prestigeLevel,
    prestigePoints: toDec(parsed.prestigePoints ?? 0),
    lifetimePrestigePoints: toDec(parsed.lifetimePrestigePoints ?? 0),
    treeResetCount,
    treePoints: toDec(parsed.treePoints ?? 0),
    lifetimeTreePoints: toDec(parsed.lifetimeTreePoints ?? 0),
    singularityCoreLevel: Math.min(
      SINGULARITY_CORE_MAX_LEVEL,
      Math.max(0, parsed.singularityCoreLevel ?? 0)
    ),
    singularityEssence: singEssence,
    lifetimeSingularityEssence: lifeSingEssence,
    timeTokens: toDec(parsed.timeTokens ?? 0),
    lifetimeTimeTokens: toDec(parsed.lifetimeTimeTokens ?? 0),
    timeFlipChanceLevel: Math.min(
      TIME_FLIP_MAX_LEVEL,
      Math.max(0, parsed.timeFlipChanceLevel ?? 0)
    ),
    timeTokenBoostLevel: Math.min(
      TIME_TOKEN_BOOST_MAX_LEVEL,
      Math.max(0, parsed.timeTokenBoostLevel ?? 0)
    ),
    timeAutoSingularityUnlocked: Boolean(parsed.timeAutoSingularityUnlocked),
    timeAutoTokenUpgradesUnlocked: Boolean(parsed.timeAutoTokenUpgradesUnlocked),
    idealTabUnlocked: Boolean(parsed.idealTabUnlocked),
    idleXpSpent: toDec(parsed.idleXpSpent ?? 0),
    lastRebirthPerkCost: toDec(parsed.lastRebirthPerkCost ?? 0),
    ideal: (() => {
      const savedIdeal = parsed.ideal;
      const defaultTracks = createInitialIdealTracks();
      const tracks = {} as Record<IdealColor, IdleColorTrack>;
      const legacyColorIdx = savedIdeal?.colorIndex ?? 0;

      for (let i = 0; i < IDEAL_COLORS.length; i++) {
        const col = IDEAL_COLORS[i];
        const savedTrack = savedIdeal?.tracks?.[col.id];
        if (savedTrack) {
          const baseNeeded = toDec(col.baseXpNeeded);
          const savedNeeded = toDec(savedTrack.xpNeeded ?? col.baseXpNeeded);
          tracks[col.id] = {
            ...defaultTracks[col.id],
            ...savedTrack,
            unlocked: i === 0 ? true : Boolean(savedTrack.unlocked),
            xp: toDec(savedTrack.xp ?? 0),
            totalXp: toDec(savedTrack.totalXp ?? 0),
            xpNeeded:
              savedTrack.level === 0
                ? baseNeeded
                : Decimal.max(baseNeeded, savedNeeded)
          };
        } else {
          const legacySquares = savedIdeal?.squares?.[col.id] ?? 0;
          tracks[col.id] = {
            id: col.id,
            unlocked: i === 0 || i <= legacyColorIdx || legacySquares > 0,
            xp: i === legacyColorIdx ? toDec(savedIdeal?.xp ?? 0) : D_ZERO,
            xpNeeded: toDec(col.baseXpNeeded).mul(safePow(col.xpGrowth, legacySquares)),
            totalXp: D_ZERO,
            level: legacySquares,
            squares: legacySquares
          };
        }
      }

      const squares = { ...def.ideal.squares, ...(savedIdeal?.squares ?? {}) };
      for (const col of IDEAL_COLORS) {
        squares[col.id] = tracks[col.id].squares;
      }

      return {
        ...def.ideal,
        ...(savedIdeal ?? {}),
        xp: toDec(savedIdeal?.xp ?? 0),
        xpNeeded:
          (savedIdeal?.totalLevels ?? 0) === 0 && legacyColorIdx === 0
            ? toDec(IDEAL_BASE_XP)
            : Decimal.max(IDEAL_BASE_XP, toDec(savedIdeal?.xpNeeded ?? IDEAL_BASE_XP)),
        squares,
        tracks
      };
    })(),
    buildings: mergeById(def.buildings, parsed.buildings).map((b, idx) => ({
      ...b,
      baseCost: def.buildings[idx].baseCost,
      baseCps: def.buildings[idx].baseCps,
      unlockCoins: def.buildings[idx].unlockCoins
    })),
    upgradeTracks: mergeById(def.upgradeTracks, parsed.upgradeTracks).map((u, idx) => ({
      ...u,
      baseCost: def.upgradeTracks[idx].baseCost,
      maxTier: UPGRADE_MAX_TIER,
      tier: Math.min(UPGRADE_MAX_TIER, Math.max(1, u.tier))
    })),
    sectionWaves: normalizeSectionWaves(parsed.sectionWaves),
    rebirthPerks: mergeById(def.rebirthPerks, parsed.rebirthPerks),
    ascendedRebirthPerks: mergeById(def.ascendedRebirthPerks, parsed.ascendedRebirthPerks).map((p) => {
      const bc = toDec(p.baseCost);
      return {
        ...p,
        baseCost: bc.gt(0) ? bc : D_ZERO
      };
    }),
    prestigeUpgrades: mergeById(def.prestigeUpgrades, parsed.prestigeUpgrades),
    skillNodes: mergeById(def.skillNodes, parsed.skillNodes).map((s) => ({
      ...s,
      requires: def.skillNodes.find((d) => d.id === s.id)?.requires ?? s.requires
    })),
    singularityUpgrades: mergeById(def.singularityUpgrades, parsed.singularityUpgrades),
    essenceConvergenceUnlocked: Boolean(parsed.essenceConvergenceUnlocked),
    essenceConvergenceUpgrades: mergeById(
      def.essenceConvergenceUpgrades,
      parsed.essenceConvergenceUpgrades
    ),
    billionEssenceUnlocked: Boolean(
      parsed.billionEssenceUnlocked ||
        singEssence.gte(BILLION_ESSENCE_THRESHOLD) ||
        lifeSingEssence.gte(BILLION_ESSENCE_THRESHOLD)
    ),
    billionEssenceUpgrades: mergeById(def.billionEssenceUpgrades, parsed.billionEssenceUpgrades),
    multiBuyBySection: { ...def.multiBuyBySection, ...(parsed.multiBuyBySection ?? {}) },
    automation: {
      ...def.automation,
      ...(parsed.automation ?? {}),
      buildingAutoBuyEnabled: {
        ...def.automation.buildingAutoBuyEnabled,
        ...(parsed.automation?.buildingAutoBuyEnabled ?? {})
      }
    },
    achievements: {
      firstRebirth: Boolean(parsed.achievements?.firstRebirth ?? rebirthLevel >= 1),
      firstPrestige: Boolean(parsed.achievements?.firstPrestige ?? prestigeLevel >= 1),
      firstSkillTree: Boolean(parsed.achievements?.firstSkillTree ?? treeResetCount >= 1)
    },
    hardMode: Boolean(parsed.hardMode),
    codeClickerUnlocked: Boolean(parsed.codeClickerUnlocked),
    codeClickerEnabled: parsed.codeClickerEnabled ?? true,
    firstRebirthPopupShown: Boolean(parsed.firstRebirthPopupShown ?? rebirthLevel >= 1)
  };
}

function loadSavedState(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw) as Partial<GameState>;
    return normalizeState(parsed);
  } catch {
    return createInitialState();
  }
}

function loadSaveStatesList(): SaveStateEntry[] {
  try {
    const raw = localStorage.getItem(SAVE_STATES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistSaveStatesList(list: SaveStateEntry[]) {
  try {
    localStorage.setItem(SAVE_STATES_KEY, JSON.stringify(list));
  } catch {
    // Ignore storage quota issues
  }
}

export function isTieredItemMaxed<
  T extends Pick<TieredPerk, 'tier' | 'maxTier' | 'level' | 'tierMaxLevel'>
>(item: T): boolean {
  return item.tier >= item.maxTier && item.level >= item.tierMaxLevel;
}

export function isSkillNodeCompleted(node: SkillNode): boolean {
  return isTieredItemMaxed(node) || (node.id === 'sk_scale' && node.totalBonus.gte(60));
}

export interface TieredBuyPreview {
  count: number;
  totalCost: Decimal;
  canAfford: boolean;
  nextSingleCost: Decimal;
  effectiveScale: number;
  willEvolve: boolean;
  isMaxed: boolean;
}

export function previewTieredPurchase<
  T extends Pick<
    TieredPerk,
    'id' | 'tier' | 'maxTier' | 'level' | 'tierMaxLevel' | 'baseCost' | 'costScale' | 'bonusPerLevel' | 'bonusUnit'
  >
>(
  item: T,
  currency: DecimalSource,
  multiBuy: MultiBuyAmount,
  scaleReduction: number,
  freeMode = false,
  costMult = 1
): TieredBuyPreview {
  if (isTieredItemMaxed(item)) {
    return {
      count: 0,
      totalCost: D_ZERO,
      canAfford: false,
      nextSingleCost: D_ZERO,
      effectiveScale: getEffectiveScale(item.costScale, scaleReduction),
      willEvolve: false,
      isMaxed: true
    };
  }

  const curDec = toDec(currency);
  let simTier = item.tier;
  let simLevel = item.level;
  let simBaseCost = toDec(item.baseCost);
  let simCostScale = item.costScale;
  let effectiveScale = getEffectiveScale(simCostScale, scaleReduction);
  let rawScaled = safeMul(simBaseCost, safePow(effectiveScale, simLevel));
  const nextSingleCost = freeMode
    ? D_ZERO
    : Decimal.max(D_ONE, rawScaled.mul(costMult).floor());

  const isMaxMode = multiBuy === -1;
  if (isMaxMode && !freeMode && curDec.lt(nextSingleCost)) {
    return {
      count: 1,
      totalCost: nextSingleCost,
      canAfford: false,
      nextSingleCost,
      effectiveScale,
      willEvolve: item.level + 1 >= item.tierMaxLevel && item.tier < item.maxTier,
      isMaxed: false
    };
  }

  const maxSteps = isMaxMode ? (freeMode ? 10 : 100) : multiBuy;
  let totalCost = D_ZERO;
  let count = 0;
  let willEvolve = false;

  const isEssenceConvergence = item.id.startsWith('ec_');
  const isBillionEssence = item.id.startsWith('be_');
  const isSingularityUpg = item.id.startsWith('su_');
  const isSectionWave = item.id.startsWith('sw_');
  const isSlowWave = item.id.startsWith('sw_timeReset') || item.id.startsWith('sw_ideal');

  for (let i = 0; i < maxSteps; i++) {
    if (simTier >= item.maxTier && simLevel >= item.tierMaxLevel) break;

    const stepCost =
      i === 0
        ? nextSingleCost
        : freeMode
          ? D_ZERO
          : Decimal.max(D_ONE, rawScaled.mul(costMult).floor());

    if (isMaxMode && !freeMode) {
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

    simLevel++;
    if (simLevel >= item.tierMaxLevel) {
      if (simTier < item.maxTier) {
        willEvolve = true;
        const tierEndScaled = rawScaled.mul(effectiveScale);
        if (isSingularityUpg) {
          simBaseCost = tierEndScaled.ceil();
        } else if (isSectionWave) {
          simBaseCost = tierEndScaled.mul(isSlowWave ? 1.15 : 1.2).ceil();
          simCostScale = Number((simCostScale + (isSlowWave ? 0.015 : 0.025)).toFixed(3));
        } else if (isEssenceConvergence) {
          simBaseCost = tierEndScaled.mul(1.25).ceil();
          simCostScale = Number((simCostScale + 0.03).toFixed(2));
        } else if (isBillionEssence) {
          simBaseCost = tierEndScaled.mul(1.25).ceil();
          simCostScale = Number((simCostScale + 0.04).toFixed(2));
        } else {
          simBaseCost = tierEndScaled.mul(1.45).ceil();
          simCostScale = Number((simCostScale + 0.08).toFixed(2));
        }
        simTier++;
        simLevel = 0;
        effectiveScale = getEffectiveScale(simCostScale, scaleReduction);
        rawScaled = simBaseCost;
      } else {
        break;
      }
    } else {
      rawScaled = rawScaled.mul(effectiveScale);
    }
  }

  if (isMaxMode && !freeMode && count === 0) {
    return {
      count: 1,
      totalCost: nextSingleCost,
      canAfford: false,
      nextSingleCost,
      effectiveScale: getEffectiveScale(item.costScale, scaleReduction),
      willEvolve: item.level + 1 >= item.tierMaxLevel && item.tier < item.maxTier,
      isMaxed: false
    };
  }

  return {
    count,
    totalCost: freeMode ? D_ZERO : totalCost,
    canAfford: freeMode ? count > 0 : count > 0 && curDec.gte(totalCost),
    nextSingleCost,
    effectiveScale: getEffectiveScale(item.costScale, scaleReduction),
    willEvolve,
    isMaxed: false
  };
}

function applyTieredPurchase<T extends TieredPerk | SkillNode | SingularityUpgrade | EssenceConvergenceUpgrade>(
  item: T,
  currency: DecimalSource,
  multiBuy: MultiBuyAmount,
  scaleReduction: number,
  freeMode = false,
  costMult = 1
): { updated: T; spent: Decimal; bought: number; evolutions: number; lastStepCost: Decimal } {
  const sim = previewTieredPurchase(item, currency, multiBuy, scaleReduction, freeMode, costMult);
  if (sim.isMaxed || !sim.canAfford || sim.count <= 0) {
    return { updated: item, spent: D_ZERO, bought: 0, evolutions: 0, lastStepCost: D_ZERO };
  }

  const nextItem = { ...item };
  let evolutions = 0;
  let lastStepCost = D_ZERO;
  const isPrestigeUpg = nextItem.id.startsWith('pu_');
  const isSingularityUpg = nextItem.id.startsWith('su_');
  const isEssenceConvergence = nextItem.id.startsWith('ec_');
  const isBillionEssence = nextItem.id.startsWith('be_');
  const isSectionWave = nextItem.id.startsWith('sw_');
  const isSlowWave = nextItem.id.startsWith('sw_timeReset') || nextItem.id.startsWith('sw_ideal');

  for (let i = 0; i < sim.count; i++) {
    if (nextItem.tier >= nextItem.maxTier && nextItem.level >= nextItem.tierMaxLevel) break;

    const effScaleNow = getEffectiveScale(nextItem.costScale, scaleReduction);
    lastStepCost = getLevelCost(nextItem.baseCost, effScaleNow, nextItem.level, costMult);

    nextItem.level += 1;
    nextItem.totalLevels += 1;
    nextItem.totalBonus = nextItem.totalBonus.add(nextItem.bonusPerLevel);

    if (nextItem.level >= nextItem.tierMaxLevel && nextItem.tier < nextItem.maxTier) {
      const effScale = getEffectiveScale(nextItem.costScale, scaleReduction);
      const nextTierCost = nextItem.baseCost.mul(safePow(effScale, nextItem.tierMaxLevel));
      if (isSingularityUpg) {
        nextItem.baseCost = nextTierCost.ceil();
      } else if (isSectionWave) {
        nextItem.baseCost = nextTierCost.mul(isSlowWave ? 1.15 : 1.2).ceil();
        nextItem.costScale = Number((nextItem.costScale + (isSlowWave ? 0.015 : 0.025)).toFixed(3));
      } else if (isEssenceConvergence) {
        nextItem.baseCost = nextTierCost.mul(1.25).ceil();
        nextItem.costScale = Number((nextItem.costScale + 0.03).toFixed(2));
      } else if (isBillionEssence) {
        nextItem.baseCost = nextTierCost.mul(1.25).ceil();
        nextItem.costScale = Number((nextItem.costScale + 0.04).toFixed(2));
      } else {
        nextItem.baseCost = nextTierCost.mul(1.45).ceil();
        nextItem.costScale = Number((nextItem.costScale + 0.08).toFixed(2));
      }

      let bonusJump = 2;
      if (isSectionWave) {
        bonusJump = 1.5;
      } else if (isPrestigeUpg) {
        if (nextItem.id === 'pu_crit' || nextItem.id === 'pu_memory') {
          bonusJump = nextItem.tier >= 4 ? 1.5 : 1.25;
        } else {
          bonusJump = nextItem.tier >= 4 ? 10 : 3;
        }
      } else if (nextItem.bonusUnit.includes('Exp')) {
        bonusJump = 1.25;
      }

      nextItem.bonusPerLevel = nextItem.bonusPerLevel.mul(bonusJump);
      nextItem.tier += 1;
      nextItem.level = 0;
      evolutions += 1;
    }
  }

  return {
    updated: nextItem,
    spent: freeMode ? D_ZERO : sim.totalCost,
    bought: sim.count,
    evolutions,
    lastStepCost
  };
}

function advanceSectionWaveIfComplete(
  waveState: SectionWaveState,
  tab: ActiveTab,
  lastStepCost: DecimalSource = 0
): SectionWaveState {
  if (!waveState.upgrades.every(isTieredItemMaxed)) return waveState;

  let waveMult = waveState.completedWavesBonusMult;
  let maxCostFound = toDec(lastStepCost);
  for (const u of waveState.upgrades) {
    waveMult = waveMult.mul(D_ONE.add(u.totalBonus.div(100)));
    if (u.baseCost.gt(maxCostFound)) maxCostFound = u.baseCost;
  }
  const nextCompletedMult = Decimal.max(D_ONE, waveMult);
  const cfg = SECTION_WAVE_CONFIGS[tab];
  const nextWave = waveState.wave + 1;
  const anchorBase = Decimal.max(
    toDec(cfg.defaultBaseCost).mul(safePow(1000, Math.max(1, nextWave - cfg.initialWave))),
    maxCostFound.mul(10)
  );

  return {
    wave: nextWave,
    completedWavesBonusMult: nextCompletedMult,
    upgrades: createWaveUpgradesForTab(tab, nextWave, anchorBase)
  };
}

function estimateFallbackLastRebirthCost(
  scaleReduction: number,
  hardCostMult: number
): Decimal {
  const sample = INITIAL_REBIRTH_PERKS[INITIAL_REBIRTH_PERKS.length - 1];
  let simBaseCost = sample.baseCost;
  let simCostScale = sample.costScale;
  for (let tier = 1; tier < sample.maxTier; tier++) {
    const effScale = getEffectiveScale(simCostScale, scaleReduction);
    simBaseCost = simBaseCost.mul(safePow(effScale, sample.tierMaxLevel)).mul(1.45).ceil();
    simCostScale = Number((simCostScale + 0.08).toFixed(2));
  }
  const finalEffScale = getEffectiveScale(simCostScale, scaleReduction);
  return getLevelCost(simBaseCost, finalEffScale, Math.max(0, sample.tierMaxLevel - 1), hardCostMult);
}

export function useGameEngine(activeTab: ActiveTab = 'buildings') {
  const [state, setState] = useState<GameState>(loadSavedState);
  const [saveStates, setSaveStates] = useState<SaveStateEntry[]>(loadSaveStatesList);
  const [firstRebirthPopupOpen, setFirstRebirthPopupOpen] = useState(false);

  useEffect(() => {
    sounds.enabled = state.soundEnabled;
  }, [state.soundEnabled]);

  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const saveAsync = () => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateRef.current));
      } catch {
        // Ignore storage errors
      }
    };
    const id = window.setInterval(() => {
      const w = window as Window & {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      };
      if (typeof w.requestIdleCallback === 'function') {
        w.requestIdleCallback(saveAsync, { timeout: 1500 });
      } else {
        window.setTimeout(saveAsync, 50);
      }
    }, 5000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const onUnload = () => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateRef.current));
      } catch {
        // Ignore
      }
    };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, []);

  const stats = useMemo(() => {
    const free = state.adminFreeMode;
    const hardCostMult = state.hardMode ? 10 : 1;
    const getRebirthPerk = (id: string) => state.rebirthPerks.find((p) => p.id === id);
    const getAscendedPerk = (id: string) => state.ascendedRebirthPerks.find((p) => p.id === id);
    const getPrestigeUpg = (id: string) => state.prestigeUpgrades.find((p) => p.id === id);
    const getSkill = (id: string) => state.skillNodes.find((s) => s.id === id);
    const getSingUpg = (id: string) => state.singularityUpgrades.find((u) => u.id === id);
    const getBillionUpg = (id: string) => state.billionEssenceUpgrades.find((u) => u.id === id);

    // 0. Time Reset Multiplier (+1% per Time Token!) & Dynamic 1e+50 * 10^timeResetCount Caps
    const timeTokenMult = D_ONE.add(state.timeTokens.mul(0.01));
    const boostCapCeiling = safeMul(BASE_BOOST_CAP, safePow(10, state.timeResetCount));

    // 1. Global Scale Reduction (Soft cap 40%, Hard cap 60%)
    const rawScaleRed = toDec(getSkill('sk_scale')?.totalBonus ?? 0)
      .add(toDec(getSingUpg('su_compression')?.totalBonus ?? 0))
      .div(100);
    const globalScaleReduction = applySoftAndHardCap(rawScaleRed, 0.4, 0.6, 0.5).toNumber();

    // 2. Singularity Core Level Multipliers (Capped at Lv.100)
    const coreLevel = Math.min(SINGULARITY_CORE_MAX_LEVEL, state.singularityCoreLevel);
    const coreCoinMult = applySoftAndHardCap(safePow(3, coreLevel), 1e12, 1e24, 0.45);
    const coreRpMult = applySoftAndHardCap(safePow(2, coreLevel), 1e8, 1e16, 0.45);
    const corePpMult = applySoftAndHardCap(safePow(2.2, coreLevel), 1e8, 1e16, 0.5);
    const coreTpMult = applySoftAndHardCap(safePow(1.8, coreLevel), 1e6, 1e12, 0.5);

    // 3. Cascading Cross-Currency Boost Curves (All share boostCapCeiling = 1e+50 * 10^timeResets):
    // - RP -> Coins
    // - PP -> RP & Coins
    // - TP -> PP, RP & Coins
    // - Essence -> TP, PP, RP & Coins
    const rpResonanceBonus = applySoftAndHardCap(
      toDec(getRebirthPerk('rp_resonance')?.totalBonus ?? 0).div(100),
      5,
      25,
      0.45
    ).toNumber();
    const rpFormulaExponent = 0.72;
    const rpFormulaFactor = Number((0.25 * (1 + rpResonanceBonus)).toFixed(3));
    const rpCurve = computeCappedBoostCurve(
      state.rebirthPoints,
      boostCapCeiling,
      rpFormulaExponent,
      rpFormulaFactor,
      1e22,
      1e36
    );
    const ppToRpCurve = computeCappedBoostCurve(
      state.prestigePoints,
      boostCapCeiling,
      0.6,
      0.25,
      1e20,
      1e32
    );
    const tpToPpCurve = computeCappedBoostCurve(
      state.treePoints,
      boostCapCeiling,
      0.6,
      0.3,
      1e20,
      1e32
    );
    const essenceToTpCurve = computeCappedBoostCurve(
      state.singularityEssence,
      boostCapCeiling,
      0.58,
      0.3,
      1e18,
      1e28
    );

    const coinCascadeMult = safeMul(
      safeMul(rpCurve.multiplier, ppToRpCurve.multiplier),
      safeMul(tpToPpCurve.multiplier, essenceToTpCurve.multiplier)
    );
    const rpCascadeMult = safeMul(
      ppToRpCurve.multiplier,
      safeMul(tpToPpCurve.multiplier, essenceToTpCurve.multiplier)
    );
    const ppCascadeMult = safeMul(tpToPpCurve.multiplier, essenceToTpCurve.multiplier);
    const tpCascadeMult = essenceToTpCurve.multiplier;

    // 4. Coin Core (Clicker) — NO level cap, 1.1x scale, starting click = 1!
    const clickerEvolution = getClickerEvolution(state.clickerLevel);
    const nextClickerEvolution = getNextClickerEvolution(state.clickerLevel);
    const skClickerBoost = applySoftAndHardCap(
      D_ONE.add(toDec(getSkill('sk_clicker')?.totalBonus ?? 0).div(100)),
      10,
      100,
      0.45
    );
    const suDarkEnergyBoost = applySoftAndHardCap(
      D_ONE.add(toDec(getSingUpg('su_darkenergy')?.totalBonus ?? 0).div(100)),
      50,
      10000,
      0.5
    );
    const clickerLevelMult = safeMul(
      1 + Math.max(0, state.clickerLevel - 1) * 0.04,
      safePow(1.015, Math.max(0, state.clickerLevel - 1))
    );
    const clickerTotalPowerMult = safeMul(
      safeMul(clickerEvolution.coinBoostMultiplier, clickerLevelMult),
      safeMul(skClickerBoost, suDarkEnergyBoost)
    );
    const clickerGlobalCoinBoost = safeMul(
      1 + (clickerEvolution.coinBoostMultiplier - 1) * 0.12 + Math.max(0, state.clickerLevel - 1) * 0.015,
      timeTokenMult
    );

    // 4b. Idle Colored Square Multipliers (+5% per square, cascading across currencies)
    const getSquares = (c: IdealColor) => state.ideal.tracks?.[c]?.squares ?? state.ideal.squares?.[c] ?? 0;
    const redFactor = D_ONE.add(getSquares('red') * 0.05);
    const orangeFactor = D_ONE.add(getSquares('orange') * 0.05);
    const yellowFactor = D_ONE.add(getSquares('yellow') * 0.05);
    const greenFactor = D_ONE.add(getSquares('green') * 0.05);
    const blueFactor = D_ONE.add(getSquares('blue') * 0.05);
    const purpleFactor = D_ONE.add(getSquares('purple') * 0.05);
    const violetFactor = D_ONE.add(getSquares('violet') * 0.05);

    const idleCoinMult = safeMul(
      safeMul(safeMul(redFactor, orangeFactor), safeMul(yellowFactor, greenFactor)),
      safeMul(safeMul(blueFactor, purpleFactor), violetFactor)
    );
    const idleRpMult = safeMul(
      safeMul(orangeFactor, yellowFactor),
      safeMul(safeMul(greenFactor, blueFactor), safeMul(purpleFactor, violetFactor))
    );
    const idleGemMult = safeMul(
      safeMul(yellowFactor, greenFactor),
      safeMul(safeMul(blueFactor, purpleFactor), violetFactor)
    );
    const idleLeafMult = safeMul(
      safeMul(greenFactor, blueFactor),
      safeMul(purpleFactor, violetFactor)
    );
    const idleEssenceMult = safeMul(safeMul(blueFactor, purpleFactor), violetFactor);
    const idleTokenMult = safeMul(purpleFactor, violetFactor);
    const idleXpMult = violetFactor;

    // 5. Global Multipliers (all boosted by +1% per Time Token)
    const skRootAllMult = safeMul(
      applySoftAndHardCap(D_ONE.add(toDec(getSkill('sk_root')?.totalBonus ?? 0).div(100)), 1e4, 1e8, 0.45),
      timeTokenMult
    );
    const skVanguardMult = applySoftAndHardCap(
      D_ONE.add(toDec(getSkill('sk_vanguard')?.totalBonus ?? 0).div(100)),
      1e5,
      1e10,
      0.5
    );
    const skOmniTreeMult = applySoftAndHardCap(
      D_ONE.add(toDec(getSkill('sk_omni_tree')?.totalBonus ?? 0).div(100)),
      1e5,
      1e10,
      0.5
    );
    const skMintsMult = applySoftAndHardCap(
      D_ONE.add(toDec(getSkill('sk_mints')?.totalBonus ?? 0).div(100)),
      1e4,
      1e8,
      0.45
    );
    const skLeafSurgeMult = applySoftAndHardCap(
      D_ONE.add(toDec(getSkill('sk_leaf_surge')?.totalBonus ?? 0).div(100)),
      1e4,
      1e8,
      0.45
    );
    const skGemBoostMult = applySoftAndHardCap(
      D_ONE.add(toDec(getSkill('sk_gem_boost')?.totalBonus ?? 0).div(100)),
      1e4,
      1e8,
      0.45
    );
    const skEssenceEchoMult = applySoftAndHardCap(
      D_ONE.add(toDec(getSkill('sk_essence_echo')?.totalBonus ?? 0).div(100)),
      1e3,
      1e6,
      0.45
    );

    const rebirthLevelMult = applySoftAndHardCap(1 + state.rebirthLevel * 0.5, 50, 500, 0.5);
    const prestigeLevelCoinMult = applySoftAndHardCap(1 + state.prestigeLevel * 1.1, 500, 1e6, 0.5);

    const rebirthMinesMult = safeMul(
      applySoftAndHardCap(D_ONE.add(toDec(getRebirthPerk('rp_mines')?.totalBonus ?? 0).div(100)), 1e4, 1e8, 0.45),
      timeTokenMult
    );
    const rebirthTapperMult = safeMul(
      applySoftAndHardCap(D_ONE.add(toDec(getRebirthPerk('rp_tapper')?.totalBonus ?? 0).div(100)), 1e4, 1e8, 0.45),
      timeTokenMult
    );
    const buildingDiscountMult = Math.max(
      0.25,
      1 -
        applySoftAndHardCap(
          toDec(getRebirthPerk('rp_discount')?.totalBonus ?? 0).div(100),
          0.5,
          0.75,
          0.5
        ).toNumber()
    );
    const bulkPerBldgPct = applySoftAndHardCap(
      toDec(getRebirthPerk('rp_bulk')?.totalBonus ?? 0).div(100),
      0.5,
      2.5,
      0.45
    ).toNumber();

    // 6. Upgrade Tracks (Soft cap T15, Max Tier 30) & 1B Essence Astral Horizon Multipliers
    const billionEssenceOpen =
      state.billionEssenceUnlocked ||
      state.singularityEssence.gte(BILLION_ESSENCE_THRESHOLD) ||
      state.lifetimeSingularityEssence.gte(BILLION_ESSENCE_THRESHOLD) ||
      state.adminUnlocked;
    const beEssenceNovaMult = applySoftAndHardCap(
      D_ONE.add(toDec(getBillionUpg('be_essence_nova')?.totalBonus ?? 0).div(100)),
      1e15,
      1e35,
      0.5
    );
    const beReactorMult = applySoftAndHardCap(
      D_ONE.add(toDec(getBillionUpg('be_reactor_overdrive')?.totalBonus ?? 0).div(100)),
      1e15,
      1e35,
      0.5
    );
    const beChronoTokenMult = applySoftAndHardCap(
      D_ONE.add(toDec(getBillionUpg('be_chrono_catalyst')?.totalBonus ?? 0).div(100)),
      1e8,
      1e20,
      0.5
    );
    const beSpectrumIdleXpMult = applySoftAndHardCap(
      D_ONE.add(toDec(getBillionUpg('be_spectrum_accel')?.totalBonus ?? 0).div(100)),
      1e12,
      1e28,
      0.5
    );
    const beOmniYieldMult = applySoftAndHardCap(
      D_ONE.add(toDec(getBillionUpg('be_omni_cascade')?.totalBonus ?? 0).div(100)),
      1e18,
      1e40,
      0.5
    );

    const getTrackEffMult = (id: string, customBase?: number): Decimal => {
      const trk = state.upgradeTracks.find((u) => u.id === id);
      if (!trk) return D_ONE;
      const effTiers = applySoftAndHardCap(trk.tier - 1, 15, UPGRADE_MAX_TIER, 0.45);
      return safePow(customBase ?? trk.effectMultiplier, effTiers);
    };

    const trkOmniCoinMult = getTrackEffMult('trk_omni_coin');
    const trkCritForgeClickMult = getTrackEffMult('trk_crit_forge');
    const trkCritForgeOmniMult = getTrackEffMult('trk_crit_forge', 1.35);
    const trkPassiveHarmonyCpsMult = getTrackEffMult('trk_passive_harmony');
    const trkPassiveHarmonyOmniMult = getTrackEffMult('trk_passive_harmony', 1.35);
    const trkAstralMintMult = getTrackEffMult('trk_astral_mint');

    const rpOmniSparkMult = D_ONE.add(toDec(getRebirthPerk('rp_omni_spark')?.totalBonus ?? 0).div(100));
    const rpHyperClickMult = D_ONE.add(toDec(getRebirthPerk('rp_hyper_click')?.totalBonus ?? 0).div(100));
    const rpHyperClickOmniMult = D_ONE.add(toDec(getRebirthPerk('rp_hyper_click')?.totalBonus ?? 0).div(400));
    const rpCosmicTributeRpMult = D_ONE.add(toDec(getRebirthPerk('rp_cosmic_tribute')?.totalBonus ?? 0).div(100));
    const rpCosmicTributeOmniMult = D_ONE.add(toDec(getRebirthPerk('rp_cosmic_tribute')?.totalBonus ?? 0).div(300));

    const puOmniPrismMult = D_ONE.add(toDec(getPrestigeUpg('pu_omni_prism')?.totalBonus ?? 0).div(100));
    const puGemFurnaceMult = D_ONE.add(toDec(getPrestigeUpg('pu_gem_furnace')?.totalBonus ?? 0).div(100));
    const puGemFurnaceOmniMult = D_ONE.add(toDec(getPrestigeUpg('pu_gem_furnace')?.totalBonus ?? 0).div(300));
    const puStellarDynamoMult = D_ONE.add(toDec(getPrestigeUpg('pu_stellar_dynamo')?.totalBonus ?? 0).div(100));

    const skChronoCanopyMult = D_ONE.add(toDec(getSkill('sk_chrono_canopy')?.totalBonus ?? 0).div(100));
    const skVoidSapMult = D_ONE.add(toDec(getSkill('sk_void_sap')?.totalBonus ?? 0).div(100));
    const skCosmicBlossomMult = D_ONE.add(toDec(getSkill('sk_cosmic_blossom')?.totalBonus ?? 0).div(100));

    const suOmniSingMult = D_ONE.add(toDec(getSingUpg('su_omni_singularity')?.totalBonus ?? 0).div(100));
    const suEssenceSurgeMult = D_ONE.add(toDec(getSingUpg('su_essence_surge')?.totalBonus ?? 0).div(100));
    const suStellarNexusMult = D_ONE.add(toDec(getSingUpg('su_stellar_nexus')?.totalBonus ?? 0).div(100));

    let sectionWavesOmniMult = D_ONE;
    for (const tab of ALL_TABS) {
      const w = state.sectionWaves?.[tab];
      if (!w) continue;
      sectionWavesOmniMult = safeMul(sectionWavesOmniMult, w.completedWavesBonusMult);
      for (const u of w.upgrades) {
        if (u.totalBonus.gt(0)) {
          sectionWavesOmniMult = safeMul(sectionWavesOmniMult, D_ONE.add(u.totalBonus.div(100)));
        }
      }
    }

    const rawOmniEverything = [
      trkOmniCoinMult,
      trkCritForgeOmniMult,
      trkPassiveHarmonyOmniMult,
      trkAstralMintMult,
      rpOmniSparkMult,
      rpHyperClickOmniMult,
      rpCosmicTributeOmniMult,
      puOmniPrismMult,
      puGemFurnaceOmniMult,
      puStellarDynamoMult,
      skChronoCanopyMult,
      skVoidSapMult,
      skCosmicBlossomMult,
      suOmniSingMult,
      suEssenceSurgeMult,
      suStellarNexusMult,
      sectionWavesOmniMult
    ].reduce((acc, m) => safeMul(acc, m), D_ONE);

    // Uncapped so infinite 30-tier Omni-Waves continue scaling without hitting a ceiling
    const omniEverythingMult = rawOmniEverything;

    const globalTrack = state.upgradeTracks.find((u) => u.id === 'trk_global');
    const globalEffTiers = globalTrack
      ? applySoftAndHardCap(globalTrack.tier - 1, 15, UPGRADE_MAX_TIER, 0.45)
      : D_ZERO;
    const globalTrackMult = globalTrack ? safePow(globalTrack.effectMultiplier, globalEffTiers) : D_ONE;

    const clickTrack = state.upgradeTracks.find((u) => u.id === 'trk_click');
    const clickEffTiers = clickTrack
      ? applySoftAndHardCap(clickTrack.tier - 1, 15, UPGRADE_MAX_TIER, 0.45)
      : D_ZERO;
    const clickTrackMult = clickTrack ? safePow(clickTrack.effectMultiplier, clickEffTiers) : D_ONE;

    const totalBuildingsOwned = state.buildings.reduce((sum, b) => sum + b.count, 0);
    const synergyTrack = state.upgradeTracks.find((u) => u.id === 'trk_synergy');
    const synergyTier = synergyTrack
      ? applySoftAndHardCap(synergyTrack.tier - 1, 15, UPGRADE_MAX_TIER, 0.45).toNumber()
      : 0;
    const synergyMult = applySoftAndHardCap(
      1 + synergyTier * 0.05 * Math.floor(totalBuildingsOwned / 10),
      10,
      100,
      0.45
    );

    // 7. Total Buildings CPS — every 25 owned multiplies by 2x
    let rawBuildingsCps = D_ZERO;
    const buildingCpsMap: Record<string, Decimal> = {};
    const upgradeByBuildingId = new Map<string, typeof state.upgradeTracks[number]>();
    for (const u of state.upgradeTracks) {
      if (u.targetBuildingId) upgradeByBuildingId.set(u.targetBuildingId, u);
    }

    const sharedGlobalCpsMult = safeMul(
      safeMul(
        safeMul(safeMul(globalTrackMult, synergyMult), trkPassiveHarmonyCpsMult),
        safeMul(rebirthMinesMult, skMintsMult)
      ),
      safeMul(
        safeMul(
          safeMul(skRootAllMult, safeMul(skVanguardMult, skOmniTreeMult)),
          safeMul(idleCoinMult, safeMul(beOmniYieldMult, omniEverythingMult))
        ),
        safeMul(
          safeMul(rebirthLevelMult, prestigeLevelCoinMult),
          safeMul(coinCascadeMult, safeMul(clickerGlobalCoinBoost, coreCoinMult))
        )
      )
    );

    for (const b of state.buildings) {
      const bTrack = upgradeByBuildingId.get(b.id);
      const bEffTiers = bTrack ? applySoftAndHardCap(bTrack.tier - 1, 15, UPGRADE_MAX_TIER, 0.45) : D_ZERO;
      const bTrackMult = bTrack ? safePow(bTrack.effectMultiplier, bEffTiers) : D_ONE;
      const milestone25Mult = safePow(2, Math.floor(b.count / 25));
      const bulkSelfMult = applySoftAndHardCap(1 + b.count * bulkPerBldgPct, 25, 250, 0.45);
      const singleCps = safeMul(
        safeMul(b.baseCps, safeMul(safeMul(bTrackMult, milestone25Mult), bulkSelfMult)),
        sharedGlobalCpsMult
      );
      buildingCpsMap[b.id] = singleCps;
      if (b.count > 0) {
        rawBuildingsCps = rawBuildingsCps.add(singleCps.mul(b.count));
      }
    }

    const gameSpeedMultiplier = applySoftAndHardCap(
      D_ONE.add(toDec(getPrestigeUpg('pu_hourglass')?.totalBonus ?? 0).div(100)),
      50,
      500,
      0.45
    ).toNumber();
    const coinsPerSecond = safeMul(rawBuildingsCps, gameSpeedMultiplier);

    // 8. Manual Click Value (Strictly 1 at fresh game start!)
    const midasShare = safeMul(
      applySoftAndHardCap(toDec(getPrestigeUpg('pu_midas')?.totalBonus ?? 0).div(100), 5, 50, 0.45),
      coinsPerSecond
    );
    const baseClick = safeMul(
      safeMul(
        safeMul(safeMul(clickTrackMult, trkCritForgeClickMult), safeMul(rebirthTapperMult, rpHyperClickMult)),
        safeMul(clickerTotalPowerMult, rebirthLevelMult)
      ),
      safeMul(
        safeMul(
          prestigeLevelCoinMult,
          safeMul(coinCascadeMult, safeMul(idleCoinMult, safeMul(beOmniYieldMult, omniEverythingMult)))
        ),
        safeMul(safeMul(skRootAllMult, safeMul(skVanguardMult, skOmniTreeMult)), coreCoinMult)
      )
    );
    const coinsPerClick = Decimal.max(D_ONE, baseClick.add(midasShare));

    const critChance = applySoftAndHardCap(
      toDec(getPrestigeUpg('pu_crit')?.totalBonus ?? 0).div(100),
      0.5,
      0.75,
      0.5
    ).toNumber();
    const critMultiplier = applySoftAndHardCap(
      toDec(6).add(toDec(getSkill('sk_supercrit')?.totalBonus ?? 0)),
      30,
      150,
      0.45
    ).toNumber();

    // 9. Passive Cross-Layer Generators + Ascended Rebirth Upgrades
    const allBaseRebirthPerksMaxed = state.rebirthPerks.every(isTieredItemMaxed);
    const effectiveAscendedRebirthBaseCost = state.lastRebirthPerkCost.gt(0)
      ? state.lastRebirthPerkCost
      : (allBaseRebirthPerksMaxed || state.adminUnlocked) && activeTab === 'rebirth'
        ? Decimal.max(1_000, estimateFallbackLastRebirthCost(globalScaleReduction, hardCostMult))
        : toDec(1_000_000);

    const ascendedRpMult = applySoftAndHardCap(
      D_ONE.add(toDec(getAscendedPerk('arp_rp_mult')?.totalBonus ?? 0).div(100)),
      1e5,
      1e10,
      0.45
    );
    const ascendedRpConduit = toDec(getAscendedPerk('arp_rp_conduit')?.totalBonus ?? 0);
    const ascendedGemMult = applySoftAndHardCap(
      D_ONE.add(toDec(getAscendedPerk('arp_gem_mult')?.totalBonus ?? 0).div(100)),
      1e4,
      1e8,
      0.45
    );
    const ascendedGemGen = toDec(getAscendedPerk('arp_gem_gen')?.totalBonus ?? 0);

    // 9a. RP/sec boosted by PP, TP, Essence, Time Tokens & Idle Squares + Omni
    const conduitBaseRpSec = toDec(getPrestigeUpg('pu_conduit')?.totalBonus ?? 0).add(ascendedRpConduit);
    const skFountainMult = applySoftAndHardCap(
      D_ONE.add(toDec(getSkill('sk_fountain')?.totalBonus ?? 0).div(100)),
      1e4,
      1e8,
      0.45
    );
    const primordialRpMult = D_ONE.add((getSingUpg('su_primordial')?.totalLevels ?? 0) * 5);
    const rpPerSecond = safeMul(
      safeMul(conduitBaseRpSec, safeMul(skFountainMult, safeMul(skRootAllMult, rpCosmicTributeRpMult))),
      safeMul(
        safeMul(
          safeMul(skVanguardMult, skOmniTreeMult),
          safeMul(primordialRpMult, safeMul(idleRpMult, safeMul(beOmniYieldMult, omniEverythingMult)))
        ),
        safeMul(safeMul(coreRpMult, rpCascadeMult), gameSpeedMultiplier)
      )
    );

    // 9b. PP/sec boosted by TP, Essence, Time Tokens & Idle Squares + Omni
    const skillPpGenBase = toDec(getSkill('sk_prestige_gen')?.totalBonus ?? 0).add(ascendedGemGen);
    const ppPerSecond = safeMul(
      safeMul(
        skillPpGenBase,
        safeMul(
          ppCascadeMult,
          safeMul(timeTokenMult, safeMul(idleGemMult, safeMul(beOmniYieldMult, omniEverythingMult)))
        )
      ),
      safeMul(
        safeMul(safeMul(skVanguardMult, skOmniTreeMult), safeMul(skGemBoostMult, puGemFurnaceMult)),
        safeMul(suDarkEnergyBoost, corePpMult)
      )
    );

    // 9c. TP/sec (`su_tree_gen` scales UP with each level: totalBonus * 1.5^(levels-1)) boosted by Essence, Time Tokens & Idle Squares + Omni
    const suTreeGen = getSingUpg('su_tree_gen');
    const singTpGenBase =
      suTreeGen && suTreeGen.totalLevels > 0
        ? safeMul(suTreeGen.totalBonus, safePow(1.5, Math.max(0, suTreeGen.totalLevels - 1)))
        : D_ZERO;
    const tpPerSecond = safeMul(
      safeMul(
        singTpGenBase,
        safeMul(
          tpCascadeMult,
          safeMul(timeTokenMult, safeMul(idleLeafMult, safeMul(beOmniYieldMult, omniEverythingMult)))
        )
      ),
      safeMul(safeMul(coreTpMult, suDarkEnergyBoost), safeMul(skLeafSurgeMult, skOmniTreeMult))
    );

    // 9d. 50-Tier Singularity Essence Convergence & Essence Reactor
    const allUpgradeTracksMaxed = state.upgradeTracks.every((u) => u.tier >= u.maxTier);
    const rebirthBaseMaxedCount = state.rebirthPerks.filter(isTieredItemMaxed).length;
    const rebirthAscendedMaxedCount = state.ascendedRebirthPerks.filter(isTieredItemMaxed).length;
    const rebirthMaxedCount = rebirthBaseMaxedCount + rebirthAscendedMaxedCount;
    const rebirthTotalCount = state.rebirthPerks.length + state.ascendedRebirthPerks.length;
    const prestigeMaxedCount = state.prestigeUpgrades.filter(isTieredItemMaxed).length;
    const prestigeTotalCount = state.prestigeUpgrades.length;
    const skillTreeMaxedCount = state.skillNodes.filter(isSkillNodeCompleted).length;
    const skillTreeTotalCount = state.skillNodes.length;
    const allSingularityUpgradesMaxed = state.singularityUpgrades.every(isTieredItemMaxed);

    const allRebirthMaxed = rebirthMaxedCount >= rebirthTotalCount;
    const allPrestigeMaxed = prestigeMaxedCount >= prestigeTotalCount;
    const allSkillTreeMaxed = skillTreeMaxedCount >= skillTreeTotalCount;
    const allLayersMaxedForEssence = allRebirthMaxed && allPrestigeMaxed && allSkillTreeMaxed;
    const essenceConvergenceOpen =
      allLayersMaxedForEssence || state.essenceConvergenceUnlocked || state.adminUnlocked;

    const rawEcProduct = state.essenceConvergenceUpgrades.reduce(
      (prod, u) => safeMul(prod, D_ONE.add(u.totalBonus.div(100))),
      D_ONE
    );
    const essenceConvergenceMult = applySoftAndHardCap(rawEcProduct, 1e20, 1e45, 0.5);

    const allBaseSingularityBought = state.singularityUpgrades.every((u) => u.totalLevels >= 1);
    const reactorUnlocked = allBaseSingularityBought || state.adminUnlocked;
    const totalEssenceGainBoost = safeMul(
      safeMul(
        safeMul(timeTokenMult, idleEssenceMult),
        safeMul(skEssenceEchoMult, safeMul(skVoidSapMult, suEssenceSurgeMult))
      ),
      safeMul(safeMul(essenceConvergenceMult, beEssenceNovaMult), omniEverythingMult)
    );
    const essencePerSecond =
      state.essenceReactorLevel > 0
        ? safeMul(
            safeMul(state.essenceReactorLevel * 10, safePow(2, Math.floor(state.essenceReactorLevel / 5))),
            safeMul(totalEssenceGainBoost, beReactorMult)
          )
        : D_ZERO;

    // 10. Auto-Clicks/sec (Code Auto-Clicker does 100 clicks/sec!)
    const autoPulseClicks = applySoftAndHardCap(
      toDec(getRebirthPerk('rp_autopulse')?.totalBonus ?? 0),
      50,
      250,
      0.45
    ).toNumber();
    const companionClicks = clickerEvolution.companionCount * (1 + (getSkill('sk_clicker')?.totalLevels ?? 0) * 0.5);
    const codeAutoClicks = state.codeClickerUnlocked && state.codeClickerEnabled ? 100 : 0;
    const autoClicksPerSecond = (autoPulseClicks + companionClicks + codeAutoClicks) * gameSpeedMultiplier;

    // 11. Coin Core Multi-Buy (NO level cap, 1.1x cost scale!)
    const effectiveClickerScale = getEffectiveScale(CLICKER_COST_SCALE, globalScaleReduction);
    const coinCoreMulti = state.multiBuyBySection.coinCore;
    const clickerBuyInfo = free
      ? {
          count: coinCoreMulti === -1 ? 10 : coinCoreMulti,
          totalCost: D_ZERO,
          canAfford: true,
          nextSingleCost: D_ZERO
        }
      : calculateMultiBuy(
          state.coins,
          CLICKER_BASE_COST,
          effectiveClickerScale,
          state.clickerLevel - 1,
          coinCoreMulti,
          1000,
          hardCostMult
        );

    // 12. Rebirth Multi-Buy
    const effectiveRebirthScale = getEffectiveScale(REBIRTH_COST_SCALE, globalScaleReduction);
    const nextRebirthSingleCost = free
      ? D_ZERO
      : getRebirthLevelCost(REBIRTH_BASE_COST, effectiveRebirthScale, state.rebirthLevel)
          .mul(hardCostMult)
          .floor();
    const rebirthBuyInfo = free
      ? {
          count: state.multiBuyBySection.rebirth === -1 ? 5 : state.multiBuyBySection.rebirth,
          totalCost: D_ZERO,
          canAfford: true,
          nextSingleCost: D_ZERO
        }
      : activeTab === 'rebirth'
        ? calculateMultiBuyRebirth(
            state.coins,
            REBIRTH_BASE_COST,
            effectiveRebirthScale,
            state.rebirthLevel,
            state.multiBuyBySection.rebirth,
            50,
            hardCostMult
          )
        : {
            count: 1,
            totalCost: nextRebirthSingleCost,
            canAfford: state.coins.gte(nextRebirthSingleCost),
            nextSingleCost: nextRebirthSingleCost
          };

    const crucibleMult = applySoftAndHardCap(
      D_ONE.add(toDec(getPrestigeUpg('pu_crucible')?.totalBonus ?? 0).div(100)),
      1e4,
      1e9,
      0.45
    );
    const rpGainMultiplier = safeMul(
      safeMul(
        safeMul(crucibleMult, safeMul(ascendedRpMult, rpCosmicTributeRpMult)),
        safeMul(rpCascadeMult, safeMul(idleRpMult, safeMul(beOmniYieldMult, omniEverythingMult)))
      ),
      safeMul(skRootAllMult, safeMul(safeMul(skVanguardMult, skOmniTreeMult), safeMul(coreRpMult, timeTokenMult)))
    );

    let projectedRebirthRpGain = D_ZERO;
    if (rebirthBuyInfo.canAfford) {
      let stepSum = D_ZERO;
      for (let i = 0; i < rebirthBuyInfo.count; i++) {
        const gain = Decimal.max(
          D_ONE,
          safeMul(1 + (state.rebirthLevel + i) * 0.65, rpGainMultiplier).floor()
        );
        stepSum = stepSum.add(gain);
      }
      const ratio = free
        ? toDec(10)
        : Decimal.max(D_ONE, state.coins.div(Decimal.max(D_ONE, rebirthBuyInfo.nextSingleCost)));
      const surplusBonus = Decimal.max(
        D_ONE,
        safeMul(safePow(ratio, 0.48), safeMul(1 + state.rebirthLevel * 0.65, rpGainMultiplier)).floor()
      );
      projectedRebirthRpGain = Decimal.max(stepSum, surplusBonus);
    }

    // 13. Prestige Multi-Buy
    const effectivePrestigeScale = getEffectiveScale(PRESTIGE_RP_SCALE, globalScaleReduction);
    const nextPrestigeSingleCost = free
      ? D_ZERO
      : getLevelCost(PRESTIGE_BASE_RP_COST, effectivePrestigeScale, state.prestigeLevel, hardCostMult);
    const prestigeBuyInfo = free
      ? {
          count: state.multiBuyBySection.prestige === -1 ? 5 : state.multiBuyBySection.prestige,
          totalCost: D_ZERO,
          canAfford: true,
          nextSingleCost: D_ZERO
        }
      : activeTab === 'prestige'
        ? calculateMultiBuy(
            state.rebirthPoints,
            PRESTIGE_BASE_RP_COST,
            effectivePrestigeScale,
            state.prestigeLevel,
            state.multiBuyBySection.prestige,
            50,
            hardCostMult
          )
        : {
            count: 1,
            totalCost: nextPrestigeSingleCost,
            canAfford: state.rebirthPoints.gte(nextPrestigeSingleCost),
            nextSingleCost: nextPrestigeSingleCost
          };

    const ppGainMult = safeMul(
      safeMul(
        ppCascadeMult,
        safeMul(timeTokenMult, safeMul(idleGemMult, safeMul(beOmniYieldMult, omniEverythingMult)))
      ),
      safeMul(
        safeMul(
          safeMul(skVanguardMult, skOmniTreeMult),
          safeMul(safeMul(skGemBoostMult, puGemFurnaceMult), ascendedGemMult)
        ),
        safeMul(suDarkEnergyBoost, corePpMult)
      )
    );
    let projectedPrestigePointsGain = D_ZERO;
    if (prestigeBuyInfo.canAfford) {
      for (let i = 0; i < prestigeBuyInfo.count; i++) {
        const pTier = state.prestigeLevel + i;
        const expTierBoost = safePow(10, Math.floor(pTier / 3) + (pTier >= 4 ? (pTier - 3) * 0.55 : 0));
        const stepGain = Decimal.max(
          D_ONE,
          safeMul(safeMul(1 + pTier * 1.5, expTierBoost), ppGainMult).floor()
        );
        projectedPrestigePointsGain = projectedPrestigePointsGain.add(stepGain);
      }
      if (!free && state.rebirthPoints.gt(prestigeBuyInfo.nextSingleCost)) {
        const ratio = state.rebirthPoints.div(Decimal.max(D_ONE, prestigeBuyInfo.nextSingleCost));
        const surplusPp = safeMul(safePow(ratio, 0.4), ppGainMult).floor();
        projectedPrestigePointsGain = Decimal.max(projectedPrestigePointsGain, surplusPp);
      }
    }

    // 14. Skill Tree Reset (slightly lower cost scaling: 1.35)
    const treeMulti = state.multiBuyBySection.skillTree;
    const nextTreeSingleCost = free
      ? D_ZERO
      : getLevelCost(TREE_POINT_BASE_PP_COST, TREE_POINT_PP_SCALE, state.treeResetCount, hardCostMult);
    const treeBuyInfo = free
      ? {
          count: treeMulti === -1 ? 5 : treeMulti,
          totalCost: D_ZERO,
          canAfford: true,
          nextSingleCost: D_ZERO
        }
      : activeTab === 'skillTree'
        ? calculateMultiBuy(
            state.prestigePoints,
            TREE_POINT_BASE_PP_COST,
            TREE_POINT_PP_SCALE,
            state.treeResetCount,
            treeMulti,
            50,
            hardCostMult
          )
        : {
            count: 1,
            totalCost: nextTreeSingleCost,
            canAfford: state.prestigePoints.gte(nextTreeSingleCost),
            nextSingleCost: nextTreeSingleCost
          };

    const tpGainMult = safeMul(
      safeMul(
        tpCascadeMult,
        safeMul(timeTokenMult, safeMul(idleLeafMult, safeMul(beOmniYieldMult, omniEverythingMult)))
      ),
      safeMul(safeMul(safeMul(skVanguardMult, skOmniTreeMult), skLeafSurgeMult), safeMul(suDarkEnergyBoost, coreTpMult))
    );
    const projectedTreePointsGain = treeBuyInfo.canAfford
      ? Decimal.max(
          treeBuyInfo.count,
          safeMul(
            safeMul(
              treeBuyInfo.count,
              free
                ? 10
                : safePow(
                    Decimal.max(D_ONE, state.prestigePoints.div(Decimal.max(D_ONE, treeBuyInfo.nextSingleCost))),
                    0.35
                  )
            ),
            tpGainMult
          ).floor()
        )
      : D_ZERO;

    // 15. Singularity Reset (ONLY 1 at a time)
    const singularityCost = free
      ? D_ZERO
      : getLevelCost(SINGULARITY_BASE_TP_COST, SINGULARITY_TP_SCALE, state.singularityCount, hardCostMult);
    const canSingularity = free ? true : state.treePoints.gte(singularityCost);
    const projectedEssenceGain = Decimal.max(
      state.singularityCount + 1,
      safeMul(state.singularityCount + 1, totalEssenceGainBoost).floor()
    );

    // Essence Reactor preview (Only computed when Singularity tab is active & reactor unlocked!)
    const reactorRemaining = Math.max(0, ESSENCE_REACTOR_MAX_LEVEL - state.essenceReactorLevel);
    const reactorBuyInfo =
      activeTab !== 'singularity' || !reactorUnlocked
        ? { count: 0, totalCost: D_ZERO, canAfford: false, nextSingleCost: D_ZERO }
        : free
          ? {
              count: Math.min(
                reactorRemaining,
                state.multiBuyBySection.singularity === -1 ? 10 : state.multiBuyBySection.singularity
              ),
              totalCost: D_ZERO,
              canAfford: reactorRemaining > 0,
              nextSingleCost: D_ZERO
            }
          : calculateMultiBuy(
              state.singularityEssence,
              ESSENCE_REACTOR_BASE_COST,
              getEffectiveScale(ESSENCE_REACTOR_COST_SCALE, globalScaleReduction),
              state.essenceReactorLevel,
              state.multiBuyBySection.singularity,
              reactorRemaining,
              hardCostMult
            );

    // Singularity Core Level-Up (Max Level 100!) — Only full-computed when Singularity tab is active
    const effectiveCoreScale = getEffectiveScale(1.85, globalScaleReduction);
    const coreRemaining = Math.max(0, SINGULARITY_CORE_MAX_LEVEL - coreLevel);
    const nextCoreSingleCost = free
      ? D_ZERO
      : getLevelCost(1, effectiveCoreScale, coreLevel, hardCostMult);
    const singularityCoreBuyInfo =
      coreRemaining <= 0
        ? { count: 0, totalCost: D_ZERO, canAfford: false, nextSingleCost: D_ZERO }
        : free
          ? {
              count: Math.min(
                coreRemaining,
                state.multiBuyBySection.singularity === -1 ? 10 : state.multiBuyBySection.singularity
              ),
              totalCost: D_ZERO,
              canAfford: true,
              nextSingleCost: D_ZERO
            }
          : activeTab === 'singularity'
            ? calculateMultiBuy(
                state.singularityEssence,
                1,
                effectiveCoreScale,
                coreLevel,
                state.multiBuyBySection.singularity,
                coreRemaining,
                hardCostMult
              )
            : {
                count: 1,
                totalCost: nextCoreSingleCost,
                canAfford: state.singularityEssence.gte(nextCoreSingleCost),
                nextSingleCost: nextCoreSingleCost
              };

    // 16. Time Reset, Coin Odds (+5% per level, 50% -> 80% max), Token Boost, Auto-Singularity & Idle Tab
    const timeResetRequiredEssence = free ? D_ZERO : safeMul(TIME_RESET_ESSENCE_COST, hardCostMult);
    const canTimeReset = free ? true : state.singularityEssence.gte(timeResetRequiredEssence);
    const timeTokenBoostMult = safeMul(
      safeMul(safePow(2, state.timeTokenBoostLevel), beChronoTokenMult),
      safeMul(skChronoCanopyMult, omniEverythingMult)
    );
    const projectedTimeTokens = canTimeReset
      ? Decimal.max(
          D_ONE,
          safeMul(
            safePow(
              Decimal.max(D_ONE, state.singularityEssence.div(Decimal.max(D_ONE, timeResetRequiredEssence))),
              0.5
            ),
            safeMul(timeTokenBoostMult, idleTokenMult)
          ).floor()
        )
      : D_ZERO;
    const timeFlipWinChance = Math.min(0.8, 0.5 + state.timeFlipChanceLevel * 0.05);
    const timeFlipRemaining = Math.max(0, TIME_FLIP_MAX_LEVEL - state.timeFlipChanceLevel);
    const timeFlipBuyInfo =
      activeTab !== 'timeReset' || timeFlipRemaining <= 0
        ? { count: 0, totalCost: D_ZERO, canAfford: false, nextSingleCost: D_ZERO }
        : free
          ? {
              count: Math.min(
                timeFlipRemaining,
                state.multiBuyBySection.timeReset === -1 ? TIME_FLIP_MAX_LEVEL : state.multiBuyBySection.timeReset
              ),
              totalCost: D_ZERO,
              canAfford: true,
              nextSingleCost: D_ZERO
            }
          : calculateMultiBuy(
              state.timeTokens,
              TIME_FLIP_BASE_COST,
              TIME_FLIP_COST_SCALE,
              state.timeFlipChanceLevel,
              state.multiBuyBySection.timeReset,
              timeFlipRemaining,
              hardCostMult
            );

    const tokenBoostRemaining = Math.max(0, TIME_TOKEN_BOOST_MAX_LEVEL - state.timeTokenBoostLevel);
    const timeTokenBoostBuyInfo =
      activeTab !== 'timeReset' || tokenBoostRemaining <= 0
        ? { count: 0, totalCost: D_ZERO, canAfford: false, nextSingleCost: D_ZERO }
        : free
          ? {
              count: Math.min(
                tokenBoostRemaining,
                state.multiBuyBySection.timeReset === -1 ? 5 : state.multiBuyBySection.timeReset
              ),
              totalCost: D_ZERO,
              canAfford: true,
              nextSingleCost: D_ZERO
            }
          : calculateMultiBuy(
              state.timeTokens,
              TIME_TOKEN_BOOST_BASE_COST,
              TIME_TOKEN_BOOST_COST_SCALE,
              state.timeTokenBoostLevel,
              state.multiBuyBySection.timeReset,
              tokenBoostRemaining,
              hardCostMult
            );

    const timeAutoSingularityCost = free ? D_ZERO : safeMul(TIME_AUTO_SINGULARITY_COST, hardCostMult);
    const canBuyTimeAutoSingularity =
      !state.timeAutoSingularityUnlocked && (free || state.timeTokens.gte(timeAutoSingularityCost));

    const idealTabCost = free ? D_ZERO : safeMul(IDEAL_TAB_COST, hardCostMult);
    const canUnlockIdealTab =
      !state.idealTabUnlocked && (free || state.timeTokens.gte(idealTabCost));
    const idleXpSpeedMult = safeMul(
      safeMul(idleXpMult, safeMul(skEssenceEchoMult, skOmniTreeMult)),
      safeMul(safeMul(skCosmicBlossomMult, beSpectrumIdleXpMult), omniEverythingMult)
    );
    const idealXpPerSecond = state.idealTabUnlocked
      ? IDEAL_COLORS.reduce((sum, col) => {
          const track = state.ideal.tracks?.[col.id];
          if (!track || !track.unlocked) return sum;
          const milestone5Mult = safePow(2, Math.floor(track.level / 5));
          const milestone20Mult = safePow(5, Math.floor(track.level / 20));
          const colorRate = safeMul(
            safeMul(safeMul(1 + track.level, col.baseXpPerSec), safeMul(milestone5Mult, milestone20Mult)),
            idleXpSpeedMult
          );
          return sum.add(colorRate);
        }, D_ZERO)
      : D_ZERO;
    const totalIdleXp = state.idealTabUnlocked
      ? IDEAL_COLORS.reduce(
          (sum, col) => sum.add(state.ideal.tracks?.[col.id]?.totalXp ?? D_ZERO),
          D_ZERO
        )
      : D_ZERO;
    const availableIdleXp = Decimal.max(D_ZERO, totalIdleXp.sub(state.idleXpSpent));
    const idleAutoTimeCost = free ? D_ZERO : safeMul(IDLE_AUTO_TIME_COST, hardCostMult);
    const canBuyTimeAutoUpgrades =
      !state.timeAutoTokenUpgradesUnlocked && (free || availableIdleXp.gte(idleAutoTimeCost));

    // 17. Separate Singularity, Time & Idle Automations
    const hasAutoBuildings = (getSingUpg('su_auto_buildings')?.totalLevels ?? 0) >= 1 || state.adminUnlocked;
    const hasAutoUpgrades = (getSingUpg('su_auto_upgrades')?.totalLevels ?? 0) >= 1 || state.adminUnlocked;
    const hasAutoRebirth = (getSingUpg('su_auto_rebirth')?.totalLevels ?? 0) >= 1 || state.adminUnlocked;
    const hasAutoPrestige = (getSingUpg('su_auto_prestige')?.totalLevels ?? 0) >= 1 || state.adminUnlocked;
    const hasAutoSkillTree = (getSingUpg('su_auto_skill_tree')?.totalLevels ?? 0) >= 1 || state.adminUnlocked;
    const hasAutoBillionEssence = (getBillionUpg('be_auto_billion')?.totalLevels ?? 0) >= 1 || state.adminUnlocked;
    const hasAutoClicker = (getSingUpg('su_auto_clicker')?.totalLevels ?? 0) >= 1 || state.adminUnlocked;
    const hasAutoSingularity = state.timeAutoSingularityUnlocked || state.adminUnlocked;
    const hasAutoTimeUpgrades = state.timeAutoTokenUpgradesUnlocked || state.adminUnlocked;

    const isStellarMaxed = getSkill('sk_scale')?.totalBonus.gte(60) ?? false;

    return {
      hardCostMult,
      timeTokenMult,
      boostCapCeiling,
      globalScaleReduction,
      isStellarMaxed,
      omniEverythingMult,
      allUpgradeTracksMaxed,
      allSingularityUpgradesMaxed,
      idleBoosts: {
        coins: idleCoinMult,
        rp: idleRpMult,
        gems: idleGemMult,
        leaves: idleLeafMult,
        essence: idleEssenceMult,
        tokens: idleTokenMult,
        idleXp: idleXpSpeedMult
      },
      allBaseRebirthPerksMaxed,
      effectiveAscendedRebirthBaseCost,
      essenceConvergenceOpen,
      allLayersMaxedForEssence,
      essenceConvergenceMult,
      billionEssenceOpen,
      billionEssenceThreshold: BILLION_ESSENCE_THRESHOLD,
      beEssenceNovaMult,
      hasAutoBillionEssence,
      essenceConvergenceProgress: {
        rebirthMaxed: rebirthMaxedCount,
        rebirthTotal: rebirthTotalCount,
        prestigeMaxed: prestigeMaxedCount,
        prestigeTotal: prestigeTotalCount,
        skillTreeMaxed: skillTreeMaxedCount,
        skillTreeTotal: skillTreeTotalCount,
        allRebirthMaxed,
        allPrestigeMaxed,
        allSkillTreeMaxed
      },
      coreCoinMult,
      coreRpMult,
      corePpMult,
      coreTpMult,
      rpFormulaExponent,
      rpFormulaFactor,
      rpCurve,
      ppToRpCurve,
      tpToPpCurve,
      essenceToTpCurve,
      coinCascadeMult,
      rpCascadeMult,
      ppCascadeMult,
      tpCascadeMult,
      clickerEvolution,
      nextClickerEvolution,
      clickerTotalPowerMult,
      clickerGlobalCoinBoost,
      buildingDiscountMult,
      buildingCpsMap,
      totalBuildingsOwned,
      coinsPerSecond,
      coinsPerClick,
      critChance,
      critMultiplier,
      gameSpeedMultiplier,
      rpPerSecond,
      ppPerSecond,
      tpPerSecond,
      singTpGenBase,
      essencePerSecond,
      reactorUnlocked,
      reactorBuyInfo,
      autoClicksPerSecond,
      effectiveRebirthScale,
      rebirthBuyInfo,
      projectedRebirthRpGain,
      effectivePrestigeScale,
      prestigeBuyInfo,
      projectedPrestigePointsGain,
      treeBuyInfo,
      projectedTreePointsGain,
      singularityCost,
      canSingularity,
      projectedEssenceGain,
      effectiveCoreScale,
      singularityCoreBuyInfo,
      timeResetRequiredEssence,
      canTimeReset,
      timeTokenBoostMult,
      timeTokenBoostBuyInfo,
      timeAutoSingularityCost,
      canBuyTimeAutoSingularity,
      idealTabCost,
      canUnlockIdealTab,
      idealXpPerSecond,
      totalIdleXp,
      availableIdleXp,
      idleAutoTimeCost,
      canBuyTimeAutoUpgrades,
      projectedTimeTokens,
      timeFlipWinChance,
      timeFlipBuyInfo,
      effectiveClickerScale,
      clickerBuyInfo,
      hasAutoBuildings,
      hasAutoUpgrades,
      hasAutoRebirth,
      hasAutoPrestige,
      hasAutoSkillTree,
      hasAutoSingularity,
      hasAutoTimeUpgrades,
      hasAutoClicker,
      retainedCoinPct: applySoftAndHardCap(
        toDec(getRebirthPerk('rp_retainer')?.totalBonus ?? 0).div(100),
        0.7,
        1.0,
        0.5
      ).toNumber(),
      startingTreasury: toDec(getRebirthPerk('rp_treasury')?.totalBonus ?? 0),
      keptRebirthLevels: Math.floor(getPrestigeUpg('pu_memory')?.totalBonus.toNumber() ?? 0),
      primordialStartRp: toDec(getSingUpg('su_primordial')?.totalBonus ?? 0)
    };
  }, [state, activeTab]);

  const statsRef = useRef(stats);
  statsRef.current = stats;

  // 250ms Game Tick Loop
  useEffect(() => {
    let tickCounter = 0;
    const interval = window.setInterval(() => {
      tickCounter++;
      const s = statsRef.current;
      const dt = 0.25;

      setState((prev) => {
        const passiveGain = safeMul(s.coinsPerSecond, dt);
        const autoClickGain = safeMul(safeMul(s.autoClicksPerSecond, s.coinsPerClick), dt);
        const totalCoinGain = passiveGain.add(autoClickGain);

        const rpGain = safeMul(s.rpPerSecond, dt);
        const ppGain = safeMul(s.ppPerSecond, dt);
        const tpGain = safeMul(s.tpPerSecond, dt);
        const essenceGain = safeMul(s.essencePerSecond, dt);

        let nextCoins = prev.coins.add(totalCoinGain);
        const nextLifetimeCoins = prev.lifetimeCoins.add(totalCoinGain);
        let nextRp = prev.rebirthPoints.add(rpGain);
        const nextLifetimeRp = prev.lifetimeRebirthPoints.add(rpGain);
        const nextPp = prev.prestigePoints.add(ppGain);
        const nextLifetimePp = prev.lifetimePrestigePoints.add(ppGain);
        let finalTp = prev.treePoints.add(tpGain);
        const nextLifetimeTp = prev.lifetimeTreePoints.add(tpGain);
        const nextEssence = prev.singularityEssence.add(essenceGain);
        const nextLifetimeEssence = prev.lifetimeSingularityEssence.add(essenceGain);

        let nextBuildings = prev.buildings;
        let nextTracks = prev.upgradeTracks;
        let nextRebirthPerks = prev.rebirthPerks;
        let nextLastRebirthPerkCost = prev.lastRebirthPerkCost;
        let nextAscendedRebirthPerks = prev.ascendedRebirthPerks;
        let nextPrestigeUpgrades = prev.prestigeUpgrades;
        let nextSkillNodes = prev.skillNodes;
        let nextSingularityUpgrades = prev.singularityUpgrades;
        let nextEssenceConvergenceUpgrades = prev.essenceConvergenceUpgrades;
        let nextEssenceConvergenceUnlocked = prev.essenceConvergenceUnlocked;
        let nextBillionEssenceUpgrades = prev.billionEssenceUpgrades;
        let nextBillionEssenceUnlocked =
          prev.billionEssenceUnlocked ||
          nextEssence.gte(BILLION_ESSENCE_THRESHOLD) ||
          nextLifetimeEssence.gte(BILLION_ESSENCE_THRESHOLD);
        let nextClickerLevel = prev.clickerLevel;
        let nextCompletedUpgrades = prev.completedUpgradeCount;
        let nextCompletedPerkTiers = prev.completedPerkTiersCount;
        let finalTokens = prev.timeTokens;
        let nextTimeFlipLv = prev.timeFlipChanceLevel;
        let nextTimeTokenBoostLv = prev.timeTokenBoostLevel;
        let nextTimeAutoSing = prev.timeAutoSingularityUnlocked;
        const hardMult = prev.hardMode ? 10 : 1;

        // Independent Per-Color Idle XP Progression with O(1) geometric multi-level skip
        let nextIdeal = prev.ideal;
        if (prev.idealTabUnlocked) {
          const updatedTracks = { ...prev.ideal.tracks } as Record<IdealColor, IdleColorTrack>;
          const updatedSquares = { ...prev.ideal.squares };
          let highestUnlockedIdx = 0;
          let totalLevels = 0;
          const xpGain = safeMul(s.idealXpPerSecond, dt);

          for (let i = 0; i < IDEAL_COLORS.length; i++) {
            const col = IDEAL_COLORS[i];
            const prevColorId = i > 0 ? IDEAL_COLORS[i - 1].id : null;
            const prevTrack = prevColorId ? updatedTracks[prevColorId] : null;
            const cur = { ...updatedTracks[col.id] };

            if (!cur.unlocked) {
              if (i === 0 || (prevTrack && prevTrack.level >= col.unlockPrevLevel)) {
                cur.unlocked = true;
              }
            }

            if (cur.unlocked) {
              highestUnlockedIdx = Math.max(highestUnlockedIdx, i);
              cur.xp = cur.xp.add(xpGain);
              cur.totalXp = cur.totalXp.add(xpGain);

              if (cur.xp.gte(cur.xpNeeded)) {
                const g = col.xpGrowth;
                const ratio = D_ONE.add(cur.xp.mul(g - 1).div(Decimal.max(1e-9, cur.xpNeeded)));
                const log10Ratio = ratio.log10().toNumber();
                const maxK = Number.isFinite(log10Ratio)
                  ? Math.floor(log10Ratio / Math.log10(g))
                  : 0;
                if (maxK > 1) {
                  const k = Math.min(maxK, 500);
                  const gPowK = safePow(g, k);
                  const costSum = cur.xpNeeded.mul(gPowK.sub(D_ONE).div(g - 1));
                  if (cur.xp.gte(costSum)) {
                    cur.xp = Decimal.max(D_ZERO, cur.xp.sub(costSum));
                    cur.level += k;
                    cur.squares += k;
                    cur.xpNeeded = cur.xpNeeded.mul(gPowK);
                  }
                }
                let guard = 0;
                while (cur.xp.gte(cur.xpNeeded) && guard < 10) {
                  guard++;
                  cur.xp = Decimal.max(D_ZERO, cur.xp.sub(cur.xpNeeded));
                  cur.level += 1;
                  cur.squares += 1;
                  cur.xpNeeded = cur.xpNeeded.mul(g);
                }
              }
            }

            updatedTracks[col.id] = cur;
            updatedSquares[col.id] = cur.squares;
            totalLevels += cur.level;
          }

          nextIdeal = {
            ...prev.ideal,
            colorIndex: highestUnlockedIdx,
            totalLevels,
            squares: updatedSquares,
            tracks: updatedTracks
          };
        }

        if (tickCounter % 2 === 0 && !prev.adminFreeMode) {
          const autoMulti: MultiBuyAmount = prev.automation.autoBuyMax ? -1 : 1;

          if (s.hasAutoBuildings && prev.automation.autoBuyBuildings && nextCoins.gt(0)) {
            let changed = false;
            const mapped = prev.buildings.map((b) => {
              if (prev.automation.buildingAutoBuyEnabled[b.id] === false) return b;
              if (nextLifetimeCoins.lt(b.unlockCoins) && b.count === 0) return b;
              const effScale = getEffectiveScale(b.scaleFactor, s.globalScaleReduction);
              const info = calculateMultiBuy(
                nextCoins,
                b.baseCost,
                effScale,
                b.count,
                autoMulti,
                250,
                s.buildingDiscountMult * hardMult
              );
              if (info.canAfford && info.count > 0) {
                nextCoins = Decimal.max(D_ZERO, nextCoins.sub(info.totalCost));
                changed = true;
                return { ...b, count: b.count + info.count };
              }
              return b;
            });
            if (changed) nextBuildings = mapped;
          }

          if (s.hasAutoUpgrades && prev.automation.autoBuyUpgrades && nextCoins.gt(0)) {
            let changed = false;
            const mapped = prev.upgradeTracks.map((trk) => {
              if (trk.tier >= trk.maxTier) return trk;
              const effScale = getEffectiveScale(trk.costScale, s.globalScaleReduction);
              const remaining = Math.max(0, trk.maxTier - trk.tier);
              const info = calculateMultiBuy(
                nextCoins,
                trk.baseCost,
                effScale,
                trk.tier - 1,
                autoMulti,
                remaining,
                hardMult
              );
              if (info.canAfford && info.count > 0) {
                nextCoins = Decimal.max(D_ZERO, nextCoins.sub(info.totalCost));
                nextCompletedUpgrades += info.count;
                changed = true;
                return { ...trk, tier: Math.min(trk.maxTier, trk.tier + info.count) };
              }
              return trk;
            });
            if (changed) nextTracks = mapped;
          }

          if (s.hasAutoRebirth && prev.automation.autoBuyRebirthUpgrades && nextRp.gt(0)) {
            let changed = false;
            const mapped = prev.rebirthPerks.map((perk) => {
              if (isTieredItemMaxed(perk)) return perk;
              const res = applyTieredPurchase(perk, nextRp, autoMulti, s.globalScaleReduction, false, hardMult);
              if (res.bought > 0) {
                nextRp = Decimal.max(D_ZERO, nextRp.sub(res.spent));
                nextCompletedPerkTiers += res.evolutions;
                if (res.lastStepCost.gt(0)) nextLastRebirthPerkCost = res.lastStepCost;
                changed = true;
                return res.updated;
              }
              return perk;
            });
            if (changed) nextRebirthPerks = mapped;

            if (s.allBaseRebirthPerksMaxed && nextRp.gt(0)) {
              let ascChanged = false;
              const anchorCost = nextLastRebirthPerkCost.gt(0)
                ? Decimal.max(1_000, nextLastRebirthPerkCost)
                : Decimal.max(1_000, s.effectiveAscendedRebirthBaseCost);
              const ascMapped = prev.ascendedRebirthPerks.map((perk) => {
                if (isTieredItemMaxed(perk)) return perk;
                const seeded = perk.baseCost.gt(0) ? perk : { ...perk, baseCost: anchorCost };
                const res = applyTieredPurchase(seeded, nextRp, autoMulti, s.globalScaleReduction, false, hardMult);
                if (res.bought > 0) {
                  nextRp = Decimal.max(D_ZERO, nextRp.sub(res.spent));
                  nextCompletedPerkTiers += res.evolutions;
                  ascChanged = true;
                  return res.updated;
                }
                return perk;
              });
              if (ascChanged) nextAscendedRebirthPerks = ascMapped;
            }
          }

          if (s.hasAutoClicker && prev.automation.autoLevelClicker && nextCoins.gt(0)) {
            const effClickerScale = getEffectiveScale(CLICKER_COST_SCALE, s.globalScaleReduction);
            const info = calculateMultiBuy(
              nextCoins,
              CLICKER_BASE_COST,
              effClickerScale,
              nextClickerLevel - 1,
              autoMulti,
              1000,
              hardMult
            );
            if (info.canAfford && info.count > 0) {
              nextCoins = Decimal.max(D_ZERO, nextCoins.sub(info.totalCost));
              nextClickerLevel += info.count;
            }
          }
        }

        // Clean budget-safe PP, Leaves, Essence & Time Token deductions for Auto-Buyers
        let finalPp = nextPp;
        if (tickCounter % 2 === 0 && !prev.adminFreeMode && s.hasAutoPrestige && prev.automation.autoBuyPrestigeUpgrades && finalPp.gt(0)) {
          const autoMulti: MultiBuyAmount = prev.automation.autoBuyMax ? -1 : 1;
          let changed = false;
          const mapped = prev.prestigeUpgrades.map((upg) => {
            if (isTieredItemMaxed(upg)) return upg;
            const res = applyTieredPurchase(upg, finalPp, autoMulti, s.globalScaleReduction, false, hardMult);
            if (res.bought > 0) {
              finalPp = Decimal.max(D_ZERO, finalPp.sub(res.spent));
              nextCompletedPerkTiers += res.evolutions;
              changed = true;
              return res.updated;
            }
            return upg;
          });
          if (changed) nextPrestigeUpgrades = mapped;
        }

        if (tickCounter % 2 === 0 && !prev.adminFreeMode && s.hasAutoSkillTree && prev.automation.autoBuySkillTree && finalTp.gt(0)) {
          const autoMulti: MultiBuyAmount = prev.automation.autoBuyMax ? -1 : 1;
          let changed = false;
          const workingNodes = prev.skillNodes.map((n) => ({ ...n, requires: [...n.requires] }));
          for (let i = 0; i < workingNodes.length; i++) {
            const node = workingNodes[i];
            const unlocked =
              prev.adminUnlocked ||
              node.requires.length === 0 ||
              node.requires.every((reqId) => {
                const parent = workingNodes.find((p) => p.id === reqId);
                return parent ? parent.totalLevels > 0 : false;
              });
            if (!unlocked || isTieredItemMaxed(node) || (node.id === 'sk_scale' && node.totalBonus.gte(60))) {
              continue;
            }
            const res = applyTieredPurchase(node, finalTp, autoMulti, s.globalScaleReduction, false, hardMult);
            if (res.bought > 0) {
              finalTp = Decimal.max(D_ZERO, finalTp.sub(res.spent));
              nextCompletedPerkTiers += res.evolutions;
              if (node.id === 'sk_scale' && res.updated.totalBonus.gt(60)) {
                res.updated.totalBonus = toDec(60);
              }
              workingNodes[i] = res.updated;
              changed = true;
            }
          }
          if (changed) nextSkillNodes = workingNodes;
        }

        let finalEssence = nextEssence;
        if (tickCounter % 2 === 0 && !prev.adminFreeMode && s.hasAutoSingularity && prev.automation.autoBuySingularityUpgrades && finalEssence.gt(0)) {
          const autoMulti: MultiBuyAmount = prev.automation.autoBuyMax ? -1 : 1;
          let changed = false;
          const mapped = prev.singularityUpgrades.map((upg) => {
            if (isTieredItemMaxed(upg)) return upg;
            const res = applyTieredPurchase(upg, finalEssence, autoMulti, s.globalScaleReduction, false, hardMult);
            if (res.bought > 0) {
              finalEssence = Decimal.max(D_ZERO, finalEssence.sub(res.spent));
              nextCompletedPerkTiers += res.evolutions;
              changed = true;
              return res.updated;
            }
            return upg;
          });
          if (changed) nextSingularityUpgrades = mapped;
        }

        const nowAllRebirthMaxed =
          nextRebirthPerks.every(isTieredItemMaxed) &&
          nextAscendedRebirthPerks.every(isTieredItemMaxed);
        const nowAllPrestigeMaxed = nextPrestigeUpgrades.every(isTieredItemMaxed);
        const nowAllSkillTreeMaxed = nextSkillNodes.every(isSkillNodeCompleted);
        if (nowAllRebirthMaxed && nowAllPrestigeMaxed && nowAllSkillTreeMaxed) {
          nextEssenceConvergenceUnlocked = true;
        }

        if (
          tickCounter % 2 === 0 &&
          !prev.adminFreeMode &&
          s.hasAutoSingularity &&
          prev.automation.autoBuySingularityUpgrades &&
          (nextEssenceConvergenceUnlocked || prev.adminUnlocked)
        ) {
          const autoMulti: MultiBuyAmount = prev.automation.autoBuyMax ? -1 : 1;
          let ecChanged = false;
          const ecMapped = prev.essenceConvergenceUpgrades.map((upg) => {
            if (isTieredItemMaxed(upg)) return upg;
            const currencyBalance =
              upg.currency === 'rebirthPoints'
                ? nextRp
                : upg.currency === 'prestigePoints'
                  ? finalPp
                  : upg.currency === 'treePoints'
                    ? finalTp
                    : finalEssence;
            const res = applyTieredPurchase(
              upg,
              currencyBalance,
              autoMulti,
              s.globalScaleReduction,
              false,
              hardMult
            );
            if (res.bought > 0) {
              if (upg.currency === 'rebirthPoints') nextRp = Decimal.max(D_ZERO, nextRp.sub(res.spent));
              else if (upg.currency === 'prestigePoints') finalPp = Decimal.max(D_ZERO, finalPp.sub(res.spent));
              else if (upg.currency === 'treePoints') finalTp = Decimal.max(D_ZERO, finalTp.sub(res.spent));
              else finalEssence = Decimal.max(D_ZERO, finalEssence.sub(res.spent));
              nextCompletedPerkTiers += res.evolutions;
              ecChanged = true;
              return res.updated;
            }
            return upg;
          });
          if (ecChanged) nextEssenceConvergenceUpgrades = ecMapped;
        }

        if (
          tickCounter % 2 === 0 &&
          !prev.adminFreeMode &&
          s.hasAutoBillionEssence &&
          prev.automation.autoBuyBillionEssence &&
          (nextBillionEssenceUnlocked || prev.adminUnlocked) &&
          finalEssence.gte(BILLION_ESSENCE_THRESHOLD)
        ) {
          const autoMulti: MultiBuyAmount = prev.automation.autoBuyMax ? -1 : 1;
          let beChanged = false;
          const beMapped = prev.billionEssenceUpgrades.map((upg) => {
            if (isTieredItemMaxed(upg)) return upg;
            const res = applyTieredPurchase(upg, finalEssence, autoMulti, s.globalScaleReduction, false, hardMult);
            if (res.bought > 0) {
              finalEssence = Decimal.max(D_ZERO, finalEssence.sub(res.spent));
              nextCompletedPerkTiers += res.evolutions;
              beChanged = true;
              return res.updated;
            }
            return upg;
          });
          if (beChanged) nextBillionEssenceUpgrades = beMapped;
        }

        if (
          tickCounter % 2 === 0 &&
          !prev.adminFreeMode &&
          s.hasAutoTimeUpgrades &&
          prev.automation.autoBuyTimeUpgrades &&
          finalTokens.gt(0)
        ) {
          const autoMulti: MultiBuyAmount = prev.automation.autoBuyMax ? -1 : 1;
          const flipRem = Math.max(0, TIME_FLIP_MAX_LEVEL - nextTimeFlipLv);
          if (flipRem > 0) {
            const flipInfo = calculateMultiBuy(
              finalTokens,
              TIME_FLIP_BASE_COST,
              TIME_FLIP_COST_SCALE,
              nextTimeFlipLv,
              autoMulti,
              flipRem,
              hardMult
            );
            if (flipInfo.canAfford && flipInfo.count > 0) {
              finalTokens = Decimal.max(D_ZERO, finalTokens.sub(flipInfo.totalCost));
              nextTimeFlipLv = Math.min(TIME_FLIP_MAX_LEVEL, nextTimeFlipLv + flipInfo.count);
            }
          }

          const boostRem = Math.max(0, TIME_TOKEN_BOOST_MAX_LEVEL - nextTimeTokenBoostLv);
          if (boostRem > 0) {
            const boostInfo = calculateMultiBuy(
              finalTokens,
              TIME_TOKEN_BOOST_BASE_COST,
              TIME_TOKEN_BOOST_COST_SCALE,
              nextTimeTokenBoostLv,
              autoMulti,
              boostRem,
              hardMult
            );
            if (boostInfo.canAfford && boostInfo.count > 0) {
              finalTokens = Decimal.max(D_ZERO, finalTokens.sub(boostInfo.totalCost));
              nextTimeTokenBoostLv = Math.min(TIME_TOKEN_BOOST_MAX_LEVEL, nextTimeTokenBoostLv + boostInfo.count);
            }
          }

          if (!nextTimeAutoSing) {
            const singAutoCost = safeMul(TIME_AUTO_SINGULARITY_COST, hardMult);
            if (finalTokens.gte(singAutoCost)) {
              finalTokens = Decimal.max(D_ZERO, finalTokens.sub(singAutoCost));
              nextTimeAutoSing = true;
            }
          }
        }

        let nextSectionWaves = prev.sectionWaves;
        let nextIdleXpSpent = prev.idleXpSpent;

        if (tickCounter % 2 === 0 && !prev.adminFreeMode) {
          const autoMulti: MultiBuyAmount = prev.automation.autoBuyMax ? -1 : 1;
          const runWaveAuto = (tab: ActiveTab, balance: Decimal): { balance: Decimal; changed: boolean } => {
            const waveState = nextSectionWaves?.[tab];
            if (!waveState) return { balance, changed: false };
            let curBalance = balance;
            let waveChanged = false;
            let lastCost = D_ZERO;
            const updatedUpgrades = waveState.upgrades.map((upg) => {
              if (isTieredItemMaxed(upg)) return upg;
              const res = applyTieredPurchase(upg, curBalance, autoMulti, s.globalScaleReduction, false, hardMult);
              if (res.bought > 0) {
                curBalance = Decimal.max(D_ZERO, curBalance.sub(res.spent));
                nextCompletedPerkTiers += res.evolutions;
                if (res.lastStepCost.gt(0)) lastCost = res.lastStepCost;
                waveChanged = true;
                return res.updated;
              }
              return upg;
            });
            if (waveChanged) {
              const advanced = advanceSectionWaveIfComplete(
                { ...waveState, upgrades: updatedUpgrades },
                tab,
                lastCost
              );
              nextSectionWaves = { ...nextSectionWaves, [tab]: advanced };
            }
            return { balance: curBalance, changed: waveChanged };
          };

          if (s.hasAutoBuildings && prev.automation.autoBuyBuildings && nextCoins.gt(0)) {
            nextCoins = runWaveAuto('buildings', nextCoins).balance;
          }
          if (
            s.hasAutoUpgrades &&
            prev.automation.autoBuyUpgrades &&
            nextCoins.gt(0) &&
            nextTracks.every((u) => u.tier >= u.maxTier)
          ) {
            nextCoins = runWaveAuto('upgrades', nextCoins).balance;
          }
          if (s.hasAutoRebirth && prev.automation.autoBuyRebirthUpgrades && nextRp.gt(0) && nowAllRebirthMaxed) {
            nextRp = runWaveAuto('rebirth', nextRp).balance;
          }
          if (s.hasAutoPrestige && prev.automation.autoBuyPrestigeUpgrades && finalPp.gt(0) && nowAllPrestigeMaxed) {
            finalPp = runWaveAuto('prestige', finalPp).balance;
          }
          if (s.hasAutoSkillTree && prev.automation.autoBuySkillTree && finalTp.gt(0) && nowAllSkillTreeMaxed) {
            finalTp = runWaveAuto('skillTree', finalTp).balance;
          }
          if (
            s.hasAutoSingularity &&
            prev.automation.autoBuySingularityUpgrades &&
            finalEssence.gt(0) &&
            nextSingularityUpgrades.every(isTieredItemMaxed)
          ) {
            finalEssence = runWaveAuto('singularity', finalEssence).balance;
          }
          if (s.hasAutoTimeUpgrades && prev.automation.autoBuyTimeUpgrades && finalTokens.gt(0)) {
            finalTokens = runWaveAuto('timeReset', finalTokens).balance;
          }
          if (
            prev.idealTabUnlocked &&
            s.hasAutoTimeUpgrades &&
            prev.automation.autoBuyTimeUpgrades
          ) {
            const liveTotalIdleXp = IDEAL_COLORS.reduce(
              (sum, col) => sum.add(nextIdeal.tracks?.[col.id]?.totalXp ?? D_ZERO),
              D_ZERO
            );
            const availIdleXp = Decimal.max(D_ZERO, liveTotalIdleXp.sub(nextIdleXpSpent));
            if (availIdleXp.gt(0)) {
              const afterIdle = runWaveAuto('ideal', availIdleXp);
              if (afterIdle.changed) {
                nextIdleXpSpent = nextIdleXpSpent.add(availIdleXp.sub(afterIdle.balance));
              }
            }
          }
        }

        return {
          ...prev,
          coins: nextCoins,
          lifetimeCoins: nextLifetimeCoins,
          rebirthPoints: nextRp,
          lifetimeRebirthPoints: nextLifetimeRp,
          prestigePoints: finalPp,
          lifetimePrestigePoints: nextLifetimePp,
          treePoints: finalTp,
          lifetimeTreePoints: nextLifetimeTp,
          singularityEssence: finalEssence,
          lifetimeSingularityEssence: nextLifetimeEssence,
          timeTokens: finalTokens,
          timeFlipChanceLevel: nextTimeFlipLv,
          timeTokenBoostLevel: nextTimeTokenBoostLv,
          timeAutoSingularityUnlocked: nextTimeAutoSing,
          idleXpSpent: nextIdleXpSpent,
          ideal: nextIdeal,
          buildings: nextBuildings,
          upgradeTracks: nextTracks,
          sectionWaves: nextSectionWaves,
          rebirthPerks: nextRebirthPerks,
          lastRebirthPerkCost: nextLastRebirthPerkCost,
          ascendedRebirthPerks: nextAscendedRebirthPerks,
          prestigeUpgrades: nextPrestigeUpgrades,
          skillNodes: nextSkillNodes,
          singularityUpgrades: nextSingularityUpgrades,
          essenceConvergenceUnlocked: nextEssenceConvergenceUnlocked,
          essenceConvergenceUpgrades: nextEssenceConvergenceUpgrades,
          billionEssenceUnlocked: nextBillionEssenceUnlocked,
          billionEssenceUpgrades: nextBillionEssenceUpgrades,
          clickerLevel: nextClickerLevel,
          completedUpgradeCount: nextCompletedUpgrades,
          completedPerkTiersCount: nextCompletedPerkTiers
        };
      });
    }, 250);

    return () => window.clearInterval(interval);
  }, []);

  const createSaveState = useCallback((customName?: string, isAutoBackup = false): SaveStateEntry => {
    const snap = JSON.parse(JSON.stringify(stateRef.current)) as GameState;
    const summary = `${formatNum(snap.coins, snap.notation)} Coins · R${snap.rebirthLevel} · P${snap.prestigeLevel} · S${snap.singularityCount} · T${snap.timeResetCount}`;
    const entry: SaveStateEntry = {
      id: `save_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: customName?.trim() || (isAutoBackup ? 'Pre-Admin Auto-Backup' : `Save Slot`),
      createdAt: Date.now(),
      isAutoBackup,
      summary,
      data: snap
    };
    setSaveStates((prev) => {
      const next = [entry, ...prev].slice(0, 30);
      persistSaveStatesList(next);
      return next;
    });
    return entry;
  }, []);

  const loadSaveState = useCallback((id: string): boolean => {
    const found = saveStates.find((s) => s.id === id);
    if (!found) return false;
    const normalized = normalizeState(found.data);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    } catch {
      // Ignore
    }
    setState(normalized);
    sounds.playLevelUp();
    return true;
  }, [saveStates]);

  const deleteSaveState = useCallback((id: string) => {
    setSaveStates((prev) => {
      const next = prev.filter((s) => s.id !== id);
      persistSaveStatesList(next);
      return next;
    });
  }, []);

  const handleManualClick = useCallback((): { amount: Decimal; isCrit: boolean } => {
    const s = statsRef.current;
    const isCrit = Math.random() < s.critChance;
    const amount = safeMul(s.coinsPerClick, isCrit ? s.critMultiplier : 1);
    sounds.playClick(isCrit);

    setState((prev) => ({
      ...prev,
      coins: prev.coins.add(amount),
      lifetimeCoins: prev.lifetimeCoins.add(amount),
      totalClicks: prev.totalClicks + 1
    }));

    return { amount, isCrit };
  }, []);

  const setSectionMultiBuy = useCallback((section: MultiBuySection, amount: MultiBuyAmount) => {
    setState((prev) => ({
      ...prev,
      multiBuyBySection: {
        ...prev.multiBuyBySection,
        [section]: amount
      }
    }));
  }, []);

  const toggleNotation = useCallback(() => {
    setState((prev) => ({
      ...prev,
      notation: prev.notation === 'standard' ? 'scientific' : 'standard'
    }));
  }, []);

  const toggleSound = useCallback(() => {
    setState((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  }, []);

  const toggleCodeClicker = useCallback(() => {
    setState((prev) => ({ ...prev, codeClickerEnabled: !prev.codeClickerEnabled }));
  }, []);

  const toggleAutomation = useCallback(
    (
      key:
        | 'autoBuyBuildings'
        | 'autoBuyUpgrades'
        | 'autoLevelClicker'
        | 'autoBuyRebirthUpgrades'
        | 'autoBuyPrestigeUpgrades'
        | 'autoBuySkillTree'
        | 'autoBuySingularityUpgrades'
        | 'autoBuyBillionEssence'
        | 'autoBuyTimeUpgrades'
        | 'autoBuyMax'
    ) => {
      setState((prev) => ({
        ...prev,
        automation: { ...prev.automation, [key]: !prev.automation[key] }
      }));
    },
    []
  );

  const toggleBuildingAutoBuy = useCallback((buildingId: string) => {
    setState((prev) => ({
      ...prev,
      automation: {
        ...prev.automation,
        buildingAutoBuyEnabled: {
          ...prev.automation.buildingAutoBuyEnabled,
          [buildingId]: !(prev.automation.buildingAutoBuyEnabled[buildingId] !== false)
        }
      }
    }));
  }, []);

  const setAllBuildingsAutoBuy = useCallback((enabled: boolean) => {
    setState((prev) => {
      const nextMap: Record<string, boolean> = {};
      for (const b of prev.buildings) nextMap[b.id] = enabled;
      return {
        ...prev,
        automation: { ...prev.automation, buildingAutoBuyEnabled: nextMap }
      };
    });
  }, []);

  const levelUpClicker = useCallback(() => {
    const s = statsRef.current;
    const info = s.clickerBuyInfo;
    if (!info.canAfford || info.count <= 0) return;

    const prevEvo = getClickerEvolution(stateRef.current.clickerLevel);
    const nextEvo = getClickerEvolution(stateRef.current.clickerLevel + info.count);
    if (nextEvo.minLevel > prevEvo.minLevel) sounds.playLevelUp();
    else sounds.playBuy();

    setState((prev) => ({
      ...prev,
      coins: prev.adminFreeMode ? prev.coins : Decimal.max(D_ZERO, prev.coins.sub(info.totalCost)),
      clickerLevel: prev.clickerLevel + info.count
    }));
  }, []);

  const buyBuilding = useCallback((buildingId: string) => {
    const s = statsRef.current;
    const free = stateRef.current.adminFreeMode;
    const b = stateRef.current.buildings.find((item) => item.id === buildingId);
    if (!b) return;
    const multi = stateRef.current.multiBuyBySection.buildings;
    const effScale = getEffectiveScale(b.scaleFactor, s.globalScaleReduction);
    const info = free
      ? { count: multi === -1 ? 25 : multi, totalCost: D_ZERO, canAfford: true }
      : calculateMultiBuy(
          stateRef.current.coins,
          b.baseCost,
          effScale,
          b.count,
          multi,
          250,
          s.buildingDiscountMult * s.hardCostMult
        );
    if (!info.canAfford || info.count <= 0) return;

    sounds.playBuy();
    setState((prev) => ({
      ...prev,
      coins: prev.adminFreeMode ? prev.coins : Decimal.max(D_ZERO, prev.coins.sub(info.totalCost)),
      buildings: prev.buildings.map((item) =>
        item.id === buildingId ? { ...item, count: item.count + info.count } : item
      )
    }));
  }, []);

  const buyUpgradeTrack = useCallback((trackId: string) => {
    const s = statsRef.current;
    const free = stateRef.current.adminFreeMode;
    const trk = stateRef.current.upgradeTracks.find((u) => u.id === trackId);
    if (!trk || trk.tier >= trk.maxTier) return;
    const multi = stateRef.current.multiBuyBySection.upgrades;
    const remaining = Math.max(0, trk.maxTier - trk.tier);
    const effScale = getEffectiveScale(trk.costScale, s.globalScaleReduction);
    const info = free
      ? { count: Math.min(remaining, multi === -1 ? 10 : multi), totalCost: D_ZERO, canAfford: remaining > 0 }
      : calculateMultiBuy(
          stateRef.current.coins,
          trk.baseCost,
          effScale,
          trk.tier - 1,
          multi,
          remaining,
          s.hardCostMult
        );
    if (!info.canAfford || info.count <= 0) return;

    sounds.playBuy();
    setState((prev) => ({
      ...prev,
      coins: prev.adminFreeMode ? prev.coins : Decimal.max(D_ZERO, prev.coins.sub(info.totalCost)),
      completedUpgradeCount: prev.completedUpgradeCount + info.count,
      upgradeTracks: prev.upgradeTracks.map((u) =>
        u.id === trackId ? { ...u, tier: Math.min(u.maxTier, u.tier + info.count) } : u
      )
    }));
  }, []);

  const buyRebirthPerk = useCallback((perkId: string) => {
    const s = statsRef.current;
    setState((prev) => {
      const target = prev.rebirthPerks.find((p) => p.id === perkId);
      if (!target || isTieredItemMaxed(target)) return prev;
      const res = applyTieredPurchase(
        target,
        prev.rebirthPoints,
        prev.multiBuyBySection.rebirth,
        s.globalScaleReduction,
        prev.adminFreeMode,
        s.hardCostMult
      );
      if (res.bought <= 0) return prev;
      if (res.evolutions > 0) sounds.playLevelUp();
      else sounds.playBuy();
      return {
        ...prev,
        rebirthPoints: prev.adminFreeMode
          ? prev.rebirthPoints
          : Decimal.max(D_ZERO, prev.rebirthPoints.sub(res.spent)),
        lastRebirthPerkCost: res.lastStepCost.gt(0) ? res.lastStepCost : prev.lastRebirthPerkCost,
        completedPerkTiersCount: prev.completedPerkTiersCount + res.evolutions,
        rebirthPerks: prev.rebirthPerks.map((p) => (p.id === perkId ? res.updated : p))
      };
    });
  }, []);

  const buyAscendedRebirthPerk = useCallback((perkId: string) => {
    const s = statsRef.current;
    if (!s.allBaseRebirthPerksMaxed && !stateRef.current.adminUnlocked) return;
    setState((prev) => {
      const target = prev.ascendedRebirthPerks.find((p) => p.id === perkId);
      if (!target || isTieredItemMaxed(target)) return prev;
      const anchorCost = prev.lastRebirthPerkCost.gt(0)
        ? Decimal.max(1_000, prev.lastRebirthPerkCost)
        : Decimal.max(1_000, s.effectiveAscendedRebirthBaseCost);
      const seededTarget = target.baseCost.gt(0) ? target : { ...target, baseCost: anchorCost };
      const res = applyTieredPurchase(
        seededTarget,
        prev.rebirthPoints,
        prev.multiBuyBySection.rebirth,
        s.globalScaleReduction,
        prev.adminFreeMode,
        s.hardCostMult
      );
      if (res.bought <= 0) return prev;
      if (res.evolutions > 0) sounds.playLevelUp();
      else sounds.playBuy();
      return {
        ...prev,
        rebirthPoints: prev.adminFreeMode
          ? prev.rebirthPoints
          : Decimal.max(D_ZERO, prev.rebirthPoints.sub(res.spent)),
        completedPerkTiersCount: prev.completedPerkTiersCount + res.evolutions,
        ascendedRebirthPerks: prev.ascendedRebirthPerks.map((p) => (p.id === perkId ? res.updated : p))
      };
    });
  }, []);

  const buyPrestigeUpgrade = useCallback((upgradeId: string) => {
    const s = statsRef.current;
    setState((prev) => {
      const target = prev.prestigeUpgrades.find((p) => p.id === upgradeId);
      if (!target || isTieredItemMaxed(target)) return prev;
      const res = applyTieredPurchase(
        target,
        prev.prestigePoints,
        prev.multiBuyBySection.prestige,
        s.globalScaleReduction,
        prev.adminFreeMode,
        s.hardCostMult
      );
      if (res.bought <= 0) return prev;
      if (res.evolutions > 0) sounds.playLevelUp();
      else sounds.playBuy();
      return {
        ...prev,
        prestigePoints: prev.adminFreeMode
          ? prev.prestigePoints
          : Decimal.max(D_ZERO, prev.prestigePoints.sub(res.spent)),
        completedPerkTiersCount: prev.completedPerkTiersCount + res.evolutions,
        prestigeUpgrades: prev.prestigeUpgrades.map((p) => (p.id === upgradeId ? res.updated : p))
      };
    });
  }, []);

  const isSkillNodeUnlocked = useCallback((node: SkillNode, allNodes: SkillNode[], adminMode = false): boolean => {
    if (adminMode) return true;
    if (node.requires.length === 0) return true;
    return node.requires.every((reqId) => {
      const parent = allNodes.find((n) => n.id === reqId);
      return parent ? parent.totalLevels > 0 : false;
    });
  }, []);

  const buySkillNode = useCallback(
    (nodeId: string) => {
      const s = statsRef.current;
      setState((prev) => {
        const target = prev.skillNodes.find((n) => n.id === nodeId);
        if (
          !target ||
          isTieredItemMaxed(target) ||
          (target.id === 'sk_scale' && target.totalBonus.gte(60)) ||
          !isSkillNodeUnlocked(target, prev.skillNodes, prev.adminUnlocked)
        ) {
          return prev;
        }
        const remainingBonus = Math.max(0, 60 - target.totalBonus.toNumber());
        const stepBonus = Math.max(1, target.bonusPerLevel.toNumber());
        const effectiveMulti: MultiBuyAmount =
          target.id === 'sk_scale' && prev.multiBuyBySection.skillTree === -1
            ? (Math.max(1, Math.ceil(remainingBonus / stepBonus)) as MultiBuyAmount)
            : prev.multiBuyBySection.skillTree;
        const res = applyTieredPurchase(
          target,
          prev.treePoints,
          target.id === 'sk_scale'
            ? prev.multiBuyBySection.skillTree === -1
              ? -1
              : effectiveMulti
            : prev.multiBuyBySection.skillTree,
          s.globalScaleReduction,
          prev.adminFreeMode,
          s.hardCostMult
        );
        if (res.bought <= 0) return prev;
        if (target.id === 'sk_scale' && res.updated.totalBonus.gt(60)) {
          res.updated.totalBonus = toDec(60);
        }
        if (res.evolutions > 0) sounds.playLevelUp();
        else sounds.playBuy();
        return {
          ...prev,
          treePoints: prev.adminFreeMode ? prev.treePoints : Decimal.max(D_ZERO, prev.treePoints.sub(res.spent)),
          completedPerkTiersCount: prev.completedPerkTiersCount + res.evolutions,
          skillNodes: prev.skillNodes.map((n) => (n.id === nodeId ? res.updated : n))
        };
      });
    },
    [isSkillNodeUnlocked]
  );

  const levelUpSingularityCore = useCallback(() => {
    const s = statsRef.current;
    const info = s.singularityCoreBuyInfo;
    if (!info.canAfford || info.count <= 0) return;
    if (stateRef.current.singularityCoreLevel >= SINGULARITY_CORE_MAX_LEVEL) return;

    sounds.playLevelUp();
    setState((prev) => ({
      ...prev,
      singularityEssence: prev.adminFreeMode
        ? prev.singularityEssence
        : Decimal.max(D_ZERO, prev.singularityEssence.sub(info.totalCost)),
      singularityCoreLevel: Math.min(SINGULARITY_CORE_MAX_LEVEL, prev.singularityCoreLevel + info.count)
    }));
  }, []);

  const buySingularityUpgrade = useCallback((upgradeId: string) => {
    const s = statsRef.current;
    setState((prev) => {
      const target = prev.singularityUpgrades.find((u) => u.id === upgradeId);
      if (!target || isTieredItemMaxed(target)) return prev;
      const res = applyTieredPurchase(
        target,
        prev.singularityEssence,
        prev.multiBuyBySection.singularity,
        s.globalScaleReduction,
        prev.adminFreeMode,
        s.hardCostMult
      );
      if (res.bought <= 0) return prev;
      if (res.evolutions > 0) sounds.playLevelUp();
      else sounds.playBuy();
      return {
        ...prev,
        singularityEssence: prev.adminFreeMode
          ? prev.singularityEssence
          : Decimal.max(D_ZERO, prev.singularityEssence.sub(res.spent)),
        completedPerkTiersCount: prev.completedPerkTiersCount + res.evolutions,
        singularityUpgrades: prev.singularityUpgrades.map((u) => (u.id === upgradeId ? res.updated : u))
      };
    });
  }, []);

  const buyEssenceReactor = useCallback(() => {
    const s = statsRef.current;
    if (!s.reactorUnlocked || !s.reactorBuyInfo.canAfford || s.reactorBuyInfo.count <= 0) return;
    sounds.playLevelUp();
    setState((prev) => ({
      ...prev,
      singularityEssence: prev.adminFreeMode
        ? prev.singularityEssence
        : Decimal.max(D_ZERO, prev.singularityEssence.sub(s.reactorBuyInfo.totalCost)),
      essenceReactorLevel: Math.min(ESSENCE_REACTOR_MAX_LEVEL, prev.essenceReactorLevel + s.reactorBuyInfo.count)
    }));
  }, []);

  const buyEssenceConvergenceUpgrade = useCallback((upgradeId: string, multiOverride?: MultiBuyAmount) => {
    const s = statsRef.current;
    if (!s.essenceConvergenceOpen) return;
    setState((prev) => {
      const target = prev.essenceConvergenceUpgrades.find((u) => u.id === upgradeId);
      if (!target || isTieredItemMaxed(target)) return prev;

      const currencyBalance =
        target.currency === 'rebirthPoints'
          ? prev.rebirthPoints
          : target.currency === 'prestigePoints'
            ? prev.prestigePoints
            : target.currency === 'treePoints'
              ? prev.treePoints
              : prev.singularityEssence;

      const multi = multiOverride ?? prev.multiBuyBySection.singularity;
      const res = applyTieredPurchase(
        target,
        currencyBalance,
        multi,
        s.globalScaleReduction,
        prev.adminFreeMode,
        s.hardCostMult
      );
      if (res.bought <= 0) return prev;
      if (res.evolutions > 0) sounds.playLevelUp();
      else sounds.playBuy();

      return {
        ...prev,
        rebirthPoints:
          target.currency === 'rebirthPoints' && !prev.adminFreeMode
            ? Decimal.max(D_ZERO, prev.rebirthPoints.sub(res.spent))
            : prev.rebirthPoints,
        prestigePoints:
          target.currency === 'prestigePoints' && !prev.adminFreeMode
            ? Decimal.max(D_ZERO, prev.prestigePoints.sub(res.spent))
            : prev.prestigePoints,
        treePoints:
          target.currency === 'treePoints' && !prev.adminFreeMode
            ? Decimal.max(D_ZERO, prev.treePoints.sub(res.spent))
            : prev.treePoints,
        singularityEssence:
          target.currency === 'singularityEssence' && !prev.adminFreeMode
            ? Decimal.max(D_ZERO, prev.singularityEssence.sub(res.spent))
            : prev.singularityEssence,
        completedPerkTiersCount: prev.completedPerkTiersCount + res.evolutions,
        essenceConvergenceUpgrades: prev.essenceConvergenceUpgrades.map((u) =>
          u.id === upgradeId ? res.updated : u
        )
      };
    });
  }, []);

  const buyBillionEssenceUpgrade = useCallback((upgradeId: string) => {
    const s = statsRef.current;
    if (!s.billionEssenceOpen) return;
    setState((prev) => {
      const target = prev.billionEssenceUpgrades.find((u) => u.id === upgradeId);
      if (!target || isTieredItemMaxed(target)) return prev;
      const res = applyTieredPurchase(
        target,
        prev.singularityEssence,
        prev.multiBuyBySection.singularity,
        s.globalScaleReduction,
        prev.adminFreeMode,
        s.hardCostMult
      );
      if (res.bought <= 0) return prev;
      if (res.evolutions > 0) sounds.playLevelUp();
      else sounds.playBuy();
      return {
        ...prev,
        singularityEssence: prev.adminFreeMode
          ? prev.singularityEssence
          : Decimal.max(D_ZERO, prev.singularityEssence.sub(res.spent)),
        completedPerkTiersCount: prev.completedPerkTiersCount + res.evolutions,
        billionEssenceUpgrades: prev.billionEssenceUpgrades.map((u) =>
          u.id === upgradeId ? res.updated : u
        )
      };
    });
  }, []);

  const buySectionWaveUpgrade = useCallback((tab: ActiveTab, upgradeId: string) => {
    const s = statsRef.current;
    setState((prev) => {
      const waveState = prev.sectionWaves?.[tab];
      if (!waveState) return prev;
      const target = waveState.upgrades.find((u) => u.id === upgradeId);
      if (!target || isTieredItemMaxed(target)) return prev;

      const liveTotalIdleXp =
        tab === 'ideal'
          ? IDEAL_COLORS.reduce(
              (sum, col) => sum.add(prev.ideal.tracks?.[col.id]?.totalXp ?? D_ZERO),
              D_ZERO
            )
          : D_ZERO;
      const availIdleXp = Decimal.max(D_ZERO, liveTotalIdleXp.sub(prev.idleXpSpent));

      const currencyBalance =
        tab === 'buildings' || tab === 'upgrades'
          ? prev.coins
          : tab === 'rebirth'
            ? prev.rebirthPoints
            : tab === 'prestige'
              ? prev.prestigePoints
              : tab === 'skillTree'
                ? prev.treePoints
                : tab === 'singularity'
                  ? prev.singularityEssence
                  : tab === 'timeReset'
                    ? prev.timeTokens
                    : availIdleXp;

      const multi = tab === 'ideal' ? prev.multiBuyBySection.timeReset : prev.multiBuyBySection[tab];
      const res = applyTieredPurchase(
        target,
        currencyBalance,
        multi,
        s.globalScaleReduction,
        prev.adminFreeMode,
        s.hardCostMult
      );
      if (res.bought <= 0) return prev;

      const updatedList = waveState.upgrades.map((u) => (u.id === upgradeId ? res.updated : u));
      const nextWaveState = advanceSectionWaveIfComplete(
        { ...waveState, upgrades: updatedList },
        tab,
        res.lastStepCost
      );

      if (res.evolutions > 0 || nextWaveState.wave > waveState.wave) {
        sounds.playLevelUp();
      } else {
        sounds.playBuy();
      }

      const free = prev.adminFreeMode;
      return {
        ...prev,
        coins:
          !free && (tab === 'buildings' || tab === 'upgrades')
            ? Decimal.max(D_ZERO, prev.coins.sub(res.spent))
            : prev.coins,
        rebirthPoints:
          !free && tab === 'rebirth' ? Decimal.max(D_ZERO, prev.rebirthPoints.sub(res.spent)) : prev.rebirthPoints,
        prestigePoints:
          !free && tab === 'prestige'
            ? Decimal.max(D_ZERO, prev.prestigePoints.sub(res.spent))
            : prev.prestigePoints,
        treePoints:
          !free && tab === 'skillTree' ? Decimal.max(D_ZERO, prev.treePoints.sub(res.spent)) : prev.treePoints,
        singularityEssence:
          !free && tab === 'singularity'
            ? Decimal.max(D_ZERO, prev.singularityEssence.sub(res.spent))
            : prev.singularityEssence,
        timeTokens:
          !free && tab === 'timeReset' ? Decimal.max(D_ZERO, prev.timeTokens.sub(res.spent)) : prev.timeTokens,
        idleXpSpent:
          !free && tab === 'ideal' ? prev.idleXpSpent.add(res.spent) : prev.idleXpSpent,
        completedPerkTiersCount: prev.completedPerkTiersCount + res.evolutions,
        sectionWaves: {
          ...prev.sectionWaves,
          [tab]: nextWaveState
        }
      };
    });
  }, []);

  const triggerRebirth = useCallback(() => {
    const s = statsRef.current;
    if (!s.rebirthBuyInfo.canAfford || s.rebirthBuyInfo.count <= 0) return;

    const shouldShowPopup = !stateRef.current.firstRebirthPopupShown;
    sounds.playRebirth();
    setState((prev) => {
      const keptCoins = prev.coins.mul(s.retainedCoinPct).floor().add(s.startingTreasury);
      return {
        ...prev,
        coins: keptCoins,
        clickerLevel: 1,
        rebirthLevel: prev.rebirthLevel + s.rebirthBuyInfo.count,
        rebirthPoints: prev.rebirthPoints.add(s.projectedRebirthRpGain),
        lifetimeRebirthPoints: prev.lifetimeRebirthPoints.add(s.projectedRebirthRpGain),
        buildings: INITIAL_BUILDINGS.map((b) => ({ ...b })),
        upgradeTracks: INITIAL_UPGRADE_TRACKS.map((u) => ({ ...u })),
        sectionWaves: {
          ...prev.sectionWaves,
          buildings: createInitialSectionWaveForTab('buildings'),
          upgrades: createInitialSectionWaveForTab('upgrades')
        },
        achievements: {
          ...prev.achievements,
          firstRebirth: true
        },
        firstRebirthPopupShown: true
      };
    });
    if (shouldShowPopup) {
      setFirstRebirthPopupOpen(true);
    }
  }, []);

  const triggerPrestige = useCallback(() => {
    const s = statsRef.current;
    if (!s.prestigeBuyInfo.canAfford || s.prestigeBuyInfo.count <= 0) return;

    sounds.playPrestige();
    setState((prev) => ({
      ...prev,
      coins: s.startingTreasury,
      clickerLevel: 1,
      rebirthLevel: Math.min(prev.rebirthLevel, s.keptRebirthLevels),
      rebirthPoints: D_ZERO,
      rebirthPerks: INITIAL_REBIRTH_PERKS.map((p) => ({ ...p })),
      lastRebirthPerkCost: D_ZERO,
      ascendedRebirthPerks: INITIAL_ASCENDED_REBIRTH_PERKS.map((p) => ({ ...p })),
      prestigeLevel: prev.prestigeLevel + s.prestigeBuyInfo.count,
      prestigePoints: prev.prestigePoints.add(s.projectedPrestigePointsGain),
      lifetimePrestigePoints: prev.lifetimePrestigePoints.add(s.projectedPrestigePointsGain),
      buildings: INITIAL_BUILDINGS.map((b) => ({ ...b })),
      upgradeTracks: INITIAL_UPGRADE_TRACKS.map((u) => ({ ...u })),
      sectionWaves: {
        ...prev.sectionWaves,
        buildings: createInitialSectionWaveForTab('buildings'),
        upgrades: createInitialSectionWaveForTab('upgrades'),
        rebirth: createInitialSectionWaveForTab('rebirth')
      },
      achievements: {
        ...prev.achievements,
        firstPrestige: true
      }
    }));
  }, []);

  const triggerTreeReset = useCallback(() => {
    const s = statsRef.current;
    if (!s.treeBuyInfo.canAfford || s.treeBuyInfo.count <= 0) return;

    sounds.playPrestige();
    setState((prev) => ({
      ...prev,
      coins: D_ZERO,
      clickerLevel: 1,
      rebirthLevel: 0,
      rebirthPoints: D_ZERO,
      rebirthPerks: INITIAL_REBIRTH_PERKS.map((p) => ({ ...p })),
      lastRebirthPerkCost: D_ZERO,
      ascendedRebirthPerks: INITIAL_ASCENDED_REBIRTH_PERKS.map((p) => ({ ...p })),
      prestigeLevel: 0,
      prestigePoints: D_ZERO,
      prestigeUpgrades: INITIAL_PRESTIGE_UPGRADES.map((p) => ({ ...p })),
      treeResetCount: prev.treeResetCount + s.treeBuyInfo.count,
      treePoints: prev.treePoints.add(s.projectedTreePointsGain),
      lifetimeTreePoints: prev.lifetimeTreePoints.add(s.projectedTreePointsGain),
      buildings: INITIAL_BUILDINGS.map((b) => ({ ...b })),
      upgradeTracks: INITIAL_UPGRADE_TRACKS.map((u) => ({ ...u })),
      sectionWaves: {
        ...prev.sectionWaves,
        buildings: createInitialSectionWaveForTab('buildings'),
        upgrades: createInitialSectionWaveForTab('upgrades'),
        rebirth: createInitialSectionWaveForTab('rebirth'),
        prestige: createInitialSectionWaveForTab('prestige')
      },
      achievements: {
        ...prev.achievements,
        firstSkillTree: true
      }
    }));
  }, []);

  // Singularity Reset: ONLY 1 at a time, grants +1 Essence per Singularity count!
  const triggerSingularity = useCallback(() => {
    const s = statsRef.current;
    if (!s.canSingularity) return;

    sounds.playSingularity();
    setState((prev) => ({
      ...prev,
      coins: D_ZERO,
      clickerLevel: 1,
      rebirthLevel: 0,
      rebirthPoints: s.primordialStartRp,
      rebirthPerks: INITIAL_REBIRTH_PERKS.map((p) => ({ ...p })),
      lastRebirthPerkCost: D_ZERO,
      ascendedRebirthPerks: INITIAL_ASCENDED_REBIRTH_PERKS.map((p) => ({ ...p })),
      prestigeLevel: 0,
      prestigePoints: D_ZERO,
      prestigeUpgrades: INITIAL_PRESTIGE_UPGRADES.map((p) => ({ ...p })),
      treeResetCount: 0,
      treePoints: D_ZERO,
      skillNodes: INITIAL_SKILL_NODES.map((n) => ({ ...n, requires: [...n.requires] })),
      buildings: INITIAL_BUILDINGS.map((b) => ({ ...b })),
      upgradeTracks: INITIAL_UPGRADE_TRACKS.map((u) => ({ ...u })),
      sectionWaves: {
        ...prev.sectionWaves,
        buildings: createInitialSectionWaveForTab('buildings'),
        upgrades: createInitialSectionWaveForTab('upgrades'),
        rebirth: createInitialSectionWaveForTab('rebirth'),
        prestige: createInitialSectionWaveForTab('prestige'),
        skillTree: createInitialSectionWaveForTab('skillTree')
      },
      singularityCount: prev.singularityCount + 1,
      singularityEssence: prev.singularityEssence.add(s.projectedEssenceGain),
      lifetimeSingularityEssence: prev.lifetimeSingularityEssence.add(s.projectedEssenceGain)
    }));
  }, []);

  // Time Reset with Optional Coin Flip Gamble
  const triggerTimeReset = useCallback((gambleFlip: boolean): { won: boolean; awarded: Decimal } => {
    const s = statsRef.current;
    if (!s.canTimeReset) return { won: false, awarded: D_ZERO };

    const baseTokens = s.projectedTimeTokens;
    let won = true;
    let awarded = baseTokens;
    if (gambleFlip) {
      won = Math.random() < s.timeFlipWinChance;
      awarded = won ? baseTokens.mul(2) : D_ZERO;
    }

    sounds.playSingularity();
    setState((prev) => ({
      ...prev,
      coins: D_ZERO,
      clickerLevel: 1,
      rebirthLevel: 0,
      rebirthPoints: D_ZERO,
      rebirthPerks: INITIAL_REBIRTH_PERKS.map((p) => ({ ...p })),
      lastRebirthPerkCost: D_ZERO,
      ascendedRebirthPerks: INITIAL_ASCENDED_REBIRTH_PERKS.map((p) => ({ ...p })),
      prestigeLevel: 0,
      prestigePoints: D_ZERO,
      prestigeUpgrades: INITIAL_PRESTIGE_UPGRADES.map((p) => ({ ...p })),
      treeResetCount: 0,
      treePoints: D_ZERO,
      skillNodes: INITIAL_SKILL_NODES.map((n) => ({ ...n, requires: [...n.requires] })),
      singularityCount: 0,
      singularityCoreLevel: 0,
      singularityEssence: D_ZERO,
      singularityUpgrades: INITIAL_SINGULARITY_UPGRADES.map((u) => ({ ...u })),
      essenceReactorLevel: 0,
      essenceConvergenceUnlocked: false,
      essenceConvergenceUpgrades: INITIAL_ESSENCE_CONVERGENCE_UPGRADES.map((u) => ({ ...u })),
      billionEssenceUnlocked: false,
      billionEssenceUpgrades: INITIAL_BILLION_ESSENCE_UPGRADES.map((u) => ({ ...u })),
      buildings: INITIAL_BUILDINGS.map((b) => ({ ...b })),
      upgradeTracks: INITIAL_UPGRADE_TRACKS.map((u) => ({ ...u })),
      sectionWaves: {
        ...prev.sectionWaves,
        buildings: createInitialSectionWaveForTab('buildings'),
        upgrades: createInitialSectionWaveForTab('upgrades'),
        rebirth: createInitialSectionWaveForTab('rebirth'),
        prestige: createInitialSectionWaveForTab('prestige'),
        skillTree: createInitialSectionWaveForTab('skillTree'),
        singularity: createInitialSectionWaveForTab('singularity')
      },
      timeResetCount: prev.timeResetCount + 1,
      timeTokens: prev.timeTokens.add(awarded),
      lifetimeTimeTokens: prev.lifetimeTimeTokens.add(awarded)
    }));

    return { won, awarded };
  }, []);

  const buyTimeFlipUpgrade = useCallback(() => {
    const s = statsRef.current;
    if (!s.timeFlipBuyInfo.canAfford || s.timeFlipBuyInfo.count <= 0) return;
    if (stateRef.current.timeFlipChanceLevel >= TIME_FLIP_MAX_LEVEL) return;
    sounds.playBuy();
    setState((prev) => ({
      ...prev,
      timeTokens: prev.adminFreeMode
        ? prev.timeTokens
        : Decimal.max(D_ZERO, prev.timeTokens.sub(s.timeFlipBuyInfo.totalCost)),
      timeFlipChanceLevel: Math.min(TIME_FLIP_MAX_LEVEL, prev.timeFlipChanceLevel + s.timeFlipBuyInfo.count)
    }));
  }, []);

  const buyTimeTokenBoostUpgrade = useCallback(() => {
    const s = statsRef.current;
    if (!s.timeTokenBoostBuyInfo.canAfford || s.timeTokenBoostBuyInfo.count <= 0) return;
    if (stateRef.current.timeTokenBoostLevel >= TIME_TOKEN_BOOST_MAX_LEVEL) return;
    sounds.playBuy();
    setState((prev) => ({
      ...prev,
      timeTokens: prev.adminFreeMode
        ? prev.timeTokens
        : Decimal.max(D_ZERO, prev.timeTokens.sub(s.timeTokenBoostBuyInfo.totalCost)),
      timeTokenBoostLevel: Math.min(
        TIME_TOKEN_BOOST_MAX_LEVEL,
        prev.timeTokenBoostLevel + s.timeTokenBoostBuyInfo.count
      )
    }));
  }, []);

  const buyTimeAutoSingularity = useCallback(() => {
    const s = statsRef.current;
    if (!s.canBuyTimeAutoSingularity) return;
    sounds.playLevelUp();
    setState((prev) => ({
      ...prev,
      timeTokens: prev.adminFreeMode
        ? prev.timeTokens
        : Decimal.max(D_ZERO, prev.timeTokens.sub(s.timeAutoSingularityCost)),
      timeAutoSingularityUnlocked: true
    }));
  }, []);

  const unlockIdealTab = useCallback(() => {
    const s = statsRef.current;
    if (!s.canUnlockIdealTab) return;
    sounds.playSingularity();
    setState((prev) => ({
      ...prev,
      timeTokens: prev.adminFreeMode
        ? prev.timeTokens
        : Decimal.max(D_ZERO, prev.timeTokens.sub(s.idealTabCost)),
      idealTabUnlocked: true
    }));
  }, []);

  const buyTimeAutoUpgrades = useCallback(() => {
    const s = statsRef.current;
    if (!s.canBuyTimeAutoUpgrades) return;
    sounds.playLevelUp();
    setState((prev) => ({
      ...prev,
      idleXpSpent: prev.adminFreeMode ? prev.idleXpSpent : prev.idleXpSpent.add(s.idleAutoTimeCost),
      timeAutoTokenUpgradesUnlocked: true
    }));
  }, []);

  // Unified Code Redeemer ("HARD", "clicker", "bobdabuilder")
  const redeemCode = useCallback(
    (rawCode: string): { ok: boolean; type?: 'hard' | 'clicker' | 'admin'; message: string } => {
      const normalized = rawCode.trim();
      const lower = normalized.toLowerCase();

      if (normalized.toUpperCase() === 'HARD') {
        sounds.playLevelUp();
        if (stateRef.current.hardMode) {
          return { ok: true, type: 'hard', message: 'HARD Mode (10x prices) is already active!' };
        }
        setState((prev) => ({ ...prev, hardMode: true }));
        return {
          ok: true,
          type: 'hard',
          message: 'HARD Mode enabled! Everything is now 10x more expensive.'
        };
      }

      if (lower === 'clicker') {
        sounds.playLevelUp();
        setState((prev) => ({
          ...prev,
          codeClickerUnlocked: true,
          codeClickerEnabled: true
        }));
        return {
          ok: true,
          type: 'clicker',
          message: 'Auto-Clicker unlocked! (+100 Auto-Clicks/sec active)'
        };
      }

      if (lower === 'bobdabuilder') {
        if (!stateRef.current.adminUnlocked) {
          createSaveState('Pre-Admin Backup', true);
        }
        sounds.playLevelUp();
        setState((prev) => ({
          ...prev,
          adminUnlocked: true,
          adminFreeMode: true
        }));
        return {
          ok: true,
          type: 'admin',
          message: 'Admin Panel unlocked! Pre-Admin Save State backed up automatically.'
        };
      }

      return { ok: false, message: 'Invalid code.' };
    },
    [createSaveState]
  );

  const unlockAdminWithCode = useCallback(
    (code: string): boolean => {
      if (code.trim().toLowerCase() === 'bobdabuilder') {
        if (!stateRef.current.adminUnlocked) {
          createSaveState('Pre-Admin Backup', true);
        }
        sounds.playLevelUp();
        setState((prev) => ({
          ...prev,
          adminUnlocked: true,
          adminFreeMode: true
        }));
        return true;
      }
      return false;
    },
    [createSaveState]
  );

  const toggleAdminFreeMode = useCallback(() => {
    setState((prev) => ({ ...prev, adminFreeMode: !prev.adminFreeMode }));
  }, []);

  const adminGrantResources = useCallback(() => {
    sounds.playLevelUp();
    setState((prev) => {
      const nextCoins = prev.coins.add(1e35);
      const nextRp = prev.rebirthPoints.add(1e15);
      const nextPp = prev.prestigePoints.add(1e15);
      const nextTp = prev.treePoints.add(1e15);
      const nextEssence = prev.singularityEssence.add(1e9);
      const nextTokens = prev.timeTokens.add(2_000_000);
      return {
        ...prev,
        coins: nextCoins,
        lifetimeCoins: Decimal.max(prev.lifetimeCoins, nextCoins),
        rebirthPoints: nextRp,
        lifetimeRebirthPoints: Decimal.max(prev.lifetimeRebirthPoints, nextRp),
        prestigePoints: nextPp,
        lifetimePrestigePoints: Decimal.max(prev.lifetimePrestigePoints, nextPp),
        treePoints: nextTp,
        lifetimeTreePoints: Decimal.max(prev.lifetimeTreePoints, nextTp),
        singularityEssence: nextEssence,
        lifetimeSingularityEssence: Decimal.max(prev.lifetimeSingularityEssence, nextEssence),
        timeTokens: nextTokens,
        lifetimeTimeTokens: Decimal.max(prev.lifetimeTimeTokens, nextTokens)
      };
    });
  }, []);

  const exitAdminMode = useCallback(() => {
    setState((prev) => ({ ...prev, adminUnlocked: false, adminFreeMode: false }));
  }, []);

  const hardReset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState(createInitialState());
  }, []);

  return {
    state,
    stats,
    saveStates,
    firstRebirthPopupOpen,
    dismissFirstRebirthPopup: () => setFirstRebirthPopupOpen(false),
    createSaveState,
    loadSaveState,
    deleteSaveState,
    redeemCode,
    handleManualClick,
    setSectionMultiBuy,
    toggleNotation,
    toggleSound,
    toggleCodeClicker,
    toggleAutomation,
    toggleBuildingAutoBuy,
    setAllBuildingsAutoBuy,
    levelUpClicker,
    buyBuilding,
    buyUpgradeTrack,
    buyRebirthPerk,
    buyAscendedRebirthPerk,
    buyPrestigeUpgrade,
    buySkillNode,
    isSkillNodeUnlocked,
    levelUpSingularityCore,
    buySingularityUpgrade,
    buyEssenceReactor,
    buyEssenceConvergenceUpgrade,
    buyBillionEssenceUpgrade,
    buySectionWaveUpgrade,
    triggerRebirth,
    triggerPrestige,
    triggerTreeReset,
    triggerSingularity,
    triggerTimeReset,
    buyTimeFlipUpgrade,
    buyTimeTokenBoostUpgrade,
    buyTimeAutoSingularity,
    unlockIdealTab,
    buyTimeAutoUpgrades,
    unlockAdminWithCode,
    toggleAdminFreeMode,
    adminGrantResources,
    exitAdminMode,
    hardReset
  };
}
