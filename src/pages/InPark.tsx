import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import LoomingHorizon from '@/components/LoomingHorizon';
import FocusMove from '@/components/priority-stack/FocusMove';
import QuietHorizon from '@/components/priority-stack/QuietHorizon';
import PriorityFootnote from '@/components/priority-stack/PriorityFootnote';
import SideQuestsRow from '@/components/priority-stack/SideQuestsRow';
import AssistedDrawer from '@/components/priority-stack/AssistedDrawer';
import AudibleMenu from '@/components/priority-stack/AudibleMenu';
import SovereignAnchor from '@/components/priority-stack/SovereignAnchor';
import MinimalistView from '@/components/MinimalistView';
import SovereignView from '@/components/SovereignView';
import NeedOverlay from '@/components/NeedOverlay';
import RecalibrateSheet from '@/components/RecalibrateSheet';
import SwapSuggestionsSheet from '@/components/SwapSuggestionsSheet';
import DevPanel from '@/components/DevPanel';
import WhisperStrip from '@/components/WhisperStrip';
import { useCompanion } from '@/contexts/CompanionContext';
import { useCelebrate, WHISPERS } from '@/contexts/CelebrationContext';

interface PlanItem {
  id: string;
  rank: 'now' | 'next' | 'later';
  time: string;
  attraction: string;
  location: string;
  logic: string;
  wait?: string;
  llSecured?: boolean;
  votes?: number;
}

const PLAN: PlanItem[] = [
  {
    id: '1',
    rank: 'now',
    time: '10:15',
    attraction: 'Pirates of the Caribbean',
    location: 'Adventureland',
    logic: 'Optimized to beat the 2 PM parade crowd — wait is 15m below average right now.',
    wait: '12 min',
    votes: 1_708,
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
    votes: 2_410,
  },
  {
    id: '3',
    rank: 'later',
    time: '1:15',
    attraction: 'Jungle Cruise',
    location: 'Adventureland',
    logic: 'Paired with lunch nearby to avoid backtracking after the parade.',
    wait: '30 min',
    votes: 1_944,
  },
];

const InPark = () => {
  const [audibleOpen, setAudibleOpen] = useState(false);
  const [needType, setNeedType] = useState<'bathroom' | 'quiet' | null>(null);
  const [showRecalibrate, setShowRecalibrate] = useState(false);
  const [swapFor, setSwapFor] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerHandled, setDrawerHandled] = useState(false);
  const [llDismissed, setLlDismissed] = useState(false);

  const { minimalist, tier, devPanelEnabled, llTrackerVisible } = useCompanion();
  const { celebrate } = useCelebrate();

  const useQuietView = minimalist || tier === 'sovereign';
  const hero = PLAN.find((p) => p.rank === 'now');
  const horizonItems = PLAN.filter((p) => p.rank !== 'now');

  // Inline LL recommendation — folded INTO the Focus card, not a separate section.
  const showInlineLL = llTrackerVisible && tier === 'manager' && !llDismissed;
  const inlineLL = showInlineLL
    ? { ride: 'Space Mountain', window: '12:30 – 1:30', savedMin: 55 }
    : null;

  useEffect(() => {
    if (useQuietView || tier !== 'manager' || drawerHandled) return;
    const t = setTimeout(() => setDrawerOpen(true), 4000);
    return () => clearTimeout(t);
  }, [useQuietView, tier, drawerHandled]);

  const commitHero = () => {
    const tip = WHISPERS.arrival[Math.floor(Math.random() * WHISPERS.arrival.length)];
    celebrate(tip, 'On Your Way');
  };

  const secureInlineLL = () => {
    const tip = WHISPERS.llSnipe[Math.floor(Math.random() * WHISPERS.llSnipe.length)];
    celebrate(tip, 'LL Secured');
    setLlDismissed(true);
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

            {/* Whisper ticker — single quiet line of context */}
            <div className="mb-5 -mx-5">
              <WhisperStrip />
            </div>

            {/* ── ZONE 1: NOW ── the only decision on screen ── */}
            <section aria-label="Right now" className="shrink-0">
              {hero && (
                <FocusMove
                  attraction={hero.attraction}
                  location={hero.location}
                  logic={hero.logic}
                  wait={hero.wait}
                  votes={hero.votes}
                  ctaLabel="On Our Way"
                  onCommit={commitHero}
                  llSuggestion={inlineLL}
                  onSecureLL={secureInlineLL}
                />
              )}
            </section>

            {/* Soft divider — typographic, no rule */}
            <div className="mt-8 mb-4 px-1">
              <span className="font-sans text-[9px] uppercase tracking-sovereign text-muted-foreground font-semibold">
                Later today
              </span>
            </div>

            {/* ── ZONE 2: LATER ── the rest of the day, quiet ── */}
            <section aria-label="Later today" className="shrink-0">
              <QuietHorizon items={horizonItems} />
            </section>

            {/* Footnote — most-wanted as one tappable line */}
            <div className="mt-5">
              <PriorityFootnote />
            </div>

            {/* Side Quests — discoverable chip row, visually subordinate */}
            <div className="mt-6">
              <SideQuestsRow />
            </div>
          </main>

          <AssistedDrawer
            open={drawerOpen}
            attraction="Pirates of the Caribbean"
            window="1:20 PM"
            savedMinutes={45}
            onConfirm={confirmDrawer}
            onDismiss={dismissDrawer}
          />
        </>
      )}

      <SovereignAnchor onTap={() => setAudibleOpen(true)} active={audibleOpen} />

      <AudibleMenu
        open={audibleOpen}
        onClose={() => setAudibleOpen(false)}
        onBreak={() => setNeedType('quiet')}
        onRefuel={() => setNeedType('bathroom')}
        onClosure={() => setSwapFor(hero?.attraction ?? 'current ride')}
        onReset={() => setShowRecalibrate(true)}
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
    </div>
  );
};

export default InPark;
