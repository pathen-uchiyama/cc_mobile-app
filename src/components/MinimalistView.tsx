import WhisperStrip from './WhisperStrip';
import { motion } from 'framer-motion';

interface MinimalistViewProps {
  parkName: string;
}

/**
 * Minimalist Mode — the "off switch" for the full app.
 *
 * Renders only:
 *  - A single tiny park-pulse indicator
 *  - One context-aware whisper (large, contemplative)
 *  - The Sovereign Key (rendered by parent so muscle memory holds)
 */
const MinimalistView = ({ parkName }: MinimalistViewProps) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-between py-12 px-6 pointer-events-none">
      {/* Top — single park pulse dot */}
      <div className="flex items-center gap-2 pointer-events-auto">
        <motion.div
          className="w-1.5 h-1.5 rounded-full bg-accent"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 3 }}
        />
        <span className="font-sans text-[8px] uppercase tracking-sovereign text-muted-foreground">
          {parkName} · breathing easy
        </span>
      </div>

      {/* Middle — single whisper */}
      <div className="flex-1 flex items-center justify-center w-full pointer-events-auto">
        <WhisperStrip bare />
      </div>

      {/* Bottom hint — leaves room for the Sovereign Key */}
      <div className="pb-24 pointer-events-auto">
        <span className="font-sans text-[8px] uppercase tracking-sovereign text-muted-foreground/40">
          Two-finger swipe down to wake
        </span>
      </div>
    </div>
  );
};

export default MinimalistView;
