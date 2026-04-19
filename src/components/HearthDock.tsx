import { motion } from 'framer-motion';
import { useHaptics } from '@/hooks/useHaptics';

interface HearthDockProps {
  /** Tap handler for the Sovereign Key (centered Gold anchor). */
  onSovereignTap: () => void;
  /** Whether a Sovereign sheet is currently open (suppresses idle pulse + rotates the mark). */
  active?: boolean;
  /** Optional left-side and right-side glyph slots — kept minimal so the Key dominates. */
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
}

/**
 * The Hearth — floating Obsidian navigation dock.
 *
 * Replaces the standard tab bar with a single, intentional surface:
 * a Deep Obsidian (#1A1A1B) pill anchored at the bottom, with the
 * Burnished Gold (#947120) Sovereign Key centered as the only OS anchor.
 *
 * Spec:
 * - 16px radius (rounded-2xl carries from --radius)
 * - Sovereign Key elevated above the dock (overflow-visible)
 * - Soft idle pulse on the Key when no sheet is open
 */
const HearthDock = ({ onSovereignTap, active, leftSlot, rightSlot }: HearthDockProps) => {
  const { fire } = useHaptics();

  const handleTap = () => {
    fire('tap');
    onSovereignTap();
  };

  return (
    <nav
      aria-label="Sovereign navigation"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9990] w-[min(360px,calc(100vw-32px))]"
    >
      <div
        className="relative h-[64px] flex items-center justify-between px-7"
        style={{
          backgroundColor: 'hsl(var(--obsidian))',
          borderRadius: '16px',
          boxShadow:
            '0 18px 48px hsl(var(--obsidian) / 0.32), 0 0 0 1px hsl(var(--obsidian) / 0.6)',
        }}
      >
        {/* Left slot — quiet glyph or empty for visual balance */}
        <div className="w-10 flex items-center justify-start opacity-70">{leftSlot}</div>

        {/* Right slot — quiet glyph or empty for visual balance */}
        <div className="w-10 flex items-center justify-end opacity-70">{rightSlot}</div>

        {/* The Sovereign Key — centered, elevated above the dock */}
        <div className="absolute left-1/2 -top-5 -translate-x-1/2">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleTap}
            aria-label="Sovereign Key — open audible menu"
            className="relative w-[56px] h-[56px] rounded-full border-none cursor-pointer flex items-center justify-center"
            style={{
              background:
                'radial-gradient(circle at 30% 30%, hsl(var(--gold) / 1) 0%, hsl(var(--gold) / 0.92) 55%, hsl(41 64% 24%) 100%)',
              boxShadow:
                '0 12px 28px hsl(var(--obsidian) / 0.45), 0 0 0 3px hsl(var(--obsidian)), 0 0 0 4px hsl(var(--gold) / 0.4)',
            }}
          >
            {/* Soft pulse ring when idle */}
            {!active && (
              <motion.span
                aria-hidden
                className="absolute inset-0 rounded-full"
                style={{ border: '1px solid hsl(var(--gold) / 0.5)' }}
                animate={{ scale: [1, 1.35, 1], opacity: [0.7, 0, 0.7] }}
                transition={{ repeat: Infinity, duration: 2.6, ease: 'easeOut' }}
              />
            )}
            {/* Center mark — small Obsidian square (anchor glyph) */}
            <motion.span
              aria-hidden
              animate={active ? { rotate: 45 } : { rotate: 0 }}
              transition={{ type: 'spring', damping: 18, stiffness: 220 }}
              className="block w-[10px] h-[10px]"
              style={{
                backgroundColor: 'hsl(var(--obsidian))',
                borderRadius: '2px',
              }}
            />
          </motion.button>
        </div>
      </div>
    </nav>
  );
};

export default HearthDock;
