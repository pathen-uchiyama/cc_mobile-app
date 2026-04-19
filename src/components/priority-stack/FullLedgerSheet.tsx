import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Clock, Check } from 'lucide-react';

interface LedgerItem {
  id: string;
  rank: 'now' | 'next' | 'later';
  time: string;
  attraction: string;
  location: string;
  logic: string;
  wait?: string;
  llSecured?: boolean;
}

interface FullLedgerSheetProps {
  open: boolean;
  onClose: () => void;
  items: LedgerItem[];
  /** Inline LL action — fires when the user taps "Secure" on any row. */
  onSecureLL?: (itemId: string) => void;
  /** Optional escape hatch to the global LL Vault for ANY ride in the park. */
  onOpenVault?: () => void;
}

/**
 * Full Ledger — bottom sheet revealed on demand.
 *
 * Holds every plan item beyond the Hero + 2 Horizon peeks.
 * Hidden by default. Opened from the "View full plan" link
 * beneath the Horizon stack.
 */
const FullLedgerSheet = ({ open, onClose, items, onSecureLL, onOpenVault }: FullLedgerSheetProps) => {
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
            aria-label="Full plan ledger"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 280 }}
            className="fixed bottom-[108px] left-1/2 -translate-x-1/2 z-[9985] w-full max-w-[480px] bg-card flex flex-col"
            style={{
              maxHeight: 'calc(78vh - 108px)',
              borderRadius: '16px',
              boxShadow: '0 -24px 60px hsl(var(--obsidian) / 0.18)',
            }}
          >
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-foreground/15" />
            </div>

            <header className="flex items-start justify-between px-6 pt-3 pb-3 shrink-0">
              <div>
                <span className="font-sans text-[9px] uppercase tracking-sovereign text-muted-foreground font-semibold">
                  The Full Ledger
                </span>
                <h3 className="font-display text-[22px] text-foreground mt-1">
                  Today's complete plan
                </h3>
              </div>
              <button
                onClick={onClose}
                aria-label="Close ledger"
                className="bg-transparent border-none cursor-pointer p-1.5 -mr-1.5"
              >
                <X size={18} className="text-muted-foreground" />
              </button>
            </header>

            <ol className="list-none p-0 m-0 px-5 pb-8 space-y-2 overflow-y-auto">
              {items.map((it) => (
                <li
                  key={it.id}
                  className="rounded-2xl bg-background/60 px-4 py-3"
                  style={{ border: '1px solid hsl(var(--obsidian) / 0.04)' }}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-sans text-[8px] uppercase tracking-sovereign font-bold tabular-nums" style={{ color: 'hsl(var(--slate-plaid))' }}>
                      {it.rank} · {it.time}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {it.llSecured && (
                        <span
                          className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: 'hsl(var(--gold) / 0.15)', color: 'hsl(var(--gold))' }}
                        >
                          <Check size={9} />
                          <span className="font-sans text-[8px] uppercase tracking-sovereign font-bold">
                            LL Secured
                          </span>
                        </span>
                      )}
                      {it.wait && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Clock size={9} />
                          <span className="font-sans text-[10px] tabular-nums">{it.wait}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <h4 className="font-display text-[16px] leading-tight text-foreground">
                    {it.attraction}
                  </h4>
                  <p className="font-sans text-[10px] text-muted-foreground mt-0.5">
                    {it.location}
                  </p>
                  <p className="font-sans italic text-[11px] text-foreground/70 mt-1.5 leading-snug">
                    {it.logic}
                  </p>
                </li>
              ))}
            </ol>

            {/* Footer note — explains why there are no Secure buttons here */}
            <p
              className="font-sans italic text-[11px] text-center px-6 pb-5 shrink-0 leading-snug"
              style={{ color: 'hsl(var(--slate-plaid))' }}
            >
              Lightning Lanes appear as Strategic Windows when the system finds a path
              that fits your day — never as a list to grab from.
            </p>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default FullLedgerSheet;
