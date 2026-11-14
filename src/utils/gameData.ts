import {
  ActiveTab,
  Building,
  UpgradeTrackState,
  TieredPerk,
  SkillNode,
  ClickerEvolution,
  SingularityUpgrade,
  EssenceConvergenceUpgrade,
  SectionWaveUpgrade
} from '../types/game';
import { Decimal, type DecimalSource, D_ONE, D_ZERO, safePow, toDec } from './format';

type RawDecimalFields<T> = Omit<T, 'totalBonus' | 'baseCost' | 'bonusPerLevel'> & {
  totalBonus: number;
  baseCost: number;
  bonusPerLevel: number;
};

function hydrateDecimalPerks<
  T extends { totalBonus: number; baseCost: number; bonusPerLevel: number }
>(
  items: T[]
): Array<
  Omit<T, 'totalBonus' | 'baseCost' | 'bonusPerLevel'> & {
    totalBonus: Decimal;
    baseCost: Decimal;
    bonusPerLevel: Decimal;
  }
> {
  return items.map((item) => ({
    ...item,
    totalBonus: toDec(item.totalBonus),
    baseCost: toDec(item.baseCost),
    bonusPerLevel: toDec(item.bonusPerLevel)
  }));
}

export const REBIRTH_BASE_COST = 1_000_000;
export const REBIRTH_COST_SCALE = 4.5;

// Cross-layer Reset Costs
export const PRESTIGE_BASE_RP_COST = 1_000_000; // 1 Million Rebirth Points
export const PRESTIGE_RP_SCALE = 2.8;

export const TREE_POINT_BASE_PP_COST = 1_000_000; // 1 Million Gems per Leaf
export const TREE_POINT_PP_SCALE = 1.35;
export const SINGULARITY_BASE_TP_COST = 1_000_000; // 1 Million Leaves (10x per purchase, 1 at a time)
export const SINGULARITY_TP_SCALE = 10.0;

export const TIME_RESET_ESSENCE_COST = 1_000_000; // 1 Million Singularity Essence
export const TIME_FLIP_BASE_COST = 10; // 10 Time Tokens
export const TIME_FLIP_COST_SCALE = 10.0; // Increases 10x per purchase
export const TIME_FLIP_MAX_LEVEL = 6; // 50% base + 6 * 5% = 80% max
export const TIME_TOKEN_BOOST_BASE_COST = 10; // 10 Time Tokens
export const TIME_TOKEN_BOOST_COST_SCALE = 10.0; // 10x per purchase
export const TIME_TOKEN_BOOST_MAX_LEVEL = 30;
export const TIME_AUTO_SINGULARITY_COST = 100; // 100 Time Tokens to unlock Auto-Buy Singularity
export const IDEAL_TAB_COST = 1_000_000; // 1 Million Time Tokens to unlock Idle tab
export const IDLE_AUTO_TIME_COST = 1_000_000; // 1 Million Idle XP to unlock Auto-Buy Time Token Upgrades

export const IDEAL_BASE_XP = 1;
export const IDEAL_XP_GROWTH = 1.416;
export const IDEAL_UNLOCK_LEVEL = 10;

export const IDEAL_COLORS: {
  id: 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'violet';
  name: string;
  baseXpNeeded: number;
  baseXpPerSec: number;
  xpGrowth: number;
  unlockPrevLevel: number;
  boostSummary: string;
  barClass: string;
  squareClass: string;
  textClass: string;
  borderClass: string;
}[] = [
  {
    id: 'red',
    name: 'Red',
    baseXpNeeded: 1,
    baseXpPerSec: 1,
    xpGrowth: IDEAL_XP_GROWTH,
    unlockPrevLevel: 0,
    boostSummary: '+5% Coins per Red Square',
    barClass: 'from-red-500 to-rose-400',
    squareClass: 'bg-red-500 border-red-300',
    textClass: 'text-red-300',
    borderClass: 'border-red-500/50'
  },
  {
    id: 'orange',
    name: 'Orange',
    baseXpNeeded: 5,
    baseXpPerSec: 2,
    xpGrowth: IDEAL_XP_GROWTH,
    unlockPrevLevel: IDEAL_UNLOCK_LEVEL,
    boostSummary: '+5% Coins & Rebirth Points per Orange Square',
    barClass: 'from-orange-500 to-amber-400',
    squareClass: 'bg-orange-500 border-orange-300',
    textClass: 'text-orange-300',
    borderClass: 'border-orange-500/50'
  },
  {
    id: 'yellow',
    name: 'Yellow',
    baseXpNeeded: 25,
    baseXpPerSec: 4,
    xpGrowth: IDEAL_XP_GROWTH,
    unlockPrevLevel: IDEAL_UNLOCK_LEVEL,
    boostSummary: '+5% Coins, RP & Gems per Yellow Square',
    barClass: 'from-yellow-400 to-amber-300',
    squareClass: 'bg-yellow-400 border-yellow-200',
    textClass: 'text-yellow-300',
    borderClass: 'border-yellow-400/50'
  },
  {
    id: 'green',
    name: 'Green',
    baseXpNeeded: 125,
    baseXpPerSec: 8,
    xpGrowth: IDEAL_XP_GROWTH,
    unlockPrevLevel: IDEAL_UNLOCK_LEVEL,
    boostSummary: '+5% Coins, RP, Gems & Leaves per Green Square',
    barClass: 'from-emerald-500 to-green-400',
    squareClass: 'bg-emerald-500 border-emerald-300',
    textClass: 'text-emerald-300',
    borderClass: 'border-emerald-500/50'
  },
  {
    id: 'blue',
    name: 'Blue',
    baseXpNeeded: 625,
    baseXpPerSec: 16,
    xpGrowth: IDEAL_XP_GROWTH,
    unlockPrevLevel: IDEAL_UNLOCK_LEVEL,
    boostSummary: '+5% Coins, RP, Gems, Leaves & Singularity Essence per Blue Square',
    barClass: 'from-blue-500 to-cyan-400',
    squareClass: 'bg-blue-500 border-blue-300',
    textClass: 'text-blue-300',
    borderClass: 'border-blue-500/50'
  },
  {
    id: 'purple',
    name: 'Purple',
    baseXpNeeded: 3_125,
    baseXpPerSec: 32,
    xpGrowth: IDEAL_XP_GROWTH,
    unlockPrevLevel: IDEAL_UNLOCK_LEVEL,
    boostSummary: '+5% Coins, RP, Gems, Leaves, Essence & Time Tokens per Purple Square',
    barClass: 'from-purple-600 to-purple-400',
    squareClass: 'bg-purple-500 border-purple-300',
    textClass: 'text-purple-300',
    borderClass: 'border-purple-500/50'
  },
  {
    id: 'violet',
    name: 'Violet',
    baseXpNeeded: 15_625,
    baseXpPerSec: 64,
    xpGrowth: IDEAL_XP_GROWTH,
    unlockPrevLevel: IDEAL_UNLOCK_LEVEL,
    boostSummary: '+5% All Currencies & Idle XP Speed per Violet Square',
    barClass: 'from-fuchsia-500 to-violet-400',
    squareClass: 'bg-violet-500 border-violet-300',
    textClass: 'text-violet-300',
    borderClass: 'border-violet-500/50'
  }
];

// Base Boosting Cap (1.00e+50) — multiplied by 10x every Time Reset!
export const BASE_BOOST_CAP = 1e50;

// Coin Core Level-Up (1.1x cost scale, NO level cap!)
export const CLICKER_BASE_COST = 60;
export const CLICKER_COST_SCALE = 1.1;

