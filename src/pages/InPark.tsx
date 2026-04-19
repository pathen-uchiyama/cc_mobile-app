import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import LoomingHorizon from '@/components/LoomingHorizon';
import HeroCard from '@/components/priority-stack/HeroCard';
import HorizonCard from '@/components/priority-stack/HorizonCard';
import AssistedDrawer from '@/components/priority-stack/AssistedDrawer';
import AudibleMenu from '@/components/priority-stack/AudibleMenu';
import SovereignAnchor from '@/components/priority-stack/SovereignAnchor';
import PriorityRides from '@/components/priority-stack/PriorityRides';
import MinimalistView from '@/components/MinimalistView';
import SovereignView from '@/components/SovereignView';
import NeedOverlay from '@/components/NeedOverlay';
import RecalibrateSheet from '@/components/RecalibrateSheet';
import SwapSuggestionsSheet from '@/components/SwapSuggestionsSheet';
import DevPanel from '@/components/DevPanel';
import WhisperStrip from '@/components/WhisperStrip';
import LightningLaneTracker from '@/components/LightningLaneTracker';
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
  /** Crowd-vote count — explains why this attraction is on the plan. */
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

  const { minimalist, tier, devPanelEnabled, llTrackerVisible } = useCompanion();
  const { celebrate } = useCelebrate();

  const useQuietView = minimalist || tier === 'sovereign';
  const hero = PLAN.find((p) => p.rank === 'now');
  const next = PLAN.find((p) => p.rank === 'next');
  const later = PLAN.find((p) => p.rank === 'later');

  // Backend "found a window" — simulate a 4s discovery for Manager tier
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

  return (
    <div className="min-h-screen bg-background max-w-[480px] mx-auto relative flex flex-col">
      {useQuietView ? (
        minimalist
          ? <MinimalistView parkName="Magic Kingdom" />
          : <SovereignView parkName="Magic Kingdom" />
      ) : (
        <>
          <LoomingHorizon parkName="Magic Kingdom" pulseStatus="Strategy is Active" />

          {/* ── The Strategic Stack ── */}
          <main className="flex-1 pt-[72px] pb-[140px] px-5 flex flex-col">
            {/* Editorial title */}
            <header className="mb-4 shrink-0">
              <span className="font-sans text-[9px] uppercase tracking-sovereign text-muted-foreground font-semibold">
                Today
              </span>
              <h1 className="font-display text-[28px] leading-tight text-foreground mt-1">
                The Active Journey
              </h1>
            </header>

            {/* Contextual nudges — single-line whisper ticker */}
            <div className="mb-4 -mx-5">
              <WhisperStrip />
            </div>

            {/* Visual Anchor — top 40% of viewport reserved for the Focus card */}
            <section
              className="shrink-0 flex items-start"
              style={{ minHeight: '38vh' }}
              aria-label="Focus priority"
            >
              {hero && (
                <HeroCard
                  attraction={hero.attraction}
                  location={hero.location}
                  logic={hero.logic}
                  wait={hero.wait}
                  votes={hero.votes}
                  ctaLabel="On Our Way"
                  onCommit={commitHero}
                />
              )}
            </section>

            {/* Horizon — Next & Later peek at 90% width */}
            <section
              className="mt-5 space-y-2.5"
              aria-label="Horizon — upcoming priorities"
            >
              <p className="font-sans text-[8px] uppercase tracking-sovereign text-muted-foreground font-semibold px-1 mb-1">
                On the Horizon
              </p>
              {next && (
                <HorizonCard
                  rank="next"
                  depth={1}
                  time={next.time}
                  attraction={next.attraction}
                  logic={next.logic}
                  wait={next.wait}
                  llSecured={next.llSecured}
                  votes={next.votes}
                />
              )}
              {later && (
                <HorizonCard
                  rank="later"
                  depth={2}
                  time={later.time}
                  attraction={later.attraction}
                  logic={later.logic}
                  wait={later.wait}
                  llSecured={later.llSecured}
                  votes={later.votes}
                />
              )}
            </section>

            {/* Pocket Concierge — Lightning Lane management strip */}
            <section className="mt-6" aria-label="Lightning Lane management">
              <LightningLaneTracker visible={llTrackerVisible} tier={tier} />
            </section>

            {/* Crowd-voted priority rides */}
            <section className="mt-7">
              <PriorityRides />
            </section>
          </main>

          {/* Assisted Drawer — bottom-up, lower 50% */}
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

      {/* The Sovereign Anchor — always present */}
      <SovereignAnchor onTap={() => setAudibleOpen(true)} active={audibleOpen} />

      {/* Audible Menu — gold-outline secondary actions */}
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
