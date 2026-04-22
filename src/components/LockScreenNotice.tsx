import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { useWhispers } from '@/hooks/useWhispers';

interface LockScreenNoticeProps {
  /** Optional app/source label rendered in the header chrome. */
  source?: string;
}

/**
 * Lock-Screen Notice — a single, top-pinned notification card.
 *
 * Visually patterned after an iOS / Android lock-screen banner so the same
 * surface reads correctly when the OS pushes it to a real lock screen.
 * Pulls the freshest whisper from `useWhispers()` and lets the guest swipe
 * (or tap the close affordance) to dismiss.
 */
const LockScreenNotice = ({ source = 'Castle Companion' }: LockScreenNoticeProps) => {
  const { whispers, dismiss } = useWhispers();
  const current = whispers[0];

  return (
    <AnimatePresence mode="wait">
      {current && (
        <motion.aside
          key={current.id}
          role="status"
          aria-label={`Notification from ${source}`}
          initial={{ y: -24, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -24, opacity: 0, scale: 0.96 }}
          transition={{ type: 'spring', damping: 22, stiffness: 240 }}
          className="rounded-2xl bg-card/95 px-4 py-3 flex flex-col gap-1.5"
          style={{
            backdropFilter: 'blur(14px) saturate(140%)',
            WebkitBackdropFilter: 'blur(14px) saturate(140%)',
            boxShadow:
              '0 10px 28px hsl(var(--obsidian) / 0.10), 0 0 0 1px hsl(var(--gold) / 0.18)',
          }}
        >
          {/* Lock-screen chrome row — app icon, source, time, dismiss */}
          <header className="flex items-center gap-2">
            <span
              className="flex items-center justify-center rounded-md shrink-0"
              style={{
                width: '20px',
                height: '20px',
                background: 'hsl(var(--gold))',
                color: 'hsl(var(--card))',
              }}
            >
              <Bell size={11} strokeWidth={2.5} />
            </span>
            <span
              className="font-sans text-[9px] uppercase font-bold tracking-widest flex-1 truncate"
              style={{ color: 'hsl(var(--gold))' }}
            >
              {source}
            </span>
            <span
              className="font-sans text-[9px] tabular-nums"
              style={{ color: 'hsl(var(--slate-plaid))' }}
            >
              now
            </span>
            <button
              type="button"
              onClick={() => dismiss(current.id)}
              aria-label="Dismiss notification"
              className="bg-transparent border-none cursor-pointer p-0.5 -mr-0.5 rounded-full"
              style={{ color: 'hsl(var(--slate-plaid))' }}
            >
              <X size={12} />
            </button>
          </header>

          {/* The whisper itself — calm, two-line clamp like a real banner */}
          <p
            className="font-sans text-[12.5px] leading-snug text-foreground"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {current.text}
          </p>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

export default LockScreenNotice;
