import { motion } from 'framer-motion';
import { Camera, Search } from 'lucide-react';

interface EngagementRibbonProps {
  onCaptureMemory?: () => void;
  onFindAndSeek?: () => void;
}

/**
 * The Engagement Ribbon — full-width, 54px, 50/50 split.
 *
 * Sits at the base of every Priority card. Memory + Find & Seek are
 * primary touch zones, never small icon buttons.
 */
const EngagementRibbon = ({ onCaptureMemory, onFindAndSeek }: EngagementRibbonProps) => (
  <div
    className="grid grid-cols-2"
    style={{
      borderTop: '1px solid hsl(36 47% 35% / 0.35)',
      background: 'linear-gradient(180deg, hsl(36 47% 35% / 0.08) 0%, hsl(36 47% 35% / 0.02) 100%)',
    }}
  >
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onCaptureMemory}
      className="flex items-center justify-center gap-2 bg-transparent cursor-pointer font-sans text-[11px] font-semibold uppercase tracking-sovereign border-none"
      style={{
        height: '54px',
        color: 'hsl(36 47% 35%)',
        borderRight: '1px solid hsl(36 47% 35% / 0.35)',
      }}
      aria-label="Record Memory"
    >
      <Camera size={14} />
      Record Memory
    </motion.button>
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onFindAndSeek}
      className="flex items-center justify-center gap-2 bg-transparent cursor-pointer font-sans text-[11px] font-semibold uppercase tracking-sovereign border-none"
      style={{
        height: '54px',
        color: 'hsl(36 47% 35%)',
      }}
      aria-label="Find and Seek"
    >
      <Search size={14} />
      Find &amp; Seek
    </motion.button>
  </div>
);

export default EngagementRibbon;
