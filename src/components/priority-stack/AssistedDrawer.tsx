import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';

interface AssistedDrawerProps {
  open: boolean;
  attraction: string;
  window: string;
  savedMinutes: number;
  onConfirm: () => void;
  onDismiss: () => void;
}

/**
 * Bottom-Up Assisted Drawer — covers lower 50% of screen.
 *
 * Triggered only when the backend finds a Lightning Lane window.
 * Single Strategic Executive Decision: Confirm (Obsidian) or Dismiss (subtle).
 *
 * Haptics:
 * - Double pulse the moment a recommendation appears.
 * - Single long pulse on successful Confirm.
 */
const AssistedDrawer = ({
  open, attraction, window, savedMinutes, onConfirm, onDismiss,
}: AssistedDrawerProps) => {
  const { fire } = useHaptics();

  useEffect(() => {
    if (open) fire('recommendation');
  }, [open, fire]);

  const handleConfirm = () => {
    fire('bookingSuccess');
    onConfirm();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Vellum backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onDismiss}
            className="fixed inset-0 z-[9970] bg-foreground/30"
            style={{ backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
          />

          {/* The drawer — lower 50% */}
          <motion.aside
            role="dialog"
            aria-label="Strategic Opportunity Found"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 240 }}
            className="fixed bottom-[108px] left-1/2 -translate-x-1/2 z-[9980] w-full max-w-[480px] bg-card flex flex-col"
            style={{
              height: '50vh',
              borderRadius: '16px',
              boxShadow: '0 -24px 60px hsl(var(--obsidian) / 0.18)',
            }}
          >
            {/* Drawer handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-foreground/15" />
            </div>

            {/* Dismiss icon top-right */}
            <button
              onClick={onDismiss}
              className="absolute top-4 right-4 bg-transparent border-none cursor-pointer p-2 opacity-50 hover:opacity-100 transition-opacity"
              aria-label="Dismiss"
            >
              <X size={16} className="text-foreground" />
            </button>

            {/* Body */}
            <div className="flex-1 px-7 pt-6 pb-4 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={14} className="text-accent" />
                <span className="font-sans text-[10px] uppercase tracking-sovereign font-bold" style={{ color: 'hsl(var(--gold))' }}>
                  Strategic Opportunity Found
                </span>
              </div>

              {/* WIN — Publico Headline (Playfair fallback) */}
              <h3
                className="font-display text-[26px] leading-[1.15] text-foreground mb-3"
                style={{ fontFamily: '"Publico Headline", "Playfair Display", serif' }}
              >
                A window for {attraction} just opened.
              </h3>

              {/* LOGIC WHISPER — Inter Italic */}
              <p className="font-sans italic text-[14px] text-foreground/80 leading-relaxed mb-5">
                Return at <span className="not-italic font-semibold tabular-nums">{window}</span>. Slots into your
                route with no detour, and saves you{' '}
                <span className="not-italic font-semibold tabular-nums">{savedMinutes} minutes</span> of standby
                time.
              </p>

              <p className="font-sans italic text-[12px] mb-auto" style={{ color: 'hsl(var(--slate-plaid))' }}>
                Booking handled in the background — keep walking.
              </p>
            </div>

            {/* Action zone — single thumb-press confirms */}
            <div className="px-6 pb-7 pt-3 grid grid-cols-[1fr_2fr] gap-3 shrink-0">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onDismiss}
                className="rounded-2xl py-4 bg-transparent border-none cursor-pointer font-sans text-[12px] font-semibold min-h-[52px]"
                style={{ color: 'hsl(var(--slate-plaid))' }}
              >
                Dismiss
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleConfirm}
                className="rounded-2xl py-4 bg-primary text-primary-foreground border-none cursor-pointer font-sans text-[13px] font-semibold min-h-[52px]"
              >
                Confirm — Secure It
              </motion.button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default AssistedDrawer;
