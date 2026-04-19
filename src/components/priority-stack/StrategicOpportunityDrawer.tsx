import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface StrategicOpportunityDrawerProps {
  open: boolean;
  attraction: string;
  window: string;
  logic: string;
  onBook: () => void;
  onDismiss: () => void;
}

/**
 * Persistent Bottom Sheet — only visible when an LL window is found.
 *
 * Header in Burnished Gold. Two horizontal CTAs: Book Now (Obsidian) + Not Now (Ghost).
 * Sits above the Sovereign Key thumb-zone.
 */
const StrategicOpportunityDrawer = ({
  open,
  attraction,
  window,
  logic,
  onBook,
  onDismiss,
}: StrategicOpportunityDrawerProps) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 220 }}
          className="fixed bottom-[110px] left-1/2 -translate-x-1/2 z-[9960] w-[min(440px,calc(100vw-24px))] bg-card rounded-2xl px-5 py-4"
          style={{ boxShadow: '0 24px 60px hsl(var(--obsidian) / 0.18)' }}
        >
          {/* Header — Burnished Gold */}
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={12} className="text-accent" />
            <span className="font-sans text-[9px] uppercase tracking-sovereign font-bold" style={{ color: 'hsl(var(--gold))' }}>
              Strategic Opportunity Found
            </span>
          </div>

          <h4 className="font-display text-[18px] leading-tight text-foreground">
            {attraction}
            <span className="font-sans text-[11px] text-muted-foreground ml-2 tabular-nums font-normal">
              {window}
            </span>
          </h4>

          <p className="font-sans italic text-[12px] text-foreground/75 mt-1.5 mb-4 leading-snug">
            {logic}
          </p>

          {/* Two horizontal CTAs */}
          <div className="grid grid-cols-2 gap-2.5">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onDismiss}
              className="rounded-xl py-3 bg-transparent border cursor-pointer font-sans text-[12px] font-semibold text-foreground min-h-[44px]"
              style={{ borderColor: 'hsl(var(--slate-divider) / 0.5)' }}
            >
              Not Now
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onBook}
              className="rounded-xl py-3 bg-primary text-primary-foreground border-none cursor-pointer font-sans text-[12px] font-semibold min-h-[44px]"
            >
              Book Now
            </motion.button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

export default StrategicOpportunityDrawer;