// Singularity Core Level Cap
export const SINGULARITY_CORE_MAX_LEVEL = 100;

// Upgrade / Perk Max Tiers
export const UPGRADE_MAX_TIER = 30;
export const LAYER_PERK_MAX_TIER = 30;
export const ESSENCE_CONVERGENCE_MAX_TIER = 50;

// Essence Reactor (Appears after every Singularity upgrade has been bought)
export const ESSENCE_REACTOR_BASE_COST = 5;
export const ESSENCE_REACTOR_COST_SCALE = 1.45;
export const ESSENCE_REACTOR_MAX_LEVEL = 100;

// 1 Billion Singularity Essence Threshold & Upgrades
export const BILLION_ESSENCE_THRESHOLD = 1_000_000_000; // 1B Essence

export const CLICKER_EVOLUTIONS: ClickerEvolution[] = [
  {
    minLevel: 1,
    name: 'Copper Coin',
    subtitle: 'Basic Coin Core',
    coinBoostMultiplier: 1,
    companionCount: 0,
    gradient: 'from-amber-300 via-amber-500 to-amber-700',
    ringColor: 'border-amber-300/70',
    glowColor: 'from-amber-500/15'
  },
  {
    minLevel: 10,
    name: 'Gilded Sovereign',
    subtitle: 'Refined Gold Core',
    coinBoostMultiplier: 1.35,
    companionCount: 1,
    gradient: 'from-yellow-200 via-amber-400 to-orange-600',
    ringColor: 'border-yellow-200/80',
    glowColor: 'from-yellow-400/20'
  },
  {
    minLevel: 25,
    name: 'Prism Resonator',
    subtitle: 'Crystalline Core',
    coinBoostMultiplier: 1.9,
    companionCount: 2,
    gradient: 'from-fuchsia-300 via-purple-500 to-indigo-700',
    ringColor: 'border-fuchsia-300/80',
    glowColor: 'from-purple-500/25'
  },
  {
    minLevel: 50,
    name: 'Solar Corona',
    subtitle: 'Fusion Mint Core',
    coinBoostMultiplier: 2.8,
    companionCount: 3,
    gradient: 'from-orange-200 via-rose-500 to-red-700',
    ringColor: 'border-orange-200/80',
    glowColor: 'from-orange-500/25'
  },
  {
    minLevel: 100,
    name: 'Quantum Relic',
    subtitle: 'Subatomic Core',
    coinBoostMultiplier: 4.2,
    companionCount: 4,
    gradient: 'from-cyan-200 via-sky-500 to-blue-800',
    ringColor: 'border-cyan-200/80',
    glowColor: 'from-cyan-500/25'
  },
  {
    minLevel: 175,
    name: 'Astral Crown',
    subtitle: 'Celestial Core',
    coinBoostMultiplier: 6.5,
    companionCount: 5,
    gradient: 'from-emerald-200 via-teal-500 to-emerald-800',
    ringColor: 'border-emerald-200/80',
    glowColor: 'from-emerald-500/25'
  },
  {
    minLevel: 250,
    name: 'Singularity Heart',
    subtitle: 'Omega Coin Core',
    coinBoostMultiplier: 10,
    companionCount: 6,
    gradient: 'from-rose-300 via-fuchsia-500 to-cyan-400',
    ringColor: 'border-white/80',
    glowColor: 'from-pink-500/30'
  }
];

export function getClickerEvolution(level: number): ClickerEvolution {
  let current = CLICKER_EVOLUTIONS[0];
  for (const evo of CLICKER_EVOLUTIONS) {
    if (level >= evo.minLevel) current = evo;
  }
  return current;
}

export function getNextClickerEvolution(level: number): ClickerEvolution | null {
  for (const evo of CLICKER_EVOLUTIONS) {
    if (level < evo.minLevel) return evo;
  }
  return null;
}

// 18 Buildings — steeply higher costs after Alchemy Forge (b6), with 2x output every 25 owned!
const RAW_BUILDINGS: (Omit<Building, 'baseCost' | 'baseCps' | 'unlockCoins'> & {
  baseCost: number;
  baseCps: number;
  unlockCoins: number;
})[] = [
  { id: 'b1', name: 'Auto Clicker', baseCost: 25, baseCps: 1, scaleFactor: 1.14, count: 0, icon: '👆', unlockCoins: 0 },
  { id: 'b2', name: 'Bronze Pickaxe', baseCost: 180, baseCps: 6, scaleFactor: 1.145, count: 0, icon: '⛏️', unlockCoins: 50 },
  { id: 'b3', name: 'Coin Press', baseCost: 1500, baseCps: 38, scaleFactor: 1.15, count: 0, icon: '⚙️', unlockCoins: 400 },
  { id: 'b4', name: 'Gold Mine', baseCost: 16000, baseCps: 260, scaleFactor: 1.155, count: 0, icon: '⛰️', unlockCoins: 4000 },
  { id: 'b5', name: 'Treasury Vault', baseCost: 190000, baseCps: 1900, scaleFactor: 1.16, count: 0, icon: '🏦', unlockCoins: 45000 },
  { id: 'b6', name: 'Alchemy Forge', baseCost: 2400000, baseCps: 15000, scaleFactor: 1.165, count: 0, icon: '✨', unlockCoins: 500000 },
  // Post-Alchemy Forge: Steep cost jump!
  { id: 'b7', name: 'Dragon Hoard', baseCost: 5e8, baseCps: 1.5e6, scaleFactor: 1.2, count: 0, icon: '🐉', unlockCoins: 5e7 },
  { id: 'b8', name: 'Meteor Harvester', baseCost: 2.5e10, baseCps: 4.5e7, scaleFactor: 1.21, count: 0, icon: '☄️', unlockCoins: 2.5e9 },
  { id: 'b9', name: 'Solar Foundry', baseCost: 1.5e12, baseCps: 1.5e9, scaleFactor: 1.22, count: 0, icon: '☀️', unlockCoins: 1.5e11 },
  { id: 'b10', name: 'Dimensional Siphon', baseCost: 1.0e14, baseCps: 6.0e10, scaleFactor: 1.23, count: 0, icon: '🌀', unlockCoins: 1.0e13 },
  { id: 'b11', name: 'Singularity Mint', baseCost: 8.0e15, baseCps: 2.8e12, scaleFactor: 1.24, count: 0, icon: '🕳️', unlockCoins: 8.0e14 },
  { id: 'b12', name: 'Cosmic Reserve', baseCost: 7.5e17, baseCps: 1.4e14, scaleFactor: 1.25, count: 0, icon: '🌌', unlockCoins: 7.5e16 },
  { id: 'b13', name: 'Nebula Refinery', baseCost: 8.0e19, baseCps: 8.0e15, scaleFactor: 1.26, count: 0, icon: '🌠', unlockCoins: 8.0e18 },
  { id: 'b14', name: 'Pulsar Dynamo', baseCost: 9.5e21, baseCps: 5.0e17, scaleFactor: 1.27, count: 0, icon: '⚡', unlockCoins: 9.5e20 },
  { id: 'b15', name: 'Quasar Loom', baseCost: 1.2e24, baseCps: 3.5e19, scaleFactor: 1.28, count: 0, icon: '💫', unlockCoins: 1.2e23 },
  { id: 'b16', name: 'Void Cathedral', baseCost: 1.8e26, baseCps: 2.6e21, scaleFactor: 1.29, count: 0, icon: '🏛️', unlockCoins: 1.8e25 },
  { id: 'b17', name: 'Eternity Engine', baseCost: 3.0e28, baseCps: 2.2e23, scaleFactor: 1.3, count: 0, icon: '⏳', unlockCoins: 3.0e27 },
  { id: 'b18', name: 'Infinity Nexus', baseCost: 6.0e30, baseCps: 2.0e25, scaleFactor: 1.32, count: 0, icon: '♾️', unlockCoins: 6.0e29 }
];

