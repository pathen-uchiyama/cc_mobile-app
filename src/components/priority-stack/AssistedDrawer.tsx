import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, ArrowRight, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useHaptics } from '@/hooks/useHaptics';
import { useCompanion, type ServiceTier } from '@/contexts/CompanionContext';

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
 * Contextual Booking Drawer — the Interaction Hub for the Assisted Path.
 *
 * Stays INVISIBLE by default. Only triggers when the strategy engine
 * identifies a Strategic Opportunity (LL window matching a Must-Do).
 *
 * Tier-aware UI injection:
 *   • Tier 1 (explorer)  — "Secure Path" CTA. The user takes action.
 *   • Tier 2 (manager)   — "Confirm Strategy" CTA. The app already prepped it.
 *   • Tier 3 (sovereign) — Auto-confirms via top toast, then dismisses. The
 *                          drawer never visually opens; the Hero updates itself.
 *
 * The Logic Whisper (Inter Italic, "Why now") is required on every render.
 */
const tierCopy: Record<ServiceTier, { eyebrow: string; cta: string }> = {
  explorer: { eyebrow: 'Strategic Window Found', cta: 'Secure Path' },
  manager: { eyebrow: 'Strategy Prepared', cta: 'Confirm Strategy' },
  sovereign: { eyebrow: 'Strategy Success', cta: 'Done' },
};

const AssistedDrawer = ({
  open, attraction, window, savedMinutes, reasoning, onConfirm, onDismiss,
}: AssistedDrawerProps) => {
  const { fire } = useHaptics();
  const { tier } = useCompanion();

  // Tier 3 — Sovereign: never visually opens. Fire a top-aligned toast and
  // auto-confirm so the Hero card updates itself.
  useEffect(() => {
    if (!open) return;
    if (tier === 'sovereign') {
      fire('bookingSuccess');
      toast.success(`${attraction} secured for ${window}`, {
        description: reasoning
          ? `Saved ${savedMinutes} minutes. ${reasoning.charAt(0).toUpperCase()}${reasoning.slice(1)}.`
          : `Saved ${savedMinutes} minutes of standby.`,
        position: 'top-center',
        duration: 3200,
      });
      const t = setTimeout(() => onConfirm(), 600);
      return () => clearTimeout(t);
    }
    fire('recommendation');
  }, [open, tier, attraction, window, reasoning, savedMinutes, fire, onConfirm]);

  const handleConfirm = () => {
    fire('bookingSuccess');
    onConfirm();
  };

  // Tier 3 — render nothing visible (toast handled in effect).
  if (tier === 'sovereign') return null;

  const { eyebrow, cta } = tierCopy[tier];

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
            aria-label={eyebrow}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 240 }}
            className="fixed bottom-[108px] left-1/2 -translate-x-1/2 z-[9980] w-[calc(100vw-24px)] max-w-[420px] bg-card flex flex-col"
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
                  {eyebrow}
                </span>
              </div>

              <h3
                className="font-display text-[24px] leading-[1.18] text-foreground mb-4"
                style={{ fontFamily: '"Publico Headline", "Playfair Display", serif' }}
              >
                {tier === 'manager' ? 'Ready to lock ' : 'We can secure '}
                <span style={{ color: 'hsl(var(--gold))' }}>{attraction}</span>
                {' '}for{' '}
                <span className="tabular-nums">{window}</span>.
              </h3>

              <p className="font-sans italic text-[14px] text-foreground/85 leading-relaxed mb-5">
                {tier === 'manager'
                  ? <>The strategy is prepped — </>
                  : <>This </>}
                saves{' '}
                <span className="not-italic font-semibold tabular-nums">{savedMinutes} minutes</span>
                {reasoning ? <> and {reasoning}.</> : <> of standby time.</>}
              </p>

              {/* Logic Whisper — Inter Italic rationale.
                  Switched to the editorial magenta info-ribbon: tertiary
                  surface (#ffd8ec @ 30%) + magenta ink, mirroring the
                  "Delayed" alert in the Digital Plaid reference. This
                  visually separates *rationale* from gold *strategy*. */}
              <div className="mt-auto px-3 py-2.5 rounded-xl flex items-start gap-2 bg-tertiary-fixed/30 border border-tertiary/10">
                <span
                  className="font-sans not-italic text-[8px] uppercase font-bold shrink-0 mt-[2px] text-tertiary-on-fixed-variant"
                  style={{ letterSpacing: '0.2em' }}
                >
                  Why now
                </span>
                <span className="font-sans italic text-[11px] leading-snug text-tertiary-on-fixed-variant">
                  Securing this now ensures you can stack the afternoon for your Must-Dos.
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
                {cta}
                {tier === 'manager' ? <Check size={16} /> : <ArrowRight size={16} />}
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
