import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import LoomingHorizon from '@/components/LoomingHorizon';
import NudgeStack from '@/components/NudgeStack';
import NowCarousel from '@/components/NowCarousel';
import MemoryMakerWidget from '@/components/MemoryMakerWidget';
import FindAndSeekWidget from '@/components/FindAndSeekWidget';
import QuickActions from '@/components/QuickActions';
import SentimentSlider from '@/components/SentimentSlider';
import NeedOverlay from '@/components/NeedOverlay';
import CheckInOverlay from '@/components/CheckInOverlay';
import RecalibrateSheet from '@/components/RecalibrateSheet';
import LightningLaneTracker from '@/components/LightningLaneTracker';

const InPark = () => {
  const [showPulse, setShowPulse] = useState(false);
  const [needType, setNeedType] = useState<'bathroom' | 'quiet' | null>(null);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showRecalibrate, setShowRecalibrate] = useState(false);
  const [showLL, setShowLL] = useState(true); // toggleable in settings

  return (
    <div className="h-screen bg-background max-w-[480px] mx-auto relative flex flex-col overflow-hidden">
      {/* ── Fixed top: header + notification center ── */}
      <div className="shrink-0">
        <LoomingHorizon parkName="Magic Kingdom" />
        <div className="pt-[52px]">
          <NudgeStack />
        </div>
      </div>

      {/* ── Middle: plan cards with breathing room ── */}
      <section className="flex-1 min-h-0 flex flex-col justify-center px-4">
        <NowCarousel />
      </section>

      {/* ── Bottom third: experiences side by side ── */}
      <section className="shrink-0 h-[36vh] min-h-[240px] px-4 pb-[92px]">
        <div className="flex items-center gap-3 mb-2.5 px-1">
          <div className="w-1.5 h-1.5 bg-primary" />
          <span className="font-sans text-[9px] uppercase tracking-sovereign text-muted-foreground font-semibold">
            Your Experiences
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 h-[calc(100%-24px)]">
          <MemoryMakerWidget />
          <FindAndSeekWidget />
        </div>
      </section>

      {/* Gold Thread */}
      <div className="fixed bottom-[72px] inset-x-0 max-w-[480px] mx-auto z-40">
        <div className="h-px bg-accent/40" />
        <div className="bg-card/80 backdrop-blur-sm px-4 py-1.5 flex items-center justify-center">
          <span className="font-sans text-[7px] uppercase tracking-sovereign text-muted-foreground">
            ✨ Active Automation enabled via Sovereign Root
          </span>
        </div>
      </div>

      {/* Command Center */}
      <div className="fixed bottom-0 inset-x-0 max-w-[480px] mx-auto z-50">
        <QuickActions
          onBathroom={() => setNeedType('bathroom')}
          onQuietSpace={() => setNeedType('quiet')}
          onMemory={() => {}}
          onPulse={() => setShowPulse(true)}
          onCheckIn={() => setShowCheckIn(true)}
          onRecalibrate={() => setShowRecalibrate(true)}
        />
      </div>

      {/* Overlays */}
      <AnimatePresence>
        {showPulse && <SentimentSlider onClose={() => setShowPulse(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {needType && <NeedOverlay type={needType} onClose={() => setNeedType(null)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showCheckIn && <CheckInOverlay onClose={() => setShowCheckIn(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showRecalibrate && <RecalibrateSheet onClose={() => setShowRecalibrate(false)} />}
      </AnimatePresence>
    </div>
  );
};

export default InPark;
