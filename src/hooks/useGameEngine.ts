import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  ActiveTab,
  GameState,
  IdealColor,
  IdealState,
  MultiBuyAmount,
  MultiBuySection,
  SaveStateEntry,
  SkillNode,
  SingularityUpgrade,
  TieredPerk
} from '../types/game';
import {
  BASE_BOOST_CAP,
  CLICKER_BASE_COST,
  CLICKER_COST_SCALE,
  ESSENCE_REACTOR_BASE_COST,
  ESSENCE_REACTOR_COST_SCALE,
  ESSENCE_REACTOR_MAX_LEVEL,
  IDEAL_BASE_XP,
  IDEAL_COLORS,
  IDEAL_SQUARES_PER_COLOR,
  IDEAL_TAB_COST,
  IDEAL_XP_GROWTH,
  INITIAL_BUILDINGS,
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
  UPGRADE_MAX_TIER,
  getClickerEvolution,
  getNextClickerEvolution
} from '../utils/gameData';
import {
  FLOAT_SAFE_MAX,
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
  safePow
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

function createInitialIdealState(): IdealState {
  return {
    colorIndex: 0,
    xp: 0,
    xpNeeded: IDEAL_BASE_XP,
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
    }
  };
}

function createInitialState(): GameState {
  return {
    version: 7,
    coins: 0,
    lifetimeCoins: 0,
    totalClicks: 0,
    clickerLevel: 1,
    rebirthLevel: 0,
    rebirthPoints: 0,
    lifetimeRebirthPoints: 0,
    rebirthPerks: INITIAL_REBIRTH_PERKS.map((p) => ({ ...p })),
    prestigeLevel: 0,
    prestigePoints: 0,
    lifetimePrestigePoints: 0,
    prestigeUpgrades: INITIAL_PRESTIGE_UPGRADES.map((p) => ({ ...p })),
    treeResetCount: 0,
    treePoints: 0,
    lifetimeTreePoints: 0,
    skillNodes: INITIAL_SKILL_NODES.map((s) => ({ ...s, requires: [...s.requires] })),
    singularityCount: 0,
    singularityCoreLevel: 0,
    singularityEssence: 0,
    lifetimeSingularityEssence: 0,
    singularityUpgrades: INITIAL_SINGULARITY_UPGRADES.map((u) => ({ ...u })),
    essenceReactorLevel: 0,
    timeResetCount: 0,
    timeTokens: 0,
    lifetimeTimeTokens: 0,
    timeFlipChanceLevel: 0,
    timeTokenBoostLevel: 0,
    timeAutoSingularityUnlocked: false,
    idealTabUnlocked: false,
    ideal: createInitialIdealState(),
    buildings: INITIAL_BUILDINGS.map((b) => ({ ...b })),
    upgradeTracks: INITIAL_UPGRADE_TRACKS.map((u) => ({ ...u })),
    completedUpgradeCount: 0,
    completedPerkTiersCount: 0,
    automation: {
      autoBuyBuildings: true,
      autoBuyUpgrades: true,
      autoLevelClicker: true,
      autoBuyRebirthUpgrades: true,
      autoBuyPrestigeUpgrades: true,
      autoBuySingularityUpgrades: true,
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
    const defaultMaxTier = (def as unknown as { maxTier?: number }).maxTier ?? LAYER_PERK_MAX_TIER;
    const savedTier = (existing as unknown as { tier?: number }).tier ?? 1;
    return {
      ...def,
      ...existing,
      maxTier: defaultMaxTier,
      tier: Math.min(defaultMaxTier, Math.max(1, savedTier))
    } as T;
  });
}

