import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import BottomGlassNav from '@/components/BottomGlassNav';
import HeroHorizonStack, { type PlanItem, type WalkingPrompt } from '@/components/priority-stack/HeroHorizonStack';
import PivotShimmer from '@/components/priority-stack/PivotShimmer';
import ParkEmptyState, { type ParkEmptyVariant } from '@/components/priority-stack/ParkEmptyState';
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
import MustDoFan from '@/components/priority-stack/MustDoFan';
import LockScreenNotice from '@/components/LockScreenNotice';
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
  const [mustDoOpen, setMustDoOpen] = useState(false);
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

  // Must-Do data is no longer surfaced on /park — it lives inside the
  // Audible menu / itinerary editor. Keep `mustDos` available to other
  // hooks but avoid building per-render view-models here.

  // Fire a one-time celebration whisper the moment the unlock window opens.
  useEffect(() => {
    if (!llSummary.canBookLLNow) return;
    const t = setTimeout(() => {
      celebrate('Your next Lightning Lane is ready to book.', 'Slot Open');
    }, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The Contextual Booking Drawer no longer auto-surfaces. The whitespace
  // reset means /park shows ONE thing — the active journey — until the
  // guest taps the Sovereign Key for an audible. Drawer remains mounted
  // for celebrate-on-confirm but only opens via explicit triggers.

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

  const runPivot = (label: string, after: () => void) => {
    setAudibleOpen(false);
    pivotWith(label, after);
  };

  // ── Empty-state derivation ────────────────────────────────────────────
  // The /park page can legitimately have nothing to show. We pick ONE
  // calm placard based on the planning machinery's current state, and
  // the masthead voice softens to match so the eyebrow, title, and
  // placard read as a single composition.
  const hasPlan = plan.length > 0;
  const hasMustDos = mustDos.some((m) => m.desired > 0);
  const completedAny = mustDos.some((m) => m.done > 0);

  let emptyVariant: ParkEmptyVariant | null = null;
  let masthead = {
    eyebrow: 'Today',
    line1: 'The Active',
    line2: 'Journey.',
  };

  if (!hasPlan) {
    if (completedAny && !hasMustDos) {
      emptyVariant = 'day-complete';
      masthead = { eyebrow: 'Today', line1: 'A complete', line2: 'voyage.' };
    } else if (hasMustDos) {
      emptyVariant = 'pivot-pending';
      masthead = { eyebrow: 'Composing', line1: 'A new line', line2: 'is forming.' };
    } else {
      emptyVariant = 'no-plan';
      masthead = { eyebrow: 'A Quiet Slate', line1: 'A blank', line2: 'page.' };
    }
  }

  return (
    <div className="min-h-screen bg-background digital-plaid-bg max-w-[480px] mx-auto relative flex flex-col">
      {useQuietView ? (
        minimalist
          ? <MinimalistView parkName="Magic Kingdom" />
          : <SovereignView parkName="Magic Kingdom" />
      ) : (
        <>
          <main className="flex-1 pt-12 pb-[140px] px-6 flex flex-col">
            {/* Lock-screen-style notification — pinned at the very top so the
                same surface reads correctly when the OS pushes it to a real
                lock screen. Mirrors the active whisper. */}
            <div className="mb-6 shrink-0">
              <LockScreenNotice />
            </div>

            {/* Editorial title — generous whitespace, no chrome above. */}
            <header className="mb-10 shrink-0">
              <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-tertiary-fixed/40">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-tertiary" />
                <span
                  className="font-sans text-[10px] uppercase font-bold text-tertiary-on-fixed-variant"
                  style={{ letterSpacing: '0.18em' }}
                >
                  {masthead.eyebrow}
                </span>
              </div>
              <h1 className="text-masthead text-primary">
                {masthead.line1}<br /><span className="text-secondary">{masthead.line2}</span>
              </h1>
            </header>

            {/* The Sovereign Stack OR Pivot Shimmer — the only thing on screen. */}
            <section aria-label="Today's plan" className="shrink-0">
              <AnimatePresence mode="wait">
                {pivotLabel ? (
                  <motion.div key="shimmer">
                    <PivotShimmer audibleLabel={pivotLabel} />
                  </motion.div>
                ) : emptyVariant ? (
                  <motion.div
                    key={`empty-${emptyVariant}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                  >
                    <ParkEmptyState
                      variant={emptyVariant}
                      action={
                        emptyVariant === 'no-plan'
                          ? {
                              label: 'Sketch your day',
                              onPress: () => navigate('/edit-itinerary'),
                            }
                          : emptyVariant === 'day-complete'
                            ? {
                                label: 'Open your Joy Report',
                                onPress: () => navigate('/joy-report'),
                              }
                            : undefined
                      }
                      secondary={
                        emptyVariant === 'pivot-pending'
                          ? { label: 'Call an audible', onPress: () => setAudibleOpen(true) }
                          : emptyVariant === 'no-plan'
                            ? { label: 'Or call an audible', onPress: () => setAudibleOpen(true) }
                            : undefined
                      }
                    />
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

      {/* Bottom nav — 4 tabs: Today, Must-Do, Pivot, Dashboard. */}
      <BottomGlassNav
        activeTab="today"
        mustDoProgress={{
          done: mustDos.reduce((s, m) => s + Math.min(m.done, m.desired), 0),
          total: mustDos.reduce((s, m) => s + m.desired, 0),
        }}
        attentionTabs={{
          // The Pivot tab pulses when the strategy engine has a fresh
          // suggestion or any pivot badge has flipped on (rain, refuel, …).
          pivot:
            (pivotSuggested && !pivotLabel) ||
            !!pivotBadges.rain ||
            !!pivotBadges.refuel ||
            !!pivotBadges.break ||
            !!pivotBadges.restroom,
          // Details glows when an LL slot has just opened.
          details: llSummary.canBookLLNow,
        }}
        onTabChange={(tab) => {
          if (tab === 'today') return;
          if (tab === 'mustdo') setMustDoOpen(true);
          if (tab === 'pivot') setAudibleOpen(true);
          if (tab === 'details') setDashboardOpen(true);
        }}
      />

      <AudibleMenu
        open={audibleOpen}
        onClose={() => setAudibleOpen(false)}
        onBreak={() => runPivot('Need a Break', () => setNeedType('quiet'))}
        onRefuel={() => runPivot('Refuel', () => setNeedType('food'))}
        onClosure={() => runPivot('Rain Pivot', () => openSwap('rain', hero?.attraction ?? 'current ride'))}
        onReset={() => runPivot('Reset Strategy', () => { setPivotSuggested(false); setShowRecalibrate(true); })}
        onRestroom={() => runPivot('Restroom', () => setNeedType('bathroom'))}
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

      <MustDoFan
        open={mustDoOpen}
        onClose={() => setMustDoOpen(false)}
        mustDos={mustDos}
        onPromote={promoteMustDoToHero}
      />

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