export const INITIAL_BUILDINGS: Building[] = RAW_BUILDINGS.map((b) => ({
  ...b,
  baseCost: toDec(b.baseCost),
  baseCps: toDec(b.baseCps),
  unlockCoins: toDec(b.unlockCoins)
}));

const RAW_UPGRADE_TRACKS: (Omit<UpgradeTrackState, 'baseCost'> & { baseCost: number })[] = [
  {
    id: 'trk_click',
    name: 'Kinetic Click Mastery',
    description: 'Multiplies manual click power by 2.5x per tier (soft cap T15, max T30)',
    category: 'click',
    tier: 1,
    maxTier: UPGRADE_MAX_TIER,
    baseCost: 150,
    costScale: 14,
    effectMultiplier: 2.5,
    icon: '🖱️'
  },
  {
    id: 'trk_global',
    name: 'Global Overclock',
    description: 'Multiplies ALL building production by 2x per tier (soft cap T15, max T30)',
    category: 'global',
    tier: 1,
    maxTier: UPGRADE_MAX_TIER,
    baseCost: 12000,
    costScale: 22,
    effectMultiplier: 2,
    icon: '🔥'
  },
  {
    id: 'trk_synergy',
    name: 'Synergy Matrix',
    description: 'Adds +5% global CPS for every 10 buildings owned per tier (soft cap T15, max T30)',
    category: 'synergy',
    tier: 1,
    maxTier: UPGRADE_MAX_TIER,
    baseCost: 250000,
    costScale: 35,
    effectMultiplier: 1,
    icon: '🔗'
  },
  {
    id: 'trk_omni_coin',
    name: 'Universal Coin Catalyst',
    description: 'Multiplies EVERYTHING (Coins, RP, Gems, Leaves, Essence, Tokens & Idle XP) by 1.65x per tier (max T30)',
    category: 'omni',
    tier: 1,
    maxTier: UPGRADE_MAX_TIER,
    baseCost: 5_000_000,
    costScale: 24,
    effectMultiplier: 1.65,
    icon: '🌟'
  },
  {
    id: 'trk_crit_forge',
    name: 'Omega Critical Forge',
    description: 'Multiplies Click Power by 1.8x AND Everything by 1.35x per tier (max T30)',
    category: 'omni',
    tier: 1,
    maxTier: UPGRADE_MAX_TIER,
    baseCost: 500_000_000,
    costScale: 26,
    effectMultiplier: 1.8,
    icon: '💥'
  },
  {
    id: 'trk_passive_harmony',
    name: 'Harmonic Production Core',
    description: 'Multiplies Passive CPS by 1.75x AND Everything by 1.35x per tier (max T30)',
    category: 'omni',
    tier: 1,
    maxTier: UPGRADE_MAX_TIER,
    baseCost: 50_000_000_000,
    costScale: 28,
    effectMultiplier: 1.75,
    icon: '🎵'
  },
  {
    id: 'trk_astral_mint',
    name: 'Astral Omni-Mint',
    description: 'Multiplies EVERYTHING across all game layers by 1.9x per tier (max T30)',
    category: 'omni',
    tier: 1,
    maxTier: UPGRADE_MAX_TIER,
    baseCost: 50_000_000_000_000,
    costScale: 32,
    effectMultiplier: 1.9,
    icon: '♾️'
  },
  ...RAW_BUILDINGS.map((b, idx) => ({
    id: `trk_${b.id}`,
    name: `${b.name} Overdrive`,
    description: `Multiplies ${b.name} output by 3x per tier (soft cap T15, max T30)`,
    category: 'building' as const,
    targetBuildingId: b.id,
    tier: 1,
    maxTier: UPGRADE_MAX_TIER,
    baseCost: Math.floor(b.baseCost * 18),
    costScale: 24 + idx * 1.5,
    effectMultiplier: 3,
    icon: b.icon
  }))
];

export const INITIAL_UPGRADE_TRACKS: UpgradeTrackState[] = RAW_UPGRADE_TRACKS.map((u) => ({
  ...u,
  baseCost: toDec(u.baseCost)
}));

// Harder Rebirth Shop Perks (Max Tier 30)
const RAW_REBIRTH_PERKS: RawDecimalFields<TieredPerk>[] = [
  {
    id: 'rp_treasury',
    name: 'Starting Treasury',
    description: 'Start every Rebirth run with instant bonus coins',
    tier: 1,
    maxTier: LAYER_PERK_MAX_TIER,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 5,
    baseCost: 3,
    costScale: 2.1,
    bonusPerLevel: 2500,
    bonusUnit: 'Coins',
    icon: '💰'
  },
  {
    id: 'rp_tapper',
    name: 'Super Tapper',
    description: 'Permanently boosts manual click power',
    tier: 1,
    maxTier: LAYER_PERK_MAX_TIER,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 5,
    baseCost: 4,
    costScale: 2.05,
    bonusPerLevel: 50,
    bonusUnit: '% Click',
    icon: '👆'
  },
  {
    id: 'rp_mines',
    name: 'Overclocked Mines',
    description: 'Increases all building passive output',
    tier: 1,
    maxTier: LAYER_PERK_MAX_TIER,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 5,
    baseCost: 5,
    costScale: 2.15,
    bonusPerLevel: 35,
    bonusUnit: '% CPS',
    icon: '⚡'
  },
  {
    id: 'rp_discount',
    name: 'Discount Architect',
    description: 'Reduces building purchase prices (capped at 75% off)',
    tier: 1,
    maxTier: LAYER_PERK_MAX_TIER,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 5,
    baseCost: 6,
    costScale: 2.25,
    bonusPerLevel: 5,
    bonusUnit: '% Off',
    icon: '🏷️'
  },
  {
    id: 'rp_autopulse',
    name: 'Cosmic Auto-Pulse',
    description: 'Automatically clicks the coin every second',
    tier: 1,
    maxTier: LAYER_PERK_MAX_TIER,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 5,
    baseCost: 8,
    costScale: 2.3,
    bonusPerLevel: 2,
    bonusUnit: 'Clicks/s',
    icon: '⏰'
  },
  {
    id: 'rp_bulk',
    name: 'Bulk Mastery',
    description: 'Each building count adds compounding self-bonus',
    tier: 1,
    maxTier: LAYER_PERK_MAX_TIER,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 5,
    baseCost: 8,
    costScale: 2.35,
    bonusPerLevel: 1.5,
    bonusUnit: '%/bldg',
    icon: '📦'
  },
  {
    id: 'rp_retainer',
    name: 'Rebirth Retainer',
    description: 'Retain a share of your Coins across Rebirths (hard cap 100%)',
    tier: 1,
    maxTier: LAYER_PERK_MAX_TIER,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 5,
    baseCost: 12,
    costScale: 2.5,
    bonusPerLevel: 4,
    bonusUnit: '% Kept',
    icon: '🛡️'
  },
  {
    id: 'rp_resonance',
    name: 'RP Formula Amplifier',
    description: 'Amplifies the Rebirth Points → Coins curve before the 1e+50 cap',
    tier: 1,
    maxTier: LAYER_PERK_MAX_TIER,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 5,
    baseCost: 10,
    costScale: 2.4,
    bonusPerLevel: 15,
    bonusUnit: '% Formula',
    icon: '🌟'
  },
  {
    id: 'rp_omni_spark',
    name: 'Rebirth Omni-Spark',
    description: 'Boosts EVERYTHING (Coins, RP, Gems, Leaves, Essence, Tokens & Idle XP)',
    tier: 1,
    maxTier: LAYER_PERK_MAX_TIER,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 5,
    baseCost: 15,
    costScale: 2.35,
    bonusPerLevel: 25,
    bonusUnit: '% Everything',
    icon: '🌌'
  },
  {
    id: 'rp_hyper_click',
    name: 'Ascendant Click Flux',
    description: 'Supercharges Manual Clicks & boosts Everything across all layers',
    tier: 1,
    maxTier: LAYER_PERK_MAX_TIER,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 5,
    baseCost: 20,
    costScale: 2.4,
    bonusPerLevel: 80,
    bonusUnit: '% Click & All',
    icon: '💫'
  },
  {
    id: 'rp_cosmic_tribute',
    name: 'Cosmic Tribute',
    description: 'Multiplies Rebirth Points gained and boosts Everything',
    tier: 1,
    maxTier: LAYER_PERK_MAX_TIER,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 5,
    baseCost: 25,
    costScale: 2.45,
    bonusPerLevel: 40,
    bonusUnit: '% RP & All',
    icon: '👑'
  }
];

