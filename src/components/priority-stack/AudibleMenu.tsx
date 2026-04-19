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
 * The Audible Menu — opened by tapping the Sovereign Key.
 *
 * 4 buttons in a 2x2 grid, all in the bottom thumb-zone.
 * Consistent 16px corners, no flat edges.
 */
const AudibleMenu = ({ open, onClose, onBreak, onRefuel, onClosure, onReset }: AudibleMenuProps) => {
  const handlers: Record<string, () => void> = {
    break: onBreak, refuel: onRefuel, closure: onClosure, reset: onReset,
  };

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
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-[112px] left-1/2 -translate-x-1/2 z-[9985] w-[320px] bg-card rounded-2xl p-4"
            style={{ boxShadow: '0 24px 60px hsl(var(--obsidian) / 0.2)' }}
          >
            <p className="font-sans text-[8px] uppercase tracking-sovereign text-muted-foreground font-bold text-center mb-3">
              Call an Audible
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {items.map((it) => {
                const Icon = it.icon;
                return (
                  <motion.button
                    key={it.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { onClose(); handlers[it.id](); }}
                    className="flex flex-col items-center justify-center gap-2 py-5 rounded-2xl bg-muted/40 hover:bg-muted border-none cursor-pointer min-h-[88px]"
                  >
                    <Icon size={20} className="text-foreground" />
                    <span className="font-sans text-[10px] uppercase tracking-sovereign text-foreground font-semibold">
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
