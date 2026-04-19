import { motion, AnimatePresence } from 'framer-motion';
import { Coffee, Utensils, AlertTriangle, RefreshCw } from 'lucide-react';

interface AudibleMenuProps {
  open: boolean;
  onClose: () => void;
  onBreak: () => void;
  onRefuel: () => void;
  onClosure: () => void;
  onReset: () => void;
}

const items = [
  { id: 'break',   label: 'Need a Break',   icon: Coffee },
  { id: 'refuel',  label: 'Refuel (Food)',  icon: Utensils },
  { id: 'closure', label: 'Ride Closure',   icon: AlertTriangle },
  { id: 'reset',   label: 'Reset the Pulse',icon: RefreshCw },
] as const;

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
            <p className="font-sans text-[8px] uppercase tracking-sovereign font-bold text-center mb-4" style={{ color: 'hsl(var(--gold))' }}>
              Call an Audible
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
