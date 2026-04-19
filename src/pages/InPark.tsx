import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import LoomingHorizon from '@/components/LoomingHorizon';
import HeroHorizonStack, { type PlanItem, type WalkingPrompt } from '@/components/priority-stack/HeroHorizonStack';
import PivotShimmer from '@/components/priority-stack/PivotShimmer';
import MustDoRibbon, { type MustDoIcon } from '@/components/priority-stack/MustDoRibbon';

import AssistedDrawer from '@/components/priority-stack/AssistedDrawer';
import AudibleMenu from '@/components/priority-stack/AudibleMenu';
import StrategicDashboard from '@/components/priority-stack/StrategicDashboard';
import HearthDock from '@/components/HearthDock';
import MinimalistView from '@/components/MinimalistView';
import SovereignView from '@/components/SovereignView';
import NeedOverlay from '@/components/NeedOverlay';
import RecalibrateSheet from '@/components/RecalibrateSheet';
import SwapSuggestionsSheet from '@/components/SwapSuggestionsSheet';
import BottomSheet from '@/components/BottomSheet';
import FindAndSeekWidget from '@/components/FindAndSeekWidget';
import DevPanel from '@/components/DevPanel';
import WhisperStrip from '@/components/WhisperStrip';
import { useCompanion } from '@/contexts/CompanionContext';
import { useCelebrate, WHISPERS } from '@/contexts/CelebrationContext';

const PLAN: PlanItem[] = [
  {
    id: '1',
    rank: 'now',
    time: '10:15',
    attraction: 'Pirates of the Caribbean',
    location: 'Adventureland',
    logic: 'Optimized: 15m lower than predicted wait. Beats the 10:30 parade crowd.',
    wait: '12 min',
    party: { yes: 4, total: 5 },
    questPrompt: 'Find the hidden Mickey on the weather vane above the bridge.',
    questType: 'photo',
    mustDo: true,
  },
  {
    id: '2',
    rank: 'next',
    time: '11:00',
    attraction: 'Haunted Mansion',
    location: 'Liberty Square',
    logic: 'LL secured — your walk lands you 2 minutes before the window opens.',
    wait: '25 min',
    llSecured: true,
    party: { yes: 5, total: 5 },
    questPrompt: 'Look up in the queue — the chandelier tells a story. Catch the third pendant.',
    questType: 'photo',
    mustDo: true,
  },
  {
    id: '3',
    rank: 'later',
    time: '1:15',
    attraction: 'Jungle Cruise',
    location: 'Adventureland',
    logic: 'Paired with lunch nearby to avoid backtracking after the parade.',
    wait: '30 min',
    party: { yes: 3, total: 5 },
    questPrompt: 'Whisper the punchline of the skipper\'s best joke into the Vault.',
    questType: 'voice',
  },
];

// The user's day-of Must-Do list — drives the Sovereign Progress Bar at the top
// and the gold border on any matching card in the stack.
const MUST_DOS: { id: string; attraction: string }[] = [
  { id: 'm1', attraction: 'Pirates of the Caribbean' },
  { id: 'm2', attraction: 'Haunted Mansion' },
  { id: 'm3', attraction: 'Big Thunder Mountain' },
  { id: 'm4', attraction: 'Space Mountain' },
  { id: 'm5', attraction: 'Peter Pan\u2019s Flight' },
];

// Walking prompts are intentionally retained as data but NOT rendered as cards
// — the page must never show more than 3 cards. Whimsy surfaces via WhisperStrip.
const WALKING_PROMPTS: WalkingPrompt[] = [];


