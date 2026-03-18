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
    <div className="min-h-screen bg-background max-w-[480px] mx-auto relative">
      <LoomingHorizon parkName="Magic Kingdom" />

      <main className="pt-[60px] pb-32">
        {/* Top: Nudges */}
        <NudgeStack />

        {/* Flighty-style vertical timeline */}
        <div className="px-6 py-6">
          <NowCarousel />
        </div>

        {/* Interactive Widgets */}
        <div className="px-6 grid grid-cols-2 gap-3">
          <MemoryMakerWidget />
          <FindAndSeekWidget />
        </div>
      </main>

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
