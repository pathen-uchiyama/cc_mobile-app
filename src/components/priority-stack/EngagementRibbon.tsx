import { motion } from 'framer-motion';
import { Camera } from 'lucide-react';

interface EngagementRibbonProps {
  onCaptureMemory?: () => void;
  /**
   * Retained for prop-shape compatibility with FocusMove. Unused — Find &
   * Seek has been removed from the focus card to keep the ribbon laser-
   * focused on memory-making (the brand soul of the Vault).
   */
  onFindAndSeek?: () => void;
}

/**
 * The Engagement Ribbon — full-width, 56px, single CTA.
 *
 * Past iterations split this 50/50 with Find & Seek. We collapsed it to a
 * single "Record this Memory" action so the ribbon's only job is to nudge
 * guests into capturing the moment they're standing in. Find & Seek now
 * lives in the dashboard / chip rail instead.
 */
const EngagementRibbon = ({ onCaptureMemory }: EngagementRibbonProps) => (
  <motion.button
    whileTap={{ scale: 0.985 }}
    onClick={onCaptureMemory}
    className="w-full flex items-center justify-center gap-2 bg-transparent cursor-pointer font-sans text-[12px] font-bold uppercase tracking-sovereign border-none"
    style={{
      height: '56px',
      color: 'hsl(36 47% 35%)',
      borderTop: '1px solid hsl(36 47% 35% / 0.35)',
      background: 'linear-gradient(180deg, hsl(36 47% 35% / 0.10) 0%, hsl(36 47% 35% / 0.02) 100%)',
    }}
    aria-label="Record this Memory"
  >
    <Camera size={15} />
    Record this Memory
  </motion.button>
);

export default EngagementRibbon;
