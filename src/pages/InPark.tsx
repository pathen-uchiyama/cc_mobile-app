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

const InPark = () => {
  const [showPulse, setShowPulse] = useState(false);
  const [needType, setNeedType] = useState<'bathroom' | 'quiet' | null>(null);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showRecalibrate, setShowRecalibrate] = useState(false);

  return (
    <div className="h-screen bg-background max-w-[480px] mx-auto relative flex flex-col overflow-hidden">
      <LoomingHorizon parkName="Magic Kingdom" />

      {/* Toast notifications — ephemeral, auto-dismiss */}
      <NudgeStack />

      {/* ── Plan Cards: bulk of screen with breathing room ── */}
      <section className="flex-1 pt-[60px] px-6 flex flex-col justify-center min-h-0">
        <div className="py-6">
          <NowCarousel />
        </div>
      </section>

      {/* ── Experiences: bottom third, side by side ── */}
      <section className="h-[33vh] min-h-[200px] px-4 pb-[92px] flex flex-col">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-1.5 h-1.5 bg-primary" />
          <span className="font-sans text-[9px] uppercase tracking-sovereign text-muted-foreground font-semibold">
            Your Experiences
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">
          <div className="overflow-hidden">
            <MemoryMakerWidget />
          </div>
          <div className="overflow-hidden">
            <FindAndSeekWidget />
          </div>
        </div>
      </section>

      {/* Gold Thread — AI Disclosure Footer */}
      <div className="fixed bottom-[72px] inset-x-0 max-w-[480px] mx-auto z-40">
        <div className="h-px bg-accent/40" />
        <div className="bg-card/80 backdrop-blur-sm px-4 py-1.5 flex items-center justify-center">
          <span className="font-sans text-[7px] uppercase tracking-sovereign text-muted-foreground">
            ✨ Active Automation enabled via Sovereign Root
          </span>
        </div>
      </div>

      {/* Command Center — fixed bottom */}
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
