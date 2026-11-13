export type MultiBuyAmount = 1 | 5 | 10 | 25 | -1; // -1 = MAX
export type NotationType = 'standard' | 'scientific';

export type MultiBuySection =
  | 'coinCore'
  | 'buildings'
  | 'upgrades'
  | 'rebirth'
  | 'prestige'
  | 'skillTree'
  | 'singularity'
  | 'timeReset';

export type ActiveTab =
  | 'buildings'
  | 'upgrades'
  | 'rebirth'
  | 'prestige'
  | 'skillTree'
  | 'singularity'
  | 'timeReset';

export interface Building {
  id: string;
  name: string;
  baseCost: number;
  baseCps: number;
  scaleFactor: number;
  count: number;
  icon: string;
  unlockCoins: number;
}

export interface UpgradeTrackState {
  id: string;
  name: string;
  description: string;
  category: 'click' | 'building' | 'global' | 'synergy';
  targetBuildingId?: string;
  tier: number;
  maxTier: number;
  baseCost: number;
  costScale: number;
  effectMultiplier: number;
  icon: string;
}

export interface TieredPerk {
  id: string;
  name: string;
  description: string;
  tier: number;
  maxTier: number;
  level: number;
  totalLevels: number;
  totalBonus: number;
  tierMaxLevel: number;
  baseCost: number;
  costScale: number;
  bonusPerLevel: number;
  bonusUnit: string;
  icon: string;
}

export interface SkillNode {
  id: string;
  name: string;
  description: string;
  branch: 'root' | 'wealth' | 'rebirth' | 'clicker' | 'capstone';
  requires: string[];
  tier: number;
  maxTier: number;
  level: number;
  totalLevels: number;
  totalBonus: number;
  tierMaxLevel: number;
  baseCost: number;
  costScale: number;
  bonusPerLevel: number;
  bonusUnit: string;
  icon: string;
}

export interface ClickerEvolution {
  minLevel: number;
  name: string;
  subtitle: string;
  coinBoostMultiplier: number;
  companionCount: number;
  gradient: string;
  ringColor: string;
  glowColor: string;
}

export interface SingularityUpgrade {
  id: string;
  name: string;
  description: string;
  tier: number;
  maxTier: number;
  level: number;
  totalLevels: number;
  totalBonus: number;
  tierMaxLevel: number;
  baseCost: number;
  costScale: number;
  bonusPerLevel: number;
  bonusUnit: string;
  icon: string;
}

export interface FloatingNumber {
  id: number;
  x: number;
  y: number;
  text: string;
  isCrit?: boolean;
}

export interface AutomationState {
  autoBuyBuildings: boolean;
  autoBuyUpgrades: boolean;
  autoLevelClicker: boolean;
  autoBuyRebirthUpgrades: boolean;
  buildingAutoBuyEnabled: Record<string, boolean>;
}

export interface GameState {
  version: number;
  coins: number;
  lifetimeCoins: number;
  totalClicks: number;

  // Coin Core Level-Up System (No cap, 1.1x scale)
  clickerLevel: number;

  // Rebirth Layer
  rebirthLevel: number;
  rebirthPoints: number;
  lifetimeRebirthPoints: number;
  rebirthPerks: TieredPerk[];

  // Prestige Layer (Costs 1M RP)
  prestigeLevel: number;
  prestigePoints: number;
  lifetimePrestigePoints: number;
  prestigeUpgrades: TieredPerk[];

  // Skill Tree Layer (Own currency: Tree Points, costs 1B Prestige Points)
  treeResetCount: number;
  treePoints: number;
  lifetimeTreePoints: number;
  skillNodes: SkillNode[];

  // Singularity Layer (Costs 1B Tree Points, 10x per purchase, 1 at a time)
  singularityCount: number;
  singularityCoreLevel: number;
  singularityEssence: number;
  lifetimeSingularityEssence: number;
  singularityUpgrades: SingularityUpgrade[];
  essenceReactorLevel: number; // Tier 1 only, max 100, unlocks after all Singularity upgrades bought

  // Time Reset Layer (Costs 1M Singularity Essence)
  timeResetCount: number;
  timeTokens: number;
  lifetimeTimeTokens: number;
  timeFlipChanceLevel: number; // +10% flip chance per level, starts at 10 Time Tokens, 10x per level

  // Core Entities
  buildings: Building[];
  upgradeTracks: UpgradeTrackState[];
  completedUpgradeCount: number;
  completedPerkTiersCount: number;

  // Automation & Preferences
  automation: AutomationState;
  multiBuyBySection: Record<MultiBuySection, MultiBuyAmount>;
  notation: NotationType;
  soundEnabled: boolean;

  // Admin / Architect Sandbox Mode ("bobdabuilder")
  adminUnlocked: boolean;
  adminFreeMode: boolean;
}
