import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, ArrowRight } from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';

interface AssistedDrawerProps {
  open: boolean;
  attraction: string;
  /** The proposed return window, e.g. "1:15 PM". */
  window: string;
  /** Minutes saved vs standby. */
  savedMinutes: number;
  /** Strategic reasoning sentence — the "why this aligns with your day" line. */
  reasoning?: string;
  onConfirm: () => void;
  onDismiss: () => void;
}

/**
 * Contextual Booking Drawer — the ONLY surface where Lightning Lanes are managed.
 *
 * Triggered exclusively by the strategy engine when a window is found.
 * Single Strategic Executive Decision: one Deep Obsidian "Secure Path" button.
 *
 * Copy spec: "Strategic Window Found: We can secure {attraction} for {window}.
 * This saves {savedMinutes} minutes and {reasoning}. Secure?"
 *
 * Haptics: double-pulse on appearance, long pulse on confirm.
 */
const AssistedDrawer = ({
  open, attraction, window, savedMinutes, reasoning, onConfirm, onDismiss,
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onDismiss}
            className="fixed inset-0 z-[9970] bg-foreground/30"
            style={{ backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
          />

          <motion.aside
            role="dialog"
            aria-label="Strategic Window Found"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 240 }}
            className="fixed bottom-[108px] left-1/2 -translate-x-1/2 z-[9980] w-full max-w-[480px] bg-card flex flex-col"
            style={{
              minHeight: '46vh',
              maxHeight: '70vh',
              borderRadius: '16px',
              boxShadow: '0 -24px 60px hsl(var(--obsidian) / 0.18)',
            }}
          >
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-foreground/15" />
            </div>

            <button
              onClick={onDismiss}
              className="absolute top-4 right-4 bg-transparent border-none cursor-pointer p-2 opacity-50 hover:opacity-100 transition-opacity"
              aria-label="Dismiss"
            >
              <X size={16} className="text-foreground" />
            </button>

            <div className="flex-1 px-7 pt-6 pb-4 flex flex-col overflow-y-auto">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={14} style={{ color: 'hsl(var(--gold))' }} />
                <span
                  className="font-sans text-[10px] uppercase tracking-sovereign font-bold"
                  style={{ color: 'hsl(var(--gold))', letterSpacing: '0.16em' }}
                >
                  Strategic Window Found
                </span>
              </div>

              <h3
                className="font-display text-[24px] leading-[1.18] text-foreground mb-4"
                style={{ fontFamily: '"Publico Headline", "Playfair Display", serif' }}
              >
                We can secure{' '}
                <span style={{ color: 'hsl(var(--gold))' }}>{attraction}</span>
                {' '}for{' '}
                <span className="tabular-nums">{window}</span>.
              </h3>

              <p className="font-sans italic text-[14px] text-foreground/85 leading-relaxed mb-5">
                This saves{' '}
                <span className="not-italic font-semibold tabular-nums">{savedMinutes} minutes</span>
                {reasoning ? (
                  <> and {reasoning}.</>
                ) : (
                  <> of standby time.</>
                )}
              </p>

              <div
                className="mt-auto px-3 py-2.5 rounded-xl flex items-start gap-2"
                style={{
                  background: 'hsl(var(--gold) / 0.08)',
                  border: '1px solid hsl(var(--gold) / 0.2)',
                }}
              >
                <span
                  className="font-sans not-italic text-[8px] uppercase tracking-sovereign font-bold shrink-0 mt-[2px]"
                  style={{ color: 'hsl(var(--gold))', letterSpacing: '0.16em' }}
                >
                  Why now
                </span>
                <span
                  className="font-sans italic text-[11px] leading-snug"
                  style={{ color: 'hsl(var(--slate-plaid))' }}
                >
                  Lightning Lanes are only surfaced here, when the system finds a path that fits your day.
                </span>
              </div>
            </div>

            <div className="px-6 pb-7 pt-3 shrink-0">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleConfirm}
                className="w-full bg-primary text-primary-foreground border-none cursor-pointer font-sans text-[14px] font-semibold flex items-center justify-center gap-2"
                style={{ borderRadius: '16px', minHeight: '60px' }}
              >
                Secure Path
                <ArrowRight size={16} />
              </motion.button>
              <button
                onClick={onDismiss}
                className="w-full mt-2 bg-transparent border-none cursor-pointer font-sans text-[11px] py-2"
                style={{ color: 'hsl(var(--slate-plaid))' }}
              >
                Not now
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default AssistedDrawer;