export const INITIAL_REBIRTH_PERKS: TieredPerk[] = hydrateDecimalPerks(RAW_REBIRTH_PERKS);

// Ascended Rebirth Upgrades (Unlocked after maxing all Rebirth Shop perks; baseCost anchors dynamically to last buy price)
const RAW_ASCENDED_REBIRTH_PERKS: RawDecimalFields<TieredPerk>[] = [
  {
    id: 'arp_rp_mult',
    name: 'Ascended RP Surge',
    description: 'Exponentially multiplies Rebirth Points gained from Rebirthing',
    tier: 1,
    maxTier: LAYER_PERK_MAX_TIER,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 5,
    baseCost: 0,
    costScale: 2.35,
    bonusPerLevel: 150,
    bonusUnit: '% RP Gain',
    icon: '🔮'
  },
  {
    id: 'arp_rp_conduit',
    name: 'Eternal RP Conduit',
    description: 'Adds massive base Rebirth Points/sec scaled by your Prestige & Tree multipliers',
    tier: 1,
    maxTier: LAYER_PERK_MAX_TIER,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 5,
    baseCost: 0,
    costScale: 2.35,
    bonusPerLevel: 500,
    bonusUnit: 'RP/sec',
    icon: '🌀'
  },
  {
    id: 'arp_gem_mult',
    name: 'Gemstone Prism',
    description: 'Multiplies Gems earned from Cosmic Prestige resets',
    tier: 1,
    maxTier: LAYER_PERK_MAX_TIER,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 5,
    baseCost: 0,
    costScale: 2.45,
    bonusPerLevel: 50,
    bonusUnit: '% Gem Gain',
    icon: '💠'
  },
  {
    id: 'arp_gem_gen',
    name: 'Ascended Gem Vein',
    description: 'Passively extracts Gems every second',
    tier: 1,
    maxTier: LAYER_PERK_MAX_TIER,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 5,
    baseCost: 0,
    costScale: 2.45,
    bonusPerLevel: 5,
    bonusUnit: 'Gems/sec',
    icon: '💎'
  }
];

export const INITIAL_ASCENDED_REBIRTH_PERKS: TieredPerk[] = hydrateDecimalPerks(RAW_ASCENDED_REBIRTH_PERKS);

// Harder Prestige Upgrades (Stop at Tier 10, surge 10x at upper tiers!)
const RAW_PRESTIGE_UPGRADES: RawDecimalFields<TieredPerk>[] = [
  {
    id: 'pu_conduit',
    name: 'Rebirth Conduit',
    description: 'Generates +1 RP/s at Lv.1; scales by 10x per tier at high Prestige!',
    tier: 1,
    maxTier: LAYER_PERK_MAX_TIER,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 10,
    baseCost: 2,
    costScale: 2.1,
    bonusPerLevel: 1,
    bonusUnit: 'RP/sec',
    icon: '🔋'
  },
  {
    id: 'pu_midas',
    name: 'Crown of Midas',
    description: 'Manual clicks gain a percentage of passive CPS (10x surge in upper tiers)',
    tier: 1,
    maxTier: LAYER_PERK_MAX_TIER,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 5,
    baseCost: 3,
    costScale: 2.25,
    bonusPerLevel: 2,
    bonusUnit: '% CPS/click',
    icon: '👑'
  },
  {
    id: 'pu_hourglass',
    name: 'Chrono Hourglass',
    description: 'Accelerates internal game clock speed (10x surge in upper tiers)',
    tier: 1,
    maxTier: LAYER_PERK_MAX_TIER,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 5,
    baseCost: 5,
    costScale: 2.35,
    bonusPerLevel: 25,
    bonusUnit: '% Speed',
    icon: '⏳'
  },
  {
    id: 'pu_crucible',
    name: 'Philosophers Crucible',
    description: 'Multiplies Rebirth Points gained when Rebirthing (10x surge in upper tiers)',
    tier: 1,
    maxTier: LAYER_PERK_MAX_TIER,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 5,
    baseCost: 5,
    costScale: 2.3,
    bonusPerLevel: 75,
    bonusUnit: '% Rebirth RP',
    icon: '⚗️'
  },
  {
    id: 'pu_memory',
    name: 'Ancestral Memory',
    description: 'Retains Rebirth Levels when triggering Prestige',
    tier: 1,
    maxTier: LAYER_PERK_MAX_TIER,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 5,
    baseCost: 8,
    costScale: 2.5,
    bonusPerLevel: 1,
    bonusUnit: 'Lvls Kept',
    icon: '📜'
  },
  {
    id: 'pu_crit',
    name: 'Critical Overdrive',
    description: 'Grants critical click chance (hard cap 75%) & crit scaling',
    tier: 1,
    maxTier: LAYER_PERK_MAX_TIER,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 5,
    baseCost: 5,
    costScale: 2.25,
    bonusPerLevel: 5,
    bonusUnit: '% Crit',
    icon: '💥'
  },
  {
    id: 'pu_omni_prism',
    name: 'Prismatic Omni-Amplifier',
    description: 'Boosts EVERYTHING (Coins, RP, Gems, Leaves, Essence, Tokens & Idle XP)',
    tier: 1,
    maxTier: LAYER_PERK_MAX_TIER,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 5,
    baseCost: 12,
    costScale: 2.35,
    bonusPerLevel: 35,
    bonusUnit: '% Everything',
    icon: '💠'
  },
  {
    id: 'pu_gem_furnace',
    name: 'Astral Gem Furnace',
    description: 'Multiplies Gems gained & boosts Everything across all layers',
    tier: 1,
    maxTier: LAYER_PERK_MAX_TIER,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 5,
    baseCost: 16,
    costScale: 2.4,
    bonusPerLevel: 50,
    bonusUnit: '% Gems & All',
    icon: '💎'
  },
  {
    id: 'pu_stellar_dynamo',
    name: 'Stellar Layer Dynamo',
    description: 'Amplifies Coins, RP & Everything across the universe',
    tier: 1,
    maxTier: LAYER_PERK_MAX_TIER,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 5,
    baseCost: 20,
    costScale: 2.45,
    bonusPerLevel: 45,
    bonusUnit: '% Everything',
    icon: '🌠'
  }
];

export const INITIAL_PRESTIGE_UPGRADES: TieredPerk[] = hydrateDecimalPerks(RAW_PRESTIGE_UPGRADES);

