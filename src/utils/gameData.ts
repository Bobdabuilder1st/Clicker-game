import {
  Building,
  UpgradeTrackState,
  TieredPerk,
  SkillNode,
  ClickerEvolution,
  SingularityUpgrade
} from '../types/game';

export const REBIRTH_BASE_COST = 1_000_000;
export const REBIRTH_COST_SCALE = 6.0;

// Cross-layer Reset Costs
export const PRESTIGE_BASE_RP_COST = 1_000_000; // 1 Million Rebirth Points
export const PRESTIGE_RP_SCALE = 3.5;

export const TREE_POINT_BASE_PP_COST = 1_000_000_000; // 1 Billion Prestige Points per Tree Point
export const SINGULARITY_BASE_TP_COST = 1_000_000_000; // 1 Billion Tree Points (10x per purchase, 1 at a time)
export const SINGULARITY_TP_SCALE = 10.0;

export const TIME_RESET_ESSENCE_COST = 1_000_000; // 1 Million Singularity Essence
export const TIME_FLIP_BASE_COST = 10; // 10 Time Tokens
export const TIME_FLIP_COST_SCALE = 10.0; // Increases 10x per purchase
export const TIME_FLIP_MAX_LEVEL = 6; // 50% base + 6 * 5% = 80% max
export const TIME_TOKEN_BOOST_BASE_COST = 10; // 10 Time Tokens
export const TIME_TOKEN_BOOST_COST_SCALE = 10.0; // 10x per purchase
export const TIME_TOKEN_BOOST_MAX_LEVEL = 30;
export const TIME_AUTO_SINGULARITY_COST = 100; // 100 Time Tokens to unlock Auto-Buy Singularity
export const IDEAL_TAB_COST = 1_000_000; // 1 Million Time Tokens to unlock Ideal tab

export const IDEAL_BASE_XP = 10;
export const IDEAL_XP_GROWTH = 1.416;
export const IDEAL_SQUARES_PER_COLOR = 10;

export const IDEAL_COLORS: {
  id: 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'violet';
  name: string;
  barClass: string;
  squareClass: string;
  textClass: string;
  borderClass: string;
}[] = [
  {
    id: 'red',
    name: 'Red',
    barClass: 'from-red-500 to-rose-400',
    squareClass: 'bg-red-500 border-red-300',
    textClass: 'text-red-300',
    borderClass: 'border-red-500/50'
  },
  {
    id: 'orange',
    name: 'Orange',
    barClass: 'from-orange-500 to-amber-400',
    squareClass: 'bg-orange-500 border-orange-300',
    textClass: 'text-orange-300',
    borderClass: 'border-orange-500/50'
  },
  {
    id: 'yellow',
    name: 'Yellow',
    barClass: 'from-yellow-400 to-amber-300',
    squareClass: 'bg-yellow-400 border-yellow-200',
    textClass: 'text-yellow-300',
    borderClass: 'border-yellow-400/50'
  },
  {
    id: 'green',
    name: 'Green',
    barClass: 'from-emerald-500 to-green-400',
    squareClass: 'bg-emerald-500 border-emerald-300',
    textClass: 'text-emerald-300',
    borderClass: 'border-emerald-500/50'
  },
  {
    id: 'blue',
    name: 'Blue',
    barClass: 'from-blue-500 to-cyan-400',
    squareClass: 'bg-blue-500 border-blue-300',
    textClass: 'text-blue-300',
    borderClass: 'border-blue-500/50'
  },
  {
    id: 'purple',
    name: 'Purple',
    barClass: 'from-purple-600 to-purple-400',
    squareClass: 'bg-purple-500 border-purple-300',
    textClass: 'text-purple-300',
    borderClass: 'border-purple-500/50'
  },
  {
    id: 'violet',
    name: 'Violet',
    barClass: 'from-fuchsia-500 to-violet-400',
    squareClass: 'bg-violet-500 border-violet-300',
    textClass: 'text-violet-300',
    borderClass: 'border-violet-500/50'
  }
];

// Base Boosting Cap (100 Trillion) — multiplied by 10x every Time Reset!
export const BASE_BOOST_CAP = 100_000_000_000_000; // 100 Trillion (1e14)

// Coin Core Level-Up (1.1x cost scale, NO level cap!)
export const CLICKER_BASE_COST = 60;
export const CLICKER_COST_SCALE = 1.1;

// Singularity Core Level Cap
export const SINGULARITY_CORE_MAX_LEVEL = 100;

// Upgrade / Perk Max Tiers
export const UPGRADE_MAX_TIER = 30;
export const LAYER_PERK_MAX_TIER = 30;

// Essence Reactor (Appears after every Singularity upgrade has been bought)
export const ESSENCE_REACTOR_BASE_COST = 5;
export const ESSENCE_REACTOR_COST_SCALE = 1.45;
export const ESSENCE_REACTOR_MAX_LEVEL = 100;

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
export const INITIAL_BUILDINGS: Building[] = [
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

export const INITIAL_UPGRADE_TRACKS: UpgradeTrackState[] = [
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
  ...INITIAL_BUILDINGS.map((b, idx) => ({
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

// Harder Rebirth Shop Perks (Max Tier 30)
export const INITIAL_REBIRTH_PERKS: TieredPerk[] = [
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
    description: 'Amplifies the Rebirth Points → Coins curve before the 100T cap',
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
  }
];

// Harder Prestige Upgrades (Stop at Tier 10, surge 10x at upper tiers!)
export const INITIAL_PRESTIGE_UPGRADES: TieredPerk[] = [
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
  }
];

// Skill Tree (Own Section & Own Currency: Leaves 🍃, resets Prestige + Rebirth + Coins)
export const INITIAL_SKILL_NODES: SkillNode[] = [
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
    id: 'sk_vanguard',
    name: 'Singularity Vanguard',
    description: 'Converges all branches: massively multiplies Leaves, Gems, RP & Coins',
    branch: 'capstone',
    requires: ['sk_mints', 'sk_prestige_gen', 'sk_supercrit'],
    tier: 1,
    maxTier: LAYER_PERK_MAX_TIER,
    level: 0,
    totalLevels: 0,
    totalBonus: 0,
    tierMaxLevel: 5,
    baseCost: 10,
    costScale: 2.5,
    bonusPerLevel: 300,
    bonusUnit: '% Hyper-All',
    icon: '🕳️'
  }
];

// Singularity Upgrades: All start at 1 Essence and increase 10x per purchase!
export const INITIAL_SINGULARITY_UPGRADES: SingularityUpgrade[] = [
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
  }
];
