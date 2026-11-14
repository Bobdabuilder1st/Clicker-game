import React from 'react';
import {
  ActiveTab,
  AutomationState,
  EssenceConvergenceUpgrade,
  MultiBuyAmount,
  NotationType,
  SectionWaveState,
  SkillNode
} from '../../types/game';
import { Decimal, formatNum, progressPercent } from '../../utils/format';
import { isTieredItemMaxed, previewTieredPurchase } from '../../hooks/useGameEngine';
import { MultiBuyBar } from '../MultiBuyBar';
import { SectionWaveUpgrades } from '../SectionWaveUpgrades';

interface SkillTreePanelProps {
  prestigePoints: Decimal;
  treeResetCount: number;
  treePoints: Decimal;
  lifetimeTreePoints: Decimal;
  singularityEssence: Decimal;
  essenceToTpMultiplier: Decimal;
  essenceToTpPhase: 'exponential' | 'diminishing' | 'capped';
  boostCapCeiling: Decimal;
  ppPerSecond: Decimal;
  tpPerSecond: Decimal;
  treeBuyInfo: {
    count: number;
    totalCost: Decimal;
    canAfford: boolean;
    nextSingleCost: Decimal;
  };
  projectedTreePointsGain: Decimal;
  skillNodes: SkillNode[];
  sectionWave: SectionWaveState;
  allSkillTreeMaxed: boolean;
  essenceConvergenceOpen: boolean;
  essenceConvergenceUpgrades: EssenceConvergenceUpgrade[];
  essenceConvergenceProgress: {
    rebirthMaxed: number;
    rebirthTotal: number;
    prestigeMaxed: number;
    prestigeTotal: number;
    skillTreeMaxed: number;
    skillTreeTotal: number;
    allRebirthMaxed: boolean;
    allPrestigeMaxed: boolean;
    allSkillTreeMaxed: boolean;
  };
  multiBuy: MultiBuyAmount;
  globalScaleReduction: number;
  hardCostMult: number;
  notation: NotationType;
  hasAutoSkillTree: boolean;
  automation: AutomationState;
  adminUnlocked: boolean;
  adminFreeMode: boolean;
  isSkillNodeUnlocked: (node: SkillNode, allNodes: SkillNode[], adminMode?: boolean) => boolean;
  onMultiBuyChange: (val: MultiBuyAmount) => void;
  onRequestTreeReset: () => void;
  onBuySkillNode: (id: string) => void;
  onBuyWaveUpgrade: (tab: ActiveTab, upgradeId: string) => void;
  onBuyEssenceConvergenceUpgrade: (id: string, multiOverride?: MultiBuyAmount) => void;
  onToggleAuto: (key: 'autoBuySkillTree' | 'autoBuyMax') => void;
}

