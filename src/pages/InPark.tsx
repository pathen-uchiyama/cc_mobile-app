import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import LoomingHorizon from '@/components/LoomingHorizon';
import HeroHorizonStack, { type PlanItem, type WalkingPrompt } from '@/components/priority-stack/HeroHorizonStack';
import PivotShimmer from '@/components/priority-stack/PivotShimmer';
import MustDoRibbon, { type MustDoIcon } from '@/components/priority-stack/MustDoRibbon';
import MustDoDropdown, { type MustDoEntry } from '@/components/priority-stack/MustDoDropdown';

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
import { RESERVATIONS, nextHospitalityReservation, minutesUntil } from '@/data/reservations';

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
//
// Survey responses can flag an attraction as a multi-ride favorite — `desired`
// captures how many times the party wants to ride it. `done` tracks completed
// rides; the attraction stays "live" until done >= desired.
type MustDo = { id: string; attraction: string; desired: number; done: number };
const MUST_DOS: MustDo[] = [
  { id: 'm1', attraction: 'Pirates of the Caribbean', desired: 1, done: 0 },
  { id: 'm2', attraction: 'Haunted Mansion', desired: 2, done: 0 },
  { id: 'm3', attraction: 'Big Thunder Mountain', desired: 2, done: 0 },
  { id: 'm4', attraction: 'Space Mountain', desired: 1, done: 0 },
  { id: 'm5', attraction: 'Peter Pan\u2019s Flight', desired: 1, done: 0 },
];

// Walking prompts are intentionally retained as data but NOT rendered as cards
// — the page must never show more than 3 cards. Whimsy surfaces via WhisperStrip.
const WALKING_PROMPTS: WalkingPrompt[] = [];


