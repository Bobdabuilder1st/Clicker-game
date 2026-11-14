import React, { Suspense, lazy, useCallback, useState } from 'react';
import { ActiveTab, MultiBuyAmount } from './types/game';
import { useGameEngine } from './hooks/useGameEngine';
import { formatNum } from './utils/format';
import { ClickerSection } from './components/ClickerSection';

const BuildingsPanel = lazy(() => import('./components/panels/BuildingsPanel'));
const UpgradesPanel = lazy(() => import('./components/panels/UpgradesPanel'));
const RebirthPanel = lazy(() => import('./components/panels/RebirthPanel'));
const PrestigePanel = lazy(() => import('./components/panels/PrestigePanel'));
const SkillTreePanel = lazy(() => import('./components/panels/SkillTreePanel'));
const SingularityPanel = lazy(() => import('./components/panels/SingularityPanel'));
const TimeResetPanel = lazy(() => import('./components/panels/TimeResetPanel'));
const IdealPanel = lazy(() => import('./components/panels/IdealPanel'));

const AdminModal = lazy(() =>
  import('./components/AdminModal').then((m) => ({ default: m.AdminModal }))
);
const SaveStatesModal = lazy(() =>
  import('./components/SaveStatesModal').then((m) => ({ default: m.SaveStatesModal }))
);
const AchievementsModal = lazy(() =>
  import('./components/AchievementsModal').then((m) => ({ default: m.AchievementsModal }))
);
const FirstRebirthPopup = lazy(() =>
  import('./components/AchievementsModal').then((m) => ({ default: m.FirstRebirthPopup }))
);
const CodesModal = lazy(() =>
  import('./components/CodesModal').then((m) => ({ default: m.CodesModal }))
);

