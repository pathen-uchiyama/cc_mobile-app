import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Timer } from 'lucide-react';

export type LLAlertKind = 'window-open' | 'redeem-ready';

export interface LLAlert {
  kind: LLAlertKind;
  /** Headline copy shown in the eyebrow slot. */
  eyebrow: string;
  /** The single sentence the guest reads. */
  title: string;
  /** Optional small detail (countdown, attraction name, etc.). */
  detail?: string;
  /** Compact countdown string (e.g. "12m") rendered as a tap-in chip. */
  countdown?: string;
  /** Label for the primary action button (e.g. "Tap in", "Book now"). */
  actionLabel?: string;
}

interface LLAlertBannerProps {
  alert: LLAlert | null;
  onTap: () => void;
}

/**
 * Lightning Lane alert banner — a single editorial gold strip that sits
 * directly above the focus card. Surfaces ONLY when:
 *   • a new standard LL booking window has opened, or
 *   • a held LL has entered its tap-in window.
 *
 * Renders nothing when `alert` is null. The parent decides whether the
 * guest is using LL on this trip — if not, it passes null and the surface
 * stays calm.
 */
const LLAlertBanner = ({ alert, onTap }: LLAlertBannerProps) => (
  <AnimatePresence initial={false}>
    {alert && (
      <motion.div
        key={alert.kind}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        role="group"
        aria-label={`${alert.eyebrow}: ${alert.title}`}
        className="w-full flex items-center gap-3 px-4 py-3 mb-4 rounded-xl text-left"
        style={{
          background:
            'linear-gradient(180deg, hsl(var(--gold) / 0.16) 0%, hsl(var(--gold) / 0.06) 100%)',
          boxShadow:
            '0 0 0 1px hsl(var(--gold) / 0.45), 0 8px 22px hsl(var(--obsidian) / 0.06)',
        }}
      >
        <span
          className="shrink-0 flex items-center justify-center rounded-full"
          style={{
            width: '32px',
            height: '32px',
            background: 'hsl(var(--gold))',
            color: 'hsl(var(--parchment))',
          }}
        >
          <Zap size={15} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p
              className="font-sans text-[8px] uppercase tracking-sovereign font-bold"
              style={{ color: 'hsl(var(--gold))', letterSpacing: '0.16em' }}
            >
              {alert.eyebrow}
            </p>
            {alert.countdown && (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-sans text-[9px] font-semibold tabular-nums"
                style={{
                  background: 'hsl(var(--gold) / 0.18)',
                  color: 'hsl(var(--gold))',
                }}
                aria-label={`Countdown ${alert.countdown}`}
              >
                <Timer size={9} strokeWidth={2.5} />
                {alert.countdown}
              </span>
            )}
          </div>
          <p className="font-display text-[14px] leading-tight text-foreground truncate">
            {alert.title}
          </p>
          {alert.detail && (
            <p className="font-sans text-[10px] mt-0.5 text-muted-foreground tabular-nums truncate">
              {alert.detail}
            </p>
          )}
        </div>
        <motion.button
          type="button"
          onClick={onTap}
          whileTap={{ scale: 0.97 }}
          className="shrink-0 inline-flex items-center justify-center rounded-lg px-3 py-2 font-sans text-[11px] font-semibold border-none cursor-pointer"
          style={{
            minHeight: '36px',
            background: 'hsl(var(--gold))',
            color: 'hsl(var(--parchment))',
            letterSpacing: '0.02em',
          }}
          aria-label={alert.actionLabel ?? (alert.kind === 'redeem-ready' ? 'Tap in' : 'Book now')}
        >
          {alert.actionLabel ?? (alert.kind === 'redeem-ready' ? 'Tap in' : 'Book now')}
        </motion.button>
      </motion.div>
    )}
  </AnimatePresence>
);

export default LLAlertBanner;