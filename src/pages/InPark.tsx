import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import BottomGlassNav from '@/components/BottomGlassNav';
import SovereignAnchor from '@/components/priority-stack/SovereignAnchor';
import HeroHorizonStack, { type PlanItem, type WalkingPrompt } from '@/components/priority-stack/HeroHorizonStack';
import PivotShimmer from '@/components/priority-stack/PivotShimmer';
import AssistedDrawer from '@/components/priority-stack/AssistedDrawer';
import AudibleMenu from '@/components/priority-stack/AudibleMenu';
import StrategicDashboard from '@/components/priority-stack/StrategicDashboard';
import MinimalistView from '@/components/MinimalistView';
import SovereignView from '@/components/SovereignView';
import NeedOverlay from '@/components/NeedOverlay';
import RecalibrateSheet from '@/components/RecalibrateSheet';
import SwapSuggestionsSheet, { type SwapReason } from '@/components/SwapSuggestionsSheet';
import BottomSheet from '@/components/BottomSheet';
import FindAndSeekWidget from '@/components/FindAndSeekWidget';
import DevPanel from '@/components/DevPanel';
import { useCompanion } from '@/contexts/CompanionContext';
import { useCelebrate, WHISPERS } from '@/contexts/CelebrationContext';
import { useMemoryVault } from '@/contexts/MemoryContext';
import RecordMemorySheet from '@/components/memory/RecordMemorySheet';
import InterviewSheet from '@/components/memory/InterviewSheet';
import { RESERVATIONS, nextHospitalityReservation, minutesUntil } from '@/data/reservations';
import { INITIAL_HOLDS, DEFAULT_CAPACITY, summarizeCapacity } from '@/data/lightningLanes';
import { usePlanStack, type MustDo } from '@/hooks/park/usePlanStack';
import { useStrategyEngine } from '@/hooks/park/useStrategyEngine';

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

const MUST_DOS: MustDo[] = [
  { id: 'm1', attraction: 'Pirates of the Caribbean', desired: 1, done: 0 },
  { id: 'm2', attraction: 'Haunted Mansion', desired: 2, done: 0 },
  { id: 'm3', attraction: 'Big Thunder Mountain', desired: 2, done: 0 },
  { id: 'm4', attraction: 'Space Mountain', desired: 1, done: 0 },
  { id: 'm5', attraction: "Peter Pan\u2019s Flight", desired: 1, done: 0 },
];

// Walking prompts retained as data but never rendered as cards — the page
// must never show more than 3 cards. Whimsy surfaces via WhisperStrip.
const WALKING_PROMPTS: WalkingPrompt[] = [];

const NOW_MINUTES = 10 * 60 + 45; // mock 10:45 AM park-time

