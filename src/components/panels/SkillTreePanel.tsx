import React from 'react';
import { MultiBuyAmount, NotationType, SkillNode } from '../../types/game';
import { formatNum } from '../../utils/format';
import { isTieredItemMaxed, previewTieredPurchase } from '../../hooks/useGameEngine';
import { MultiBuyBar } from '../MultiBuyBar';

interface SkillTreePanelProps {
  prestigePoints: number;
  treeResetCount: number;
  treePoints: number;
  lifetimeTreePoints: number;
  singularityEssence: number;
  essenceToTpMultiplier: number;
  essenceToTpPhase: 'exponential' | 'diminishing' | 'capped';
  boostCapCeiling: number;
  ppPerSecond: number;
  tpPerSecond: number;
  treeBuyInfo: {
    count: number;
    totalCost: number;
    canAfford: boolean;
    nextSingleCost: number;
  };
  projectedTreePointsGain: number;
  skillNodes: SkillNode[];
  multiBuy: MultiBuyAmount;
  globalScaleReduction: number;
  hardCostMult: number;
  notation: NotationType;
  adminUnlocked: boolean;
  adminFreeMode: boolean;
  isSkillNodeUnlocked: (node: SkillNode, allNodes: SkillNode[], adminMode?: boolean) => boolean;
  onMultiBuyChange: (val: MultiBuyAmount) => void;
  onRequestTreeReset: () => void;
  onBuySkillNode: (id: string) => void;
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
  multiBuy,
  globalScaleReduction,
  hardCostMult,
  notation,
  adminUnlocked,
  adminFreeMode,
  isSkillNodeUnlocked,
  onMultiBuyChange,
  onRequestTreeReset,
  onBuySkillNode
}) => {
  const ppProgress = adminFreeMode
    ? 100
    : Math.min(100, (prestigePoints / Math.max(1, treeBuyInfo.nextSingleCost)) * 100);

  const row1 = skillNodes.filter((n) => n.branch === 'root');
  const row2 = skillNodes.filter((n) => ['sk_scale', 'sk_fountain', 'sk_clicker'].includes(n.id));
  const row3 = skillNodes.filter((n) => ['sk_mints', 'sk_prestige_gen', 'sk_supercrit'].includes(n.id));
  const row4 = skillNodes.filter((n) => n.branch === 'capstone');

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
              {adminFreeMode ? 'FREE' : `${formatNum(preview.totalCost, notation)} 🌳`}
            </span>
          )}
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Tree Points Ascension Card (Costs 1 Billion Prestige Points) */}
      <div className="rounded-3xl border border-emerald-500/40 bg-gradient-to-br from-slate-900 via-emerald-950/35 to-slate-900 p-5 shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-emerald-300">
              World Skill Tree · Harvest #{treeResetCount}
            </div>
            <h2 className="mt-0.5 text-xl font-extrabold text-white">
              {formatNum(treePoints, notation)} Tree Points 🌳
            </h2>
            <p className="mt-1 text-xs text-slate-300">
              Lifetime TP:{' '}
              <strong className="font-mono text-emerald-200 tabular-nums">
                {formatNum(lifetimeTreePoints, notation)}
              </strong>{' '}
              · Tree Points boost Prestige Points & unlock Skill Nodes.
              {ppPerSecond > 0 && (
                <span className="ml-1.5 text-cyan-300">
                  · +{formatNum(ppPerSecond, notation)} PP/s
                </span>
              )}
              {tpPerSecond > 0 && (
                <span className="ml-1.5 text-emerald-300">
                  · +{formatNum(tpPerSecond, notation)} TP/s
                </span>
              )}
            </p>
            <p className="mt-0.5 text-xs text-rose-300/90">
              Singularity Essence ({formatNum(singularityEssence, notation)}) → TP Gain:{' '}
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
              Tree Point Cost (1,000,000,000 Prestige Points base)
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
            Harvesting Tree Points resets <strong className="text-slate-200">Prestige, Rebirth, and Coins</strong>.
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
              ? `Harvest +${treeBuyInfo.count} (+${formatNum(projectedTreePointsGain, notation)} 🌳)`
              : `Need ${formatNum(treeBuyInfo.nextSingleCost, notation)} 💎`}
          </button>
        </div>
      </div>

      {/* Branching Skill Tree */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/75 p-5">
        <div className="mb-4">
          <h3 className="text-base font-extrabold text-white">🌳 Skill Tree Upgrades</h3>
          <p className="text-xs text-slate-400">
            Purchased with Tree Points. Includes Prestige Nexus (generates Prestige Points every
            second!).
          </p>
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="w-full max-w-sm">{row1.map(renderSkillCard)}</div>
          <div className="flex w-full max-w-2xl justify-around text-slate-600">
            <span>↙</span>
            <span>↓</span>
            <span>↘</span>
          </div>
          <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-3">
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
          <div className="flex w-full max-w-2xl justify-around text-slate-600">
            <span>↘</span>
            <span>↓</span>
            <span>↙</span>
          </div>
          <div className="w-full max-w-md">{row4.map(renderSkillCard)}</div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(SkillTreePanel);
