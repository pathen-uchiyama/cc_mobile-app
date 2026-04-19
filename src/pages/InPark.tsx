import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import LoomingHorizon from '@/components/LoomingHorizon';
import WhisperStrip from '@/components/WhisperStrip';
import NowCarousel from '@/components/NowCarousel';
import MemoryMakerWidget from '@/components/MemoryMakerWidget';
import FindAndSeekWidget from '@/components/FindAndSeekWidget';
import SovereignKey from '@/components/SovereignKey';
import SentimentSlider from '@/components/SentimentSlider';
import NeedOverlay from '@/components/NeedOverlay';
import CheckInOverlay from '@/components/CheckInOverlay';
import RecalibrateSheet from '@/components/RecalibrateSheet';
import LightningLaneTracker from '@/components/LightningLaneTracker';
import MinimalistView from '@/components/MinimalistView';
import { useCompanion } from '@/contexts/CompanionContext';

const InPark = () => {
  const [showPulse, setShowPulse] = useState(false);
  const [needType, setNeedType] = useState<'bathroom' | 'quiet' | null>(null);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showRecalibrate, setShowRecalibrate] = useState(false);
  const [showLL, setShowLL] = useState(true);
  const { minimalist } = useCompanion();

  return (
    <div className="h-screen bg-background max-w-[480px] mx-auto relative flex flex-col overflow-hidden">
      {minimalist ? (
        // ── Minimalist Mode: just one whisper + the Sovereign Key ──
        <MinimalistView parkName="Magic Kingdom" />
      ) : (
        <>
          {/* ── Fixed top: header + whisper strip ── */}
          <div className="shrink-0">
            <LoomingHorizon parkName="Magic Kingdom" />
            <div className="pt-[68px] pb-2">
              <WhisperStrip />
            </div>
          </div>

          {/* ── Middle: plan cards + LL tracker — no scroll ── */}
          <section className="flex-1 min-h-0 flex flex-col justify-center px-4 gap-5">
            <NowCarousel />
            <LightningLaneTracker visible={showLL} tier="manager" />
          </section>

          {/* ── Bottom third: experiences side by side ── */}
          <section className="shrink-0 h-[34vh] min-h-[220px] px-4 pb-[112px]">
            <div className="flex items-center gap-3 mb-2.5 px-1">
              <div className="w-1.5 h-1.5 bg-primary rounded-full" />
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
          <div className="fixed bottom-[96px] inset-x-0 max-w-[480px] mx-auto z-40 pointer-events-none">
            <div className="h-px bg-accent/30" />
            <div className="bg-card/70 backdrop-blur-sm px-4 py-1 flex items-center justify-center">
              <span className="font-sans text-[7px] uppercase tracking-sovereign text-muted-foreground">
                ✨ Active Automation enabled via Sovereign Root
              </span>
            </div>
          </div>
        </>
      )}

      {/* ── The Sovereign Key — present in BOTH modes for muscle memory ── */}
      <SovereignKey
        onBathroom={() => setNeedType('bathroom')}
        onQuietSpace={() => setNeedType('quiet')}
        onMemory={() => {}}
        onPulse={() => setShowPulse(true)}
        onCheckIn={() => setShowCheckIn(true)}
        onRecalibrate={() => setShowRecalibrate(true)}
      />

      {/* Overlays — all unified through BottomSheet */}
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