// Skill Tree (Own Section & Own Currency: Leaves 🍃, resets Prestige + Rebirth + Coins)
const RAW_SKILL_NODES: RawDecimalFields<SkillNode>[] = [
  {
    id: 'sk_root',
    name: 'Cosmic Awakening',
    description: 'Root of the World Tree: multiplies Coins, RP, and Gem gains',
    branch: 'root',
    requires: [],
    tier: 1,
    maxTier: LAYER_PERK_MAX_TIER,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 5,
    baseCost: 1,
    costScale: 2.0,
    bonusPerLevel: 75,
    bonusUnit: '% All Yield',
    icon: '🌳'
  },
  {
    id: 'sk_scale',
    name: 'Stellar Architecture',
    description: 'Reduces cost scaling factors across the board (disappears at 60%)',
    branch: 'wealth',
    requires: ['sk_root'],
    tier: 1,
    maxTier: LAYER_PERK_MAX_TIER,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 5,
    baseCost: 2,
    costScale: 2.1,
    bonusPerLevel: 3,
    bonusUnit: '% Scale Red.',
    icon: '📐'
  },
  {
    id: 'sk_mints',
    name: 'Galactic Mints',
    description: 'Exponentially amplifies all building production',
    branch: 'wealth',
    requires: ['sk_scale'],
    tier: 1,
    maxTier: LAYER_PERK_MAX_TIER,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 5,
    baseCost: 4,
    costScale: 2.2,
    bonusPerLevel: 120,
    bonusUnit: '% Bldg CPS',
    icon: '🏭'
  },
  {
    id: 'sk_fountain',
    name: 'Temporal Fountain',
    description: 'Multiplies your Rebirth Conduit RP/sec output per rank',
    branch: 'rebirth',
    requires: ['sk_root'],
    tier: 1,
    maxTier: LAYER_PERK_MAX_TIER,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 8,
    baseCost: 2,
    costScale: 2.0,
    bonusPerLevel: 100,
    bonusUnit: '% RP/s Mult',
    icon: '🌊'
  },
  {
    id: 'sk_prestige_gen',
    name: 'Gem Nexus',
    description: 'Generates Gems passively every second!',
    branch: 'rebirth',
    requires: ['sk_fountain'],
    tier: 1,
    maxTier: LAYER_PERK_MAX_TIER,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 5,
    baseCost: 3,
    costScale: 2.2,
    bonusPerLevel: 1,
    bonusUnit: 'Gems/sec',
    icon: '💎'
  },
  {
    id: 'sk_clicker',
    name: 'Hyper Coin Core',
    description: 'Amplifies your Coin Core click multiplier & companion rate',
    branch: 'clicker',
    requires: ['sk_root'],
    tier: 1,
    maxTier: LAYER_PERK_MAX_TIER,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 5,
    baseCost: 2,
    costScale: 2.0,
    bonusPerLevel: 50,
    bonusUnit: '% Core',
    icon: '🍪'
  },
  {
    id: 'sk_supercrit',
    name: 'Supernova Crits',
    description: 'Increases Critical Hit multiplier (+4x per rank)',
    branch: 'clicker',
    requires: ['sk_clicker'],
    tier: 1,
    maxTier: LAYER_PERK_MAX_TIER,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 5,
    baseCost: 4,
    costScale: 2.15,
    bonusPerLevel: 4,
    bonusUnit: 'x Crit Mult',
    icon: '☄️'
  },
  {
    id: 'sk_leaf_surge',
    name: 'Canopy Harvest',
    description: 'Multiplies Leaves earned from Tree Resets and Yggdrasil Conduit output',
    branch: 'wealth',
    requires: ['sk_mints'],
    tier: 1,
    maxTier: LAYER_PERK_MAX_TIER,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 5,
    baseCost: 8,
    costScale: 2.3,
    bonusPerLevel: 75,
    bonusUnit: '% Leaves',
    icon: '🌿'
  },
  {
    id: 'sk_gem_boost',
    name: 'Prismatic Resonance',
    description: 'Multiplies Gems gained from Prestige & Gem Nexus output',
    branch: 'rebirth',
    requires: ['sk_prestige_gen'],
    tier: 1,
    maxTier: LAYER_PERK_MAX_TIER,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 5,
    baseCost: 8,
    costScale: 2.3,
    bonusPerLevel: 100,
    bonusUnit: '% Gems',
    icon: '💠'
  },
  {
    id: 'sk_essence_echo',
    name: 'Astral Echo',
    description: 'Multiplies Singularity Essence gain & Idle XP speed',
    branch: 'clicker',
    requires: ['sk_supercrit'],
    tier: 1,
    maxTier: LAYER_PERK_MAX_TIER,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 5,
    baseCost: 10,
    costScale: 2.35,
    bonusPerLevel: 25,
    bonusUnit: '% Essence/XP',
    icon: '✨'
  },
  {
    id: 'sk_vanguard',
    name: 'Singularity Vanguard',
    description: 'Converges all branches: massively multiplies Leaves, Gems, RP & Coins',
    branch: 'capstone',
    requires: ['sk_leaf_surge', 'sk_gem_boost', 'sk_essence_echo'],
    tier: 1,
    maxTier: LAYER_PERK_MAX_TIER,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 5,
    baseCost: 16,
    costScale: 2.5,
    bonusPerLevel: 300,
    bonusUnit: '% Hyper-All',
    icon: '🕳️'
  },
  {
    id: 'sk_omni_tree',
    name: 'World Tree Heart',
    description: 'Apex Skill Tree node: multiplies Coins, RP, Gems, Leaves & Idle XP',
    branch: 'capstone',
    requires: ['sk_vanguard'],
    tier: 1,
    maxTier: LAYER_PERK_MAX_TIER,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 5,
    baseCost: 30,
    costScale: 2.6,
    bonusPerLevel: 500,
    bonusUnit: '% Omni-Yield',
    icon: '🌟'
  },
  {
    id: 'sk_chrono_canopy',
    name: 'Chrono Canopy',
    description: 'Boosts EVERYTHING including Time Tokens & Idle XP',
    branch: 'capstone',
    requires: ['sk_omni_tree'],
    tier: 1,
    maxTier: LAYER_PERK_MAX_TIER,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 5,
    baseCost: 45,
    costScale: 2.55,
    bonusPerLevel: 50,
    bonusUnit: '% Everything',
    icon: '⏳'
  },
  {
    id: 'sk_void_sap',
    name: 'Void Sap Conduit',
    description: 'Channels World Tree sap into Singularity Essence & Everything',
    branch: 'capstone',
    requires: ['sk_omni_tree'],
    tier: 1,
    maxTier: LAYER_PERK_MAX_TIER,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 5,
    baseCost: 55,
    costScale: 2.6,
    bonusPerLevel: 60,
    bonusUnit: '% Essence & All',
    icon: '🕳️'
  },
  {
    id: 'sk_cosmic_blossom',
    name: 'Cosmic World Blossom',
    description: 'Blooms across all dimensions, boosting EVERYTHING exponentially',
    branch: 'capstone',
    requires: ['sk_omni_tree'],
    tier: 1,
    maxTier: LAYER_PERK_MAX_TIER,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 5,
    baseCost: 70,
    costScale: 2.65,
    bonusPerLevel: 75,
    bonusUnit: '% Everything',
    icon: '🌸'
  }
];

export const INITIAL_SKILL_NODES: SkillNode[] = hydrateDecimalPerks(RAW_SKILL_NODES);

