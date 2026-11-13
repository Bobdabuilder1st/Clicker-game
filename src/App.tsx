import React, { Suspense, lazy, useState } from 'react';
import { ActiveTab } from './types/game';
import { useGameEngine } from './hooks/useGameEngine';
import { formatNum } from './utils/format';
import { ClickerSection } from './components/ClickerSection';
import { BuildingsPanel } from './components/panels/BuildingsPanel';
import { UpgradesPanel } from './components/panels/UpgradesPanel';
import { AdminModal } from './components/AdminModal';

const RebirthPanel = lazy(() => import('./components/panels/RebirthPanel'));
const PrestigePanel = lazy(() => import('./components/panels/PrestigePanel'));
const SkillTreePanel = lazy(() => import('./components/panels/SkillTreePanel'));
const SingularityPanel = lazy(() => import('./components/panels/SingularityPanel'));
const TimeResetPanel = lazy(() => import('./components/panels/TimeResetPanel'));

type ConfirmModalType = 'rebirth' | 'prestige' | 'treeReset' | 'singularity' | 'hardReset' | null;

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('buildings');
  const [confirmModal, setConfirmModal] = useState<ConfirmModalType>(null);
  const [adminOpen, setAdminOpen] = useState(false);

  const {
    state,
    stats,
    handleManualClick,
    setSectionMultiBuy,
    toggleNotation,
    toggleSound,
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
    unlockAdminWithCode,
    toggleAdminFreeMode,
    adminGrantResources,
    exitAdminMode,
    hardReset
  } = useGameEngine(activeTab);

  const totalCpsWithAuto = stats.coinsPerSecond + stats.autoClicksPerSecond * stats.coinsPerClick;

  const tabs: { id: ActiveTab; label: string; ready?: boolean }[] = [
    { id: 'buildings', label: 'Buildings' },
    { id: 'upgrades', label: 'Upgrades' },
    { id: 'rebirth', label: 'Rebirth', ready: stats.rebirthBuyInfo.canAfford },
    { id: 'prestige', label: 'Prestige', ready: stats.prestigeBuyInfo.canAfford },
    { id: 'skillTree', label: 'Skill Tree', ready: stats.treeBuyInfo.canAfford },
    { id: 'singularity', label: 'Singularity', ready: stats.canSingularity },
    { id: 'timeReset', label: 'Time Reset', ready: stats.canTimeReset }
  ];

  const handleConfirmAction = () => {
    if (confirmModal === 'rebirth') triggerRebirth();
    else if (confirmModal === 'prestige') triggerPrestige();
    else if (confirmModal === 'treeReset') triggerTreeReset();
    else if (confirmModal === 'singularity') triggerSingularity();
    else if (confirmModal === 'hardReset') hardReset();
    setConfirmModal(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-amber-400 selection:text-slate-950">
      {/* Top Economy Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🪙</span>
                <h1 className="text-base font-extrabold tracking-tight text-white">
                  Cascade Infinity
                </h1>
              </div>
              <div className="text-[11px] text-slate-400">
                Rebirth Lv.{state.rebirthLevel} · Prestige T{state.prestigeLevel} · Singularity #
                {state.singularityCount} · Time #{state.timeResetCount}
              </div>
            </div>

            <div className="hidden h-8 w-px bg-slate-800 sm:block" />

            <div className="flex flex-wrap items-center gap-4">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Coins
                </div>
                <div className="font-mono text-lg font-extrabold text-amber-300 tabular-nums leading-tight">
                  {formatNum(state.coins, state.notation)}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Income
                </div>
                <div className="font-mono text-sm font-bold text-emerald-300 tabular-nums leading-tight">
                  +{formatNum(totalCpsWithAuto, state.notation)}/s
                </div>
              </div>

              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-purple-300">
                  Rebirth Pts
                </div>
                <div className="font-mono text-sm font-bold text-purple-200 tabular-nums leading-tight">
                  {formatNum(state.rebirthPoints, state.notation)} RP
                  {stats.rpPerSecond > 0 && (
                    <span className="ml-1 text-xs text-emerald-300">
                      (+{formatNum(stats.rpPerSecond, state.notation)}/s)
                    </span>
                  )}
                </div>
              </div>

              {(state.prestigePoints > 0 || state.lifetimePrestigePoints > 0 || state.adminUnlocked) && (
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
                    Prestige Pts
                  </div>
                  <div className="font-mono text-sm font-bold text-cyan-200 tabular-nums leading-tight">
                    {formatNum(state.prestigePoints, state.notation)} 💎
                  </div>
                </div>
              )}

              {(state.treePoints > 0 || state.lifetimeTreePoints > 0 || state.adminUnlocked) && (
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                    Tree Pts
                  </div>
                  <div className="font-mono text-sm font-bold text-emerald-200 tabular-nums leading-tight">
                    {formatNum(state.treePoints, state.notation)} 🌳
                  </div>
                </div>
              )}

              {(state.singularityEssence > 0 || state.singularityCount > 0 || state.adminUnlocked) && (
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-rose-300">
                    Essence
                  </div>
                  <div className="font-mono text-sm font-bold text-rose-200 tabular-nums leading-tight">
                    {formatNum(state.singularityEssence, state.notation)} 🕳️
                  </div>
                </div>
              )}

              {(state.timeTokens > 0 || state.timeResetCount > 0 || state.adminUnlocked) && (
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                    Time Tokens
                  </div>
                  <div className="font-mono text-sm font-bold text-amber-200 tabular-nums leading-tight">
                    {formatNum(state.timeTokens, state.notation)} 🪙
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setAdminOpen(true)}
              className={`rounded-xl border px-3 py-1.5 text-xs font-bold cursor-pointer whitespace-nowrap shrink-0 ${
                state.adminUnlocked
                  ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
                  : 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {state.adminFreeMode ? '🛠️ Admin (FREE)' : state.adminUnlocked ? '🛠️ Admin' : 'Admin'}
            </button>

            <button
              type="button"
              onClick={toggleNotation}
              className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-800 cursor-pointer whitespace-nowrap shrink-0"
              title="Toggle number notation"
            >
              {state.notation === 'standard' ? 'Std' : 'Sci'}
            </button>

            <button
              type="button"
              onClick={toggleSound}
              className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-800 cursor-pointer whitespace-nowrap shrink-0"
              title="Toggle sound effects"
            >
              {state.soundEnabled ? '🔊' : '🔇'}
            </button>

            <button
              type="button"
              onClick={() => setConfirmModal('hardReset')}
              className="rounded-xl border border-rose-900/60 bg-rose-950/30 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-900/40 cursor-pointer whitespace-nowrap shrink-0"
            >
              Reset
            </button>
          </div>
        </div>
      </header>

      {/* Main Split Game Workspace */}
      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-12">
        <section className="lg:col-span-4">
          <ClickerSection
            coinsPerClick={stats.coinsPerClick}
            coinsPerSecond={stats.coinsPerSecond}
            autoClicksPerSecond={stats.autoClicksPerSecond}
            rpPerSecond={stats.rpPerSecond}
            rebirthPoints={state.rebirthPoints}
            rpFormulaExponent={stats.rpFormulaExponent}
            rpFormulaFactor={stats.rpFormulaFactor}
            rpCoinMultiplier={stats.rpCurve.multiplier}
            rpCurvePhase={stats.rpCurve.phase}
            boostCapCeiling={stats.boostCapCeiling}
            critChance={stats.critChance}
            critMultiplier={stats.critMultiplier}
            clickerLevel={state.clickerLevel}
            clickerEvolution={stats.clickerEvolution}
            nextClickerEvolution={stats.nextClickerEvolution}
            clickerTotalPowerMult={stats.clickerTotalPowerMult}
            clickerGlobalCoinBoost={stats.clickerGlobalCoinBoost}
            effectiveClickerScale={stats.effectiveClickerScale}
            coinCoreMultiBuy={state.multiBuyBySection.coinCore}
            clickerBuyInfo={stats.clickerBuyInfo}
            notation={state.notation}
            adminFreeMode={state.adminFreeMode}
            onManualClick={handleManualClick}
            onLevelUpClicker={levelUpClicker}
            onCoinCoreMultiChange={(val) => setSectionMultiBuy('coinCore', val)}
          />
        </section>

        <section className="flex flex-col gap-4 lg:col-span-8">
          <nav className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-slate-800 bg-slate-900/80 p-1.5">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive
                      ? tab.id === 'timeReset'
                        ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-md'
                        : tab.id === 'singularity'
                          ? 'bg-gradient-to-r from-rose-500 to-fuchsia-500 text-white shadow-md'
                          : tab.id === 'skillTree'
                            ? 'bg-emerald-400 text-slate-950 shadow-md'
                            : tab.id === 'prestige'
                              ? 'bg-cyan-400 text-slate-950 shadow-md'
                              : tab.id === 'rebirth'
                                ? 'bg-purple-500 text-white shadow-md'
                                : 'bg-amber-400 text-slate-950 shadow-md'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.ready && !isActive && (
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </button>
              );
            })}
          </nav>

          {activeTab === 'buildings' && (
            <BuildingsPanel
              buildings={state.buildings}
              coins={state.coins}
              lifetimeCoins={state.lifetimeCoins}
              multiBuy={state.multiBuyBySection.buildings}
              globalScaleReduction={stats.globalScaleReduction}
              buildingDiscountMult={stats.buildingDiscountMult}
              buildingCpsMap={stats.buildingCpsMap}
              notation={state.notation}
              hasAutoBuildings={stats.hasAutoBuildings}
              adminUnlocked={state.adminUnlocked}
              adminFreeMode={state.adminFreeMode}
              automation={state.automation}
              onMultiBuyChange={(val) => setSectionMultiBuy('buildings', val)}
              onBuyBuilding={buyBuilding}
              onToggleAuto={toggleAutomation}
              onToggleBuildingAuto={toggleBuildingAutoBuy}
              onSetAllBuildingsAuto={setAllBuildingsAutoBuy}
            />
          )}

          {activeTab === 'upgrades' && (
            <UpgradesPanel
              upgradeTracks={state.upgradeTracks}
              buildings={state.buildings}
              buildingCpsMap={stats.buildingCpsMap}
              coinsPerSecond={stats.coinsPerSecond}
              coinsPerClick={stats.coinsPerClick}
              totalBuildingsOwned={stats.totalBuildingsOwned}
              lifetimeCoins={state.lifetimeCoins}
              coins={state.coins}
              completedUpgradeCount={state.completedUpgradeCount}
              multiBuy={state.multiBuyBySection.upgrades}
              globalScaleReduction={stats.globalScaleReduction}
              notation={state.notation}
              hasAutoUpgrades={stats.hasAutoUpgrades}
              adminUnlocked={state.adminUnlocked}
              adminFreeMode={state.adminFreeMode}
              automation={state.automation}
              onMultiBuyChange={(val) => setSectionMultiBuy('upgrades', val)}
              onBuyUpgrade={buyUpgradeTrack}
              onToggleAuto={toggleAutomation}
            />
          )}

          <Suspense
            fallback={
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center text-xs text-slate-400">
                Loading section...
              </div>
            }
          >
            {activeTab === 'rebirth' && (
              <RebirthPanel
                coins={state.coins}
                rebirthLevel={state.rebirthLevel}
                rebirthPoints={state.rebirthPoints}
                prestigePoints={state.prestigePoints}
                ppToRpMultiplier={stats.ppToRpCurve.multiplier}
                ppToRpPhase={stats.ppToRpCurve.phase}
                rpPerSecond={stats.rpPerSecond}
                rpFormulaExponent={stats.rpFormulaExponent}
                rpFormulaFactor={stats.rpFormulaFactor}
                rpCoinMultiplier={stats.rpCurve.multiplier}
                rpCurvePhase={stats.rpCurve.phase}
                boostCapCeiling={stats.boostCapCeiling}
                effectiveRebirthScale={stats.effectiveRebirthScale}
                rebirthBuyInfo={stats.rebirthBuyInfo}
                projectedRebirthRpGain={stats.projectedRebirthRpGain}
                rebirthPerks={state.rebirthPerks}
                multiBuy={state.multiBuyBySection.rebirth}
                globalScaleReduction={stats.globalScaleReduction}
                notation={state.notation}
                hasAutoRebirth={stats.hasAutoRebirth}
                adminFreeMode={state.adminFreeMode}
                automation={state.automation}
                onMultiBuyChange={(val) => setSectionMultiBuy('rebirth', val)}
                onRequestRebirth={() => setConfirmModal('rebirth')}
                onBuyPerk={buyRebirthPerk}
                onToggleAuto={toggleAutomation}
              />
            )}

            {activeTab === 'prestige' && (
              <PrestigePanel
                rebirthPoints={state.rebirthPoints}
                prestigeLevel={state.prestigeLevel}
                prestigePoints={state.prestigePoints}
                lifetimePrestigePoints={state.lifetimePrestigePoints}
                treePoints={state.treePoints}
                tpToPpMultiplier={stats.tpToPpCurve.multiplier}
                tpToPpPhase={stats.tpToPpCurve.phase}
                boostCapCeiling={stats.boostCapCeiling}
                rpPerSecond={stats.rpPerSecond}
                ppPerSecond={stats.ppPerSecond}
                effectivePrestigeScale={stats.effectivePrestigeScale}
                prestigeBuyInfo={stats.prestigeBuyInfo}
                projectedPrestigePointsGain={stats.projectedPrestigePointsGain}
                prestigeUpgrades={state.prestigeUpgrades}
                multiBuy={state.multiBuyBySection.prestige}
                globalScaleReduction={stats.globalScaleReduction}
                notation={state.notation}
                adminFreeMode={state.adminFreeMode}
                onMultiBuyChange={(val) => setSectionMultiBuy('prestige', val)}
                onRequestPrestige={() => setConfirmModal('prestige')}
                onBuyPrestigeUpgrade={buyPrestigeUpgrade}
              />
            )}

            {activeTab === 'skillTree' && (
              <SkillTreePanel
                prestigePoints={state.prestigePoints}
                treeResetCount={state.treeResetCount}
                treePoints={state.treePoints}
                lifetimeTreePoints={state.lifetimeTreePoints}
                singularityEssence={state.singularityEssence}
                essenceToTpMultiplier={stats.essenceToTpCurve.multiplier}
                essenceToTpPhase={stats.essenceToTpCurve.phase}
                boostCapCeiling={stats.boostCapCeiling}
                ppPerSecond={stats.ppPerSecond}
                tpPerSecond={stats.tpPerSecond}
                treeBuyInfo={stats.treeBuyInfo}
                projectedTreePointsGain={stats.projectedTreePointsGain}
                skillNodes={state.skillNodes}
                multiBuy={state.multiBuyBySection.skillTree}
                globalScaleReduction={stats.globalScaleReduction}
                notation={state.notation}
                adminUnlocked={state.adminUnlocked}
                adminFreeMode={state.adminFreeMode}
                isSkillNodeUnlocked={isSkillNodeUnlocked}
                onMultiBuyChange={(val) => setSectionMultiBuy('skillTree', val)}
                onRequestTreeReset={() => setConfirmModal('treeReset')}
                onBuySkillNode={buySkillNode}
              />
            )}

            {activeTab === 'singularity' && (
              <SingularityPanel
                treePoints={state.treePoints}
                singularityCount={state.singularityCount}
                singularityCoreLevel={state.singularityCoreLevel}
                singularityEssence={state.singularityEssence}
                singularityCost={stats.singularityCost}
                canSingularity={stats.canSingularity}
                projectedEssenceGain={stats.projectedEssenceGain}
                coreCoinMult={stats.coreCoinMult}
                coreRpMult={stats.coreRpMult}
                corePpMult={stats.corePpMult}
                coreTpMult={stats.coreTpMult}
                effectiveCoreScale={stats.effectiveCoreScale}
                singularityCoreBuyInfo={stats.singularityCoreBuyInfo}
                singularityUpgrades={state.singularityUpgrades}
                essenceReactorLevel={state.essenceReactorLevel}
                reactorUnlocked={stats.reactorUnlocked}
                reactorBuyInfo={stats.reactorBuyInfo}
                essencePerSecond={stats.essencePerSecond}
                tpPerSecond={stats.tpPerSecond}
                hasAutoBuildings={stats.hasAutoBuildings}
                hasAutoUpgrades={stats.hasAutoUpgrades}
                hasAutoRebirth={stats.hasAutoRebirth}
                hasAutoClicker={stats.hasAutoClicker}
                automation={state.automation}
                multiBuy={state.multiBuyBySection.singularity}
                globalScaleReduction={stats.globalScaleReduction}
                notation={state.notation}
                adminFreeMode={state.adminFreeMode}
                onMultiBuyChange={(val) => setSectionMultiBuy('singularity', val)}
                onRequestSingularity={() => setConfirmModal('singularity')}
                onLevelUpCore={levelUpSingularityCore}
                onBuySingularityUpgrade={buySingularityUpgrade}
                onBuyEssenceReactor={buyEssenceReactor}
                onToggleAuto={toggleAutomation}
              />
            )}

            {activeTab === 'timeReset' && (
              <TimeResetPanel
                singularityEssence={state.singularityEssence}
                timeResetCount={state.timeResetCount}
                timeTokens={state.timeTokens}
                lifetimeTimeTokens={state.lifetimeTimeTokens}
                timeTokenMult={stats.timeTokenMult}
                boostCapCeiling={stats.boostCapCeiling}
                canTimeReset={stats.canTimeReset}
                projectedTimeTokens={stats.projectedTimeTokens}
                timeFlipChanceLevel={state.timeFlipChanceLevel}
                timeFlipWinChance={stats.timeFlipWinChance}
                timeFlipBuyInfo={stats.timeFlipBuyInfo}
                multiBuy={state.multiBuyBySection.timeReset}
                notation={state.notation}
                adminFreeMode={state.adminFreeMode}
                onMultiBuyChange={(val) => setSectionMultiBuy('timeReset', val)}
                onTimeReset={triggerTimeReset}
                onBuyTimeFlipUpgrade={buyTimeFlipUpgrade}
              />
            )}
          </Suspense>
        </section>
      </main>

      {/* Admin Modal ("bobdabuilder") */}
      <AdminModal
        isOpen={adminOpen}
        adminUnlocked={state.adminUnlocked}
        adminFreeMode={state.adminFreeMode}
        onClose={() => setAdminOpen(false)}
        onSubmitCode={unlockAdminWithCode}
        onToggleFreeMode={toggleAdminFreeMode}
        onGrantResources={adminGrantResources}
        onExitAdmin={exitAdminMode}
      />

      {/* In-App Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-lg font-extrabold text-white">
              {confirmModal === 'rebirth' && `Confirm Rebirth (+${stats.rebirthBuyInfo.count})`}
              {confirmModal === 'prestige' && `Confirm Prestige (+${stats.prestigeBuyInfo.count})`}
              {confirmModal === 'treeReset' &&
                `Harvest Tree Points (+${stats.treeBuyInfo.count})`}
              {confirmModal === 'singularity' && 'Enter The Singularity'}
              {confirmModal === 'hardReset' && 'Hard Reset Save Data?'}
            </h3>

            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              {confirmModal === 'rebirth' &&
                `Resets Coins, Buildings, Upgrades, and Coin Core Level in exchange for +${formatNum(stats.projectedRebirthRpGain, state.notation)} Rebirth Points.`}
              {confirmModal === 'prestige' &&
                `Costs 1M+ Rebirth Points and resets Coins, Buildings, Upgrades, Coin Core, and Rebirth in exchange for +${formatNum(stats.projectedPrestigePointsGain, state.notation)} Prestige Points.`}
              {confirmModal === 'treeReset' &&
                `Costs 1B+ Prestige Points and resets Prestige, Rebirth, and Coins in exchange for +${formatNum(stats.projectedTreePointsGain, state.notation)} Tree Points.`}
              {confirmModal === 'singularity' &&
                `Costs ${formatNum(stats.singularityCost, state.notation)} Tree Points (increases 10x after) and resets Coins, Rebirth, Prestige, and Skill Tree in exchange for +${stats.projectedEssenceGain} Singularity Essence!`}
              {confirmModal === 'hardReset' &&
                'This permanently erases all progress across all layers. This cannot be undone.'}
            </p>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                className={`rounded-xl px-4 py-2 text-xs font-extrabold cursor-pointer ${
                  confirmModal === 'hardReset' || confirmModal === 'singularity'
                    ? 'bg-rose-500 text-white hover:bg-rose-400'
                    : confirmModal === 'treeReset'
                      ? 'bg-emerald-400 text-slate-950 hover:bg-emerald-300'
                      : confirmModal === 'prestige'
                        ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300'
                        : 'bg-purple-500 text-white hover:bg-purple-400'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
