import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import LoomingHorizon from '@/components/LoomingHorizon';
import BottomGlassNav, { TabId } from '@/components/BottomGlassNav';
import OnboardingWizard from '@/components/OnboardingWizard';
import HorizonView from '@/components/HorizonView';
import ItineraryRibbon from '@/components/ItineraryRibbon';
import IntelligentGuide from '@/components/IntelligentGuide';
import AudioVaultPlayer from '@/components/AudioVaultPlayer';
import SentimentSlider from '@/components/SentimentSlider';

const Index = () => {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('horizon');
  const [showPulse, setShowPulse] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingText, setThinkingText] = useState('');

  // Simulate concierge thinking after onboarding
  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setIsThinking(true);
    setThinkingText('Composing your day...');
    setTimeout(() => {
      setThinkingText('Securing Space Mountain...');
    }, 2000);
    setTimeout(() => {
      setIsThinking(false);
      setThinkingText('');
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-background max-w-[480px] mx-auto relative">
      {/* Onboarding */}
      <AnimatePresence>
        {showOnboarding && (
          <OnboardingWizard onComplete={handleOnboardingComplete} />
        )}
      </AnimatePresence>

      {/* Top Status Bar */}
      {!showOnboarding && (
        <LoomingHorizon
          parkName="Magic Kingdom"
          isThinking={isThinking}
          statusText={thinkingText}
        />
      )}

      {/* Main Content */}
      {!showOnboarding && (
        <main className="pt-[60px]">
          {activeTab === 'horizon' && <HorizonView onOpenPulse={() => setShowPulse(true)} />}
          {activeTab === 'canvas' && <ItineraryRibbon />}
          {activeTab === 'guide' && <IntelligentGuide />}
          {activeTab === 'vault' && <AudioVaultPlayer />}
        </main>
      )}

      {/* Sentiment Pulse Modal */}
      <AnimatePresence>
        {showPulse && <SentimentSlider onClose={() => setShowPulse(false)} />}
      </AnimatePresence>

      {/* Bottom Navigation */}
      {!showOnboarding && (
        <BottomGlassNav activeTab={activeTab} onTabChange={setActiveTab} />
      )}
    </div>
  );
};

export default Index;