const InPark = () => {
  // The Sovereign Stack lives in state so cards can be promoted, completed,
  // and pulled in from the Must-Do dropdown — all with a shared-layout swap.
  const [plan, setPlan] = useState<PlanItem[]>(PLAN);
  const [mustDos, setMustDos] = useState<MustDo[]>(MUST_DOS);

  // Sovereign Key contextual mode: 'audible' for relaxed users, 'dashboard' for Type A.
  const [audibleOpen, setAudibleOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [needType, setNeedType] = useState<'bathroom' | 'quiet' | 'food' | null>(null);
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
  // Per-pivot proactive-suggestion flags shown as gold dots on the dock icons.
  const [pivotBadges, setPivotBadges] = useState<Partial<Record<'restroom' | 'refuel' | 'break' | 'rain' | 'reset', boolean>>>({});
  useEffect(() => {
    const t = setTimeout(() => setPivotSuggested(true), 6000);
    // Mock: weather radar shows rain in 30 min → flag Rain Pivot.
    const rainFlag = setTimeout(() => setPivotBadges((b) => ({ ...b, rain: true })), 8000);
    // Mock: party sentiment dips + lunch window opens → flag Refuel.
    const refuelFlag = setTimeout(() => setPivotBadges((b) => ({ ...b, refuel: true })), 12000);
    return () => { clearTimeout(t); clearTimeout(rainFlag); clearTimeout(refuelFlag); };
  }, []);

  const { minimalist, tier, devPanelEnabled, llTrackerVisible } = useCompanion();
  const { celebrate } = useCelebrate();

  const useQuietView = minimalist || tier === 'sovereign';
  const hero = plan.find((p) => p.rank === 'now') ?? plan[0];

  // "On the Books" — surface the next dining/experience hold within 60 min.
  // Mock current park-time of 10:45 AM (645 min). In production this would be
  // `Date.now()` projected to park-local minutes-since-midnight.
  const NOW_MINUTES = 10 * 60 + 45;
  const nextHold = nextHospitalityReservation(RESERVATIONS, NOW_MINUTES, 60);
  const upcomingHold = nextHold && (nextHold.kind === 'dining' || nextHold.kind === 'experience')
    ? {
        kind: nextHold.kind,
        name: nextHold.name,
        minutesAway: Math.max(0, minutesUntil(nextHold.startsAt, NOW_MINUTES)),
        walkMinutes: nextHold.walkMinutes,
      }
    : undefined;

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

  // The Assisted Drawer is the canonical LL surface — invisible by default,
  // surfaces only when the strategy engine identifies a Strategic Opportunity.
  // Tier 3 (sovereign) renders as a top toast + auto-confirm (handled inside the drawer).
  useEffect(() => {
    if (minimalist || drawerHandled) return;
    const t = setTimeout(() => setDrawerOpen(true), 4000);
    return () => clearTimeout(t);
  }, [minimalist, drawerHandled]);

  const commitHero = () => {
    const tip = WHISPERS.arrival[Math.floor(Math.random() * WHISPERS.arrival.length)];
    celebrate(tip, 'On Your Way');
  };

  /**
   * Mark the Hero ride as completed.
   *
   * Increments the Must-Do `done` counter (rides can be repeated, so we count
   * each ride independently rather than flipping a boolean). Removes the card
   * from the active stack and promotes the next item. If the attraction still
   * has remaining rides (done < desired), the Must-Do stays on deck so the
   * user can promote it again later.
   */
  const completeHero = () => {
    if (!hero) return;
    setPlan((prev) => {
      const remaining = prev.filter((p) => p.id !== hero.id);
      if (remaining.length === 0) return remaining;
      const [first, second, ...rest] = remaining;
      return [
        { ...first, rank: 'now' as const },
        ...(second ? [{ ...second, rank: 'next' as const }] : []),
        ...rest.map((r) => ({ ...r, rank: 'later' as const })),
      ];
    });
    let toastSuffix = '';
    setMustDos((prev) =>
      prev.map((m) => {
        if (m.attraction !== hero.attraction) return m;
        const nextDone = Math.min(m.desired, m.done + 1);
        const remaining = m.desired - nextDone;
        toastSuffix =
          m.desired > 1
            ? remaining > 0
              ? ` · ${remaining} ride${remaining === 1 ? '' : 's'} to go`
              : ` · all ${m.desired} rides done`
            : '';
        return { ...m, done: nextDone };
      }),
    );
    celebrate(`${hero.attraction} — tucked into the Vault.${toastSuffix}`, 'Marked Done');
  };

  /** Adjust the desired ride count for a Must-Do (e.g. user wants to ride Tron 3x instead of 2x). */
  const adjustDesired = (mustDoId: string, nextDesired: number) => {
    const clamped = Math.max(1, Math.min(10, nextDesired));
    setMustDos((prev) =>
      prev.map((m) => (m.id === mustDoId ? { ...m, desired: clamped } : m)),
    );
  };

  /** Promote a Horizon card into the Hero slot — shared-layout swap. */
  const promoteToHero = (planItemId: string) => {
    setPlan((prev) => {
      const target = prev.find((p) => p.id === planItemId);
      if (!target) return prev;
      const others = prev.filter((p) => p.id !== planItemId);
      const reordered: PlanItem[] = [
        { ...target, rank: 'now' },
        ...others.map((o, i) => ({ ...o, rank: i === 0 ? ('next' as const) : ('later' as const) })),
      ];
      return reordered;
    });
  };

  /** Promote an off-stack Must-Do into the Hero slot. Synthesizes a PlanItem. */
  const promoteMustDoToHero = (mustDoId: string, attraction: string) => {
    setPlan((prev) => {
      // If already in the plan, just promote it.
      const existing = prev.find((p) => p.attraction === attraction);
      if (existing) {
        const others = prev.filter((p) => p.id !== existing.id);
        return [
          { ...existing, rank: 'now' as const },
          ...others.map((o, i) => ({ ...o, rank: i === 0 ? ('next' as const) : ('later' as const) })),
        ];
      }
      // Otherwise synthesize a fresh card and demote the rest.
      const synthesized: PlanItem = {
        id: `must-${mustDoId}`,
        rank: 'now',
        time: 'Now',
        attraction,
        location: 'On the way',
        logic: 'Pulled from your Must-Do list — strategy is recalculating.',
        wait: '—',
        mustDo: true,
      };
      const demoted = prev.map((o, i) => ({ ...o, rank: i === 0 ? ('next' as const) : ('later' as const) }));
      return [synthesized, ...demoted];
    });
    celebrate(`${attraction} promoted to your main card.`, 'Pulled In');
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

            {/* Sovereign Progress Bar — only the Must-Dos. Items currently in
                the stack glow gold to mirror the card border. */}
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
              <WhisperStrip />
            </div>

            {/* ── The Sovereign Stack (max 3 cards) OR Pivot Shimmer ── */}
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
                      onCaptureMemory={(id) => celebrate('Memory tucked into the Vault.', `Captured · ${id}`)}
                      onFindAndSeek={() => setFindAndSeekOpen(true)}
                      onPromote={promoteToHero}
                      onCompleteHero={completeHero}
                      pivotSuggested={pivotSuggested && !pivotLabel}
                      pivotHeadline="A New Path is Available"
                      upcomingHold={upcomingHold}
                      onUpcomingHoldTap={() => setDashboardOpen(true)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          </main>

        </>
      )}

      {/* Contextual Booking Drawer — globally mounted so Tier 3 (sovereign)
          users still receive the auto-confirm toast even in the quiet view.
          Invisible by default; surfaces only when a Strategic Opportunity hits. */}
      <AssistedDrawer
        open={drawerOpen}
        attraction="Pirates of the Caribbean"
        window="1:15 PM"
        savedMinutes={40}
        reasoning="aligns with your lunch pivot at Skipper Canteen"
        onConfirm={confirmDrawer}
        onDismiss={dismissDrawer}
      />

      {/* The Hearth: Floating Obsidian dock with the centered Gold Sovereign Key.
          No side slots — the Key is the only OS anchor. Lightning Lanes are
          surfaced exclusively through the Strategic Window drawer. */}
      <HearthDock
        onSovereignTap={handleSovereignTap}
        active={audibleOpen || dashboardOpen}
        badges={pivotBadges}
        onRestroom={() => { setPivotBadges((b) => ({ ...b, restroom: false })); pivotWith('Restroom', () => setNeedType('bathroom')); }}
        onRefuel={() => { setPivotBadges((b) => ({ ...b, refuel: false })); pivotWith('Refuel', () => setNeedType('food')); }}
        onBreak={() => { setPivotBadges((b) => ({ ...b, break: false })); pivotWith('Need a Break', () => setNeedType('quiet')); }}
        onRain={() => { setPivotBadges((b) => ({ ...b, rain: false })); pivotWith('Rain Pivot', () => setSwapFor(hero?.attraction ?? 'current ride')); }}
        onReset={() => { setPivotBadges((b) => ({ ...b, reset: false })); pivotWith('Reset Strategy', () => { setPivotSuggested(false); setShowRecalibrate(true); }); }}
      />

      <AudibleMenu
        open={audibleOpen}
        onClose={() => setAudibleOpen(false)}
        onBreak={() => pivotWith('Need a Break', () => setNeedType('quiet'))}
        onRefuel={() => pivotWith('Refuel', () => setNeedType('food'))}
        onClosure={() => pivotWith('Rain Pivot', () => setSwapFor(hero?.attraction ?? 'current ride'))}
        onReset={() => pivotWith('Reset Strategy', () => { setPivotSuggested(false); setShowRecalibrate(true); })}
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
