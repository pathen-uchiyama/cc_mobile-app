import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles, Sunrise, Wind, Compass } from 'lucide-react';

type ParkEmptyVariant =
  | 'no-plan'         // No itinerary built yet
  | 'day-complete'    // Plan finished, day done
  | 'pivot-pending'   // Pivot triggered, awaiting replacement
  | 'no-suggestions'; // Concierge has nothing strategic to add right now

interface ParkEmptyStateProps {
  variant: ParkEmptyVariant;
  /** Primary CTA. Optional — most variants are observational, not active. */
  action?: { label: string; onPress: () => void };
  /** Quiet secondary action — usually "Open the audible menu". */
  secondary?: { label: string; onPress: () => void };
}

/**
 * Calm, premium empty-states for /park.
 *
 * The reset for /park (Hero + Horizon, nothing else) means the page can
 * legitimately have nothing to show. Rather than collapse to a void, we
 * surface a parchment placard — masthead voice, magenta accent, and a
 * single optional action. The placard is sized to match the FocusMove
 * card so the page rhythm doesn't change between empty and full states.
 */
const COPY: Record<ParkEmptyVariant, {
  eyebrow: string;
  title: string;
  hint: string;
  Icon: typeof Sparkles;
}> = {
  'no-plan': {
    eyebrow: 'A Quiet Slate',
    title: 'Your day is\nunwritten.',
    hint: 'No itinerary on the books yet. Sketch your first move and the concierge will start composing the rest.',
    Icon: Sunrise,
  },
  'day-complete': {
    eyebrow: 'A Complete Day',
    title: 'The pages\nare full.',
    hint: 'Every move on your plan has been honoured. Wander a while — the Vault is keeping the memories warm.',
    Icon: Sparkles,
  },
  'pivot-pending': {
    eyebrow: 'Composing',
    title: 'A new line\nis forming.',
    hint: 'The concierge is reading the room. Your next move will land here in a moment — no need to hover.',
    Icon: Wind,
  },
  'no-suggestions': {
    eyebrow: 'Nothing to push',
    title: 'The plan is\nholding well.',
    hint: 'No strategic adjustments necessary. Stay the course — we will whisper the moment something shifts.',
    Icon: Compass,
  },
};

const ParkEmptyState = ({ variant, action, secondary }: ParkEmptyStateProps) => {
  const reduce = useReducedMotion();
  const copy = COPY[variant];
  const { Icon } = copy;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative w-full"
      aria-label={copy.eyebrow}
    >
      {/* Placard — matches FocusMove footprint so the page rhythm holds. */}
      <div
        className="relative bg-card rounded-2xl px-7 pt-8 pb-9 overflow-hidden"
        style={{
          boxShadow:
            '0 0 0 1px hsl(var(--obsidian) / 0.04), 0 24px 60px hsl(var(--obsidian) / 0.10)',
        }}
      >
        {/* Whisper-faint plaid wash for parchment texture. */}
        <div
          aria-hidden
          className="absolute inset-0 digital-plaid-bg pointer-events-none opacity-60"
        />

        <div className="relative">
          {/* Magenta eyebrow pill — same vocabulary as PageHeader. */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-tertiary-fixed/40 mb-5">
            <motion.span
              aria-hidden
              className="inline-block w-1.5 h-1.5 rounded-full bg-tertiary"
              {...(reduce
                ? {}
                : {
                    animate: { opacity: [1, 0.45, 1] },
                    transition: { repeat: Infinity, duration: 2.4, ease: 'easeInOut' as const },
                  })}
            />
            <span
              className="font-sans text-[10px] uppercase font-bold text-tertiary-on-fixed-variant"
              style={{ letterSpacing: '0.18em' }}
            >
              {copy.eyebrow}
            </span>
          </div>

          <h2 className="text-headline text-primary whitespace-pre-line mb-3">
            {copy.title.split('\n').map((line, i, all) => (
              <span key={i} className={i === all.length - 1 ? 'text-secondary' : undefined}>
                {line}
                {i < all.length - 1 && <br />}
              </span>
            ))}
          </h2>

          <p className="font-sans text-[13px] text-on-surface-variant leading-relaxed max-w-[34ch] mb-6">
            {copy.hint}
          </p>

          {/* Anchor mark — quiet circular icon, matches the dock motif. */}
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mb-6"
            style={{
              background:
                'radial-gradient(circle at 30% 30%, hsl(var(--highlighter) / 0.95) 0%, hsl(var(--gold) / 0.85) 100%)',
              boxShadow: '0 8px 22px hsl(var(--obsidian) / 0.18)',
            }}
            aria-hidden
          >
            <Icon size={18} className="text-primary" strokeWidth={2.2} />
          </div>

          {action && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={action.onPress}
              className="w-full bg-primary text-primary-foreground rounded-2xl py-4 px-5 flex items-center justify-center gap-2 border-none cursor-pointer min-h-[52px] font-sans text-sm font-semibold tracking-wide"
            >
              {action.label}
            </motion.button>
          )}

          {secondary && (
            <button
              type="button"
              onClick={secondary.onPress}
              className="w-full mt-3 bg-transparent border-none cursor-pointer py-2 font-sans text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {secondary.label}
            </button>
          )}
        </div>
      </div>
    </motion.section>
  );
};

export default ParkEmptyState;
export type { ParkEmptyVariant };