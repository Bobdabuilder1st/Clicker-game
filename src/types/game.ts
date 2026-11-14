import Decimal from 'break_eternity.js';

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

export interface IdleColorTrack {
  id: IdealColor;
  unlocked: boolean;
  xp: Decimal;
  xpNeeded: Decimal;
  totalXp: Decimal;
  level: number;
  squares: number;
}

export interface IdealState {
  colorIndex: number; // highest unlocked color index (0..6)
  xp: Decimal;
  xpNeeded: Decimal;
  levelInColor: number;
  totalLevels: number;
  squares: Record<IdealColor, number>;
  tracks: Record<IdealColor, IdleColorTrack>;
}

export interface Building {
  id: string;
  name: string;
  baseCost: Decimal;
  baseCps: Decimal;
  scaleFactor: number;
  count: number;
  icon: string;
  unlockCoins: Decimal;
}

export interface UpgradeTrackState {
  id: string;
  name: string;
  description: string;
  category: 'click' | 'building' | 'global' | 'synergy' | 'omni';
  targetBuildingId?: string;
  tier: number;
  maxTier: number;
  baseCost: Decimal;
  costScale: number;
  effectMultiplier: number;
  icon: string;
}

export interface SectionWaveUpgrade extends TieredPerk {
  tab: ActiveTab;
  wave: number;
}

export interface SectionWaveState {
  wave: number;
  completedWavesBonusMult: Decimal;
  upgrades: SectionWaveUpgrade[];
}

export interface TieredPerk {
  id: string;
  name: string;
  description: string;
  tier: number;
  maxTier: number;
  level: number;
  totalLevels: number;
  totalBonus: Decimal;
  tierMaxLevel: number;
  baseCost: Decimal;
  costScale: number;
  bonusPerLevel: Decimal;
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
  totalBonus: Decimal;
  tierMaxLevel: number;
  baseCost: Decimal;
  costScale: number;
  bonusPerLevel: Decimal;
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

export type EssenceConvergenceCurrency =
  | 'rebirthPoints'
  | 'prestigePoints'
  | 'treePoints'
  | 'singularityEssence';

export interface SingularityUpgrade {
  id: string;
  name: string;
  description: string;
  tier: number;
  maxTier: number;
  level: number;
  totalLevels: number;
  totalBonus: Decimal;
  tierMaxLevel: number;
  baseCost: Decimal;
  costScale: number;
  bonusPerLevel: Decimal;
  bonusUnit: string;
  icon: string;
}

export interface EssenceConvergenceUpgrade extends TieredPerk {
  currency: EssenceConvergenceCurrency;
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
  autoBuySkillTree: boolean;
  autoBuySingularityUpgrades: boolean;
  autoBuyBillionEssence: boolean;
  autoBuyTimeUpgrades: boolean;
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
  coins: Decimal;
  lifetimeCoins: Decimal;
  totalClicks: number;

  // Coin Core Level-Up System (No cap, 1.1x scale)
  clickerLevel: number;

  // Rebirth Layer
  rebirthLevel: number;
  rebirthPoints: Decimal;
  lifetimeRebirthPoints: Decimal;
  rebirthPerks: TieredPerk[];
  lastRebirthPerkCost: Decimal;
  ascendedRebirthPerks: TieredPerk[];

  // Prestige Layer (Costs 1M RP)
  prestigeLevel: number;
  prestigePoints: Decimal;
  lifetimePrestigePoints: Decimal;
  prestigeUpgrades: TieredPerk[];

  // Skill Tree Layer (Own currency: Tree Points, costs 1M Gems)
  treeResetCount: number;
  treePoints: Decimal;
  lifetimeTreePoints: Decimal;
  skillNodes: SkillNode[];

  // Singularity Layer (Costs 1M Leaves, 10x per purchase, 1 at a time)
  singularityCount: number;
  singularityCoreLevel: number; // Max 100
  singularityEssence: Decimal;
  lifetimeSingularityEssence: Decimal;
  singularityUpgrades: SingularityUpgrade[];
  essenceReactorLevel: number;
  essenceConvergenceUnlocked: boolean;
  essenceConvergenceUpgrades: EssenceConvergenceUpgrade[];
  billionEssenceUnlocked: boolean;
  billionEssenceUpgrades: SingularityUpgrade[];

  // Time Reset Layer (Costs 1M Singularity Essence)
  timeResetCount: number;
  timeTokens: Decimal;
  lifetimeTimeTokens: Decimal;
  timeFlipChanceLevel: number; // Coin Odds: +5% per level up to 80% (max 6)
  timeTokenBoostLevel: number; // Boosts Time Tokens gained on Time Reset
  timeAutoSingularityUnlocked: boolean;
  timeAutoTokenUpgradesUnlocked: boolean;

  // Ideal Tab Layer (Unlocked for 1,000,000 Time Tokens)
  idealTabUnlocked: boolean;
  idleXpSpent: Decimal;
  ideal: IdealState;

  // Core Entities
  buildings: Building[];
  upgradeTracks: UpgradeTrackState[];
  sectionWaves: Record<ActiveTab, SectionWaveState>;
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
