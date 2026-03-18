import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SentimentSlider = ({ onClose }: { onClose: () => void }) => {
  const [val, setVal] = useState(50);

  const bgColor = val < 50
    ? `rgba(74, 85, 104, ${(50 - val) / 50 * 0.25})`
    : `rgba(200, 169, 81, ${(val - 50) / 50 * 0.2})`;

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: '40%' }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[9990]"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0"
        style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        className="absolute inset-x-0 bottom-0 min-h-[60vh] p-8 flex flex-col justify-between"
        style={{ backgroundColor: `color-mix(in srgb, hsl(40 33% 96%), ${bgColor})` }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        <div>
          <h2 className="font-display text-3xl text-foreground text-center mb-2">How does the heart feel?</h2>
          <p className="font-sans text-xs text-center text-muted-foreground uppercase tracking-sovereign">The 14:00 Pulse</p>
        </div>

        <div className="relative py-12">
          <input
            type="range"
            min="0"
            max="100"
            value={val}
            onChange={(e) => setVal(parseInt(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between mt-4">
            <span className="font-sans text-[10px] uppercase tracking-sovereign text-muted-foreground">Overwhelmed</span>
            <span className="font-sans text-[10px] uppercase tracking-sovereign text-muted-foreground">Energized</span>
          </div>
        </div>

        <AnimatePresence>
          {val < 30 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-card p-6 shadow-boutique"
            >
              <p className="font-display italic text-foreground text-sm leading-relaxed">
                "The crowds are heavy. May we suggest a 20-minute respite at the Nomad Lounge?"
              </p>
              <button
                onClick={onClose}
                className="mt-4 w-full bg-primary text-primary-foreground py-4 font-sans text-xs uppercase tracking-sovereign border-none cursor-pointer min-h-[48px]"
              >
                Reroute for Peace
              </button>
            </motion.div>
          )}
          {val > 70 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-card p-6 shadow-boutique"
            >
              <p className="font-display italic text-foreground text-sm leading-relaxed">
                "Pure radiance. We've identified a walk-on at Seven Dwarfs Mine Train. Shall we seize it?"
              </p>
              <button
                onClick={onClose}
                className="mt-4 w-full bg-gold text-foreground py-4 font-sans text-xs uppercase tracking-sovereign border-none cursor-pointer min-h-[48px]"
              >
                Seize the Moment
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default SentimentSlider;
