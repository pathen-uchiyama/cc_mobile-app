import { motion } from 'framer-motion';
import WhisperStrip from './WhisperStrip';
import { Sparkles } from 'lucide-react';

interface SovereignViewProps {
  parkName: string;
}

/**
 * The Sovereign tier in-park experience.
 *
 * Philosophy: "It just happens."
 * No wait pills, no LL strip, no plan cards. The user sees only:
 *  - A breathing acknowledgement that everything is being handled
 *  - One observational whisper at a time
 *  - The Sovereign Key (rendered by the parent for muscle memory)
 *
 * This satisfies Pillar 4 of the audit: a true "Adaptive Blueprint"
 * where deviating from the plan does not scold the user.
 */
const SovereignView = ({ parkName }: SovereignViewProps) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-between py-12 px-6 pointer-events-none">
      {/* Top — gentle status with gold acknowledgement */}
      <div className="flex flex-col items-center gap-2 pointer-events-auto">
        <div className="flex items-center gap-2">
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-accent"
            animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 3 }}
          />
          <span className="font-sans text-[8px] uppercase tracking-sovereign text-muted-foreground">
            {parkName}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <Sparkles size={9} className="text-accent" />
          <span className="font-sans text-[8px] uppercase tracking-sovereign text-accent font-bold">
            Sovereign · Active
          </span>
        </div>
      </div>

      {/* Middle — the assurance */}
      <div className="flex-1 flex flex-col items-center justify-center w-full pointer-events-auto gap-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <p className="font-display italic text-2xl text-foreground/90 leading-relaxed mb-3">
            "We've handled it."
          </p>
          <p className="font-sans text-[10px] text-muted-foreground italic max-w-[280px] mx-auto leading-relaxed">
            Walk slowly. Look up. Whatever needs doing is being done.
          </p>
        </motion.div>

        {/* One contextual whisper, large */}
        <div className="w-full">
          <WhisperStrip bare />
        </div>
      </div>

      {/* Bottom hint */}
      <div className="pb-24 pointer-events-auto">
        <span className="font-sans text-[8px] uppercase tracking-sovereign text-muted-foreground/40">
          Tap the orb if you need anything
        </span>
      </div>
    </div>
  );
};

export default SovereignView;
