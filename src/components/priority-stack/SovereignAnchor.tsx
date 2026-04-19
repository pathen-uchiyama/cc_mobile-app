import { motion } from 'framer-motion';

interface SovereignAnchorProps {
  onTap: () => void;
  active?: boolean;
}

/**
 * The Sovereign Key — Golden Anchor.
 *
 * Floating bottom-center. Single tap opens the Audible menu.
 * Soft pulse ring when idle.
 */
const SovereignAnchor = ({ onTap, active }: SovereignAnchorProps) => {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9990]">
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={onTap}
        aria-label="Sovereign Key — call an audible"
        className="relative w-16 h-16 rounded-full border-none cursor-pointer flex items-center justify-center"
        style={{
          background: 'radial-gradient(circle at 30% 30%, hsl(var(--gold)) 0%, hsl(var(--gold) / 0.85) 60%, hsl(var(--sienna) / 0.8) 100%)',
          boxShadow: '0 16px 36px hsl(var(--obsidian) / 0.22)',
        }}
      >
        {!active && (
          <motion.div
            className="absolute inset-0 rounded-full border border-accent/40"
            animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ repeat: Infinity, duration: 2.4, ease: 'easeOut' }}
          />
        )}
        <motion.div
          animate={active ? { rotate: 45 } : { rotate: 0 }}
          transition={{ type: 'spring', damping: 18, stiffness: 220 }}
          className="w-3 h-3 bg-primary"
          style={{ borderRadius: '2px' }}
        />
      </motion.button>
    </div>
  );
};

export default SovereignAnchor;
