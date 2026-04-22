import { motion, AnimatePresence } from 'framer-motion';
import { Coffee, Utensils, CloudRain, RefreshCw, Bath, ChevronRight } from 'lucide-react';

interface AudibleMenuProps {
  open: boolean;
  onClose: () => void;
  onBreak: () => void;
  onRefuel: () => void;
  onClosure: () => void;
  onReset: () => void;
  onRestroom?: () => void;
  /**
   * Per-action attention flags. When true, the matching row gets a magenta
   * dot to mirror the nav-level "needs attention" treatment.
   * Keys match item ids: 'restroom' | 'refuel' | 'break' | 'closure' | 'reset'.
   */
  attention?: Partial<Record<'restroom' | 'refuel' | 'break' | 'closure' | 'reset', boolean>>;
}

const items = [
  { id: 'restroom', label: 'Restroom',     hint: 'Nearest quiet stall',          icon: Bath },
  { id: 'refuel',   label: 'Meals',        hint: 'Snack or sit-down nearby',     icon: Utensils },
  { id: 'break',    label: 'Need a Break', hint: 'Find shade and a calm spot',   icon: Coffee },
  { id: 'closure',  label: 'Rain Pivot',   hint: 'Indoor swap suggestions',      icon: CloudRain },
  { id: 'reset',    label: 'Reset Strategy', hint: 'Re-rank the day from scratch', icon: RefreshCw },
] as const;

/**
 * Pivot menu — opened from the Pivot tab.
 *
 * Vertical, anchored card above the bottom nav. Replaces the earlier radial
 * fan because the chips overlapped at smaller viewports and tap targets
 * sometimes fell behind the nav. List rows give comfortable 56px hit areas
 * and clear hierarchy.
 */
const AudibleMenu = ({
  open,
  onClose,
  onBreak,
  onRefuel,
  onClosure,
  onReset,
  onRestroom,
  attention,
}: AudibleMenuProps) => {
  const handlers: Record<string, (() => void) | undefined> = {
    break: onBreak,
    refuel: onRefuel,
    closure: onClosure,
    reset: onReset,
    restroom: onRestroom,
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Parchment scrim — tap to dismiss */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[9995]"
            style={{
              background: 'hsl(var(--parchment) / 0.78)',
              backdropFilter: 'blur(6px) saturate(120%)',
              WebkitBackdropFilter: 'blur(6px) saturate(120%)',
            }}
          />

          {/* Anchored card — sits above the bottom nav (nav z=9998). */}
          <motion.aside
            role="dialog"
            aria-label="Pivot the day"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: 'spring', damping: 24, stiffness: 280 }}
            className="fixed bottom-[100px] left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[400px] bg-card rounded-2xl flex flex-col z-[9999]"
            style={{
              maxHeight: '70vh',
              boxShadow:
                '0 24px 60px hsl(var(--obsidian) / 0.22), 0 0 0 1px hsl(var(--gold) / 0.2)',
            }}
          >
            <header className="px-5 pt-5 pb-3 shrink-0">
              <p
                className="font-sans text-[8px] uppercase tracking-sovereign font-bold mb-1"
                style={{ color: 'hsl(var(--gold))' }}
              >
                The Sovereign's Choice
              </p>
              <h3 className="font-display text-[18px] text-foreground leading-tight">
                Pivot the strategy with a single tap.
              </h3>
            </header>

            <ul className="list-none p-3 m-0 space-y-1 overflow-y-auto">
              {items.map((it) => {
                const Icon = it.icon;
                const needsAttention = !!attention?.[it.id as keyof NonNullable<typeof attention>];
                return (
                  <li key={it.id}>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        onClose();
                        handlers[it.id]?.();
                      }}
                      aria-label={`${it.label}${needsAttention ? ' (needs attention)' : ''}`}
                      className="relative w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-transparent border-none cursor-pointer text-left transition-colors hover:bg-accent/5"
                      style={{ minHeight: '56px' }}
                    >
                      <span
                        className="relative shrink-0 flex items-center justify-center rounded-full"
                        style={{
                          width: '36px',
                          height: '36px',
                          background: 'hsl(var(--gold) / 0.12)',
                          color: 'hsl(var(--gold))',
                          boxShadow: '0 0 0 1px hsl(var(--gold) / 0.35)',
                        }}
                      >
                        <Icon size={18} />
                        {needsAttention && (
                          <span
                            aria-hidden
                            className="absolute -top-0.5 -right-0.5 rounded-full"
                            style={{
                              width: '10px',
                              height: '10px',
                              background: 'hsl(316 95% 45%)',
                              boxShadow:
                                '0 0 0 2px hsl(var(--card)), 0 0 8px hsl(316 95% 55% / 0.6)',
                            }}
                          />
                        )}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-display text-[14px] leading-tight text-foreground">
                          {it.label}
                        </p>
                        <p
                          className="font-sans text-[10px] mt-0.5"
                          style={{ color: 'hsl(var(--slate-plaid))' }}
                        >
                          {it.hint}
                        </p>
                      </div>
                      <ChevronRight
                        size={16}
                        className="shrink-0"
                        style={{ color: 'hsl(var(--gold))' }}
                      />
                    </motion.button>
                  </li>
                );
              })}
            </ul>

            <button
              type="button"
              onClick={onClose}
              className="shrink-0 m-3 mt-1 rounded-xl py-2.5 bg-transparent border cursor-pointer font-sans text-[10px] uppercase tracking-sovereign font-bold"
              style={{
                borderColor: 'hsl(var(--obsidian) / 0.1)',
                color: 'hsl(var(--slate-plaid))',
              }}
            >
              Close
            </button>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default AudibleMenu;
