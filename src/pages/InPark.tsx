import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import LoomingHorizon from '@/components/LoomingHorizon';
import WhisperStrip from '@/components/WhisperStrip';
import HeroCard from '@/components/priority-stack/HeroCard';
import HorizonCard from '@/components/priority-stack/HorizonCard';
import StrategicOpportunityDrawer from '@/components/priority-stack/StrategicOpportunityDrawer';
import AudibleMenu from '@/components/priority-stack/AudibleMenu';
import SovereignAnchor from '@/components/priority-stack/SovereignAnchor';
import MinimalistView from '@/components/MinimalistView';
import SovereignView from '@/components/SovereignView';
import NeedOverlay from '@/components/NeedOverlay';
import RecalibrateSheet from '@/components/RecalibrateSheet';
import SwapSuggestionsSheet from '@/components/SwapSuggestionsSheet';
import DevPanel from '@/components/DevPanel';
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
}

const PLAN: PlanItem[] = [
  {
    id: '1',
    rank: 'now',
    time: '10:15',
    attraction: 'Pirates of the Caribbean',
    location: 'Adventureland',
    logic: 'Wait times 15m below avg — ideal window before crowds peak.',
    wait: '12 min',
  },
  {
    id: '2',
    rank: 'next',
    time: '11:00',
    attraction: 'Haunted Mansion',
    location: 'Liberty Square',
    logic: 'LL secured — walk arrives 2 min before window opens.',
    wait: '25 min',
    llSecured: true,
  },
  {
    id: '3',
    rank: 'later',
    time: '1:15',
    attraction: 'Jungle Cruise',
    location: 'Adventureland',
    logic: 'Paired with lunch nearby — minimal backtracking.',
    wait: '30 min',
  },
];

const InPark = () => {
  const [audibleOpen, setAudibleOpen] = useState(false);
  const [needType, setNeedType] = useState<'bathroom' | 'quiet' | null>(null);
  const [showRecalibrate, setShowRecalibrate] = useState(false);
  const [swapFor, setSwapFor] = useState<string | null>(null);
  const [opportunityDismissed, setOpportunityDismissed] = useState(false);

  const { minimalist, tier, devPanelEnabled } = useCompanion();
  const { celebrate } = useCelebrate();

  const useQuietView = minimalist || tier === 'sovereign';
  const hero = PLAN.find((p) => p.rank === 'now');
  const horizons = PLAN.filter((p) => p.rank !== 'now');

  // Strategic opportunity surfaces only for Manager tier (and not when dismissed)
  const showOpportunity = tier === 'manager' && !opportunityDismissed;

  const commitHero = () => {
    const tip = WHISPERS.arrival[Math.floor(Math.random() * WHISPERS.arrival.length)];
    celebrate(tip, 'On Your Way');
  };

  const bookOpportunity = () => {
    const tip = WHISPERS.llSnipe[Math.floor(Math.random() * WHISPERS.llSnipe.length)];
    celebrate(tip, 'LL Sniped');
    setOpportunityDismissed(true);
  };

  return (
    <div className="min-h-screen bg-background max-w-[480px] mx-auto relative flex flex-col">
      {useQuietView ? (
        minimalist
          ? <MinimalistView parkName="Magic Kingdom" />
          : <SovereignView parkName="Magic Kingdom" />
      ) : (
        <>
          <LoomingHorizon parkName="Magic Kingdom" />

          {/* Editorial top padding — 80px from page top */}
          <main className="flex-1 pt-[80px] pb-[220px] px-5">
            {/* Page Title */}
            <header className="mb-6">
              <span className="font-sans text-[9px] uppercase tracking-sovereign text-muted-foreground font-semibold">
                Today
              </span>
              <h1 className="font-display text-[28px] leading-tight text-foreground mt-1">
                The Active Journey
              </h1>
            </header>

            {/* Whisper strip — single observational line */}
            <div className="mb-5">
              <WhisperStrip />
            </div>

            {/* The Depth Stack — single column */}
            <div className="space-y-3">
              {hero && (
                <HeroCard
                  attraction={hero.attraction}
                  location={hero.location}
                  logic={hero.logic}
                  wait={hero.wait}
                  ctaLabel="Secure Path"
                  onCommit={commitHero}
                />
              )}
              {horizons.map((h) => (
                <HorizonCard
                  key={h.id}
                  rank={h.rank as 'next' | 'later'}
                  time={h.time}
                  attraction={h.attraction}
                  logic={h.logic}
                  wait={h.wait}
                  llSecured={h.llSecured}
                />
              ))}
            </div>
          </main>

          {/* Strategic Opportunity drawer — appears above the Anchor */}
          <StrategicOpportunityDrawer
            open={showOpportunity}
            attraction="Space Mountain"
            window="LL window 12:45 – 1:45"
            logic="A back-door window just opened — slots into your route with zero detour."
            onBook={bookOpportunity}
            onDismiss={() => setOpportunityDismissed(true)}
          />
        </>
      )}

      {/* The Sovereign Key — Golden Anchor (always visible) */}
      <SovereignAnchor onTap={() => setAudibleOpen(true)} active={audibleOpen} />

      {/* Audible Menu — 4 buttons */}
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
