import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, TrendingDown, Clock, Users, Utensils, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RESERVATIONS, formatTime, type Reservation } from '@/data/reservations';
import {
  INITIAL_HOLDS,
  DEFAULT_CAPACITY,
  summarizeCapacity,
} from '@/data/lightningLanes';
import CapacityMeter from '@/components/lightning-lane/CapacityMeter';

interface StrategicDashboardProps {
  open: boolean;
  onClose: () => void;
}

const STATUS_TONE: Record<Reservation['status'], { bg: string; fg: string; label: string }> = {
  'open-now': { bg: 'hsl(var(--accent) / 0.15)', fg: 'hsl(var(--accent))', label: 'open now' },
  'checked-in': { bg: 'hsl(var(--accent) / 0.15)', fg: 'hsl(var(--accent))', label: 'checked in' },
  upcoming: { bg: 'hsl(var(--gold) / 0.12)', fg: 'hsl(var(--gold))', label: 'upcoming' },
  used: { bg: 'hsl(var(--obsidian) / 0.06)', fg: 'hsl(var(--muted-foreground))', label: 'redeemed' },
};

/** Renders a single reservation row — shared by both Standing Reservations and LL Inventory. */
const ReservationRow = ({ r }: { r: Reservation }) => {
  const tone = STATUS_TONE[r.status];
  const Icon =
    r.kind === 'dining' ? Utensils : r.kind === 'experience' ? Sparkles : Zap;
  const window = r.endsAt
    ? `${formatTime(r.startsAt)} – ${formatTime(r.endsAt)}`
    : formatTime(r.startsAt);
  return (
    <li
      className="flex items-center justify-between px-4 py-3 rounded-xl bg-background/60"
      style={{ border: '1px solid hsl(var(--obsidian) / 0.04)' }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <Icon size={14} className="shrink-0" style={{ color: 'hsl(var(--gold))' }} />
        <div className="min-w-0">
          <p className="font-display text-[14px] text-foreground truncate">{r.name}</p>
          <p className="font-sans text-[10px] tabular-nums" style={{ color: 'hsl(var(--slate-plaid))' }}>
            {window}
            {r.location ? ` · ${r.location}` : ''}
            {r.partySize ? ` · party of ${r.partySize}` : ''}
          </p>
        </div>
      </div>
      <span
        className="shrink-0 font-sans text-[8px] uppercase tracking-sovereign font-bold px-2 py-1 rounded-full"
        style={{ backgroundColor: tone.bg, color: tone.fg }}
      >
        {tone.label}
      </span>
    </li>
  );
};

/**
 * Strategic Dashboard — opened from the Sovereign Key (Type A view).
 *
 * Surfaces the "plumbing" — Standing Reservations (dining + experiences),
 * Lightning Lane inventory, time saved, ride efficiency, crowd pulse.
 * The control room without leaving the park view.
 */
const StrategicDashboard = ({ open, onClose }: StrategicDashboardProps) => {
  const navigate = useNavigate();
  // Mirror /park: same NOW anchor + holds means the meter never disagrees.
  const NOW_MINUTES = 11 * 60 + 5;
  const llSummary = summarizeCapacity(INITIAL_HOLDS, NOW_MINUTES, DEFAULT_CAPACITY);
  const standing = RESERVATIONS
    .filter((r) => r.kind === 'dining' || r.kind === 'experience')
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const lightning = RESERVATIONS
    .filter((r) => r.kind === 'll' || r.kind === 'ill')
    .sort((a, b) => {
      // Open-now first, then by start time.
      if (a.status === 'open-now' && b.status !== 'open-now') return -1;
      if (b.status === 'open-now' && a.status !== 'open-now') return 1;
      return a.startsAt.localeCompare(b.startsAt);
    });

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-foreground/30"
            style={{
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              zIndex: 'var(--z-overlay)' as unknown as number,
            }}
          />
          <motion.aside
            role="dialog"
            aria-label="Strategic dashboard"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 280 }}
            className="fixed bottom-[108px] left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-card flex flex-col"
            style={{
              maxHeight: 'calc(80vh - 108px)',
              borderRadius: '16px',
              boxShadow: '0 -24px 60px hsl(var(--obsidian) / 0.2)',
              zIndex: 'calc(var(--z-overlay) + 1)' as unknown as number,
            }}
          >
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-foreground/15" />
            </div>

            <header className="flex items-start justify-between px-6 pt-3 pb-4 shrink-0">
              <div>
                <span className="font-sans text-[9px] uppercase tracking-sovereign font-bold" style={{ color: 'hsl(var(--gold))' }}>
                  Strategic Dashboard
                </span>
                <h3 className="font-display text-[22px] text-foreground mt-1">
                  The Plumbing
                </h3>
              </div>
              <button
                onClick={onClose}
                aria-label="Close dashboard"
                className="bg-transparent border-none cursor-pointer p-1.5 -mr-1.5"
              >
                <X size={18} className="text-muted-foreground" />
              </button>
            </header>

            <div className="px-5 pb-8 overflow-y-auto space-y-4">
              {/* KPI grid */}
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { label: 'Time saved', value: '1h 42m', icon: TrendingDown },
                  { label: 'LLs in pocket', value: '3', icon: Zap },
                  { label: 'Avg wait beat', value: '−18m', icon: Clock },
                ].map((k) => {
                  const I = k.icon;
                  return (
                    <div
                      key={k.label}
                      className="rounded-2xl bg-background/60 px-3 py-3.5 text-center"
                      style={{ border: '1px solid hsl(var(--obsidian) / 0.05)' }}
                    >
                      <I size={14} className="mx-auto mb-1.5" style={{ color: 'hsl(var(--gold))' }} />
                      <p className="font-display text-[18px] text-foreground leading-none tabular-nums">
                        {k.value}
                      </p>
                      <p className="font-sans text-[8px] uppercase tracking-sovereign text-muted-foreground font-semibold mt-1.5">
                        {k.label}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Standing Reservations — dining + experiences (table holds, character meals, tours) */}
              {standing.length > 0 && (
                <section>
                  <p className="font-sans text-[9px] uppercase tracking-sovereign text-muted-foreground font-semibold mb-2 px-1">
                    The Standing Reservations
                  </p>
                  <ul className="list-none p-0 m-0 space-y-1.5">
                    {standing.map((r) => (
                      <ReservationRow key={r.id} r={r} />
                    ))}
                  </ul>
                </section>
              )}

              {/* Lightning Lane inventory — LL + ILL holds */}
              {lightning.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-2 px-1">
                    <p className="font-sans text-[9px] uppercase tracking-sovereign text-muted-foreground font-semibold m-0">
                      Lightning Lane inventory
                    </p>
                  </div>
                  <div className="mb-2.5">
                    <CapacityMeter summary={llSummary} compact />
                  </div>
                  <ul className="list-none p-0 m-0 space-y-1.5">
                    {lightning.map((r) => (
                      <ReservationRow key={r.id} r={r} />
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate('/book-ll');
                    }}
                    className="w-full mt-3 rounded-2xl py-3 px-5 flex items-center justify-center gap-2 border-none cursor-pointer min-h-[44px] font-sans text-[12px] font-semibold"
                    style={{
                      backgroundColor: 'hsl(var(--gold) / 0.12)',
                      color: 'hsl(var(--gold))',
                      border: '1px solid hsl(var(--gold) / 0.3)',
                    }}
                  >
                    Browse & book a Lightning Lane
                    <ArrowRight size={14} />
                  </button>
                </section>
              )}

              {/* Crowd pulse */}
              <section>
                <p className="font-sans text-[9px] uppercase tracking-sovereign text-muted-foreground font-semibold mb-2 px-1">
                  Crowd pulse
                </p>
                <div
                  className="rounded-2xl px-4 py-3.5 flex items-center gap-3"
                  style={{
                    backgroundColor: 'hsl(var(--gold) / 0.08)',
                    border: '1px solid hsl(var(--gold) / 0.2)',
                  }}
                >
                  <Users size={16} style={{ color: 'hsl(var(--gold))' }} />
                  <p className="font-sans text-[12px] text-foreground/85 leading-snug flex-1">
                    Park-wide standby is{' '}
                    <span className="font-semibold tabular-nums">22%</span> below the 30-day median.
                    Stay aggressive on Tomorrowland.
                  </p>
                </div>
              </section>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default StrategicDashboard;