function normalizeState(parsed: Partial<GameState>): GameState {
  const def = createInitialState();
  const rebirthLevel = Math.max(0, parsed.rebirthLevel ?? 0);
  const prestigeLevel = Math.max(0, parsed.prestigeLevel ?? 0);
  const treeResetCount = Math.max(0, parsed.treeResetCount ?? 0);

  return {
    ...def,
    ...parsed,
    coins: safeNum(parsed.coins ?? 0),
    lifetimeCoins: safeNum(parsed.lifetimeCoins ?? 0),
    rebirthLevel,
    rebirthPoints: safeNum(parsed.rebirthPoints ?? 0),
    lifetimeRebirthPoints: safeNum(parsed.lifetimeRebirthPoints ?? 0),
    prestigeLevel,
    prestigePoints: safeNum(parsed.prestigePoints ?? 0),
    lifetimePrestigePoints: safeNum(parsed.lifetimePrestigePoints ?? 0),
    treeResetCount,
    treePoints: safeNum(parsed.treePoints ?? 0),
    lifetimeTreePoints: safeNum(parsed.lifetimeTreePoints ?? 0),
    singularityCoreLevel: Math.min(
      SINGULARITY_CORE_MAX_LEVEL,
      Math.max(0, parsed.singularityCoreLevel ?? 0)
    ),
    singularityEssence: safeNum(parsed.singularityEssence ?? 0),
    lifetimeSingularityEssence: safeNum(parsed.lifetimeSingularityEssence ?? 0),
    timeTokens: safeNum(parsed.timeTokens ?? 0),
    lifetimeTimeTokens: safeNum(parsed.lifetimeTimeTokens ?? 0),
    timeFlipChanceLevel: Math.min(
      TIME_FLIP_MAX_LEVEL,
      Math.max(0, parsed.timeFlipChanceLevel ?? 0)
    ),
    timeTokenBoostLevel: Math.min(
      TIME_TOKEN_BOOST_MAX_LEVEL,
      Math.max(0, parsed.timeTokenBoostLevel ?? 0)
    ),
    timeAutoSingularityUnlocked: Boolean(parsed.timeAutoSingularityUnlocked),
    idealTabUnlocked: Boolean(parsed.idealTabUnlocked),
    ideal: {
      ...def.ideal,
      ...(parsed.ideal ?? {}),
      squares: {
        ...def.ideal.squares,
        ...(parsed.ideal?.squares ?? {})
      }
    },
    buildings: mergeById(def.buildings, parsed.buildings),
    upgradeTracks: mergeById(def.upgradeTracks, parsed.upgradeTracks).map((u) => ({
      ...u,
      maxTier: UPGRADE_MAX_TIER,
      tier: Math.min(UPGRADE_MAX_TIER, Math.max(1, u.tier))
    })),
    rebirthPerks: mergeById(def.rebirthPerks, parsed.rebirthPerks),
    prestigeUpgrades: mergeById(def.prestigeUpgrades, parsed.prestigeUpgrades),
    skillNodes: mergeById(def.skillNodes, parsed.skillNodes).map((s) => ({
      ...s,
      requires: def.skillNodes.find((d) => d.id === s.id)?.requires ?? s.requires
    })),
    singularityUpgrades: mergeById(def.singularityUpgrades, parsed.singularityUpgrades),
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

export interface TieredBuyPreview {
  count: number;
  totalCost: number;
  canAfford: boolean;
  nextSingleCost: number;
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
  currency: number,
  multiBuy: MultiBuyAmount,
  scaleReduction: number,
  freeMode = false,
  costMult = 1
): TieredBuyPreview {
  if (isTieredItemMaxed(item)) {
    return {
      count: 0,
      totalCost: 0,
      canAfford: false,
      nextSingleCost: 0,
      effectiveScale: getEffectiveScale(item.costScale, scaleReduction),
      willEvolve: false,
      isMaxed: true
    };
  }

  let simTier = item.tier;
  let simLevel = item.level;
  let simBaseCost = item.baseCost;
  let simCostScale = item.costScale;
  let effectiveScale = getEffectiveScale(simCostScale, scaleReduction);
  const nextSingleCost = freeMode
    ? 0
    : getLevelCost(simBaseCost, effectiveScale, simLevel, costMult);

  const isMaxMode = multiBuy === -1;
  const maxSteps = isMaxMode ? (freeMode ? 10 : 100) : multiBuy;
  let totalCost = 0;
  let count = 0;
  let willEvolve = false;

  for (let i = 0; i < maxSteps; i++) {
    if (simTier >= item.maxTier && simLevel >= item.tierMaxLevel) break;

    effectiveScale = getEffectiveScale(simCostScale, scaleReduction);
    const stepCost = freeMode ? 0 : getLevelCost(simBaseCost, effectiveScale, simLevel, costMult);
    if (stepCost >= FLOAT_SAFE_MAX) break;

    if (isMaxMode && !freeMode) {
      if (currency >= totalCost + stepCost) {
        totalCost = safeNum(totalCost + stepCost);
        count++;
      } else {
        break;
      }
    } else {
      totalCost = safeNum(totalCost + stepCost);
      count++;
    }

    simLevel++;
    if (simLevel >= item.tierMaxLevel) {
      if (simTier < item.maxTier) {
        willEvolve = true;
        simBaseCost = safeNum(
          Math.ceil(safeMul(simBaseCost, safePow(effectiveScale, item.tierMaxLevel)) * 1.45)
        );
        simCostScale = Number((simCostScale + 0.08).toFixed(2));
        simTier++;
        simLevel = 0;
      } else {
        break;
      }
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
    totalCost: freeMode ? 0 : totalCost,
    canAfford: freeMode ? count > 0 : count > 0 && currency >= totalCost && totalCost < FLOAT_SAFE_MAX,
    nextSingleCost,
    effectiveScale: getEffectiveScale(item.costScale, scaleReduction),
    willEvolve,
    isMaxed: false
  };
}

function applyTieredPurchase<T extends TieredPerk | SkillNode | SingularityUpgrade>(
  item: T,
  currency: number,
  multiBuy: MultiBuyAmount,
  scaleReduction: number,
  freeMode = false,
  costMult = 1
): { updated: T; spent: number; bought: number; evolutions: number } {
  const sim = previewTieredPurchase(item, currency, multiBuy, scaleReduction, freeMode, costMult);
  if (sim.isMaxed || !sim.canAfford || sim.count <= 0) {
    return { updated: item, spent: 0, bought: 0, evolutions: 0 };
  }

  const nextItem = { ...item };
  let evolutions = 0;
  const isPrestigeUpg = nextItem.id.startsWith('pu_');
  const isSingularityUpg = nextItem.id.startsWith('su_');

  for (let i = 0; i < sim.count; i++) {
    if (nextItem.tier >= nextItem.maxTier && nextItem.level >= nextItem.tierMaxLevel) break;

    nextItem.level += 1;
    nextItem.totalLevels += 1;
    nextItem.totalBonus = safeNum(Number((nextItem.totalBonus + nextItem.bonusPerLevel).toFixed(6)));

    if (nextItem.level >= nextItem.tierMaxLevel && nextItem.tier < nextItem.maxTier) {
      const effScale = getEffectiveScale(nextItem.costScale, scaleReduction);
      if (isSingularityUpg) {
        nextItem.baseCost = safeNum(
          Math.ceil(safeMul(nextItem.baseCost, safePow(effScale, nextItem.tierMaxLevel)))
        );
      } else {
        nextItem.baseCost = safeNum(
          Math.ceil(safeMul(nextItem.baseCost, safePow(effScale, nextItem.tierMaxLevel)) * 1.45)
        );
        nextItem.costScale = Number((nextItem.costScale + 0.08).toFixed(2));
      }

      let bonusJump = 2;
      if (isPrestigeUpg) {
        if (nextItem.id === 'pu_crit' || nextItem.id === 'pu_memory') {
          bonusJump = nextItem.tier >= 4 ? 1.5 : 1.25;
        } else {
          bonusJump = nextItem.tier >= 4 ? 10 : 3;
        }
      } else if (nextItem.bonusUnit.includes('Exp')) {
        bonusJump = 1.25;
      }

      nextItem.bonusPerLevel = safeNum(Number((nextItem.bonusPerLevel * bonusJump).toFixed(4)));
      nextItem.tier += 1;
      nextItem.level = 0;
      evolutions += 1;
    }
  }

  return { updated: nextItem, spent: freeMode ? 0 : sim.totalCost, bought: sim.count, evolutions };
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
    const id = window.setInterval(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateRef.current));
      } catch {
        // Ignore storage errors
      }
    }, 2000);
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
    const getPrestigeUpg = (id: string) => state.prestigeUpgrades.find((p) => p.id === id);
    const getSkill = (id: string) => state.skillNodes.find((s) => s.id === id);
    const getSingUpg = (id: string) => state.singularityUpgrades.find((u) => u.id === id);

    // 0. Time Reset Multiplier (+1% per Time Token!) & Dynamic 100T * 10^timeResetCount Caps
    const timeTokenMult = safeNum(1 + state.timeTokens * 0.01);
    const boostCapCeiling = safeNum(safeMul(BASE_BOOST_CAP, safePow(10, state.timeResetCount)));

    // 1. Global Scale Reduction (Soft cap 40%, Hard cap 60%)
    const rawScaleRed =
      ((getSkill('sk_scale')?.totalBonus ?? 0) + (getSingUpg('su_compression')?.totalBonus ?? 0)) / 100;
    const globalScaleReduction = applySoftAndHardCap(rawScaleRed, 0.4, 0.6, 0.5);

    // 2. Singularity Core Level Multipliers (Capped at Lv.100)
    const coreLevel = Math.min(SINGULARITY_CORE_MAX_LEVEL, state.singularityCoreLevel);
    const coreCoinMult = applySoftAndHardCap(safePow(3, coreLevel), 1e12, 1e24, 0.45);
    const coreRpMult = applySoftAndHardCap(safePow(2, coreLevel), 1e8, 1e16, 0.45);
    const corePpMult = applySoftAndHardCap(safePow(2.2, coreLevel), 1e8, 1e16, 0.5);
    const coreTpMult = applySoftAndHardCap(safePow(1.8, coreLevel), 1e6, 1e12, 0.5);

    // 3. Cascading Cross-Currency Boost Curves (All share boostCapCeiling = 100T * 10^timeResets):
    // - RP -> Coins
    // - PP -> RP & Coins
    // - TP -> PP, RP & Coins
    // - Essence -> TP, PP, RP & Coins
    const rpResonanceBonus = applySoftAndHardCap(
      (getRebirthPerk('rp_resonance')?.totalBonus ?? 0) / 100,
      5,
      25,
      0.45
    );
    const rpFormulaExponent = 0.72;
    const rpFormulaFactor = Number((0.25 * (1 + rpResonanceBonus)).toFixed(3));
    const rpCurve = computeCappedBoostCurve(
      state.rebirthPoints,
      boostCapCeiling,
      rpFormulaExponent,
      rpFormulaFactor,
      1e9,
      1e16
    );
    const ppToRpCurve = computeCappedBoostCurve(
      state.prestigePoints,
      boostCapCeiling,
      0.6,
      0.25,
      1e8,
      1e14
    );
    const tpToPpCurve = computeCappedBoostCurve(
      state.treePoints,
      boostCapCeiling,
      0.6,
      0.3,
      1e8,
      1e14
    );
    const essenceToTpCurve = computeCappedBoostCurve(
      state.singularityEssence,
      boostCapCeiling,
      0.58,
      0.3,
      1e7,
      1e12
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
      1 + (getSkill('sk_clicker')?.totalBonus ?? 0) / 100,
      10,
      100,
      0.45
    );
    const suDarkEnergyBoost = applySoftAndHardCap(
      1 + (getSingUpg('su_darkenergy')?.totalBonus ?? 0) / 100,
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

    // 5. Global Multipliers (all boosted by +1% per Time Token)
    const skRootAllMult = safeMul(
      applySoftAndHardCap(1 + (getSkill('sk_root')?.totalBonus ?? 0) / 100, 1e4, 1e8, 0.45),
      timeTokenMult
    );
    const skVanguardMult = applySoftAndHardCap(
      1 + (getSkill('sk_vanguard')?.totalBonus ?? 0) / 100,
      1e5,
      1e10,
      0.5
    );
    const skMintsMult = applySoftAndHardCap(1 + (getSkill('sk_mints')?.totalBonus ?? 0) / 100, 1e4, 1e8, 0.45);

    const rebirthLevelMult = applySoftAndHardCap(1 + state.rebirthLevel * 0.5, 50, 500, 0.5);
    const prestigeLevelCoinMult = applySoftAndHardCap(1 + state.prestigeLevel * 1.1, 500, 1e6, 0.5);

    const rebirthMinesMult = safeMul(
      applySoftAndHardCap(1 + (getRebirthPerk('rp_mines')?.totalBonus ?? 0) / 100, 1e4, 1e8, 0.45),
      timeTokenMult
    );
    const rebirthTapperMult = safeMul(
      applySoftAndHardCap(1 + (getRebirthPerk('rp_tapper')?.totalBonus ?? 0) / 100, 1e4, 1e8, 0.45),
      timeTokenMult
    );
    const buildingDiscountMult = Math.max(
      0.25,
      1 - applySoftAndHardCap((getRebirthPerk('rp_discount')?.totalBonus ?? 0) / 100, 0.5, 0.75, 0.5)
    );
    const bulkPerBldgPct = applySoftAndHardCap(
      (getRebirthPerk('rp_bulk')?.totalBonus ?? 0) / 100,
      0.5,
      2.5,
      0.45
    );

    // 6. Upgrade Tracks (Soft cap T15, Max Tier 30)
    const globalTrack = state.upgradeTracks.find((u) => u.id === 'trk_global');
    const globalEffTiers = globalTrack ? applySoftAndHardCap(globalTrack.tier - 1, 15, UPGRADE_MAX_TIER, 0.45) : 0;
    const globalTrackMult = globalTrack ? safePow(globalTrack.effectMultiplier, globalEffTiers) : 1;

    const clickTrack = state.upgradeTracks.find((u) => u.id === 'trk_click');
    const clickEffTiers = clickTrack ? applySoftAndHardCap(clickTrack.tier - 1, 15, UPGRADE_MAX_TIER, 0.45) : 0;
    const clickTrackMult = clickTrack ? safePow(clickTrack.effectMultiplier, clickEffTiers) : 1;

    const totalBuildingsOwned = state.buildings.reduce((sum, b) => sum + b.count, 0);
    const synergyTrack = state.upgradeTracks.find((u) => u.id === 'trk_synergy');
    const synergyTier = synergyTrack ? applySoftAndHardCap(synergyTrack.tier - 1, 15, UPGRADE_MAX_TIER, 0.45) : 0;
    const synergyMult = applySoftAndHardCap(
      1 + synergyTier * 0.05 * Math.floor(totalBuildingsOwned / 10),
      10,
      100,
      0.45
    );

    // 7. Total Buildings CPS — every 25 owned multiplies by 2x
    let rawBuildingsCps = 0;
    const buildingCpsMap: Record<string, number> = {};

    const sharedGlobalCpsMult = safeMul(
      safeMul(safeMul(globalTrackMult, synergyMult), safeMul(rebirthMinesMult, skMintsMult)),
      safeMul(
        safeMul(skRootAllMult, skVanguardMult),
        safeMul(
          safeMul(rebirthLevelMult, prestigeLevelCoinMult),
          safeMul(coinCascadeMult, safeMul(clickerGlobalCoinBoost, coreCoinMult))
        )
      )
    );

    for (const b of state.buildings) {
      const bTrack = state.upgradeTracks.find((u) => u.targetBuildingId === b.id);
      const bEffTiers = bTrack ? applySoftAndHardCap(bTrack.tier - 1, 15, UPGRADE_MAX_TIER, 0.45) : 0;
      const bTrackMult = bTrack ? safePow(bTrack.effectMultiplier, bEffTiers) : 1;
      const milestone25Mult = safePow(2, Math.floor(b.count / 25));
      const bulkSelfMult = applySoftAndHardCap(1 + b.count * bulkPerBldgPct, 25, 250, 0.45);
      const singleCps = safeMul(
        safeMul(b.baseCps, safeMul(safeMul(bTrackMult, milestone25Mult), bulkSelfMult)),
        sharedGlobalCpsMult
      );
      buildingCpsMap[b.id] = singleCps;
      if (b.count > 0) {
        rawBuildingsCps = safeNum(rawBuildingsCps + safeMul(singleCps, b.count));
      }
    }

    const gameSpeedMultiplier = applySoftAndHardCap(
      1 + (getPrestigeUpg('pu_hourglass')?.totalBonus ?? 0) / 100,
      50,
      500,
      0.45
    );
    const coinsPerSecond = safeMul(rawBuildingsCps, gameSpeedMultiplier);

    // 8. Manual Click Value (Strictly 1 at fresh game start!)
    const midasShare = safeMul(
      applySoftAndHardCap((getPrestigeUpg('pu_midas')?.totalBonus ?? 0) / 100, 5, 50, 0.45),
      coinsPerSecond
    );
    const baseClick = safeMul(
      safeMul(safeMul(clickTrackMult, rebirthTapperMult), safeMul(clickerTotalPowerMult, rebirthLevelMult)),
      safeMul(
        safeMul(prestigeLevelCoinMult, coinCascadeMult),
        safeMul(safeMul(skRootAllMult, skVanguardMult), coreCoinMult)
      )
    );
    const coinsPerClick = safeNum(Math.max(1, baseClick + midasShare));

    const critChance = applySoftAndHardCap((getPrestigeUpg('pu_crit')?.totalBonus ?? 0) / 100, 0.5, 0.75, 0.5);
    const critMultiplier = applySoftAndHardCap(6 + (getSkill('sk_supercrit')?.totalBonus ?? 0), 30, 150, 0.45);

    // 9. Passive Cross-Layer Generators
    // 9a. RP/sec boosted by PP, TP, Essence & Time Tokens
    const conduitBaseRpSec = getPrestigeUpg('pu_conduit')?.totalBonus ?? 0;
    const skFountainMult = applySoftAndHardCap(1 + (getSkill('sk_fountain')?.totalBonus ?? 0) / 100, 1e4, 1e8, 0.45);
    const primordialRpMult = 1 + (getSingUpg('su_primordial')?.totalLevels ?? 0) * 5;
    const rpPerSecond = safeMul(
      safeMul(conduitBaseRpSec, safeMul(skFountainMult, skRootAllMult)),
      safeMul(safeMul(skVanguardMult, primordialRpMult), safeMul(safeMul(coreRpMult, rpCascadeMult), gameSpeedMultiplier))
    );

    // 9b. PP/sec boosted by TP, Essence & Time Tokens
    const skillPpGenBase = getSkill('sk_prestige_gen')?.totalBonus ?? 0;
    const ppPerSecond = safeMul(
      safeMul(skillPpGenBase, safeMul(ppCascadeMult, timeTokenMult)),
      safeMul(safeMul(skVanguardMult, suDarkEnergyBoost), corePpMult)
    );

    // 9c. TP/sec (`su_tree_gen` scales UP with each level: totalBonus * 1.5^(levels-1)) boosted by Essence & Time Tokens
    const suTreeGen = getSingUpg('su_tree_gen');
    const singTpGenBase =
      suTreeGen && suTreeGen.totalLevels > 0
        ? safeMul(suTreeGen.totalBonus, safePow(1.5, Math.max(0, suTreeGen.totalLevels - 1)))
        : 0;
    const tpPerSecond = safeMul(
      safeMul(singTpGenBase, safeMul(tpCascadeMult, timeTokenMult)),
      safeMul(coreTpMult, suDarkEnergyBoost)
    );

    // 9d. Singularity Essence/sec (Essence Reactor: 10/s * level * 2^floor(level/5), max 100)
    const allBaseSingularityBought = state.singularityUpgrades.every((u) => u.totalLevels >= 1);
    const reactorUnlocked = allBaseSingularityBought || state.adminUnlocked;
    const essencePerSecond =
      state.essenceReactorLevel > 0
        ? safeMul(
            safeMul(state.essenceReactorLevel * 10, safePow(2, Math.floor(state.essenceReactorLevel / 5))),
            timeTokenMult
          )
        : 0;

    // 10. Auto-Clicks/sec (Code Auto-Clicker does 100 clicks/sec!)
    const autoPulseClicks = applySoftAndHardCap(getRebirthPerk('rp_autopulse')?.totalBonus ?? 0, 50, 250, 0.45);
    const companionClicks = clickerEvolution.companionCount * (1 + (getSkill('sk_clicker')?.totalLevels ?? 0) * 0.5);
    const codeAutoClicks = state.codeClickerUnlocked && state.codeClickerEnabled ? 100 : 0;
    const autoClicksPerSecond = safeMul(autoPulseClicks + companionClicks + codeAutoClicks, gameSpeedMultiplier);

    // 11. Coin Core Multi-Buy (NO level cap, 1.1x cost scale!)
    const effectiveClickerScale = getEffectiveScale(CLICKER_COST_SCALE, globalScaleReduction);
    const coinCoreMulti = state.multiBuyBySection.coinCore;
    const clickerBuyInfo = free
      ? {
          count: coinCoreMulti === -1 ? 10 : coinCoreMulti,
          totalCost: 0,
          canAfford: true,
          nextSingleCost: 0
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
      ? 0
      : safeNum(Math.floor(getRebirthLevelCost(REBIRTH_BASE_COST, effectiveRebirthScale, state.rebirthLevel) * hardCostMult));
    const rebirthBuyInfo = free
      ? {
          count: state.multiBuyBySection.rebirth === -1 ? 5 : state.multiBuyBySection.rebirth,
          totalCost: 0,
          canAfford: true,
          nextSingleCost: 0
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
            canAfford: state.coins >= nextRebirthSingleCost && nextRebirthSingleCost < FLOAT_SAFE_MAX,
            nextSingleCost: nextRebirthSingleCost
          };

    const crucibleMult = applySoftAndHardCap(
      1 + (getPrestigeUpg('pu_crucible')?.totalBonus ?? 0) / 100,
      1e4,
      1e9,
      0.45
    );
    const rpGainMultiplier = safeMul(
      safeMul(crucibleMult, rpCascadeMult),
      safeMul(skRootAllMult, safeMul(skVanguardMult, safeMul(coreRpMult, timeTokenMult)))
    );

    let projectedRebirthRpGain = 0;
    if (rebirthBuyInfo.canAfford) {
      let stepSum = 0;
      for (let i = 0; i < rebirthBuyInfo.count; i++) {
        stepSum = safeNum(
          stepSum + Math.max(1, Math.floor(safeMul(1 + (state.rebirthLevel + i) * 0.65, rpGainMultiplier)))
        );
      }
      const ratio = free ? 10 : Math.max(1, state.coins / Math.max(1, rebirthBuyInfo.nextSingleCost));
      const surplusBonus = Math.max(
        1,
        Math.floor(safeMul(safePow(ratio, 0.48), safeMul(1 + state.rebirthLevel * 0.65, rpGainMultiplier)))
      );
      projectedRebirthRpGain = safeNum(Math.max(stepSum, surplusBonus));
    }

    // 13. Prestige Multi-Buy
    const effectivePrestigeScale = getEffectiveScale(PRESTIGE_RP_SCALE, globalScaleReduction);
    const nextPrestigeSingleCost = free
      ? 0
      : getLevelCost(PRESTIGE_BASE_RP_COST, effectivePrestigeScale, state.prestigeLevel, hardCostMult);
    const prestigeBuyInfo = free
      ? {
          count: state.multiBuyBySection.prestige === -1 ? 5 : state.multiBuyBySection.prestige,
          totalCost: 0,
          canAfford: true,
          nextSingleCost: 0
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
            canAfford:
              state.rebirthPoints >= nextPrestigeSingleCost && nextPrestigeSingleCost < FLOAT_SAFE_MAX,
            nextSingleCost: nextPrestigeSingleCost
          };

    const ppGainMult = safeMul(
      safeMul(ppCascadeMult, timeTokenMult),
      safeMul(safeMul(skVanguardMult, suDarkEnergyBoost), corePpMult)
    );
    let projectedPrestigePointsGain = 0;
    if (prestigeBuyInfo.canAfford) {
      for (let i = 0; i < prestigeBuyInfo.count; i++) {
        const pTier = state.prestigeLevel + i;
        const expTierBoost = safePow(10, Math.floor(pTier / 3) + (pTier >= 4 ? (pTier - 3) * 0.55 : 0));
        projectedPrestigePointsGain = safeNum(
          projectedPrestigePointsGain +
            Math.max(1, Math.floor(safeMul(safeMul(1 + pTier * 1.5, expTierBoost), ppGainMult)))
        );
      }
      if (!free && state.rebirthPoints > prestigeBuyInfo.nextSingleCost) {
        const surplusPp = Math.floor(
          safeMul(safePow(state.rebirthPoints / prestigeBuyInfo.nextSingleCost, 0.4), ppGainMult)
        );
        projectedPrestigePointsGain = safeNum(Math.max(projectedPrestigePointsGain, surplusPp));
      }
    }

    // 14. Skill Tree Reset
    const treeMulti = state.multiBuyBySection.skillTree;
    const nextTreeSingleCost = free
      ? 0
      : getLevelCost(TREE_POINT_BASE_PP_COST, 1.5, state.treeResetCount, hardCostMult);
    const treeBuyInfo = free
      ? {
          count: treeMulti === -1 ? 5 : treeMulti,
          totalCost: 0,
          canAfford: true,
          nextSingleCost: 0
        }
      : activeTab === 'skillTree'
        ? calculateMultiBuy(
            state.prestigePoints,
            TREE_POINT_BASE_PP_COST,
            1.5,
            state.treeResetCount,
            treeMulti,
            50,
            hardCostMult
          )
        : {
            count: 1,
            totalCost: nextTreeSingleCost,
            canAfford: state.prestigePoints >= nextTreeSingleCost && nextTreeSingleCost < FLOAT_SAFE_MAX,
            nextSingleCost: nextTreeSingleCost
          };

    const tpGainMult = safeMul(
      safeMul(tpCascadeMult, timeTokenMult),
      safeMul(safeMul(skVanguardMult, suDarkEnergyBoost), coreTpMult)
    );
    const projectedTreePointsGain = treeBuyInfo.canAfford
      ? safeNum(
          Math.max(
            treeBuyInfo.count,
            Math.floor(
              safeMul(
                safeMul(
                  treeBuyInfo.count,
                  free ? 10 : Math.pow(Math.max(1, state.prestigePoints / Math.max(1, treeBuyInfo.nextSingleCost)), 0.35)
                ),
                tpGainMult
              )
            )
          )
        )
      : 0;

    // 15. Singularity Reset (ONLY 1 at a time)
    const singularityCost = free
      ? 0
      : getLevelCost(SINGULARITY_BASE_TP_COST, SINGULARITY_TP_SCALE, state.singularityCount, hardCostMult);
    const canSingularity = free ? true : state.treePoints >= singularityCost && singularityCost < FLOAT_SAFE_MAX;
    const projectedEssenceGain = safeNum(
      Math.max(state.singularityCount + 1, Math.floor(safeMul(state.singularityCount + 1, timeTokenMult)))
    );

    // Essence Reactor preview
    const reactorRemaining = Math.max(0, ESSENCE_REACTOR_MAX_LEVEL - state.essenceReactorLevel);
    const reactorBuyInfo = free
      ? {
          count: Math.min(reactorRemaining, state.multiBuyBySection.singularity === -1 ? 10 : state.multiBuyBySection.singularity),
          totalCost: 0,
          canAfford: reactorRemaining > 0,
          nextSingleCost: 0
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

    // Singularity Core Level-Up (Max Level 100!)
    const effectiveCoreScale = getEffectiveScale(1.85, globalScaleReduction);
    const coreRemaining = Math.max(0, SINGULARITY_CORE_MAX_LEVEL - coreLevel);
    const nextCoreSingleCost = free
      ? 0
      : getLevelCost(1, effectiveCoreScale, coreLevel, hardCostMult);
    const singularityCoreBuyInfo =
      coreRemaining <= 0
        ? { count: 0, totalCost: 0, canAfford: false, nextSingleCost: 0 }
        : free
          ? {
              count: Math.min(
                coreRemaining,
                state.multiBuyBySection.singularity === -1 ? 10 : state.multiBuyBySection.singularity
              ),
              totalCost: 0,
              canAfford: true,
              nextSingleCost: 0
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
                canAfford: state.singularityEssence >= nextCoreSingleCost && nextCoreSingleCost < FLOAT_SAFE_MAX,
                nextSingleCost: nextCoreSingleCost
              };

    // 16. Time Reset, Coin Odds (+5% per level, 50% -> 80% max), Token Boost, Auto-Singularity & Ideal Tab
    const timeResetRequiredEssence = free ? 0 : safeNum(TIME_RESET_ESSENCE_COST * hardCostMult);
    const canTimeReset = free ? true : state.singularityEssence >= timeResetRequiredEssence;
    const timeTokenBoostMult = safePow(2, state.timeTokenBoostLevel);
    const projectedTimeTokens = canTimeReset
      ? safeNum(
          Math.max(
            1,
            Math.floor(
              safeMul(
                Math.pow(Math.max(1, state.singularityEssence / Math.max(1, timeResetRequiredEssence)), 0.5),
                timeTokenBoostMult
              )
            )
          )
        )
      : 0;
    const timeFlipWinChance = Math.min(0.8, 0.5 + state.timeFlipChanceLevel * 0.05);
    const timeFlipRemaining = Math.max(0, TIME_FLIP_MAX_LEVEL - state.timeFlipChanceLevel);
    const timeFlipBuyInfo =
      timeFlipRemaining <= 0
        ? { count: 0, totalCost: 0, canAfford: false, nextSingleCost: 0 }
        : free
          ? {
              count: Math.min(
                timeFlipRemaining,
                state.multiBuyBySection.timeReset === -1 ? TIME_FLIP_MAX_LEVEL : state.multiBuyBySection.timeReset
              ),
              totalCost: 0,
              canAfford: true,
              nextSingleCost: 0
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
      tokenBoostRemaining <= 0
        ? { count: 0, totalCost: 0, canAfford: false, nextSingleCost: 0 }
        : free
          ? {
              count: Math.min(
                tokenBoostRemaining,
                state.multiBuyBySection.timeReset === -1 ? 5 : state.multiBuyBySection.timeReset
              ),
              totalCost: 0,
              canAfford: true,
              nextSingleCost: 0
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

    const timeAutoSingularityCost = free ? 0 : safeNum(TIME_AUTO_SINGULARITY_COST * hardCostMult);
    const canBuyTimeAutoSingularity =
      !state.timeAutoSingularityUnlocked && (free || state.timeTokens >= timeAutoSingularityCost);

    const idealTabCost = free ? 0 : safeNum(IDEAL_TAB_COST * hardCostMult);
    const canUnlockIdealTab =
      !state.idealTabUnlocked && (free || state.timeTokens >= idealTabCost);
    const idealXpPerSecond =
      state.idealTabUnlocked || state.adminUnlocked
        ? 1 + state.ideal.totalLevels + state.ideal.colorIndex
        : 0;

    // 17. Separate Singularity & Time Automations
    const hasAutoBuildings = (getSingUpg('su_auto_buildings')?.totalLevels ?? 0) >= 1 || state.adminUnlocked;
    const hasAutoUpgrades = (getSingUpg('su_auto_upgrades')?.totalLevels ?? 0) >= 1 || state.adminUnlocked;
    const hasAutoRebirth = (getSingUpg('su_auto_rebirth')?.totalLevels ?? 0) >= 1 || state.adminUnlocked;
    const hasAutoPrestige = (getSingUpg('su_auto_prestige')?.totalLevels ?? 0) >= 1 || state.adminUnlocked;
    const hasAutoClicker = (getSingUpg('su_auto_clicker')?.totalLevels ?? 0) >= 1 || state.adminUnlocked;
    const hasAutoSingularity = state.timeAutoSingularityUnlocked || state.adminUnlocked;

    const isStellarMaxed = (getSkill('sk_scale')?.totalBonus ?? 0) >= 60;

    return {
      hardCostMult,
      timeTokenMult,
      boostCapCeiling,
      globalScaleReduction,
      isStellarMaxed,
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
      projectedTimeTokens,
      timeFlipWinChance,
      timeFlipBuyInfo,
      effectiveClickerScale,
      clickerBuyInfo,
      hasAutoBuildings,
      hasAutoUpgrades,
      hasAutoRebirth,
      hasAutoPrestige,
      hasAutoSingularity,
      hasAutoClicker,
      retainedCoinPct: applySoftAndHardCap((getRebirthPerk('rp_retainer')?.totalBonus ?? 0) / 100, 0.7, 1.0, 0.5),
      startingTreasury: safeNum(getRebirthPerk('rp_treasury')?.totalBonus ?? 0),
      keptRebirthLevels: Math.floor(getPrestigeUpg('pu_memory')?.totalBonus ?? 0),
      primordialStartRp: safeNum(getSingUpg('su_primordial')?.totalBonus ?? 0)
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
        const totalCoinGain = safeNum(passiveGain + autoClickGain);

        const rpGain = safeMul(s.rpPerSecond, dt);
        const ppGain = safeMul(s.ppPerSecond, dt);
        const tpGain = safeMul(s.tpPerSecond, dt);
        const essenceGain = safeMul(s.essencePerSecond, dt);

        let nextCoins = safeNum(prev.coins + totalCoinGain);
        const nextLifetimeCoins = safeNum(prev.lifetimeCoins + totalCoinGain);
        let nextRp = safeNum(prev.rebirthPoints + rpGain);
        const nextLifetimeRp = safeNum(prev.lifetimeRebirthPoints + rpGain);
        const nextPp = safeNum(prev.prestigePoints + ppGain);
        const nextLifetimePp = safeNum(prev.lifetimePrestigePoints + ppGain);
        const nextTp = safeNum(prev.treePoints + tpGain);
        const nextLifetimeTp = safeNum(prev.lifetimeTreePoints + tpGain);
        const nextEssence = safeNum(prev.singularityEssence + essenceGain);
        const nextLifetimeEssence = safeNum(prev.lifetimeSingularityEssence + essenceGain);

        let nextBuildings = prev.buildings;
        let nextTracks = prev.upgradeTracks;
        let nextRebirthPerks = prev.rebirthPerks;
        let nextPrestigeUpgrades = prev.prestigeUpgrades;
        let nextSingularityUpgrades = prev.singularityUpgrades;
        let nextClickerLevel = prev.clickerLevel;
        let nextCompletedUpgrades = prev.completedUpgradeCount;
        let nextCompletedPerkTiers = prev.completedPerkTiersCount;
        const hardMult = prev.hardMode ? 10 : 1;

        // Ideal XP Progression (Red -> Orange -> Yellow -> Green -> Blue -> Purple -> Violet)
        let nextIdeal = prev.ideal;
        if (s.idealXpPerSecond > 0) {
          let curColorIdx = prev.ideal.colorIndex;
          let curXp = prev.ideal.xp + s.idealXpPerSecond * dt;
          let curXpNeeded = prev.ideal.xpNeeded;
          let curLvlInColor = prev.ideal.levelInColor;
          let curTotalLevels = prev.ideal.totalLevels;
          let nextSquares: Record<IdealColor, number> | null = null;
          let leveledUp = false;

          let guard = 0;
          while (curXp >= curXpNeeded && guard < 25) {
            guard++;
            curXp -= curXpNeeded;
            leveledUp = true;
            if (!nextSquares) nextSquares = { ...prev.ideal.squares };
            const colorId = IDEAL_COLORS[Math.min(IDEAL_COLORS.length - 1, curColorIdx)].id;
            nextSquares[colorId] = (nextSquares[colorId] ?? 0) + 1;
            curLvlInColor += 1;
            curTotalLevels += 1;

            if (curLvlInColor >= IDEAL_SQUARES_PER_COLOR && curColorIdx < IDEAL_COLORS.length - 1) {
              curColorIdx += 1;
              curLvlInColor = 0;
              curXpNeeded = IDEAL_BASE_XP * Math.pow(2, curColorIdx);
            } else {
              curXpNeeded = Number((curXpNeeded * IDEAL_XP_GROWTH).toFixed(4));
            }
          }

          nextIdeal = {
            colorIndex: curColorIdx,
            xp: curXp,
            xpNeeded: curXpNeeded,
            levelInColor: curLvlInColor,
            totalLevels: curTotalLevels,
            squares: leveledUp && nextSquares ? nextSquares : prev.ideal.squares
          };
        }

        if (tickCounter % 2 === 0 && !prev.adminFreeMode) {
          const autoMulti: MultiBuyAmount = prev.automation.autoBuyMax ? -1 : 1;

          if (s.hasAutoBuildings && prev.automation.autoBuyBuildings) {
            let changed = false;
            const mapped = prev.buildings.map((b) => {
              if (prev.automation.buildingAutoBuyEnabled[b.id] === false) return b;
              if (nextLifetimeCoins < b.unlockCoins && b.count === 0) return b;
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
              if (info.canAfford && info.count > 0 && info.totalCost < FLOAT_SAFE_MAX) {
                nextCoins = safeNum(nextCoins - info.totalCost);
                changed = true;
                return { ...b, count: b.count + info.count };
              }
              return b;
            });
            if (changed) nextBuildings = mapped;
          }

          if (s.hasAutoUpgrades && prev.automation.autoBuyUpgrades) {
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
              if (info.canAfford && info.count > 0 && info.totalCost < FLOAT_SAFE_MAX) {
                nextCoins = safeNum(nextCoins - info.totalCost);
                nextCompletedUpgrades += info.count;
                changed = true;
                return { ...trk, tier: Math.min(trk.maxTier, trk.tier + info.count) };
              }
              return trk;
            });
            if (changed) nextTracks = mapped;
          }

          if (s.hasAutoRebirth && prev.automation.autoBuyRebirthUpgrades) {
            let changed = false;
            const mapped = prev.rebirthPerks.map((perk) => {
              if (isTieredItemMaxed(perk)) return perk;
              const res = applyTieredPurchase(perk, nextRp, autoMulti, s.globalScaleReduction, false, hardMult);
              if (res.bought > 0) {
                nextRp = safeNum(nextRp - res.spent);
                nextCompletedPerkTiers += res.evolutions;
                changed = true;
                return res.updated;
              }
              return perk;
            });
            if (changed) nextRebirthPerks = mapped;
          }

          if (s.hasAutoClicker && prev.automation.autoLevelClicker) {
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
            if (info.canAfford && info.count > 0 && info.totalCost < FLOAT_SAFE_MAX) {
              nextCoins = safeNum(nextCoins - info.totalCost);
              nextClickerLevel += info.count;
            }
          }
        }

        // Clean budget-safe PP & Essence deductions for Auto-Buy Prestige & Auto-Buy Singularity
        let finalPp = nextPp;
        if (tickCounter % 2 === 0 && !prev.adminFreeMode && s.hasAutoPrestige && prev.automation.autoBuyPrestigeUpgrades) {
          const autoMulti: MultiBuyAmount = prev.automation.autoBuyMax ? -1 : 1;
          let changed = false;
          const mapped = prev.prestigeUpgrades.map((upg) => {
            if (isTieredItemMaxed(upg)) return upg;
            const res = applyTieredPurchase(upg, finalPp, autoMulti, s.globalScaleReduction, false, hardMult);
            if (res.bought > 0) {
              finalPp = safeNum(finalPp - res.spent);
              nextCompletedPerkTiers += res.evolutions;
              changed = true;
              return res.updated;
            }
            return upg;
          });
          if (changed) nextPrestigeUpgrades = mapped;
        }

        let finalEssence = nextEssence;
        if (tickCounter % 2 === 0 && !prev.adminFreeMode && s.hasAutoSingularity && prev.automation.autoBuySingularityUpgrades) {
          const autoMulti: MultiBuyAmount = prev.automation.autoBuyMax ? -1 : 1;
          let changed = false;
          const mapped = prev.singularityUpgrades.map((upg) => {
            if (isTieredItemMaxed(upg)) return upg;
            const res = applyTieredPurchase(upg, finalEssence, autoMulti, s.globalScaleReduction, false, hardMult);
            if (res.bought > 0) {
              finalEssence = safeNum(finalEssence - res.spent);
              nextCompletedPerkTiers += res.evolutions;
              changed = true;
              return res.updated;
            }
            return upg;
          });
          if (changed) nextSingularityUpgrades = mapped;
        }

        return {
          ...prev,
          coins: nextCoins,
          lifetimeCoins: nextLifetimeCoins,
          rebirthPoints: nextRp,
          lifetimeRebirthPoints: nextLifetimeRp,
          prestigePoints: finalPp,
          lifetimePrestigePoints: nextLifetimePp,
          treePoints: nextTp,
          lifetimeTreePoints: nextLifetimeTp,
          singularityEssence: finalEssence,
          lifetimeSingularityEssence: nextLifetimeEssence,
          ideal: nextIdeal,
          buildings: nextBuildings,
          upgradeTracks: nextTracks,
          rebirthPerks: nextRebirthPerks,
          prestigeUpgrades: nextPrestigeUpgrades,
          singularityUpgrades: nextSingularityUpgrades,
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

  const handleManualClick = useCallback((): { amount: number; isCrit: boolean } => {
    const s = statsRef.current;
    const isCrit = Math.random() < s.critChance;
    const amount = safeMul(s.coinsPerClick, isCrit ? s.critMultiplier : 1);
    sounds.playClick(isCrit);

    setState((prev) => ({
      ...prev,
      coins: safeNum(prev.coins + amount),
      lifetimeCoins: safeNum(prev.lifetimeCoins + amount),
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
        | 'autoBuySingularityUpgrades'
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
      coins: prev.adminFreeMode ? prev.coins : safeNum(prev.coins - info.totalCost),
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
      ? { count: multi === -1 ? 25 : multi, totalCost: 0, canAfford: true }
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
      coins: prev.adminFreeMode ? prev.coins : safeNum(prev.coins - info.totalCost),
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
      ? { count: Math.min(remaining, multi === -1 ? 10 : multi), totalCost: 0, canAfford: remaining > 0 }
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
      coins: prev.adminFreeMode ? prev.coins : safeNum(prev.coins - info.totalCost),
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
        rebirthPoints: prev.adminFreeMode ? prev.rebirthPoints : safeNum(prev.rebirthPoints - res.spent),
        completedPerkTiersCount: prev.completedPerkTiersCount + res.evolutions,
        rebirthPerks: prev.rebirthPerks.map((p) => (p.id === perkId ? res.updated : p))
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
        prestigePoints: prev.adminFreeMode ? prev.prestigePoints : safeNum(prev.prestigePoints - res.spent),
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
          (target.id === 'sk_scale' && target.totalBonus >= 60) ||
          !isSkillNodeUnlocked(target, prev.skillNodes, prev.adminUnlocked)
        ) {
          return prev;
        }
        const effectiveMulti: MultiBuyAmount =
          target.id === 'sk_scale' && prev.multiBuyBySection.skillTree === -1
            ? (Math.max(1, Math.ceil((60 - target.totalBonus) / Math.max(1, target.bonusPerLevel))) as MultiBuyAmount)
            : prev.multiBuyBySection.skillTree;
        const res = applyTieredPurchase(
          target,
          prev.treePoints,
          target.id === 'sk_scale' ? (prev.multiBuyBySection.skillTree === -1 ? -1 : effectiveMulti) : prev.multiBuyBySection.skillTree,
          s.globalScaleReduction,
          prev.adminFreeMode,
          s.hardCostMult
        );
        if (res.bought <= 0) return prev;
        if (target.id === 'sk_scale' && res.updated.totalBonus > 60) {
          res.updated.totalBonus = 60;
        }
        if (res.evolutions > 0) sounds.playLevelUp();
        else sounds.playBuy();
        return {
          ...prev,
          treePoints: prev.adminFreeMode ? prev.treePoints : safeNum(prev.treePoints - res.spent),
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
        : safeNum(prev.singularityEssence - info.totalCost),
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
          : safeNum(prev.singularityEssence - res.spent),
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
        : safeNum(prev.singularityEssence - s.reactorBuyInfo.totalCost),
      essenceReactorLevel: Math.min(ESSENCE_REACTOR_MAX_LEVEL, prev.essenceReactorLevel + s.reactorBuyInfo.count)
    }));
  }, []);

  const triggerRebirth = useCallback(() => {
    const s = statsRef.current;
    if (!s.rebirthBuyInfo.canAfford || s.rebirthBuyInfo.count <= 0) return;

    const shouldShowPopup = !stateRef.current.firstRebirthPopupShown;
    sounds.playRebirth();
    setState((prev) => {
      const keptCoins = safeNum(Math.floor(prev.coins * s.retainedCoinPct) + s.startingTreasury);
      return {
        ...prev,
        coins: keptCoins,
        clickerLevel: 1,
        rebirthLevel: prev.rebirthLevel + s.rebirthBuyInfo.count,
        rebirthPoints: safeNum(prev.rebirthPoints + s.projectedRebirthRpGain),
        lifetimeRebirthPoints: safeNum(prev.lifetimeRebirthPoints + s.projectedRebirthRpGain),
        buildings: INITIAL_BUILDINGS.map((b) => ({ ...b })),
        upgradeTracks: INITIAL_UPGRADE_TRACKS.map((u) => ({ ...u })),
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
      rebirthPoints: 0,
      rebirthPerks: INITIAL_REBIRTH_PERKS.map((p) => ({ ...p })),
      prestigeLevel: prev.prestigeLevel + s.prestigeBuyInfo.count,
      prestigePoints: safeNum(prev.prestigePoints + s.projectedPrestigePointsGain),
      lifetimePrestigePoints: safeNum(prev.lifetimePrestigePoints + s.projectedPrestigePointsGain),
      buildings: INITIAL_BUILDINGS.map((b) => ({ ...b })),
      upgradeTracks: INITIAL_UPGRADE_TRACKS.map((u) => ({ ...u })),
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
      coins: 0,
      clickerLevel: 1,
      rebirthLevel: 0,
      rebirthPoints: 0,
      rebirthPerks: INITIAL_REBIRTH_PERKS.map((p) => ({ ...p })),
      prestigeLevel: 0,
      prestigePoints: 0,
      prestigeUpgrades: INITIAL_PRESTIGE_UPGRADES.map((p) => ({ ...p })),
      treeResetCount: prev.treeResetCount + s.treeBuyInfo.count,
      treePoints: safeNum(prev.treePoints + s.projectedTreePointsGain),
      lifetimeTreePoints: safeNum(prev.lifetimeTreePoints + s.projectedTreePointsGain),
      buildings: INITIAL_BUILDINGS.map((b) => ({ ...b })),
      upgradeTracks: INITIAL_UPGRADE_TRACKS.map((u) => ({ ...u })),
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
      coins: 0,
      clickerLevel: 1,
      rebirthLevel: 0,
      rebirthPoints: s.primordialStartRp,
      rebirthPerks: INITIAL_REBIRTH_PERKS.map((p) => ({ ...p })),
      prestigeLevel: 0,
      prestigePoints: 0,
      prestigeUpgrades: INITIAL_PRESTIGE_UPGRADES.map((p) => ({ ...p })),
      treeResetCount: 0,
      treePoints: 0,
      skillNodes: INITIAL_SKILL_NODES.map((n) => ({ ...n, requires: [...n.requires] })),
      buildings: INITIAL_BUILDINGS.map((b) => ({ ...b })),
      upgradeTracks: INITIAL_UPGRADE_TRACKS.map((u) => ({ ...u })),
      singularityCount: prev.singularityCount + 1,
      singularityEssence: safeNum(prev.singularityEssence + s.projectedEssenceGain),
      lifetimeSingularityEssence: safeNum(prev.lifetimeSingularityEssence + s.projectedEssenceGain)
    }));
  }, []);

  // Time Reset with Optional Coin Flip Gamble
  const triggerTimeReset = useCallback((gambleFlip: boolean): { won: boolean; awarded: number } => {
    const s = statsRef.current;
    if (!s.canTimeReset) return { won: false, awarded: 0 };

    const baseTokens = s.projectedTimeTokens;
    let won = true;
    let awarded = baseTokens;
    if (gambleFlip) {
      won = Math.random() < s.timeFlipWinChance;
      awarded = won ? baseTokens * 2 : 0;
    }

    sounds.playSingularity();
    setState((prev) => ({
      ...prev,
      coins: 0,
      clickerLevel: 1,
      rebirthLevel: 0,
      rebirthPoints: 0,
      rebirthPerks: INITIAL_REBIRTH_PERKS.map((p) => ({ ...p })),
      prestigeLevel: 0,
      prestigePoints: 0,
      prestigeUpgrades: INITIAL_PRESTIGE_UPGRADES.map((p) => ({ ...p })),
      treeResetCount: 0,
      treePoints: 0,
      skillNodes: INITIAL_SKILL_NODES.map((n) => ({ ...n, requires: [...n.requires] })),
      singularityCount: 0,
      singularityCoreLevel: 0,
      singularityEssence: 0,
      singularityUpgrades: INITIAL_SINGULARITY_UPGRADES.map((u) => ({ ...u })),
      essenceReactorLevel: 0,
      buildings: INITIAL_BUILDINGS.map((b) => ({ ...b })),
      upgradeTracks: INITIAL_UPGRADE_TRACKS.map((u) => ({ ...u })),
      timeResetCount: prev.timeResetCount + 1,
      timeTokens: safeNum(prev.timeTokens + awarded),
      lifetimeTimeTokens: safeNum(prev.lifetimeTimeTokens + awarded)
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
        : safeNum(prev.timeTokens - s.timeFlipBuyInfo.totalCost),
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
        : safeNum(prev.timeTokens - s.timeTokenBoostBuyInfo.totalCost),
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
        : safeNum(prev.timeTokens - s.timeAutoSingularityCost),
      timeAutoSingularityUnlocked: true
    }));
  }, []);

  const unlockIdealTab = useCallback(() => {
    const s = statsRef.current;
    if (!s.canUnlockIdealTab) return;
    sounds.playSingularity();
    setState((prev) => ({
      ...prev,
      timeTokens: prev.adminFreeMode ? prev.timeTokens : safeNum(prev.timeTokens - s.idealTabCost),
      idealTabUnlocked: true
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
    setState((prev) => ({
      ...prev,
      coins: safeNum(prev.coins + 1e35),
      lifetimeCoins: safeNum(Math.max(prev.lifetimeCoins, 1e35)),
      rebirthPoints: safeNum(prev.rebirthPoints + 1e15),
      lifetimeRebirthPoints: safeNum(Math.max(prev.lifetimeRebirthPoints, 1e15)),
      prestigePoints: safeNum(prev.prestigePoints + 1e15),
      lifetimePrestigePoints: safeNum(Math.max(prev.lifetimePrestigePoints, 1e15)),
      treePoints: safeNum(prev.treePoints + 1e15),
      lifetimeTreePoints: safeNum(Math.max(prev.lifetimeTreePoints, 1e15)),
      singularityEssence: safeNum(prev.singularityEssence + 1e9),
      lifetimeSingularityEssence: safeNum(Math.max(prev.lifetimeSingularityEssence, 1e9)),
      timeTokens: safeNum(prev.timeTokens + 2_000_000),
      lifetimeTimeTokens: safeNum(Math.max(prev.lifetimeTimeTokens, 2_000_000))
    }));
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
    buyPrestigeUpgrade,
    buySkillNode,
    isSkillNodeUnlocked,
    levelUpSingularityCore,
    buySingularityUpgrade,
    buyEssenceReactor,
    triggerRebirth,
    triggerPrestige,
    triggerTreeReset,
    triggerSingularity,
    triggerTimeReset,
    buyTimeFlipUpgrade,
    buyTimeTokenBoostUpgrade,
    buyTimeAutoSingularity,
    unlockIdealTab,
    unlockAdminWithCode,
    toggleAdminFreeMode,
    adminGrantResources,
    exitAdminMode,
    hardReset
  };
}