// Singularity Upgrades: All start at 1 Essence and increase 10x per purchase!
const RAW_SINGULARITY_UPGRADES: RawDecimalFields<SingularityUpgrade>[] = [
  {
    id: 'su_tree_gen',
    name: 'Yggdrasil Conduit',
    description: 'Generates Leaves/sec — output grows exponentially (+50% compound per level & doubles per tier)!',
    tier: 1,
    maxTier: 10,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 5,
    baseCost: 1,
    costScale: 10,
    bonusPerLevel: 1,
    bonusUnit: 'Leaves/sec base',
    icon: '🍃'
  },
  {
    id: 'su_compression',
    name: 'Horizon Compression',
    description: 'Reduces ALL cost scaling factors across Buildings, Coin Core, and Perks',
    tier: 1,
    maxTier: 10,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 5,
    baseCost: 1,
    costScale: 10,
    bonusPerLevel: 5,
    bonusUnit: '% Scale Red.',
    icon: '🗜️'
  },
  {
    id: 'su_primordial',
    name: 'Primordial Rebirth Spark',
    description: 'Start every reset with instant RP & +5x RP/sec',
    tier: 1,
    maxTier: 10,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 5,
    baseCost: 1,
    costScale: 10,
    bonusPerLevel: 500,
    bonusUnit: 'Start RP',
    icon: '✨'
  },
  {
    id: 'su_darkenergy',
    name: 'Dark Energy Singularity',
    description: 'Multiplies Gems, Leaves & Coin Core power',
    tier: 1,
    maxTier: 10,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 5,
    baseCost: 1,
    costScale: 10,
    bonusPerLevel: 250,
    bonusUnit: '% Gems/Leaves/Core',
    icon: '🌑'
  },
  {
    id: 'su_auto_buildings',
    name: 'Auto-Buy Buildings',
    description: 'Unlocks individual ON/OFF auto-buy toggles for every Building',
    tier: 1,
    maxTier: 1,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 1,
    baseCost: 1,
    costScale: 10,
    bonusPerLevel: 1,
    bonusUnit: 'Unlock',
    icon: '🏗️'
  },
  {
    id: 'su_auto_upgrades',
    name: 'Auto-Buy Upgrades',
    description: 'Separate automation module: automatically purchases coin Upgrades',
    tier: 1,
    maxTier: 1,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 1,
    baseCost: 1,
    costScale: 10,
    bonusPerLevel: 1,
    bonusUnit: 'Unlock',
    icon: '⚡'
  },
  {
    id: 'su_auto_rebirth',
    name: 'Auto-Buy Rebirth Upgrades',
    description: 'Automatically buys Rebirth Shop perks whenever you have Rebirth Points',
    tier: 1,
    maxTier: 1,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 1,
    baseCost: 1,
    costScale: 10,
    bonusPerLevel: 1,
    bonusUnit: 'Unlock',
    icon: '♻️'
  },
  {
    id: 'su_auto_prestige',
    name: 'Auto-Buy Prestige Upgrades',
    description: 'Automatically buys Prestige Upgrades whenever you have Gems',
    tier: 1,
    maxTier: 1,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 1,
    baseCost: 1,
    costScale: 10,
    bonusPerLevel: 1,
    bonusUnit: 'Unlock',
    icon: '💎'
  },
  {
    id: 'su_auto_skill_tree',
    name: 'Auto-Buy Skill Tree',
    description: 'Automatically trains unlocked Skill Tree nodes whenever you have Leaves',
    tier: 1,
    maxTier: 1,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 1,
    baseCost: 1,
    costScale: 10,
    bonusPerLevel: 1,
    bonusUnit: 'Unlock',
    icon: '🍃'
  },
  {
    id: 'su_auto_clicker',
    name: 'Auto-Level Coin Core',
    description: 'Automatically upgrades your Coin Core when affordable',
    tier: 1,
    maxTier: 1,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 1,
    baseCost: 1,
    costScale: 10,
    bonusPerLevel: 1,
    bonusUnit: 'Unlock',
    icon: '🪙'
  },
  {
    id: 'su_omni_singularity',
    name: 'Singularity Omni-Core',
    description: '30-Tier Singularity upgrade boosting EVERYTHING across all layers',
    tier: 1,
    maxTier: LAYER_PERK_MAX_TIER,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 4,
    baseCost: 1,
    costScale: 1.45,
    bonusPerLevel: 100,
    bonusUnit: '% Everything',
    icon: '🌀'
  },
  {
    id: 'su_essence_surge',
    name: 'Void Essence Surge',
    description: '30-Tier upgrade amplifying Singularity Essence & Everything',
    tier: 1,
    maxTier: LAYER_PERK_MAX_TIER,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 4,
    baseCost: 1,
    costScale: 1.48,
    bonusPerLevel: 80,
    bonusUnit: '% Essence & All',
    icon: '🕳️'
  },
  {
    id: 'su_stellar_nexus',
    name: 'Astral Singularity Nexus',
    description: '30-Tier cosmic nexus multiplying Everything exponentially',
    tier: 1,
    maxTier: LAYER_PERK_MAX_TIER,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 4,
    baseCost: 1,
    costScale: 1.5,
    bonusPerLevel: 120,
    bonusUnit: '% Everything',
    icon: '🌟'
  }
];

export const INITIAL_SINGULARITY_UPGRADES: SingularityUpgrade[] = hydrateDecimalPerks(RAW_SINGULARITY_UPGRADES);

// 50-Tier Singularity Essence Gain Upgrades (Unlocked after all Rebirth, Prestige & Skill Tree upgrades are maxed!)
const RAW_ESSENCE_CONVERGENCE_UPGRADES: RawDecimalFields<EssenceConvergenceUpgrade>[] = [
  {
    id: 'ec_rp_syphon',
    name: 'Void RP Syphon',
    description: 'Channels maxed Rebirth mastery into Singularity Essence gain from resets & reactor',
    currency: 'rebirthPoints',
    tier: 1,
    maxTier: ESSENCE_CONVERGENCE_MAX_TIER,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 5,
    baseCost: 1_000_000,
    costScale: 1.45,
    bonusPerLevel: 100,
    bonusUnit: '% Essence Gain',
    icon: '🟣'
  },
  {
    id: 'ec_gem_prism',
    name: 'Prismatic Singularity Lens',
    description: 'Refracts Gems into massive Singularity Essence amplification across 50 tiers',
    currency: 'prestigePoints',
    tier: 1,
    maxTier: ESSENCE_CONVERGENCE_MAX_TIER,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 5,
    baseCost: 100_000,
    costScale: 1.45,
    bonusPerLevel: 125,
    bonusUnit: '% Essence Gain',
    icon: '💎'
  },
  {
    id: 'ec_leaf_bloom',
    name: 'Yggdrasil Void Bloom',
    description: 'Converts World Tree Leaves into surging Singularity Essence yield',
    currency: 'treePoints',
    tier: 1,
    maxTier: ESSENCE_CONVERGENCE_MAX_TIER,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 5,
    baseCost: 10_000,
    costScale: 1.45,
    bonusPerLevel: 150,
    bonusUnit: '% Essence Gain',
    icon: '🍃'
  },
  {
    id: 'ec_essence_core',
    name: 'Event Horizon Resonator',
    description: 'Self-amplifies Singularity Essence from Singularity resets & Essence Reactor',
    currency: 'singularityEssence',
    tier: 1,
    maxTier: ESSENCE_CONVERGENCE_MAX_TIER,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 5,
    baseCost: 50,
    costScale: 1.35,
    bonusPerLevel: 200,
    bonusUnit: '% Essence Gain',
    icon: '🕳️'
  }
];

