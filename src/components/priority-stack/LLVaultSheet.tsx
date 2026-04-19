import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Clock, Search, Check } from 'lucide-react';

export interface LLRide {
  id: string;
  attraction: string;
  land: string;
  /** Next available LL return window, e.g. "1:15 PM". null = none today. */
  nextWindow: string | null;
  /** Current standby wait. */
  wait?: string;
  /** Already secured. */
  secured?: boolean;
  /** Ride is ILL (paid Individual Lightning Lane). */
  ill?: boolean;
}

interface LLVaultSheetProps {
  open: boolean;
  onClose: () => void;
  rides: LLRide[];
  onSecure: (rideId: string) => void;
}

/**
 * The Lightning Lane Vault — a single surface for managing LL across the
 * entire park, not just the Top 3. Opened from the Hearth dock's Zap glyph
 * or from any "Secure LL" CTA.
 *
 * - Search by ride name
 * - Filter: All · Available · Secured
 * - Inline Secure / Secured pill per row
 */
const LLVaultSheet = ({ open, onClose, rides, onSecure }: LLVaultSheetProps) => {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'available' | 'secured'>('all');

  const filtered = useMemo(() => {
    return rides
      .filter((r) => {
        if (filter === 'available') return !r.secured && r.nextWindow;
        if (filter === 'secured') return r.secured;
        return true;
      })
      .filter((r) => r.attraction.toLowerCase().includes(query.toLowerCase()));
  }, [rides, query, filter]);

  const securedCount = rides.filter((r) => r.secured).length;

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
            aria-label="Lightning Lane Vault"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 280 }}
            className="fixed bottom-[108px] left-1/2 -translate-x-1/2 z-[9985] w-full max-w-[480px] bg-card flex flex-col"
            style={{
              maxHeight: 'calc(82vh - 108px)',
              borderRadius: '16px',
              boxShadow: '0 -24px 60px hsl(var(--obsidian) / 0.18)',
            }}
          >
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-foreground/15" />
            </div>

            <header className="flex items-start justify-between px-6 pt-3 pb-4 shrink-0">
              <div>
                <span className="font-sans text-[9px] uppercase tracking-sovereign font-semibold flex items-center gap-1.5" style={{ color: 'hsl(var(--gold))' }}>
                  <Zap size={10} />
                  Lightning Lane Vault
                </span>
                <h3 className="font-display text-[22px] text-foreground mt-1">
                  Every ride, one surface
                </h3>
                <p className="font-sans text-[11px] text-muted-foreground mt-0.5">
                  {securedCount} secured · {rides.length - securedCount} available
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close vault"
                className="bg-transparent border-none cursor-pointer p-1.5 -mr-1.5"
              >
                <X size={18} className="text-muted-foreground" />
              </button>
            </header>

            {/* Search + filter */}
            <div className="px-5 pb-3 shrink-0 space-y-2">
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-background/70"
                style={{ border: '1px solid hsl(var(--obsidian) / 0.06)' }}
              >
                <Search size={13} className="text-muted-foreground shrink-0" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search any ride…"
                  className="flex-1 bg-transparent border-none outline-none font-sans text-[13px] text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="flex gap-1.5">
                {(['all', 'available', 'secured'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className="px-3 py-1.5 rounded-full font-sans text-[10px] uppercase tracking-sovereign font-semibold cursor-pointer border-none"
                    style={{
                      backgroundColor: filter === f ? 'hsl(var(--gold) / 0.18)' : 'hsl(var(--obsidian) / 0.04)',
                      color: filter === f ? 'hsl(var(--gold))' : 'hsl(var(--slate-plaid))',
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <ol className="list-none p-0 m-0 px-5 pb-8 space-y-2 overflow-y-auto">
              {filtered.length === 0 && (
                <li className="text-center py-8 font-sans italic text-[12px] text-muted-foreground">
                  No rides match.
                </li>
              )}
              {filtered.map((r) => (
                <li
                  key={r.id}
                  className="rounded-2xl bg-background/60 px-4 py-3"
                  style={{ border: '1px solid hsl(var(--obsidian) / 0.04)' }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {r.ill && (
                          <span className="font-sans text-[7px] uppercase tracking-sovereign font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                            ILL
                          </span>
                        )}
                        <span className="font-sans text-[9px] text-muted-foreground">
                          {r.land}
                        </span>
                      </div>
                      <h4 className="font-display text-[15px] leading-tight text-foreground truncate">
                        {r.attraction}
                      </h4>
                      <div className="flex items-center gap-3 mt-1">
                        {r.wait && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock size={9} />
                            <span className="font-sans text-[10px] tabular-nums">{r.wait}</span>
                          </span>
                        )}
                        {r.nextWindow && (
                          <span className="font-sans text-[10px] tabular-nums" style={{ color: 'hsl(var(--gold))' }}>
                            Next: {r.nextWindow}
                          </span>
                        )}
                        {!r.nextWindow && !r.secured && (
                          <span className="font-sans italic text-[10px] text-muted-foreground">
                            No windows today
                          </span>
                        )}
                      </div>
                    </div>
                    {r.secured ? (
                      <span
                        className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-full"
                        style={{ backgroundColor: 'hsl(var(--gold) / 0.18)', color: 'hsl(var(--gold))' }}
                      >
                        <Check size={10} />
                        <span className="font-sans text-[9px] uppercase tracking-sovereign font-bold">
                          Secured
                        </span>
                      </span>
                    ) : (
                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={() => onSecure(r.id)}
                        disabled={!r.nextWindow}
                        className="shrink-0 flex items-center gap-1 px-3 py-1.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                        style={{
                          borderRadius: '12px',
                          border: '1.5px solid hsl(var(--gold))',
                          color: 'hsl(var(--gold))',
                          backgroundColor: 'transparent',
                          minHeight: '36px',
                        }}
                      >
                        <Zap size={11} />
                        <span className="font-sans text-[10px] uppercase tracking-sovereign font-bold">
                          Secure
                        </span>
                      </motion.button>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default LLVaultSheet;