const InPark = () => {
  const navigate = useNavigate();
  const { celebrate } = useCelebrate();
  const { minimalist, tier, devPanelEnabled, llTrackerVisible } = useCompanion();
  const useQuietView = minimalist || tier === 'sovereign';

  // ── State machines extracted into hooks ───────────────────────────────
  const { plan, hero, mustDos, completeHero, promoteToHero, promoteMustDoToHero, adjustDesired } =
    usePlanStack({
      initialPlan: PLAN,
      initialMustDos: MUST_DOS,
      onCelebrate: celebrate,
    });
  const {
    pivotSuggested,
    setPivotSuggested,
    pivotBadges,
    clearBadge,
    pivotLabel,
    pivotWith,
  } = useStrategyEngine({ enabled: !useQuietView });

  // ── Sovereign Key context ─────────────────────────────────────────────
  const [audibleOpen, setAudibleOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [needType, setNeedType] = useState<'bathroom' | 'quiet' | 'food' | null>(null);
  const [showRecalibrate, setShowRecalibrate] = useState(false);
  const [swapFor, setSwapFor] = useState<string | null>(null);
  const [swapReason, setSwapReason] = useState<SwapReason>('manual');

  /**
   * Centralized opener: validates that a SwapReason is set BEFORE the sheet
   * mounts, so the rain-roster code path can never silently fall back to the
   * default roster. Logs every transition for QA.
   */
  const VALID_REASONS: SwapReason[] = ['rain', 'closure', 'manual'];
  const openSwap = (nextReason: SwapReason, skipped: string) => {
    const safeReason: SwapReason = VALID_REASONS.includes(nextReason) ? nextReason : 'manual';
    if (safeReason !== nextReason) {
      console.warn('[SwapPivot] invalid reason received, falling back to "manual"', { nextReason });
    }
    console.info('[SwapPivot] opening', { reason: safeReason, skipped });
    setSwapReason(safeReason);
    // Set skipped LAST so the sheet's `open` flips to true only after reason is committed.
    setSwapFor(skipped);
  };
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerHandled, setDrawerHandled] = useState(false);
  const [findAndSeekOpen, setFindAndSeekOpen] = useState(false);
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [memoryContext, setMemoryContext] = useState<{ attraction?: string; location?: string } | undefined>(undefined);
  const [preInterviewOpen, setPreInterviewOpen] = useState(false);
  const { preCompleted } = useMemoryVault();

  // The pre-park interview is no longer auto-surfaced. It now opens only when
  // the guest taps "Record Memory" for the first time (and hasn't completed it).

  // ── Derived data ──────────────────────────────────────────────────────
  const nextHold = nextHospitalityReservation(RESERVATIONS, NOW_MINUTES, 60);
  const upcomingHold = nextHold && (nextHold.kind === 'dining' || nextHold.kind === 'experience')
    ? {
        kind: nextHold.kind,
        name: nextHold.name,
        minutesAway: Math.max(0, minutesUntil(nextHold.startsAt, NOW_MINUTES)),
        walkMinutes: nextHold.walkMinutes,
      }
    : undefined;

  const llSummary = summarizeCapacity(INITIAL_HOLDS, NOW_MINUTES, DEFAULT_CAPACITY);
  const llCapacity = {
    canBookNow: llSummary.canBookLLNow,
    unlocksInMin: llSummary.llUnlocksInMin,
    held: llSummary.llHeldCount,
    cap: llSummary.llCapTotal,
  };

  // Type A = manager tier with LL tracking on. They get the Strategic Dashboard.
  const isTypeA = tier === 'manager' && llTrackerVisible;

  // Mark Must-Dos as in-stack if their attraction matches one of the 3 visible cards.
  const stackAttractions = new Set(plan.slice(0, 3).map((p) => p.attraction));
  const mustDoIcons: MustDoIcon[] = mustDos.map((m) => ({
    id: m.id,
    label: m.attraction,
    inStack: stackAttractions.has(m.attraction),
    desired: m.desired,
    done: m.done,
  }));
  const mustDoEntries: MustDoEntry[] = mustDos.map((m) => ({
    id: m.id,
    attraction: m.attraction,
    inStack: stackAttractions.has(m.attraction),
    desired: m.desired,
    done: m.done,
  }));

  // Fire a one-time celebration whisper the moment the unlock window opens.
  useEffect(() => {
    if (!llSummary.canBookLLNow) return;
    const t = setTimeout(() => {
      celebrate('Your next Lightning Lane is ready to book.', 'Slot Open');
    }, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Contextual Booking Drawer auto-surface (suppressed in quiet view).
  useEffect(() => {
    if (minimalist || drawerHandled) return;
    const t = setTimeout(() => setDrawerOpen(true), 4000);
    return () => clearTimeout(t);
  }, [minimalist, drawerHandled]);

  // ── Handlers ──────────────────────────────────────────────────────────
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

  const runPivot = (label: string, after: () => void) => {
    setAudibleOpen(false);
    pivotWith(label, after);
  };

  // Pause whisper rotation whenever something else is competing for attention.
  const whisperPaused =
    pivotSuggested ||
    audibleOpen ||
    dashboardOpen ||
    drawerOpen ||
    needType !== null ||
    showRecalibrate ||
    swapFor !== null ||
    findAndSeekOpen ||
    memoryOpen ||
    preInterviewOpen;

  return (
    <div className="min-h-screen bg-background digital-plaid-bg max-w-[480px] mx-auto relative flex flex-col">
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
              <h1 className="text-masthead text-primary mt-2">
                The Active<br /><span className="text-secondary">Journey.</span>
              </h1>
            </header>

            {/* Sovereign Progress Bar — Must-Dos with gold glow on stack matches */}
            <div className="mb-2">
              <MustDoRibbon items={mustDoIcons} />
            </div>

            {/* Dropdown of remaining Must-Dos not yet in the stack */}
            <div className="mb-3">
              <MustDoDropdown
                items={mustDoEntries}
                onPromote={promoteMustDoToHero}
                onAdjustDesired={adjustDesired}
              />
            </div>

            {/* Whisper ticker */}
            <div className="mb-4 -mx-5">
              <WhisperStrip paused={whisperPaused} />
            </div>

            {/* The Sovereign Stack OR Pivot Shimmer */}
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
                      items={plan}
                      walkingPrompts={WALKING_PROMPTS}
                      onCommitHero={commitHero}
                      onCaptureMemory={(id) => {
                        const item = plan.find((p) => p.id === id);
                        setMemoryContext(item ? { attraction: item.attraction, location: item.location } : undefined);
                        // First tap on Record Memory surfaces the pre-park interview
                        // (once). Subsequent taps go straight to the recorder.
                        if (!preCompleted) {
                          setPreInterviewOpen(true);
                        } else {
                          setMemoryOpen(true);
                        }
                      }}
                      onFindAndSeek={() => setFindAndSeekOpen(true)}
                      onPromote={promoteToHero}
                      onCompleteHero={completeHero}
                      pivotSuggested={pivotSuggested && !pivotLabel}
                      pivotHeadline="A New Path is Available"
                      upcomingHold={upcomingHold}
                      onUpcomingHoldTap={() => setDashboardOpen(true)}
                      llCapacity={llCapacity}
                      onLLChipTap={() => navigate('/book-ll')}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          </main>
        </>
      )}

      {/* Contextual Booking Drawer — globally mounted so Tier 3 (sovereign)
          users still receive the auto-confirm toast in the quiet view. */}
      <AssistedDrawer
        open={drawerOpen}
        attraction="Pirates of the Caribbean"
        window="1:15 PM"
        savedMinutes={40}
        reasoning="aligns with your lunch pivot at Skipper Canteen"
        onConfirm={confirmDrawer}
        onDismiss={dismissDrawer}
      />

      <HearthDock
        onSovereignTap={handleSovereignTap}
        active={audibleOpen || dashboardOpen}
        badges={pivotBadges}
        onRestroom={() => { clearBadge('restroom'); runPivot('Restroom', () => setNeedType('bathroom')); }}
        onRefuel={() => { clearBadge('refuel'); runPivot('Refuel', () => setNeedType('food')); }}
        onBreak={() => { clearBadge('break'); runPivot('Need a Break', () => setNeedType('quiet')); }}
        onRain={() => { clearBadge('rain'); runPivot('Rain Pivot', () => openSwap('rain', hero?.attraction ?? 'current ride')); }}
        onReset={() => { clearBadge('reset'); runPivot('Reset Strategy', () => { setPivotSuggested(false); setShowRecalibrate(true); }); }}
      />

      <AudibleMenu
        open={audibleOpen}
        onClose={() => setAudibleOpen(false)}
        onBreak={() => runPivot('Need a Break', () => setNeedType('quiet'))}
        onRefuel={() => runPivot('Refuel', () => setNeedType('food'))}
        onClosure={() => runPivot('Rain Pivot', () => openSwap('rain', hero?.attraction ?? 'current ride'))}
        onReset={() => runPivot('Reset Strategy', () => { setPivotSuggested(false); setShowRecalibrate(true); })}
      />

      <StrategicDashboard
        open={dashboardOpen}
        onClose={() => setDashboardOpen(false)}
      />

      {devPanelEnabled && <DevPanel />}

      <AnimatePresence>
        {needType && (
          <NeedOverlay
            type={needType}
            onClose={() => setNeedType(null)}
            currentLocation={hero?.location}
            hasKids={(hero?.party?.total ?? 0) >= 4}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showRecalibrate && <RecalibrateSheet onClose={() => setShowRecalibrate(false)} />}
      </AnimatePresence>
      <SwapSuggestionsSheet
        open={swapFor !== null}
        onClose={() => { console.info('[SwapPivot] closing'); setSwapFor(null); setSwapReason('manual'); }}
        skipped={swapFor ?? undefined}
        reason={swapReason}
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

      <RecordMemorySheet
        open={memoryOpen}
        onClose={() => setMemoryOpen(false)}
        contextHint={memoryContext}
      />

      <InterviewSheet
        open={preInterviewOpen}
        onClose={() => setPreInterviewOpen(false)}
        phase="pre"
      />
    </div>
  );
};

export default InPark;
