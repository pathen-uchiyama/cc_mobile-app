import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BottomSheet from './BottomSheet';

const MOODS = [
  { label: 'Overwhelmed', emoji: '😮‍💨', position: 0 },
  { label: 'Tired', emoji: '😴', position: 25 },
  { label: 'Calm', emoji: '😌', position: 50 },
  { label: 'Happy', emoji: '😊', position: 75 },
  { label: 'Energized', emoji: '✨', position: 100 },
];

const SentimentSlider = ({ onClose }: { onClose: () => void }) => {
  const [val, setVal] = useState(50);

  const currentMood = MOODS.reduce((prev, curr) =>
    Math.abs(curr.position - val) < Math.abs(prev.position - val) ? curr : prev
  );

  return (
    <BottomSheet
      open={true}
      onClose={onClose}
      snap="full"
      eyebrow="Daily Check-In · 14:00"
      title="How are you feeling?"
      subtitle="Take a moment. Be honest with yourself."
    >
      {/* Current mood display */}
      <motion.div
        key={currentMood.label}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center mb-8 mt-2"
      >
        <span className="text-5xl block mb-3">{currentMood.emoji}</span>
        <span className="font-display text-xl text-foreground">{currentMood.label}</span>
      </motion.div>

      {/* Slider */}
      <div className="relative px-2 mb-6">
        <div className="relative h-12 flex items-center">
          <div className="absolute inset-x-0 h-[2px] bg-border" />
          <div
            className="absolute left-0 h-[2px] bg-primary transition-all duration-100"
            style={{ width: `${val}%` }}
          />
          <div className="absolute inset-x-0 flex justify-between">
            {MOODS.map((mood) => (
              <div key={mood.label} className="flex flex-col items-center">
                <div className={`w-1 h-3 ${val >= mood.position ? 'bg-primary' : 'bg-border'} transition-colors`} />
              </div>
            ))}
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={val}
            onChange={(e) => setVal(parseInt(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
            style={{ height: '48px' }}
          />
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary pointer-events-none"
            style={{ left: `calc(${val}% - 12px)` }}
            layout
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="font-sans text-[8px] uppercase tracking-sovereign text-muted-foreground/60">Low</span>
          <span className="font-sans text-[8px] uppercase tracking-sovereign text-muted-foreground/60">High</span>
        </div>
      </div>

      {/* Contextual suggestions */}
      <AnimatePresence mode="wait">
        {val < 30 && (
          <motion.div
            key="low"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-card p-5 rounded-xl shadow-boutique mb-4"
          >
            <p className="font-display italic text-foreground text-sm leading-relaxed">
              "The crowds are heavy. May we suggest a 20-minute respite at the Nomad Lounge?"
            </p>
            <p className="font-sans text-[10px] text-muted-foreground mt-2">
              We'll hold your place in the timeline.
            </p>
            <button
              onClick={onClose}
              className="mt-4 w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-sans text-[10px] uppercase tracking-sovereign border-none cursor-pointer min-h-[48px]"
            >
              Reroute for Peace
            </button>
          </motion.div>
        )}
        {val > 70 && (
          <motion.div
            key="high"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-card p-5 rounded-xl shadow-boutique mb-4"
          >
            <p className="font-display italic text-foreground text-sm leading-relaxed">
              "Pure radiance. Seven Dwarfs Mine Train is walk-on right now."
            </p>
            <p className="font-sans text-[10px] text-muted-foreground mt-2">
              Seize the window — it won't last.
            </p>
            <button
              onClick={onClose}
              className="mt-4 w-full bg-accent text-accent-foreground py-3.5 rounded-xl font-sans text-[10px] uppercase tracking-sovereign border-none cursor-pointer min-h-[48px]"
            >
              Seize the Moment
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={onClose}
        className="w-full py-3 bg-transparent border-none cursor-pointer"
      >
        <span className="font-sans text-[10px] text-muted-foreground underline underline-offset-4 decoration-muted-foreground/30">
          Skip for now
        </span>
      </button>
    </BottomSheet>
  );
};

export default SentimentSlider;