const SkillTreePanel: React.FC<SkillTreePanelProps> = ({
  prestigePoints,
  treeResetCount,
  treePoints,
  lifetimeTreePoints,
  singularityEssence,
  essenceToTpMultiplier,
  essenceToTpPhase,
  boostCapCeiling,
  ppPerSecond,
  tpPerSecond,
  treeBuyInfo,
  projectedTreePointsGain,
  skillNodes,
  sectionWave,
  allSkillTreeMaxed,
  essenceConvergenceOpen,
  essenceConvergenceUpgrades,
  essenceConvergenceProgress,
  multiBuy,
  globalScaleReduction,
  hardCostMult,
  notation,
  hasAutoSkillTree,
  automation,
  adminUnlocked,
  adminFreeMode,
  isSkillNodeUnlocked,
  onMultiBuyChange,
  onRequestTreeReset,
  onBuySkillNode,
  onBuyWaveUpgrade,
  onBuyEssenceConvergenceUpgrade,
  onToggleAuto
}) => {
  const leafEssenceUpg = essenceConvergenceUpgrades.find((u) => u.id === 'ec_leaf_bloom');
  const ppProgress = adminFreeMode
    ? 100
    : progressPercent(prestigePoints, treeBuyInfo.nextSingleCost);

  const row1 = skillNodes.filter((n) => n.id === 'sk_root');
  const row2 = skillNodes.filter(
    (n) => ['sk_scale', 'sk_fountain', 'sk_clicker'].includes(n.id) && !(n.id === 'sk_scale' && n.totalBonus.gte(60))
  );
  const row3 = skillNodes.filter((n) => ['sk_mints', 'sk_prestige_gen', 'sk_supercrit'].includes(n.id));
  const row4 = skillNodes.filter((n) => ['sk_leaf_surge', 'sk_gem_boost', 'sk_essence_echo'].includes(n.id));
  const row5 = skillNodes.filter((n) => n.id === 'sk_vanguard');
  const row6 = skillNodes.filter((n) => n.id === 'sk_omni_tree');
  const row7 = skillNodes.filter((n) => ['sk_chrono_canopy', 'sk_void_sap', 'sk_cosmic_blossom'].includes(n.id));

  const renderSkillCard = (node: SkillNode) => {
    const unlocked = isSkillNodeUnlocked(node, skillNodes, adminUnlocked);
    const maxed = isTieredItemMaxed(node);
    const preview = previewTieredPurchase(
      node,
      treePoints,
      multiBuy,
      globalScaleReduction,
      adminFreeMode,
      hardCostMult
    );

    return (
      <div
        key={node.id}
        className={`flex flex-col justify-between gap-2.5 rounded-2xl border p-3.5 transition-all ${
          !unlocked
            ? 'border-slate-800/80 bg-slate-900/40 opacity-55'
            : maxed
              ? 'border-emerald-400/50 bg-emerald-950/25'
              : node.totalLevels > 0
                ? 'border-emerald-400/50 bg-emerald-950/25 shadow-md shadow-emerald-500/10'
                : 'border-slate-700 bg-slate-900/90 hover:border-emerald-400/40'
        }`}
      >
        <div>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">{unlocked ? node.icon : '🔒'}</span>
              <div>
                <div className="text-xs font-bold text-white">
                  {node.name}{' '}
                  <span className="text-emerald-300">
                    T{node.tier}/{node.maxTier}
                  </span>
                </div>
                <div className="font-mono text-[11px] text-slate-400 tabular-nums">
                  Rank {node.level}/{node.tierMaxLevel} · Scale {preview.effectiveScale.toFixed(2)}x
                </div>
              </div>
            </div>
          </div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">{node.description}</p>
          <div className="mt-1.5 text-[11px] font-mono text-emerald-200 tabular-nums">
            Total: +{formatNum(node.totalBonus, notation)} {node.bonusUnit} (+
            {formatNum(node.bonusPerLevel, notation)}/lv)
          </div>
        </div>

        <button
          type="button"
          disabled={!unlocked || maxed || !preview.canAfford}
          onClick={() => onBuySkillNode(node.id)}
          className={`flex w-full items-center justify-between rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
            maxed
              ? 'cursor-default bg-emerald-500/20 text-emerald-300'
              : unlocked && preview.canAfford
                ? 'bg-emerald-400 text-slate-950 hover:bg-emerald-300 active:scale-[0.98]'
                : 'cursor-not-allowed bg-slate-800 text-slate-500'
          }`}
        >
          <span>
            {maxed
              ? 'Maxed (T30)'
              : !unlocked
                ? 'Locked'
                : `Train +${preview.count}${preview.willEvolve ? ' (Evolve!)' : ''}`}
          </span>
          {!maxed && (
            <span className="font-mono tabular-nums">
              {adminFreeMode ? 'FREE' : `${formatNum(preview.totalCost, notation)} 🍃`}
            </span>
          )}
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Tree Points Ascension Card (Costs 1 Million Gems) */}
      <div className="rounded-3xl border border-emerald-500/40 bg-gradient-to-br from-slate-900 via-emerald-950/35 to-slate-900 p-5 shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-emerald-300">
              World Skill Tree · Harvest #{treeResetCount}
            </div>
            <h2 className="mt-0.5 text-xl font-extrabold text-white">
              {formatNum(treePoints, notation)} Leaves 🍃
            </h2>
            <p className="mt-1 text-xs text-slate-300">
              Lifetime Leaves:{' '}
              <strong className="font-mono text-emerald-200 tabular-nums">
                {formatNum(lifetimeTreePoints, notation)}
              </strong>{' '}
              · Leaves boost Gems &amp; unlock Skill Nodes.
              {ppPerSecond.gt(0) && (
                <span className="ml-1.5 text-cyan-300">
                  · +{formatNum(ppPerSecond, notation)} Gems/s
                </span>
              )}
              {tpPerSecond.gt(0) && (
                <span className="ml-1.5 text-emerald-300">
                  · +{formatNum(tpPerSecond, notation)} Leaves/s
                </span>
              )}
            </p>
            <p className="mt-0.5 text-xs text-rose-300/90">
              Singularity Essence ({formatNum(singularityEssence, notation)}) → Leaf Gain:{' '}
              <strong className="font-mono tabular-nums">
                ×{formatNum(essenceToTpMultiplier, notation)}
              </strong>{' '}
              ({essenceToTpPhase} · Cap {formatNum(boostCapCeiling, notation)} Essence)
            </p>
          </div>

          <MultiBuyBar value={multiBuy} onChange={onMultiBuyChange} compact />
        </div>

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              Leaf Cost (1,000,000 Gems base · 1.35x scale)
            </span>
            <span className="font-mono font-semibold text-emerald-200 tabular-nums">
              {formatNum(prestigePoints, notation)} /{' '}
              {adminFreeMode ? 'FREE' : `${formatNum(treeBuyInfo.totalCost, notation)} 💎`}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800/90">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-300"
              style={{ width: `${ppProgress}%` }}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            Harvesting Leaves resets <strong className="text-slate-200">Prestige, Rebirth, and Coins</strong>.
          </div>

          <button
            type="button"
            disabled={!treeBuyInfo.canAfford}
            onClick={onRequestTreeReset}
            className={`rounded-xl px-5 py-2.5 text-sm font-extrabold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              treeBuyInfo.canAfford
                ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/25 hover:brightness-110 active:scale-95'
                : 'cursor-not-allowed bg-slate-800 text-slate-500'
            }`}
          >
            {treeBuyInfo.canAfford
              ? `Harvest +${treeBuyInfo.count} (+${formatNum(projectedTreePointsGain, notation)} 🍃)`
              : `Need ${formatNum(treeBuyInfo.nextSingleCost, notation)} 💎`}
          </button>
        </div>
      </div>

      {/* Branching Skill Tree OR Infinite Canopy Waves */}
      {allSkillTreeMaxed ? (
        <div className="flex flex-col gap-3">
          {hasAutoSkillTree && (
            <div className="flex flex-wrap items-center justify-end gap-2 px-1">
              <button
                type="button"
                onClick={() => onToggleAuto('autoBuySkillTree')}
                className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  automation.autoBuySkillTree
                    ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-300'
                    : 'border-slate-700 bg-slate-800 text-slate-400'
                }`}
              >
                Auto-Buy Skill Tree: {automation.autoBuySkillTree ? 'ON' : 'OFF'}
              </button>
              <button
                type="button"
                onClick={() => onToggleAuto('autoBuyMax')}
                className={`rounded-xl border px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  automation.autoBuyMax
                    ? 'border-amber-400/60 bg-amber-500/20 text-amber-300'
                    : 'border-slate-700 bg-slate-800 text-slate-300'
                }`}
              >
                Mode: {automation.autoBuyMax ? 'MAX' : '+1'}
              </button>
            </div>
          )}
          <SectionWaveUpgrades
            tab="skillTree"
            waveState={sectionWave}
            currency={treePoints}
            multiBuy={multiBuy}
            globalScaleReduction={globalScaleReduction}
            hardCostMult={hardCostMult}
            notation={notation}
            adminFreeMode={adminFreeMode}
            onBuyWaveUpgrade={onBuyWaveUpgrade}
          />
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/75 p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-extrabold text-white">🍃 Skill Tree Upgrades</h3>
              <p className="text-xs text-slate-400">
                Purchased with Leaves. Includes Gem Nexus, Canopy Harvest, Prismatic Resonance, World Tree Heart &amp; Cosmic Blossoms.
              </p>
            </div>

            {hasAutoSkillTree && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onToggleAuto('autoBuySkillTree')}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    automation.autoBuySkillTree
                      ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-300'
                      : 'border-slate-700 bg-slate-800 text-slate-400'
                  }`}
                >
                  Auto-Buy Skill Tree: {automation.autoBuySkillTree ? 'ON' : 'OFF'}
                </button>
                <button
                  type="button"
                  onClick={() => onToggleAuto('autoBuyMax')}
                  className={`rounded-xl border px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    automation.autoBuyMax
                      ? 'border-amber-400/60 bg-amber-500/20 text-amber-300'
                      : 'border-slate-700 bg-slate-800 text-slate-300'
                  }`}
                >
                  Mode: {automation.autoBuyMax ? 'MAX' : '+1'}
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="w-full max-w-sm">{row1.map(renderSkillCard)}</div>
            <div className="flex w-full max-w-2xl justify-around text-slate-600">
              <span>↙</span>
              <span>↓</span>
              <span>↘</span>
            </div>
            <div
              className={`grid w-full grid-cols-1 gap-3 ${
                row2.length === 2 ? 'md:grid-cols-2 max-w-3xl' : 'md:grid-cols-3'
              }`}
            >
              {row2.map(renderSkillCard)}
            </div>
            <div className="grid w-full grid-cols-3 text-center text-slate-600">
              <span>↓</span>
              <span>↓</span>
              <span>↓</span>
            </div>
            <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-3">
              {row3.map(renderSkillCard)}
            </div>
            <div className="grid w-full grid-cols-3 text-center text-slate-600">
              <span>↓</span>
              <span>↓</span>
              <span>↓</span>
            </div>
            <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-3">
              {row4.map(renderSkillCard)}
            </div>
            <div className="flex w-full max-w-2xl justify-around text-slate-600">
              <span>↘</span>
              <span>↓</span>
              <span>↙</span>
            </div>
            <div className="w-full max-w-md">{row5.map(renderSkillCard)}</div>
            <div className="text-center text-slate-600">↓</div>
            <div className="w-full max-w-md">{row6.map(renderSkillCard)}</div>
            <div className="flex w-full max-w-2xl justify-around text-slate-600">
              <span>↙</span>
              <span>↓</span>
              <span>↘</span>
            </div>
            <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-3">
              {row7.map(renderSkillCard)}
            </div>
          </div>
        </div>
      )}
      {/* 50-Tier Singularity Essence Upgrade (Unlocked when all Rebirth, Prestige & Skill Tree upgrades are maxed) */}
      {(essenceConvergenceProgress.allSkillTreeMaxed || essenceConvergenceOpen) &&
        leafEssenceUpg &&
        !isTieredItemMaxed(leafEssenceUpg) && (
        <div className="rounded-3xl border border-fuchsia-500/40 bg-gradient-to-br from-slate-900 via-fuchsia-950/25 to-rose-950/20 p-5 shadow-xl">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-fuchsia-200">
                🌌 50-Tier Singularity Essence Upgrade (Leaves)
              </h3>
              <p className="text-xs text-slate-400">
                Unlocked once all Rebirth, Prestige &amp; Skill Tree upgrades are maxed! See all 4 in Singularity.
              </p>
            </div>
            {!essenceConvergenceOpen && (
              <span className="font-mono text-xs text-amber-300 tabular-nums">
                Rebirth {essenceConvergenceProgress.rebirthMaxed}/{essenceConvergenceProgress.rebirthTotal} · Prestige {essenceConvergenceProgress.prestigeMaxed}/{essenceConvergenceProgress.prestigeTotal}
              </span>
            )}
          </div>

          {essenceConvergenceOpen &&
            (() => {
              const maxed = isTieredItemMaxed(leafEssenceUpg);
              const preview = previewTieredPurchase(
                leafEssenceUpg,
                treePoints,
                multiBuy,
                globalScaleReduction,
                adminFreeMode,
                hardCostMult
              );
              return (
                <div className="flex flex-col justify-between gap-3 rounded-2xl border border-fuchsia-500/35 bg-slate-950/85 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-fuchsia-500/30 bg-fuchsia-950/40 text-xl">
                      {leafEssenceUpg.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-bold text-white">
                          {leafEssenceUpg.name}{' '}
                          <span className="text-fuchsia-300">
                            T{leafEssenceUpg.tier}/{leafEssenceUpg.maxTier}
                          </span>
                        </span>
                        <span className="font-mono text-xs font-semibold text-slate-300 tabular-nums shrink-0">
                          {leafEssenceUpg.level}/{leafEssenceUpg.tierMaxLevel}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-400">{leafEssenceUpg.description}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 text-[11px] text-slate-500">
                        <span>
                          Total:{' '}
                          <strong className="font-mono text-rose-200 tabular-nums">
                            +{formatNum(leafEssenceUpg.totalBonus, notation)} {leafEssenceUpg.bonusUnit}
                          </strong>
                        </span>
                        <span>·</span>
                        <span className="font-mono tabular-nums">
                          +{formatNum(leafEssenceUpg.bonusPerLevel, notation)}/lv
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={maxed || !preview.canAfford}
                    onClick={() => onBuyEssenceConvergenceUpgrade(leafEssenceUpg.id, multiBuy)}
                    className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                      maxed
                        ? 'cursor-default bg-emerald-500/20 text-emerald-300'
                        : preview.canAfford
                          ? 'bg-gradient-to-r from-fuchsia-500 to-rose-500 text-white hover:brightness-110 active:scale-[0.98]'
                          : 'cursor-not-allowed bg-slate-800 text-slate-500'
                    }`}
                  >
                    <span>
                      {maxed
                        ? 'MAXED (T50)'
                        : `Ascend +${preview.count}${preview.willEvolve ? ' (Evolves Tier!)' : ''}`}
                    </span>
                    {!maxed && (
                      <span className="font-mono tabular-nums">
                        {adminFreeMode ? 'FREE' : `${formatNum(preview.totalCost, notation)} 🍃`}
                      </span>
                    )}
                  </button>
                </div>
              );
            })()}
        </div>
      )}
    </div>
  );
};

export default React.memo(SkillTreePanel);
