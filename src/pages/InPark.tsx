import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import LoomingHorizon from '@/components/LoomingHorizon';
import NudgeStack from '@/components/NudgeStack';
import NowCarousel from '@/components/NowCarousel';
import QuickActions from '@/components/QuickActions';
import SentimentSlider from '@/components/SentimentSlider';
import NeedOverlay from '@/components/NeedOverlay';

const InPark = () => {
  const [showPulse, setShowPulse] = useState(false);
  const [needType, setNeedType] = useState<'bathroom' | 'quiet' | null>(null);

  return (
    <div className="min-h-screen bg-background max-w-[480px] mx-auto relative">
      <LoomingHorizon parkName="Magic Kingdom" />

      <main className="pt-[60px] flex flex-col min-h-[calc(100vh-60px)]">
        {/* Top: Nudges */}
        <NudgeStack />

        {/* Center: Now + Next cards */}
        <div className="flex-1 flex flex-col justify-center px-6 py-4">
          <NowCarousel />
        </div>

        {/* Bottom: Quick Actions */}
        <QuickActions
          onBathroom={() => setNeedType('bathroom')}
          onQuietSpace={() => setNeedType('quiet')}
          onMemory={() => {}}
          onPulse={() => setShowPulse(true)}
        />
      </main>

      {/* Sentiment Pulse Modal */}
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