export const INITIAL_ESSENCE_CONVERGENCE_UPGRADES: EssenceConvergenceUpgrade[] = hydrateDecimalPerks(
  RAW_ESSENCE_CONVERGENCE_UPGRADES
);

// Astral Horizon Upgrades (Unlocked after reaching 1 Billion Singularity Essence)
const RAW_BILLION_ESSENCE_UPGRADES: RawDecimalFields<SingularityUpgrade>[] = [
  {
    id: 'be_essence_nova',
    name: 'Singularity Nova',
    description: 'Explosively multiplies Singularity Essence gained from resets & reactor',
    tier: 1,
    maxTier: 25,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 5,
    baseCost: 1_000_000_000,
    costScale: 2.2,
    bonusPerLevel: 150,
    bonusUnit: '% Essence Gain',
    icon: '🌠'
  },
  {
    id: 'be_reactor_overdrive',
    name: 'Reactor Overdrive',
    description: 'Directly amplifies Primordial Essence Reactor Essence/sec output',
    tier: 1,
    maxTier: 25,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 5,
    baseCost: 2_500_000_000,
    costScale: 2.25,
    bonusPerLevel: 200,
    bonusUnit: '% Reactor',
    icon: '⚛️'
  },
  {
    id: 'be_chrono_catalyst',
    name: 'Chrono-Token Catalyst',
    description: 'Multiplies Time Tokens gained whenever you perform a Time Reset',
    tier: 1,
    maxTier: 20,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 5,
    baseCost: 5_000_000_000,
    costScale: 2.4,
    bonusPerLevel: 50,
    bonusUnit: '% Time Tokens',
    icon: '⏳'
  },
  {
    id: 'be_spectrum_accel',
    name: 'Spectrum Accelerator',
    description: 'Accelerates Idle XP gain across all 7 Idle Spectrum color bars',
    tier: 1,
    maxTier: 25,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 5,
    baseCost: 10_000_000_000,
    costScale: 2.3,
    bonusPerLevel: 100,
    bonusUnit: '% Idle XP',
    icon: '🌈'
  },
  {
    id: 'be_omni_cascade',
    name: 'Omni-Layer Singularity',
    description: 'Massively boosts Coins, RP, Gems, and Leaves across all pre-Singularity layers',
    tier: 1,
    maxTier: 25,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 5,
    baseCost: 25_000_000_000,
    costScale: 2.35,
    bonusPerLevel: 500,
    bonusUnit: '% All Yields',
    icon: '🌌'
  },
  {
    id: 'be_auto_billion',
    name: 'Auto-Buy Astral Horizon',
    description: 'Automatically buys 1B+ Essence Astral Horizon upgrades when Singularity Auto-Buy is active',
    tier: 1,
    maxTier: 1,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 1,
    baseCost: 10_000_000_000,
    costScale: 10,
    bonusPerLevel: 1,
    bonusUnit: 'Unlock',
    icon: '🤖'
  }
];

export const INITIAL_BILLION_ESSENCE_UPGRADES: SingularityUpgrade[] = hydrateDecimalPerks(
  RAW_BILLION_ESSENCE_UPGRADES
);

// Infinite Escalating Section Waves (30 Tiers each, boosts Everything, replaces maxed waves!)
export const SECTION_WAVE_MAX_TIER = 30;

export interface SectionWaveTabConfig {
  tab: ActiveTab;
  title: string;
  currencySymbol: string;
  currencyName: string;
  initialWave: number; // 1 for tabs without prior 30-tier lists, 2 for tabs that unlock after maxing base upgrades
  defaultBaseCost: number;
  baseCostScale: number;
  costScaleStepPerWave: number;
  tierMaxLevel: number;
  baseBonusPerLevel: number;
  slots: { name: string; description: string; icon: string; bonusMult: number }[];
}

