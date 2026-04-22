import { motion, AnimatePresence } from 'framer-motion';
import { Coffee, Utensils, CloudRain, RefreshCw, Bath } from 'lucide-react';

interface AudibleMenuProps {
  open: boolean;
  onClose: () => void;
  onBreak: () => void;
  onRefuel: () => void;
  onClosure: () => void;
  onReset: () => void;
  onRestroom?: () => void;
}

/**
 * Fan menu items. Order matters — they radiate counter-clockwise from the
 * Pivot tab in the bottom nav (rightmost tab). First item sits closest to
 * straight-up, last item closest to horizontal-left.
 */
const items = [
  { id: 'restroom', label: 'Restroom',    icon: Bath },
  { id: 'refuel',   label: 'Meals',       icon: Utensils },
  { id: 'break',    label: 'Break',       icon: Coffee },
  { id: 'closure',  label: 'Rain',        icon: CloudRain },
  { id: 'reset',    label: 'Reset',       icon: RefreshCw },
] as const;

/** Radius of the fan in pixels — distance from the Pivot tab anchor. */
const FAN_RADIUS = 110;
/** Angular sweep of the fan in degrees, opening up-and-to-the-left from the Pivot tab. */
const FAN_START_DEG = 180; // straight left
const FAN_END_DEG = 270;   // straight up

/**
 * Audible Menu — opened from the Sovereign Anchor.
 *
 * 4 secondary actions in a 2x2 grid.
 * Buttons are Burnished Gold OUTLINES (secondary action language).
 */
const AudibleMenu = ({ open, onClose, onBreak, onRefuel, onClosure, onReset }: AudibleMenuProps) => {
  const handlers: Record<string, () => void> = {
    break: onBreak, refuel: onRefuel, closure: onClosure, reset: onReset,
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Semi-transparent Aged Parchment overlay — not a new page */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[9970]"
            style={{
              background: 'hsl(var(--parchment) / 0.82)',
              backdropFilter: 'blur(8px) saturate(120%)',
              WebkitBackdropFilter: 'blur(8px) saturate(120%)',
            }}
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-[112px] left-1/2 -translate-x-1/2 z-[9985] w-[320px] bg-card/95 rounded-2xl"
            style={{
              padding: '24px',
              boxShadow: '0 24px 60px hsl(var(--obsidian) / 0.2)',
              border: '1px solid hsl(var(--gold) / 0.18)',
            }}
          >
            <p className="font-sans text-[8px] uppercase tracking-sovereign font-bold text-center mb-1" style={{ color: 'hsl(var(--gold))' }}>
              The Sovereign's Choice
            </p>
            <p className="font-sans italic text-[11px] text-center mb-4" style={{ color: 'hsl(var(--slate-plaid))' }}>
              Pivot the strategy with a single tap.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {items.map((it) => {
                const Icon = it.icon;
                return (
                  <motion.button
                    key={it.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { onClose(); handlers[it.id](); }}
                    className="flex flex-col items-center justify-center gap-2 py-5 rounded-2xl bg-transparent cursor-pointer min-h-[88px] transition-colors hover:bg-accent/5"
                    style={{
                      border: '1.5px solid hsl(var(--gold))',
                      color: 'hsl(var(--gold))',
                    }}
                  >
                    <Icon size={20} />
                    <span className="font-sans text-[10px] uppercase tracking-sovereign font-semibold">
                      {it.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AudibleMenu;
