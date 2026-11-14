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
  | 'timeReset'
  | 'ideal';

export type IdealColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'violet';

export interface IdealState {
  colorIndex: number; // 0=red, 1=orange, 2=yellow, 3=green, 4=blue, 5=purple, 6=violet
  xp: number;
  xpNeeded: number;
  levelInColor: number;
  totalLevels: number;
  squares: Record<IdealColor, number>;
}

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
  autoBuyPrestigeUpgrades: boolean;
  autoBuySingularityUpgrades: boolean;
  autoBuyMax: boolean;
  buildingAutoBuyEnabled: Record<string, boolean>;
}

export interface AchievementsState {
  firstRebirth: boolean;
  firstPrestige: boolean;
  firstSkillTree: boolean;
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
  singularityCoreLevel: number; // Max 100
  singularityEssence: number;
  lifetimeSingularityEssence: number;
  singularityUpgrades: SingularityUpgrade[];
  essenceReactorLevel: number;

  // Time Reset Layer (Costs 1M Singularity Essence)
  timeResetCount: number;
  timeTokens: number;
  lifetimeTimeTokens: number;
  timeFlipChanceLevel: number; // Coin Odds: +5% per level up to 80% (max 6)
  timeTokenBoostLevel: number; // Boosts Time Tokens gained on Time Reset
  timeAutoSingularityUnlocked: boolean;

  // Ideal Tab Layer (Unlocked for 1,000,000 Time Tokens)
  idealTabUnlocked: boolean;
  ideal: IdealState;

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

  // Codes, Achievements & Hard Mode
  hardMode: boolean; // Typing "HARD" makes everything 10x more expensive
  codeClickerUnlocked: boolean; // Typing "clicker" grants auto-clicker
  codeClickerEnabled: boolean;
  achievements: AchievementsState;
  firstRebirthPopupShown: boolean;

  // Admin / Architect Sandbox Mode ("bobdabuilder")
  adminUnlocked: boolean;
  adminFreeMode: boolean;
}

export interface SaveStateEntry {
  id: string;
  name: string;
  createdAt: number;
  isAutoBackup?: boolean;
  summary: string;
  data: GameState;
}
