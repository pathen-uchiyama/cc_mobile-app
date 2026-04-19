import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, TrendingDown, Clock, Users } from 'lucide-react';

interface StrategicDashboardProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Strategic Dashboard — opened from the Sovereign Key (Type A view).
 *
 * Surfaces the "plumbing" — LL inventory, time saved, ride efficiency,
 * route deltas. The control room without leaving the park view.
 */
const StrategicDashboard = ({ open, onClose }: StrategicDashboardProps) => {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[9970] bg-foreground/30"
            style={{ backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
          />
          <motion.aside
            role="dialog"
            aria-label="Strategic dashboard"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 280 }}
            className="fixed bottom-0 left-1/2 -translate-x-1/2 z-[9985] w-full max-w-[480px] bg-card flex flex-col"
            style={{
              maxHeight: '80vh',
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              boxShadow: '0 -24px 60px hsl(var(--obsidian) / 0.2)',
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

              {/* LL inventory */}
              <section>
                <p className="font-sans text-[9px] uppercase tracking-sovereign text-muted-foreground font-semibold mb-2 px-1">
                  Lightning Lane inventory
                </p>
                <ul className="list-none p-0 m-0 space-y-1.5">
                  {[
                    { ride: 'Haunted Mansion', window: '11:00 – 12:00', status: 'secured' as const },
                    { ride: 'Space Mountain', window: '12:30 – 1:30', status: 'available' as const },
                    { ride: 'Big Thunder', window: '2:45 – 3:45', status: 'queued' as const },
                  ].map((ll) => (
                    <li
                      key={ll.ride}
                      className="flex items-center justify-between px-4 py-3 rounded-xl bg-background/60"
                      style={{ border: '1px solid hsl(var(--obsidian) / 0.04)' }}
                    >
                      <div className="min-w-0">
                        <p className="font-display text-[14px] text-foreground truncate">{ll.ride}</p>
                        <p className="font-sans text-[10px] tabular-nums" style={{ color: 'hsl(var(--slate-plaid))' }}>
                          {ll.window}
                        </p>
                      </div>
                      <span
                        className="shrink-0 font-sans text-[8px] uppercase tracking-sovereign font-bold px-2 py-1 rounded-full"
                        style={{
                          backgroundColor: ll.status === 'secured' ? 'hsl(var(--accent) / 0.15)' : 'hsl(var(--gold) / 0.12)',
                          color: ll.status === 'secured' ? 'hsl(var(--accent))' : 'hsl(var(--gold))',
                        }}
                      >
                        {ll.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

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
