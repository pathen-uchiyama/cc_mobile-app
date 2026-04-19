import { motion } from 'framer-motion';
import { Coffee, Utensils, CloudRain, RefreshCw, type LucideIcon } from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';

export interface PivotAction {
  id: 'break' | 'refuel' | 'rain' | 'reset';
  label: string;
  icon: LucideIcon;
  onTap: () => void;
}

interface HearthDockProps {
  /** Tap handler for the Sovereign Key (centered Gold anchor). */
  onSovereignTap: () => void;
  /** Whether a Sovereign sheet is currently open (suppresses idle pulse + rotates the mark). */
  active?: boolean;
  /** Pivot quick-actions (icons) flanking the Key — 2 on each side. */
  onBreak?: () => void;
  onRefuel?: () => void;
  onRain?: () => void;
  onReset?: () => void;
}

/**
 * The Hearth — floating Obsidian navigation dock.
 *
 * Deep Obsidian pill anchored at the bottom with the Burnished Gold
 * Sovereign Key centered as the OS anchor. Flanked by FOUR pivot
 * quick-actions (Break, Refuel, Rain, Reset) — these are the primary
 * "call an audible" surface and mirror what's inside the Audible Menu
 * for one-tap access.
 */
const HearthDock = ({
  onSovereignTap,
  active,
  onBreak,
  onRefuel,
  onRain,
  onReset,
}: HearthDockProps) => {
  const { fire } = useHaptics();

  const handleSovereign = () => {
    fire('tap');
    onSovereignTap();
  };

  const handlePivot = (cb?: () => void) => () => {
    fire('tap');
    cb?.();
  };

  const left: PivotAction[] = [
    { id: 'break', label: 'Need a Break', icon: Coffee, onTap: handlePivot(onBreak) },
    { id: 'refuel', label: 'Refuel', icon: Utensils, onTap: handlePivot(onRefuel) },
  ];
  const right: PivotAction[] = [
    { id: 'rain', label: 'Rain Pivot', icon: CloudRain, onTap: handlePivot(onRain) },
    { id: 'reset', label: 'Reset Strategy', icon: RefreshCw, onTap: handlePivot(onReset) },
  ];

  return (
    <nav
      aria-label="Sovereign navigation"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9990] w-[min(420px,calc(100vw-24px))]"
    >
      <div
        className="relative h-[64px] flex items-center justify-between px-4"
        style={{
          backgroundColor: 'hsl(var(--obsidian))',
          borderRadius: '16px',
          boxShadow:
            '0 18px 48px hsl(var(--obsidian) / 0.32), 0 0 0 1px hsl(var(--obsidian) / 0.6)',
        }}
      >
        {/* Left pivots */}
        <div className="flex items-center gap-1">
          {left.map((p) => (
            <PivotButton key={p.id} action={p} />
          ))}
        </div>

        {/* Spacer for the centered Key */}
        <div className="w-[60px]" aria-hidden />

        {/* Right pivots */}
        <div className="flex items-center gap-1">
          {right.map((p) => (
            <PivotButton key={p.id} action={p} />
          ))}
        </div>

        {/* The Sovereign Key — centered, elevated above the dock */}
        <div className="absolute left-1/2 -top-5 -translate-x-1/2">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleSovereign}
            aria-label="Sovereign Key — open audible menu"
            className="relative w-[56px] h-[56px] rounded-full border-none cursor-pointer flex items-center justify-center"
            style={{
              background:
                'radial-gradient(circle at 30% 30%, hsl(var(--gold) / 1) 0%, hsl(var(--gold) / 0.92) 55%, hsl(41 64% 24%) 100%)',
              boxShadow:
                '0 12px 28px hsl(var(--obsidian) / 0.45), 0 0 0 3px hsl(var(--obsidian)), 0 0 0 4px hsl(var(--gold) / 0.4)',
            }}
          >
            {!active && (
              <motion.span
                aria-hidden
                className="absolute inset-0 rounded-full"
                style={{ border: '1px solid hsl(var(--gold) / 0.5)' }}
                animate={{ scale: [1, 1.35, 1], opacity: [0.7, 0, 0.7] }}
                transition={{ repeat: Infinity, duration: 2.6, ease: 'easeOut' }}
              />
            )}
            <motion.span
              aria-hidden
              animate={active ? { rotate: 45 } : { rotate: 0 }}
              transition={{ type: 'spring', damping: 18, stiffness: 220 }}
              className="block w-[10px] h-[10px]"
              style={{ backgroundColor: 'hsl(var(--obsidian))', borderRadius: '2px' }}
            />
          </motion.button>
        </div>
      </div>
    </nav>
  );
};

const PivotButton = ({ action }: { action: PivotAction }) => {
  const Icon = action.icon;
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={action.onTap}
      aria-label={action.label}
      title={action.label}
      className="w-11 h-11 flex items-center justify-center bg-transparent border-none cursor-pointer rounded-full"
      style={{ color: 'hsl(var(--gold) / 0.85)' }}
    >
      <Icon size={18} strokeWidth={1.6} />
    </motion.button>
  );
};

export default HearthDock;
