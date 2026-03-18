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

const InPark = () => {
  const [showPulse, setShowPulse] = useState(false);
  const [needType, setNeedType] = useState<'bathroom' | 'quiet' | null>(null);

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

      {/* Uber-style fixed bottom quick actions */}
      <div className="fixed bottom-0 inset-x-0 max-w-[480px] mx-auto">
        <QuickActions
          onBathroom={() => setNeedType('bathroom')}
          onQuietSpace={() => setNeedType('quiet')}
          onMemory={() => {}}
          onPulse={() => setShowPulse(true)}
        />
      </div>

      {/* Stoic-style Sentiment Check-in */}
      <AnimatePresence>
        {showPulse && <SentimentSlider onClose={() => setShowPulse(false)} />}
      </AnimatePresence>

      {/* Need Overlay */}
      <AnimatePresence>
        {needType && <NeedOverlay type={needType} onClose={() => setNeedType(null)} />}
      </AnimatePresence>
    </div>
  );
};

export default InPark;
