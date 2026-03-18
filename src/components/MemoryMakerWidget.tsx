import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Mic, Heart } from 'lucide-react';

type MemoryType = 'photo' | 'conversation';

interface MemoryPrompt {
  id: string;
  type: MemoryType;
  prompt: string;
  context: string;
  icon: typeof Camera;
}

// Contextual prompts based on itinerary position and walking routes
const MEMORY_PROMPTS: MemoryPrompt[] = [
  {
    id: '1',
    type: 'photo',
    prompt: 'Capture the view from here',
    context: 'The Adventureland bridge has a perfect castle angle right now',
    icon: Camera,
  },
  {
    id: '2',
    type: 'conversation',
    prompt: "What's been the best moment so far?",
    context: "You've been going for 2 hours — a good time to pause and reflect",
    icon: Mic,
  },
  {
    id: '3',
    type: 'photo',
    prompt: 'The queue has a hidden detail',
    context: 'Look up in the Haunted Mansion queue — the ceiling tells a story',
    icon: Camera,
  },
  {
    id: '4',
    type: 'conversation',
    prompt: 'What ride are you most excited for next?',
    context: "While you walk toward Liberty Square",
    icon: Mic,
  },
  {
    id: '5',
    type: 'photo',
    prompt: "Grab a shot of everyone's face",
    context: "Right before Haunted Mansion — these reactions are priceless",
    icon: Camera,
  },
];

const MemoryMakerWidget = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [captured, setCaptured] = useState(0);
  const [showDone, setShowDone] = useState(false);

  const current = MEMORY_PROMPTS[currentIndex];
  const Icon = current?.icon || Camera;

  const handleCapture = () => {
    setShowDone(true);
    setCaptured(prev => prev + 1);
    setTimeout(() => {
      setShowDone(false);
      setCurrentIndex(prev => (prev + 1) % MEMORY_PROMPTS.length);
    }, 1400);
  };

  const handleSkip = () => {
    setCurrentIndex(prev => (prev + 1) % MEMORY_PROMPTS.length);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Heart size={12} className="text-accent" />
          <span className="font-display text-sm text-foreground">Memory Maker</span>
        </div>
        {captured > 0 && (
          <span className="font-sans text-[9px] text-accent font-bold tabular-nums">
            {captured} saved
          </span>
        )}
      </div>

      {/* Single memory prompt — fills space */}
      <div className="flex-1 min-h-0">
        <AnimatePresence mode="wait">
          {!showDone ? (
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="h-full bg-card p-4 shadow-boutique rounded-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Icon size={10} className="text-accent" />
                  <span className="font-sans text-[8px] uppercase tracking-sovereign text-accent font-bold">
                    {current.type === 'photo' ? 'Photo moment' : 'Voice moment'}
                  </span>
                </div>

                <h4 className="font-display text-base text-foreground leading-tight mb-1.5">
                  {current.prompt}
                </h4>

                <p className="font-sans text-[10px] text-muted-foreground leading-relaxed">
                  {current.context}
                </p>
              </div>

              <div className="flex items-center gap-2 mt-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCapture}
                  className="flex-1 py-2 bg-primary text-primary-foreground font-sans text-[9px] uppercase tracking-sovereign border-none cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Icon size={10} />
                  {current.type === 'photo' ? 'Capture' : 'Record'}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSkip}
                  className="py-2 px-3 bg-transparent text-muted-foreground font-sans text-[9px] uppercase tracking-sovereign border border-border cursor-pointer"
                >
                  Skip
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="saved"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="h-full bg-card shadow-boutique flex flex-col items-center justify-center"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.4 }}
                className="text-2xl mb-1"
              >
                ✨
              </motion.div>
              <span className="font-display text-sm text-foreground">Saved</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MemoryMakerWidget;