export const SECTION_WAVE_CONFIGS: Record<ActiveTab, SectionWaveTabConfig> = {
  buildings: {
    tab: 'buildings',
    title: 'Buildings Omni-Mastery',
    currencySymbol: '🪙',
    currencyName: 'Coins',
    initialWave: 1,
    defaultBaseCost: 100_000,
    baseCostScale: 1.2,
    costScaleStepPerWave: 0.03,
    tierMaxLevel: 4,
    baseBonusPerLevel: 30,
    slots: [
      {
        name: 'Architecture Omni-Boost',
        description: 'Boosts EVERYTHING (Coins, RP, Gems, Leaves, Essence, Time Tokens & Idle XP)',
        icon: '🏛️',
        bonusMult: 1
      },
      {
        name: 'Blueprint Quantum Matrix',
        description: 'Amplifies Building CPS & Everything across all game layers',
        icon: '📐',
        bonusMult: 1.25
      },
      {
        name: 'Assembly Line Overclock',
        description: 'Accelerates production, clicks & Everything exponentially',
        icon: '⚙️',
        bonusMult: 1.5
      },
      {
        name: 'Foundry Cosmic Synergy',
        description: 'Unites all structures to multiply Everything simultaneously',
        icon: '🏭',
        bonusMult: 1.85
      }
    ]
  },
  upgrades: {
    tab: 'upgrades',
    title: 'Ascended Coin Overdrive',
    currencySymbol: '🪙',
    currencyName: 'Coins',
    initialWave: 2,
    defaultBaseCost: 1e45,
    baseCostScale: 1.24,
    costScaleStepPerWave: 0.03,
    tierMaxLevel: 4,
    baseBonusPerLevel: 60,
    slots: [
      {
        name: 'Hyper-Kinetic Omni Core',
        description: 'Boosts EVERYTHING (Coins, RP, Gems, Leaves, Essence, Time Tokens & Idle XP)',
        icon: '⚡',
        bonusMult: 1
      },
      {
        name: 'Infinite Overclock Grid',
        description: 'Multiplies Everything exponentially across every tier',
        icon: '🔥',
        bonusMult: 1.3
      },
      {
        name: 'Quantum Synergy Lattice',
        description: 'Cascades global synergy to boost Everything simultaneously',
        icon: '🔗',
        bonusMult: 1.6
      },
      {
        name: 'Omega Mint Singularity',
        description: 'Apex coin-layer upgrade multiplying Everything across all systems',
        icon: '🌟',
        bonusMult: 2.0
      }
    ]
  },
  rebirth: {
    tab: 'rebirth',
    title: 'Transcendent Rebirth Waves',
    currencySymbol: 'RP',
    currencyName: 'Rebirth Points',
    initialWave: 2,
    defaultBaseCost: 1e25,
    baseCostScale: 1.22,
    costScaleStepPerWave: 0.03,
    tierMaxLevel: 4,
    baseBonusPerLevel: 55,
    slots: [
      {
        name: 'Eternal Rebirth Halo',
        description: 'Boosts EVERYTHING (Coins, RP, Gems, Leaves, Essence, Time Tokens & Idle XP)',
        icon: '🔮',
        bonusMult: 1
      },
      {
        name: 'Soul Resonance Engine',
        description: 'Amplifies RP curves & boosts Everything simultaneously',
        icon: '🌀',
        bonusMult: 1.3
      },
      {
        name: 'Astral Rebirth Crown',
        description: 'Multiplies Everything exponentially across all layers',
        icon: '👑',
        bonusMult: 1.6
      },
      {
        name: 'Genesis Omni-Pulse',
        description: 'Channels Rebirth mastery to multiply Everything across the game',
        icon: '✨',
        bonusMult: 2.0
      }
    ]
  },
  prestige: {
    tab: 'prestige',
    title: 'Celestial Prestige Waves',
    currencySymbol: '💎',
    currencyName: 'Gems',
    initialWave: 2,
    defaultBaseCost: 1e20,
    baseCostScale: 1.22,
    costScaleStepPerWave: 0.03,
    tierMaxLevel: 4,
    baseBonusPerLevel: 65,
    slots: [
      {
        name: 'Radiant Gem Constellation',
        description: 'Boosts EVERYTHING (Coins, RP, Gems, Leaves, Essence, Time Tokens & Idle XP)',
        icon: '💎',
        bonusMult: 1
      },
      {
        name: 'Cosmic Prism Refractor',
        description: 'Refracts Gem energy to multiply Everything simultaneously',
        icon: '💠',
        bonusMult: 1.3
      },
      {
        name: 'Sovereign Star Forge',
        description: 'Boosts Everything exponentially across all 30 tiers',
        icon: '🌠',
        bonusMult: 1.6
      },
      {
        name: 'Diamond Horizon Core',
        description: 'Apex Prestige wave upgrade multiplying Everything',
        icon: '👑',
        bonusMult: 2.0
      }
    ]
  },
  skillTree: {
    tab: 'skillTree',
    title: 'World Tree Canopy Waves',
    currencySymbol: '🍃',
    currencyName: 'Leaves',
    initialWave: 2,
    defaultBaseCost: 1e18,
    baseCostScale: 1.22,
    costScaleStepPerWave: 0.03,
    tierMaxLevel: 4,
    baseBonusPerLevel: 70,
    slots: [
      {
        name: 'Yggdrasil Omni-Seed',
        description: 'Boosts EVERYTHING (Coins, RP, Gems, Leaves, Essence, Time Tokens & Idle XP)',
        icon: '🌳',
        bonusMult: 1
      },
      {
        name: 'Verdant Galaxy Roots',
        description: 'Multiplies Everything exponentially through World Tree roots',
        icon: '🌿',
        bonusMult: 1.3
      },
      {
        name: 'Astral Leaf Cascade',
        description: 'Boosts Leaves, Essence, Time Tokens & Everything',
        icon: '🍃',
        bonusMult: 1.6
      },
      {
        name: 'World Tree Eternity',
        description: 'Apex Skill Tree wave multiplying Everything across all layers',
        icon: '🌸',
        bonusMult: 2.0
      }
    ]
  },
  singularity: {
    tab: 'singularity',
    title: 'Event Horizon Waves',
    currencySymbol: '🕳️',
    currencyName: 'Essence',
    initialWave: 2,
    defaultBaseCost: 1e15,
    baseCostScale: 1.22,
    costScaleStepPerWave: 0.03,
    tierMaxLevel: 4,
    baseBonusPerLevel: 90,
    slots: [
      {
        name: 'Singularity Omni-Horizon',
        description: 'Boosts EVERYTHING (Coins, RP, Gems, Leaves, Essence, Time Tokens & Idle XP)',
        icon: '🕳️',
        bonusMult: 1
      },
      {
        name: 'Black Hole Harvester',
        description: 'Amplifies Essence & Everything exponentially across 30 tiers',
        icon: '🌑',
        bonusMult: 1.35
      },
      {
        name: 'Graviton Cascade Array',
        description: 'Bends spacetime to multiply Everything across all systems',
        icon: '🌀',
        bonusMult: 1.7
      },
      {
        name: 'Omega Singularity Heart',
        description: 'Ultimate Singularity wave boosting Everything simultaneously',
        icon: '🌌',
        bonusMult: 2.1
      }
    ]
  },
  timeReset: {
    tab: 'timeReset',
    title: 'Time Vault Omni-Waves',
    currencySymbol: '🪙',
    currencyName: 'Time Tokens',
    initialWave: 1,
    defaultBaseCost: 25,
    baseCostScale: 1.15,
    costScaleStepPerWave: 0.025,
    tierMaxLevel: 3,
    baseBonusPerLevel: 40,
    slots: [
      {
        name: 'Chrono Omni-Clock',
        description: 'Boosts EVERYTHING (Coins, RP, Gems, Leaves, Essence, Time Tokens & Idle XP)',
        icon: '🕰️',
        bonusMult: 1
      },
      {
        name: 'Timeline Convergence',
        description: 'Multiplies Time Token gains & boosts Everything across all layers',
        icon: '⏳',
        bonusMult: 1.3
      },
      {
        name: 'Temporal Echo Engine',
        description: 'Amplifies Everything exponentially across every timeline',
        icon: '⏱️',
        bonusMult: 1.65
      },
      {
        name: 'Infinity Pendulum',
        description: 'Apex Time Vault upgrade multiplying Everything simultaneously',
        icon: '♾️',
        bonusMult: 2.0
      }
    ]
  },
  ideal: {
    tab: 'ideal',
    title: 'Idle Spectrum Omni-Waves',
    currencySymbol: 'XP',
    currencyName: 'Idle XP',
    initialWave: 1,
    defaultBaseCost: 250,
    baseCostScale: 1.16,
    costScaleStepPerWave: 0.025,
    tierMaxLevel: 3,
    baseBonusPerLevel: 45,
    slots: [
      {
        name: 'Prismatic Omni-Lens',
        description: 'Boosts EVERYTHING (Coins, RP, Gems, Leaves, Essence, Time Tokens & Idle XP)',
        icon: '🌈',
        bonusMult: 1
      },
      {
        name: 'Spectrum Hyper-Flow',
        description: 'Accelerates Idle XP & boosts Everything across all layers',
        icon: '✨',
        bonusMult: 1.3
      },
      {
        name: 'Chromatic Amplifier',
        description: 'Amplifies all 7 Color Bars & Everything simultaneously',
        icon: '🎨',
        bonusMult: 1.65
      },
      {
        name: 'Infinite Rainbow Core',
        description: 'Apex Idle Spectrum upgrade multiplying Everything exponentially',
        icon: '💎',
        bonusMult: 2.0
      }
    ]
  }
};

export function createWaveUpgradesForTab(
  tab: ActiveTab,
  wave: number,
  anchorBaseCost?: DecimalSource
): SectionWaveUpgrade[] {
  const cfg = SECTION_WAVE_CONFIGS[tab];
  const waveShift = Math.max(0, wave - cfg.initialWave);
  const startBase = Decimal.max(
    cfg.defaultBaseCost,
    anchorBaseCost !== undefined ? toDec(anchorBaseCost).ceil() : toDec(cfg.defaultBaseCost)
  );
  const waveCostScale = Number(
    Math.min(2.45, cfg.baseCostScale + waveShift * cfg.costScaleStepPerWave).toFixed(3)
  );
  const waveBonusScale = safePow(3.5, Math.max(0, wave - 1));

  return cfg.slots.map((slot, idx) => {
    const slotBase = Decimal.max(D_ONE, startBase.mul(safePow(2.5, idx)).ceil());
    return {
      id: `sw_${tab}_w${wave}_s${idx + 1}`,
      tab,
      wave,
      name: `${slot.name} (W${wave})`,
      description: slot.description,
      tier: 1,
      maxTier: SECTION_WAVE_MAX_TIER,
      level: 0,
      totalLevels: 0,
      totalBonus: D_ZERO,
      tierMaxLevel: cfg.tierMaxLevel,
      baseCost: slotBase,
      costScale: Number((waveCostScale + idx * 0.015).toFixed(3)),
      bonusPerLevel: toDec(cfg.baseBonusPerLevel).mul(slot.bonusMult).mul(waveBonusScale).round(),
      bonusUnit: '% Everything',
      icon: slot.icon
    };
  });
}