type ConfirmModalType = 'rebirth' | 'prestige' | 'treeReset' | 'singularity' | 'hardReset' | null;

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('buildings');
  const [confirmModal, setConfirmModal] = useState<ConfirmModalType>(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [savesOpen, setSavesOpen] = useState(false);
  const [achievementsOpen, setAchievementsOpen] = useState(false);
  const [codesOpen, setCodesOpen] = useState(false);

  const {
    state,
    stats,
    saveStates,
    firstRebirthPopupOpen,
    dismissFirstRebirthPopup,
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
  } = useGameEngine(activeTab);

  const handleCoinCoreMultiChange = useCallback(
    (val: MultiBuyAmount) => setSectionMultiBuy('coinCore', val),
    [setSectionMultiBuy]
  );
  const handleBuildingsMultiChange = useCallback(
    (val: MultiBuyAmount) => setSectionMultiBuy('buildings', val),
    [setSectionMultiBuy]
  );
  const handleUpgradesMultiChange = useCallback(
    (val: MultiBuyAmount) => setSectionMultiBuy('upgrades', val),
    [setSectionMultiBuy]
  );
  const handleRebirthMultiChange = useCallback(
    (val: MultiBuyAmount) => setSectionMultiBuy('rebirth', val),
    [setSectionMultiBuy]
  );
  const handlePrestigeMultiChange = useCallback(
    (val: MultiBuyAmount) => setSectionMultiBuy('prestige', val),
    [setSectionMultiBuy]
  );
  const handleSkillTreeMultiChange = useCallback(
    (val: MultiBuyAmount) => setSectionMultiBuy('skillTree', val),
    [setSectionMultiBuy]
  );
  const handleSingularityMultiChange = useCallback(
    (val: MultiBuyAmount) => setSectionMultiBuy('singularity', val),
    [setSectionMultiBuy]
  );
  const handleTimeResetMultiChange = useCallback(
    (val: MultiBuyAmount) => setSectionMultiBuy('timeReset', val),
    [setSectionMultiBuy]
  );

  const handleRequestRebirth = useCallback(() => setConfirmModal('rebirth'), []);
  const handleRequestPrestige = useCallback(() => setConfirmModal('prestige'), []);
  const handleRequestTreeReset = useCallback(() => setConfirmModal('treeReset'), []);
  const handleRequestSingularity = useCallback(() => setConfirmModal('singularity'), []);
  const handleOpenIdealTab = useCallback(() => setActiveTab('ideal'), []);

  const handleCloseSaves = useCallback(() => setSavesOpen(false), []);
  const handleCreateManualSave = useCallback((name?: string) => createSaveState(name, false), [createSaveState]);
  const handleCloseAchievements = useCallback(() => setAchievementsOpen(false), []);
  const handleRedeemClickerNow = useCallback(() => redeemCode('clicker'), [redeemCode]);
  const handleCloseCodes = useCallback(() => setCodesOpen(false), []);
  const handleCloseAdmin = useCallback(() => setAdminOpen(false), []);

  const totalCpsWithAuto = stats.coinsPerSecond.add(stats.coinsPerClick.mul(stats.autoClicksPerSecond));
  const completedAchievements =
    (state.achievements.firstRebirth ? 1 : 0) +
    (state.achievements.firstPrestige ? 1 : 0) +
    (state.achievements.firstSkillTree ? 1 : 0);

  const tabs: { id: ActiveTab; label: string; ready?: boolean }[] = [
    { id: 'buildings', label: 'Buildings' },
    { id: 'upgrades', label: 'Upgrades' },
    { id: 'rebirth', label: 'Rebirth', ready: stats.rebirthBuyInfo.canAfford },
    { id: 'prestige', label: 'Prestige', ready: stats.prestigeBuyInfo.canAfford },
    { id: 'skillTree', label: 'Skill Tree', ready: stats.treeBuyInfo.canAfford },
    { id: 'singularity', label: 'Singularity', ready: stats.canSingularity },
    { id: 'timeReset', label: 'Time Reset', ready: stats.canTimeReset },
    {
      id: 'ideal',
      label: state.idealTabUnlocked ? 'Idle' : '🔒 Idle',
      ready: !state.idealTabUnlocked && stats.canUnlockIdealTab
    }
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
                {state.hardMode && (
                  <span className="rounded-md border border-rose-500/60 bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-extrabold text-rose-300">
                    HARD 10x
                  </span>
                )}
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
                  {stats.rpPerSecond.gt(0) && (
                    <span className="ml-1 text-xs text-emerald-300">
                      (+{formatNum(stats.rpPerSecond, state.notation)}/s)
                    </span>
                  )}
                </div>
              </div>

              {(state.prestigePoints.gt(0) || state.lifetimePrestigePoints.gt(0) || state.adminUnlocked) && (
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
                    Gems
                  </div>
                  <div className="font-mono text-sm font-bold text-cyan-200 tabular-nums leading-tight">
                    {formatNum(state.prestigePoints, state.notation)} 💎
                  </div>
                </div>
              )}

              {(state.treePoints.gt(0) || state.lifetimeTreePoints.gt(0) || state.adminUnlocked) && (
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                    Leaves
                  </div>
                  <div className="font-mono text-sm font-bold text-emerald-200 tabular-nums leading-tight">
                    {formatNum(state.treePoints, state.notation)} 🍃
                  </div>
                </div>
              )}

              {(state.singularityEssence.gt(0) || state.singularityCount > 0 || state.adminUnlocked) && (
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-rose-300">
                    Essence
                  </div>
                  <div className="font-mono text-sm font-bold text-rose-200 tabular-nums leading-tight">
                    {formatNum(state.singularityEssence, state.notation)} 🕳️
                  </div>
                </div>
              )}

              {(state.timeTokens.gt(0) || state.timeResetCount > 0 || state.adminUnlocked) && (
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                    Time Tokens
                  </div>
                  <div className="font-mono text-sm font-bold text-amber-200 tabular-nums leading-tight">
                    {formatNum(state.timeTokens, state.notation)} 🪙
                  </div>
                </div>
              )}

              {stats.omniEverythingMult.gt(1) && (
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-fuchsia-300">
                    Omni-Boost
                  </div>
                  <div className="font-mono text-sm font-bold text-fuchsia-200 tabular-nums leading-tight">
                    ×{formatNum(stats.omniEverythingMult, state.notation)} All
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setAchievementsOpen(true)}
              className="rounded-xl border border-amber-500/40 bg-amber-950/30 px-2.5 py-1.5 text-xs font-bold text-amber-200 hover:bg-amber-900/40 cursor-pointer whitespace-nowrap shrink-0"
            >
              🏆 {completedAchievements}/3
            </button>

            <button
              type="button"
              onClick={() => setSavesOpen(true)}
              className="rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-800 cursor-pointer whitespace-nowrap shrink-0"
            >
              💾 Saves ({saveStates.length})
            </button>

            <button
              type="button"
              onClick={() => setCodesOpen(true)}
              className="rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-800 cursor-pointer whitespace-nowrap shrink-0"
            >
              🎟️ Codes
            </button>

            <button
              type="button"
              onClick={() => setAdminOpen(true)}
              className={`rounded-xl border px-2.5 py-1.5 text-xs font-bold cursor-pointer whitespace-nowrap shrink-0 ${
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
              className="rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-800 cursor-pointer whitespace-nowrap shrink-0"
              title="Toggle number notation"
            >
              {state.notation === 'standard' ? 'Std' : 'Sci'}
            </button>

            <button
              type="button"
              onClick={toggleSound}
              className="rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-800 cursor-pointer whitespace-nowrap shrink-0"
              title="Toggle sound effects"
            >
              {state.soundEnabled ? '🔊' : '🔇'}
            </button>

            <button
              type="button"
              onClick={() => setConfirmModal('hardReset')}
              className="rounded-xl border border-rose-900/60 bg-rose-950/30 px-2.5 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-900/40 cursor-pointer whitespace-nowrap shrink-0"
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
            ppCoinMultiplier={stats.ppToRpCurve.multiplier}
            tpCoinMultiplier={stats.tpToPpCurve.multiplier}
            essenceCoinMultiplier={stats.essenceToTpCurve.multiplier}
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
            codeClickerUnlocked={state.codeClickerUnlocked}
            codeClickerEnabled={state.codeClickerEnabled}
            onToggleCodeClicker={toggleCodeClicker}
            onManualClick={handleManualClick}
            onLevelUpClicker={levelUpClicker}
            onCoinCoreMultiChange={handleCoinCoreMultiChange}
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
                      ? tab.id === 'ideal'
                        ? 'bg-gradient-to-r from-rose-500 via-amber-400 to-violet-500 text-slate-950 shadow-md'
                        : tab.id === 'timeReset'
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

          <Suspense
            fallback={
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center text-xs text-slate-400">
                Loading section...
              </div>
            }
          >
            {activeTab === 'buildings' && (
              <BuildingsPanel
                buildings={state.buildings}
                coins={state.coins}
                lifetimeCoins={state.lifetimeCoins}
                sectionWave={state.sectionWaves.buildings}
                multiBuy={state.multiBuyBySection.buildings}
                globalScaleReduction={stats.globalScaleReduction}
                buildingDiscountMult={stats.buildingDiscountMult}
                hardCostMult={stats.hardCostMult}
                buildingCpsMap={stats.buildingCpsMap}
                notation={state.notation}
                hasAutoBuildings={stats.hasAutoBuildings}
                adminUnlocked={state.adminUnlocked}
                adminFreeMode={state.adminFreeMode}
                automation={state.automation}
                onMultiBuyChange={handleBuildingsMultiChange}
                onBuyBuilding={buyBuilding}
                onBuyWaveUpgrade={buySectionWaveUpgrade}
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
                sectionWave={state.sectionWaves.upgrades}
                allUpgradeTracksMaxed={stats.allUpgradeTracksMaxed}
                multiBuy={state.multiBuyBySection.upgrades}
                globalScaleReduction={stats.globalScaleReduction}
                hardCostMult={stats.hardCostMult}
                notation={state.notation}
                hasAutoUpgrades={stats.hasAutoUpgrades}
                adminUnlocked={state.adminUnlocked}
                adminFreeMode={state.adminFreeMode}
                automation={state.automation}
                onMultiBuyChange={handleUpgradesMultiChange}
                onBuyUpgrade={buyUpgradeTrack}
                onBuyWaveUpgrade={buySectionWaveUpgrade}
                onToggleAuto={toggleAutomation}
              />
            )}

            {activeTab === 'rebirth' && (
              <RebirthPanel
                coins={state.coins}
                rebirthLevel={state.rebirthLevel}
                rebirthPoints={state.rebirthPoints}
                prestigePoints={state.prestigePoints}
                ppToRpMultiplier={stats.ppToRpCurve.multiplier}
                ppToRpPhase={stats.ppToRpCurve.phase}
                tpToRpMultiplier={stats.tpToPpCurve.multiplier}
                essenceToRpMultiplier={stats.essenceToTpCurve.multiplier}
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
                ascendedRebirthPerks={state.ascendedRebirthPerks}
                allBaseRebirthPerksMaxed={stats.allBaseRebirthPerksMaxed}
                effectiveAscendedRebirthBaseCost={stats.effectiveAscendedRebirthBaseCost}
                sectionWave={state.sectionWaves.rebirth}
                allRebirthMaxed={stats.essenceConvergenceProgress.allRebirthMaxed}
                essenceConvergenceOpen={stats.essenceConvergenceOpen}
                essenceConvergenceUpgrades={state.essenceConvergenceUpgrades}
                essenceConvergenceProgress={stats.essenceConvergenceProgress}
                multiBuy={state.multiBuyBySection.rebirth}
                globalScaleReduction={stats.globalScaleReduction}
                hardCostMult={stats.hardCostMult}
                notation={state.notation}
                hasAutoRebirth={stats.hasAutoRebirth}
                adminUnlocked={state.adminUnlocked}
                adminFreeMode={state.adminFreeMode}
                automation={state.automation}
                onMultiBuyChange={handleRebirthMultiChange}
                onRequestRebirth={handleRequestRebirth}
                onBuyPerk={buyRebirthPerk}
                onBuyAscendedPerk={buyAscendedRebirthPerk}
                onBuyWaveUpgrade={buySectionWaveUpgrade}
                onBuyEssenceConvergenceUpgrade={buyEssenceConvergenceUpgrade}
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
                essenceToPpMultiplier={stats.essenceToTpCurve.multiplier}
                boostCapCeiling={stats.boostCapCeiling}
                rpPerSecond={stats.rpPerSecond}
                ppPerSecond={stats.ppPerSecond}
                effectivePrestigeScale={stats.effectivePrestigeScale}
                prestigeBuyInfo={stats.prestigeBuyInfo}
                projectedPrestigePointsGain={stats.projectedPrestigePointsGain}
                prestigeUpgrades={state.prestigeUpgrades}
                sectionWave={state.sectionWaves.prestige}
                allPrestigeMaxed={stats.essenceConvergenceProgress.allPrestigeMaxed}
                essenceConvergenceOpen={stats.essenceConvergenceOpen}
                essenceConvergenceUpgrades={state.essenceConvergenceUpgrades}
                essenceConvergenceProgress={stats.essenceConvergenceProgress}
                multiBuy={state.multiBuyBySection.prestige}
                globalScaleReduction={stats.globalScaleReduction}
                hardCostMult={stats.hardCostMult}
                notation={state.notation}
                hasAutoPrestige={stats.hasAutoPrestige}
                adminFreeMode={state.adminFreeMode}
                automation={state.automation}
                onMultiBuyChange={handlePrestigeMultiChange}
                onRequestPrestige={handleRequestPrestige}
                onBuyPrestigeUpgrade={buyPrestigeUpgrade}
                onBuyWaveUpgrade={buySectionWaveUpgrade}
                onBuyEssenceConvergenceUpgrade={buyEssenceConvergenceUpgrade}
                onToggleAuto={toggleAutomation}
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
                sectionWave={state.sectionWaves.skillTree}
                allSkillTreeMaxed={stats.essenceConvergenceProgress.allSkillTreeMaxed}
                essenceConvergenceOpen={stats.essenceConvergenceOpen}
                essenceConvergenceUpgrades={state.essenceConvergenceUpgrades}
                essenceConvergenceProgress={stats.essenceConvergenceProgress}
                multiBuy={state.multiBuyBySection.skillTree}
                globalScaleReduction={stats.globalScaleReduction}
                hardCostMult={stats.hardCostMult}
                notation={state.notation}
                hasAutoSkillTree={stats.hasAutoSkillTree}
                automation={state.automation}
                adminUnlocked={state.adminUnlocked}
                adminFreeMode={state.adminFreeMode}
                isSkillNodeUnlocked={isSkillNodeUnlocked}
                onMultiBuyChange={handleSkillTreeMultiChange}
                onRequestTreeReset={handleRequestTreeReset}
                onBuySkillNode={buySkillNode}
                onBuyWaveUpgrade={buySectionWaveUpgrade}
                onBuyEssenceConvergenceUpgrade={buyEssenceConvergenceUpgrade}
                onToggleAuto={toggleAutomation}
              />
            )}

            {activeTab === 'singularity' && (
              <SingularityPanel
                rebirthPoints={state.rebirthPoints}
                prestigePoints={state.prestigePoints}
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
                sectionWave={state.sectionWaves.singularity}
                allSingularityUpgradesMaxed={stats.allSingularityUpgradesMaxed}
                essenceConvergenceOpen={stats.essenceConvergenceOpen}
                essenceConvergenceMult={stats.essenceConvergenceMult}
                essenceConvergenceUpgrades={state.essenceConvergenceUpgrades}
                essenceConvergenceProgress={stats.essenceConvergenceProgress}
                essenceReactorLevel={state.essenceReactorLevel}
                reactorUnlocked={stats.reactorUnlocked}
                reactorBuyInfo={stats.reactorBuyInfo}
                billionEssenceOpen={stats.billionEssenceOpen}
                billionEssenceThreshold={stats.billionEssenceThreshold}
                billionEssenceUpgrades={state.billionEssenceUpgrades}
                hasAutoBillionEssence={stats.hasAutoBillionEssence}
                essencePerSecond={stats.essencePerSecond}
                tpPerSecond={stats.tpPerSecond}
                hasAutoBuildings={stats.hasAutoBuildings}
                hasAutoUpgrades={stats.hasAutoUpgrades}
                hasAutoRebirth={stats.hasAutoRebirth}
                hasAutoPrestige={stats.hasAutoPrestige}
                hasAutoSkillTree={stats.hasAutoSkillTree}
                hasAutoSingularity={stats.hasAutoSingularity}
                hasAutoTimeUpgrades={stats.hasAutoTimeUpgrades}
                hasAutoClicker={stats.hasAutoClicker}
                automation={state.automation}
                multiBuy={state.multiBuyBySection.singularity}
                globalScaleReduction={stats.globalScaleReduction}
                hardCostMult={stats.hardCostMult}
                notation={state.notation}
                adminFreeMode={state.adminFreeMode}
                onMultiBuyChange={handleSingularityMultiChange}
                onRequestSingularity={handleRequestSingularity}
                onLevelUpCore={levelUpSingularityCore}
                onBuySingularityUpgrade={buySingularityUpgrade}
                onBuyWaveUpgrade={buySectionWaveUpgrade}
                onBuyEssenceConvergenceUpgrade={buyEssenceConvergenceUpgrade}
                onBuyEssenceReactor={buyEssenceReactor}
                onBuyBillionEssenceUpgrade={buyBillionEssenceUpgrade}
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
                timeResetRequiredEssence={stats.timeResetRequiredEssence}
                canTimeReset={stats.canTimeReset}
                projectedTimeTokens={stats.projectedTimeTokens}
                timeFlipChanceLevel={state.timeFlipChanceLevel}
                timeFlipWinChance={stats.timeFlipWinChance}
                timeFlipBuyInfo={stats.timeFlipBuyInfo}
                timeTokenBoostLevel={state.timeTokenBoostLevel}
                timeTokenBoostMult={stats.timeTokenBoostMult}
                timeTokenBoostBuyInfo={stats.timeTokenBoostBuyInfo}
                timeAutoSingularityUnlocked={state.timeAutoSingularityUnlocked}
                timeAutoSingularityCost={stats.timeAutoSingularityCost}
                canBuyTimeAutoSingularity={stats.canBuyTimeAutoSingularity}
                hasAutoSingularity={stats.hasAutoSingularity}
                hasAutoTimeUpgrades={stats.hasAutoTimeUpgrades}
                idealTabUnlocked={state.idealTabUnlocked}
                idealTabCost={stats.idealTabCost}
                canUnlockIdealTab={stats.canUnlockIdealTab}
                automation={state.automation}
                sectionWave={state.sectionWaves.timeReset}
                multiBuy={state.multiBuyBySection.timeReset}
                globalScaleReduction={stats.globalScaleReduction}
                hardCostMult={stats.hardCostMult}
                notation={state.notation}
                adminFreeMode={state.adminFreeMode}
                onMultiBuyChange={handleTimeResetMultiChange}
                onTimeReset={triggerTimeReset}
                onBuyTimeFlipUpgrade={buyTimeFlipUpgrade}
                onBuyTimeTokenBoost={buyTimeTokenBoostUpgrade}
                onBuyTimeAutoSingularity={buyTimeAutoSingularity}
                onUnlockIdealTab={unlockIdealTab}
                onOpenIdealTab={handleOpenIdealTab}
                onBuyWaveUpgrade={buySectionWaveUpgrade}
                onToggleAuto={toggleAutomation}
              />
            )}

            {activeTab === 'ideal' && (
              <IdealPanel
                idealTabUnlocked={state.idealTabUnlocked}
                idealTabCost={stats.idealTabCost}
                canUnlockIdealTab={stats.canUnlockIdealTab}
                timeTokens={state.timeTokens}
                ideal={state.ideal}
                idealXpPerSecond={stats.idealXpPerSecond}
                totalIdleXp={stats.totalIdleXp}
                availableIdleXp={stats.availableIdleXp}
                idleAutoTimeCost={stats.idleAutoTimeCost}
                canBuyTimeAutoUpgrades={stats.canBuyTimeAutoUpgrades}
                timeAutoTokenUpgradesUnlocked={state.timeAutoTokenUpgradesUnlocked}
                hasAutoTimeUpgrades={stats.hasAutoTimeUpgrades}
                automation={state.automation}
                sectionWave={state.sectionWaves.ideal}
                multiBuy={state.multiBuyBySection.timeReset}
                globalScaleReduction={stats.globalScaleReduction}
                hardCostMult={stats.hardCostMult}
                idleBoosts={stats.idleBoosts}
                notation={state.notation}
                adminFreeMode={state.adminFreeMode}
                onMultiBuyChange={handleTimeResetMultiChange}
                onUnlockIdealTab={unlockIdealTab}
                onBuyTimeAutoUpgrades={buyTimeAutoUpgrades}
                onBuyWaveUpgrade={buySectionWaveUpgrade}
                onToggleAuto={toggleAutomation}
              />
            )}
          </Suspense>
        </section>
      </main>

      {/* Lazy-Loaded Modals (mounted only when opened) */}
      <Suspense fallback={null}>
        {savesOpen && (
          <SaveStatesModal
            isOpen={savesOpen}
            saveStates={saveStates}
            onClose={handleCloseSaves}
            onCreateSave={handleCreateManualSave}
            onLoadSave={loadSaveState}
            onDeleteSave={deleteSaveState}
          />
        )}

        {achievementsOpen && (
          <AchievementsModal
            isOpen={achievementsOpen}
            achievements={state.achievements}
            codeClickerUnlocked={state.codeClickerUnlocked}
            onClose={handleCloseAchievements}
          />
        )}

        {firstRebirthPopupOpen && (
          <FirstRebirthPopup
            isOpen={firstRebirthPopupOpen}
            onClose={dismissFirstRebirthPopup}
            onRedeemClickerNow={handleRedeemClickerNow}
          />
        )}

        {codesOpen && (
          <CodesModal
            isOpen={codesOpen}
            hardMode={state.hardMode}
            codeClickerUnlocked={state.codeClickerUnlocked}
            adminUnlocked={state.adminUnlocked}
            onClose={handleCloseCodes}
            onRedeemCode={redeemCode}
          />
        )}

        {adminOpen && (
          <AdminModal
            isOpen={adminOpen}
            adminUnlocked={state.adminUnlocked}
            adminFreeMode={state.adminFreeMode}
            onClose={handleCloseAdmin}
            onSubmitCode={unlockAdminWithCode}
            onToggleFreeMode={toggleAdminFreeMode}
            onGrantResources={adminGrantResources}
            onExitAdmin={exitAdminMode}
          />
        )}
      </Suspense>

      {/* In-App Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-lg font-extrabold text-white">
              {confirmModal === 'rebirth' && `Confirm Rebirth (+${stats.rebirthBuyInfo.count})`}
              {confirmModal === 'prestige' && `Confirm Prestige (+${stats.prestigeBuyInfo.count})`}
              {confirmModal === 'treeReset' &&
                `Harvest Leaves (+${stats.treeBuyInfo.count})`}
              {confirmModal === 'singularity' && 'Enter The Singularity'}
              {confirmModal === 'hardReset' && 'Hard Reset Save Data?'}
            </h3>

            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              {confirmModal === 'rebirth' &&
                `Resets Coins, Buildings, Upgrades, and Coin Core Level in exchange for +${formatNum(stats.projectedRebirthRpGain, state.notation)} Rebirth Points.`}
              {confirmModal === 'prestige' &&
                `Costs ${formatNum(stats.prestigeBuyInfo.totalCost, state.notation)} Rebirth Points and resets Coins, Buildings, Upgrades, Coin Core, and Rebirth in exchange for +${formatNum(stats.projectedPrestigePointsGain, state.notation)} Gems.`}
              {confirmModal === 'treeReset' &&
                `Costs ${formatNum(stats.treeBuyInfo.totalCost, state.notation)} Gems and resets Prestige, Rebirth, and Coins in exchange for +${formatNum(stats.projectedTreePointsGain, state.notation)} Leaves.`}
              {confirmModal === 'singularity' &&
                `Costs ${formatNum(stats.singularityCost, state.notation)} Leaves (increases 10x after) and resets Coins, Rebirth, Prestige, and Skill Tree in exchange for +${formatNum(stats.projectedEssenceGain, state.notation)} Singularity Essence!`}
              {confirmModal === 'hardReset' &&
                'This permanently erases your active run across all layers (manual Save States remain safe). This cannot be undone.'}
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
