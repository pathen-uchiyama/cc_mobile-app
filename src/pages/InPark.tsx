import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import LoomingHorizon from '@/components/LoomingHorizon';
import HeroHorizonStack from '@/components/priority-stack/HeroHorizonStack';
import PriorityFootnote from '@/components/priority-stack/PriorityFootnote';
import SideQuestsRow from '@/components/priority-stack/SideQuestsRow';
import AssistedDrawer from '@/components/priority-stack/AssistedDrawer';
import AudibleMenu from '@/components/priority-stack/AudibleMenu';
import StrategicDashboard from '@/components/priority-stack/StrategicDashboard';
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
    logic: 'Standby is at a 10-minute low — head now to beat the parade crowd.',
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
  {
    id: '4',
    rank: 'later',
    time: '2:30',
    attraction: 'Big Thunder Mountain',
    location: 'Frontierland',
    logic: 'Window aligns with your LL drop — fast in, fast out.',
    wait: '20 min',
    llSecured: true,
    votes: 2_215,
  },
  {
    id: '5',
    rank: 'later',
    time: '4:00',
    attraction: 'Space Mountain',
    location: 'Tomorrowland',
    logic: 'Late afternoon dip in standby — strategic pivot from the parade exodus.',
    wait: '35 min',
    votes: 2_984,
  },
];

const InPark = () => {
  // Sovereign Key contextual mode: 'audible' for relaxed users, 'dashboard' for Type A.
  const [audibleOpen, setAudibleOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [needType, setNeedType] = useState<'bathroom' | 'quiet' | null>(null);
  const [showRecalibrate, setShowRecalibrate] = useState(false);
  const [swapFor, setSwapFor] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerHandled, setDrawerHandled] = useState(false);

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

            {/* ── Depth-Based Stack: Hero (top 40%) + 2 peeks + Full Ledger fade ── */}
            <section aria-label="Today's plan" className="shrink-0">
              <HeroHorizonStack items={PLAN} onCommitHero={commitHero} />
            </section>

            {/* Footnote — most-wanted as one tappable line */}
            <div className="mt-6">
              <PriorityFootnote />
            </div>

            {/* Side Quests — discoverable chip row */}
            <div className="mt-5">
              <SideQuestsRow />
            </div>
          </main>

          {/* Directive 2 — Assisted Booking Drawer (bottom 30%, single-tap decision) */}
          <AssistedDrawer
            open={drawerOpen}
            attraction="Haunted Mansion"
            window="1:15 PM"
            savedMinutes={45}
            onConfirm={confirmDrawer}
            onDismiss={dismissDrawer}
          />
        </>
      )}

      {/* Directive 3 — Sovereign Key (contextual: Dashboard for Type A, Audible for relaxed) */}
      <SovereignAnchor onTap={handleSovereignTap} active={audibleOpen || dashboardOpen} />

      <AudibleMenu
        open={audibleOpen}
        onClose={() => setAudibleOpen(false)}
        onBreak={() => setNeedType('quiet')}
        onRefuel={() => setNeedType('bathroom')}
        onClosure={() => setSwapFor(hero?.attraction ?? 'current ride')}
        onReset={() => setShowRecalibrate(true)}
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
    </div>
  );
};

export default InPark;
