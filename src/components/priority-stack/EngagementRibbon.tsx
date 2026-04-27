import { motion } from 'framer-motion';
import { Camera, Compass } from 'lucide-react';

interface EngagementRibbonProps {
  onCaptureMemory?: () => void;
  /** Open the Find & Seek widget. When omitted, the half-tile is hidden
   *  and the Memory CTA stretches to fill the ribbon. */
  onFindAndSeek?: () => void;
}

/**
 * The Engagement Ribbon — full-width, 56px, split 50/50 between
 * "Record this Memory" (left) and "Find & Seek" (right). Both halves
 * share the burnished-gold ink so they read as one continuous ribbon
 * rather than two competing buttons; a single subtle divider preserves
 * the no-line rule (low-opacity gold rather than a hard hairline).
 *
 * If `onFindAndSeek` isn't provided the right tile is suppressed and
 * the Memory action stretches to fill the ribbon — keeps backward
 * compatibility with any call-site that wants the single-CTA variant.
 */
const RIBBON_INK = 'hsl(36 47% 35%)';
const RIBBON_BG =
  'linear-gradient(180deg, hsl(36 47% 35% / 0.10) 0%, hsl(36 47% 35% / 0.02) 100%)';

const EngagementRibbon = ({ onCaptureMemory, onFindAndSeek }: EngagementRibbonProps) => {
  const split = Boolean(onFindAndSeek);
  return (
    <div
      className="w-full flex items-stretch"
      style={{
        height: '56px',
        borderTop: `1px solid ${RIBBON_INK.replace(')', ' / 0.35)')}`,
        background: RIBBON_BG,
      }}
    >
      <motion.button
        whileTap={{ scale: 0.985 }}
        onClick={onCaptureMemory}
        type="button"
        className={`${split ? 'flex-1' : 'w-full'} flex items-center justify-center gap-2 bg-transparent cursor-pointer font-sans text-[12px] font-bold uppercase tracking-sovereign border-none`}
        style={{ color: RIBBON_INK, minHeight: '44px' }}
        aria-label="Record this Memory"
      >
        <Camera size={15} />
        Record Memory
      </motion.button>
      {split && (
        <>
          {/* Soft divider — gold @ low opacity, matches the no-line rule. */}
          <span
            aria-hidden="true"
            className="self-center"
            style={{
              width: '1px',
              height: '24px',
              background: 'hsl(36 47% 35% / 0.30)',
            }}
          />
          <motion.button
            whileTap={{ scale: 0.985 }}
            onClick={onFindAndSeek}
            type="button"
            className="flex-1 flex items-center justify-center gap-2 bg-transparent cursor-pointer font-sans text-[12px] font-bold uppercase tracking-sovereign border-none"
            style={{ color: RIBBON_INK, minHeight: '44px' }}
            aria-label="Find & Seek"
          >
            <Compass size={15} />
            Find &amp; Seek
          </motion.button>
        </>
      )}
    </div>
  );
};

export default EngagementRibbon;
