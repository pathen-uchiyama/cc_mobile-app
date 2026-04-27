import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Timer, AlertCircle, RefreshCw, ChevronDown, MapPin, Clock } from 'lucide-react';

export type LLAlertKind = 'window-open' | 'redeem-ready' | 'window-closed';

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
  /** Attraction name surfaced in the expanded Details panel. */
  attractionName?: string;
  /** Wall-clock string (e.g. "12:00 PM") for when the window closes. */
  closingClock?: string;
  /**
   * Remaining-time ratio in `[0, 1]`. 1 = full window left, 0 = expired.
   * Drives the thin countdown bar at the bottom of the banner. Omit to
   * hide the bar (e.g. for `window-open`, which has no fixed window).
   */
  progress?: number;
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
const LLAlertBanner = ({ alert, onTap }: LLAlertBannerProps) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <AnimatePresence initial={false}>
      {alert && (() => {
        const isClosed = alert.kind === 'window-closed';
        // Burnt-sienna palette for the closed/error variant; gold otherwise.
        const accent = isClosed ? 'var(--sienna)' : 'var(--gold)';
        const bgGradient = isClosed
          ? `linear-gradient(180deg, hsl(${accent} / 0.14) 0%, hsl(${accent} / 0.05) 100%)`
          : `linear-gradient(180deg, hsl(${accent} / 0.16) 0%, hsl(${accent} / 0.06) 100%)`;
        const Icon = isClosed ? AlertCircle : Zap;
        const ActionIcon = isClosed ? RefreshCw : null;
        const fallbackAction =
          alert.kind === 'redeem-ready'
            ? 'Tap in'
            : alert.kind === 'window-closed'
              ? 'Refresh'
              : 'Book now';
        // Show the Details affordance only when there's something extra to
        // reveal beyond the headline strip.
        const hasDetails = Boolean(alert.attractionName || alert.closingClock);
        const showProgress = typeof alert.progress === 'number';
        const progressPct = showProgress
          ? Math.max(0, Math.min(1, alert.progress as number)) * 100
          : 0;

        return (
          <motion.div
            key={alert.kind}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            role="group"
            aria-label={`${alert.eyebrow}: ${alert.title}`}
            className="w-full mb-4 rounded-xl overflow-hidden"
            style={{
              background: bgGradient,
              boxShadow: `0 0 0 1px hsl(${accent} / 0.45), 0 8px 22px hsl(var(--obsidian) / 0.06)`,
            }}
          >
            <div className="flex items-center gap-3 px-4 py-3 text-left">
              <span
                className="shrink-0 flex items-center justify-center rounded-full"
                style={{
                  width: '32px',
                  height: '32px',
                  background: `hsl(${accent})`,
                  color: 'hsl(var(--parchment))',
                }}
              >
                <Icon size={15} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p
                    className="font-sans text-[8px] uppercase tracking-sovereign font-bold"
                    style={{ color: `hsl(${accent})`, letterSpacing: '0.16em' }}
                  >
                    {alert.eyebrow}
                  </p>
                  {alert.countdown && !isClosed && (
                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-sans text-[9px] font-semibold tabular-nums"
                      style={{
                        background: `hsl(${accent} / 0.18)`,
                        color: `hsl(${accent})`,
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
                {hasDetails && (
                  <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    aria-expanded={expanded}
                    aria-controls="ll-alert-details"
                    className="mt-1 inline-flex items-center gap-1 font-sans text-[10px] font-semibold border-none bg-transparent cursor-pointer p-0"
                    style={{ color: `hsl(${accent})`, letterSpacing: '0.04em' }}
                  >
                    {expanded ? 'Hide details' : 'Details'}
                    <motion.span
                      animate={{ rotate: expanded ? 180 : 0 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className="inline-flex"
                    >
                      <ChevronDown size={11} strokeWidth={2.5} />
                    </motion.span>
                  </button>
                )}
              </div>
              <motion.button
                type="button"
                onClick={onTap}
                whileTap={{ scale: 0.97 }}
                className="shrink-0 inline-flex items-center justify-center gap-1 rounded-lg px-3 py-2 font-sans text-[11px] font-semibold border-none cursor-pointer"
                style={{
                  minHeight: '36px',
                  background: `hsl(${accent})`,
                  color: 'hsl(var(--parchment))',
                  letterSpacing: '0.02em',
                }}
                aria-label={alert.actionLabel ?? fallbackAction}
              >
                {ActionIcon && <ActionIcon size={12} strokeWidth={2.5} />}
                {alert.actionLabel ?? fallbackAction}
              </motion.button>
            </div>

            <AnimatePresence initial={false}>
              {hasDetails && expanded && (
                <motion.div
                  id="ll-alert-details"
                  key="details"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  style={{ overflow: 'hidden' }}
                >
                  <div
                    className="px-4 pb-3 pt-2 flex flex-col gap-1.5"
                    style={{
                      background: `hsl(${accent} / 0.06)`,
                      boxShadow: `inset 0 1px 0 hsl(${accent} / 0.18)`,
                    }}
                  >
                    {alert.attractionName && (
                      <div className="flex items-center gap-2 font-sans text-[11px] text-foreground">
                        <MapPin size={11} strokeWidth={2.25} style={{ color: `hsl(${accent})` }} />
                        <span className="font-semibold">Attraction</span>
                        <span className="ml-auto truncate">{alert.attractionName}</span>
                      </div>
                    )}
                    {alert.closingClock && (
                      <div className="flex items-center gap-2 font-sans text-[11px] text-foreground">
                        <Clock size={11} strokeWidth={2.25} style={{ color: `hsl(${accent})` }} />
                        <span className="font-semibold">
                          {isClosed ? 'Closed at' : 'Closes at'}
                        </span>
                        <span className="ml-auto tabular-nums">{alert.closingClock}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {showProgress && (
              <div
                className="w-full"
                style={{
                  height: '3px',
                  background: `hsl(${accent} / 0.14)`,
                }}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progressPct)}
                aria-label={`${Math.round(progressPct)}% of window remaining`}
              >
                <motion.div
                  className="h-full"
                  style={{
                    background: `linear-gradient(90deg, hsl(${accent} / 0.65) 0%, hsl(${accent}) 100%)`,
                    borderTopRightRadius: '2px',
                    borderBottomRightRadius: '2px',
                  }}
                  initial={false}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>
            )}
          </motion.div>
        );
      })()}
    </AnimatePresence>
  );
};

export default LLAlertBanner;