const InPark = () => {
  // Sovereign Key contextual mode: 'audible' for relaxed users, 'dashboard' for Type A.
  const [audibleOpen, setAudibleOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [needType, setNeedType] = useState<'bathroom' | 'quiet' | null>(null);
  const [showRecalibrate, setShowRecalibrate] = useState(false);
  const [swapFor, setSwapFor] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerHandled, setDrawerHandled] = useState(false);
  const [findAndSeekOpen, setFindAndSeekOpen] = useState(false);

  // Lightning Lanes are managed EXCLUSIVELY through the Contextual Booking
  // Drawer (`AssistedDrawer`). There is no manual "Secure" surface anywhere —
  // the strategy engine surfaces a Strategic Window when one fits the day.

  // Pivot state — shows the Pivot Shimmer while the strategy recalculates after an Audible.
  const [pivotLabel, setPivotLabel] = useState<string | null>(null);

  // Mocked: surfaces the Burnished Gold pulse + "A New Path is Available" headline on the Hero card.
  // In production this is driven by the strategy engine (weather, wait deltas, party sentiment).
  const [pivotSuggested, setPivotSuggested] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setPivotSuggested(true), 6000);
    return () => clearTimeout(t);
  }, []);

  const { minimalist, tier, devPanelEnabled, llTrackerVisible } = useCompanion();
  const { celebrate } = useCelebrate();

  const useQuietView = minimalist || tier === 'sovereign';
  const hero = PLAN.find((p) => p.rank === 'now');

  // Type A = manager tier with LL tracking on. They get the Strategic Dashboard.
  const isTypeA = tier === 'manager' && llTrackerVisible;

  // The Assisted Drawer is the canonical LL surface — surfaces only when a window is found.
  useEffect(() => {
    if (useQuietView || tier !== 'manager' || drawerHandled) return;
    const t = setTimeout(() => setDrawerOpen(true), 4000);
    return () => clearTimeout(t);
  }, [useQuietView, tier, drawerHandled]);

  const commitHero = () => {
    const tip = WHISPERS.arrival[Math.floor(Math.random() * WHISPERS.arrival.length)];
    celebrate(tip, 'On Your Way');
  };

  const confirmDrawer = () => {
    const tip = WHISPERS.llSnipe[Math.floor(Math.random() * WHISPERS.llSnipe.length)];
    celebrate(tip, 'LL Secured');
    setDrawerOpen(false);
    setDrawerHandled(true);
  };

  const dismissDrawer = () => {
    setDrawerOpen(false);
    setDrawerHandled(true);
  };

  const handleSovereignTap = () => {
    if (isTypeA) setDashboardOpen(true);
    else setAudibleOpen(true);
  };

  /**
   * Pivot the strategy after an Audible is selected.
   * Shows the parchment shimmer while the new Top 3 "computes," then runs the side-effect.
   */
  const pivotWith = (label: string, after: () => void) => {
    setAudibleOpen(false);
    setPivotLabel(label);
    window.setTimeout(() => {
      setPivotLabel(null);
      after();
    }, 1400);
  };

  return (
    <div className="min-h-screen bg-background max-w-[480px] mx-auto relative flex flex-col">
      {useQuietView ? (
        minimalist
          ? <MinimalistView parkName="Magic Kingdom" />
          : <SovereignView parkName="Magic Kingdom" />
      ) : (
        <>
          <LoomingHorizon parkName="Magic Kingdom" pulseStatus="Strategy is Active" />

          <main className="flex-1 pt-[72px] pb-[140px] px-5 flex flex-col">
            {/* Editorial title */}
            <header className="mb-3 shrink-0">
              <span className="font-sans text-[9px] uppercase tracking-sovereign text-muted-foreground font-semibold">
                Today
              </span>
              <h1 className="font-display text-[28px] leading-tight text-foreground mt-1">
                The Active Journey
              </h1>
            </header>

            {/* Whisper ticker */}
            <div className="mb-4 -mx-5">
              <WhisperStrip />
            </div>

            {/* ── Depth-Based Stack OR Pivot Shimmer ── */}
            <section aria-label="Today's plan" className="shrink-0">
              <AnimatePresence mode="wait">
                {pivotLabel ? (
                  <motion.div key="shimmer">
                    <PivotShimmer audibleLabel={pivotLabel} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="stack"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <HeroHorizonStack
                      items={PLAN}
                      walkingPrompts={WALKING_PROMPTS}
                      onCommitHero={commitHero}
                      onCaptureMemory={(id) => celebrate('Memory tucked into the Vault.', `Captured · ${id}`)}
                      onCaptureWalking={(id) => celebrate('A small wonder, recorded.', `Walking · ${id}`)}
                      onFindAndSeek={() => setFindAndSeekOpen(true)}
                      pivotSuggested={pivotSuggested && !pivotLabel}
                      pivotHeadline="A New Path is Available"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/* Footnote — most-wanted as one tappable line */}
            <div className="mt-6">
              <PriorityFootnote />
            </div>

            {/* Memory Capture & Initiate Seek now live as the Engagement Ribbon
                at the base of the Hero card — no separate chip row. */}
          </main>

          {/* Contextual Booking Drawer — the ONLY place Lightning Lanes are managed. */}
          <AssistedDrawer
            open={drawerOpen}
            attraction="Pirates of the Caribbean"
            window="1:15 PM"
            savedMinutes={40}
            reasoning="aligns with your lunch pivot at Skipper Canteen"
            onConfirm={confirmDrawer}
            onDismiss={dismissDrawer}
          />
        </>
      )}

      {/* The Hearth: Floating Obsidian dock with the centered Gold Sovereign Key.
          No side slots — the Key is the only OS anchor. Lightning Lanes are
          surfaced exclusively through the Strategic Window drawer. */}
      <HearthDock
        onSovereignTap={handleSovereignTap}
        active={audibleOpen || dashboardOpen}
      />

      <AudibleMenu
        open={audibleOpen}
        onClose={() => setAudibleOpen(false)}
        onBreak={() => pivotWith('Need a Break', () => setNeedType('quiet'))}
        onRefuel={() => pivotWith('Refuel', () => setNeedType('bathroom'))}
        onClosure={() => pivotWith('Rain Pivot', () => setSwapFor(hero?.attraction ?? 'current ride'))}
        onReset={() => pivotWith('Reset Strategy', () => { setPivotSuggested(false); setShowRecalibrate(true); })}
      />

      <StrategicDashboard
        open={dashboardOpen}
        onClose={() => setDashboardOpen(false)}
      />

      {devPanelEnabled && <DevPanel />}

      <AnimatePresence>
        {needType && <NeedOverlay type={needType} onClose={() => setNeedType(null)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showRecalibrate && <RecalibrateSheet onClose={() => setShowRecalibrate(false)} />}
      </AnimatePresence>
      <SwapSuggestionsSheet
        open={swapFor !== null}
        onClose={() => setSwapFor(null)}
        skipped={swapFor ?? undefined}
      />

      <BottomSheet
        open={findAndSeekOpen}
        onClose={() => setFindAndSeekOpen(false)}
        snap="full"
        eyebrow="The Grand Quest"
        title="Find & Seek"
        subtitle="Hidden details, ranked by proximity."
      >
        <FindAndSeekWidget />
      </BottomSheet>
    </div>
  );
};

export default InPark;
