import { motion, useReducedMotion } from 'framer-motion';
import { Coffee, Utensils, CloudRain, RefreshCw, Bath, type LucideIcon } from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';

export interface PivotAction {
  id: 'restroom' | 'refuel' | 'break' | 'rain' | 'reset';
  label: string;
  icon: LucideIcon;
  onTap: () => void;
  /** When true, a Burnished Gold dot pulses on the icon — strategy engine flag. */
  badge?: boolean;
}

interface HearthDockProps {
  /** Tap handler for the Sovereign Key (centered Gold anchor). */
  onSovereignTap: () => void;
  /** Whether a Sovereign sheet is currently open (suppresses idle pulse + rotates the mark). */
  active?: boolean;
  /** Pivot quick-actions (icons) flanking the Key. */
  onRestroom?: () => void;
  onRefuel?: () => void;
  onBreak?: () => void;
  onRain?: () => void;
  onReset?: () => void;
  /** Per-pivot proactive-suggestion flags from the strategy engine. */
  badges?: Partial<Record<PivotAction['id'], boolean>>;
}

/**
 * The Hearth — floating Obsidian navigation dock.
 *
 * Deep Obsidian pill anchored at the bottom with the Burnished Gold
 * Sovereign Key centered as the OS anchor. Flanked by pivot quick-actions:
 *   Left  — Restroom, Refuel
 *   Right — Break, Rain, Reset
 *
 * These are the primary "call an audible" surface and mirror the Audible
 * Menu for one-tap access.
 */
const HearthDock = ({
  onSovereignTap,
  active,
  onRestroom,
  onRefuel,
  onBreak,
  onRain,
  onReset,
  badges = {},
}: HearthDockProps) => {
  const { fire } = useHaptics();
  const reduceMotion = useReducedMotion();

  const handleSovereign = () => {
    fire('tap');
    onSovereignTap();
  };

  const handlePivot = (cb?: () => void) => () => {
    fire('tap');
    cb?.();
  };

  const left: PivotAction[] = [
    { id: 'restroom', label: 'Restroom', icon: Bath, onTap: handlePivot(onRestroom), badge: !!badges.restroom },
    { id: 'refuel', label: 'Refuel', icon: Utensils, onTap: handlePivot(onRefuel), badge: !!badges.refuel },
  ];
  const right: PivotAction[] = [
    { id: 'break', label: 'Need a Break', icon: Coffee, onTap: handlePivot(onBreak), badge: !!badges.break },
    { id: 'rain', label: 'Rain Pivot', icon: CloudRain, onTap: handlePivot(onRain), badge: !!badges.rain },
    { id: 'reset', label: 'Reset Strategy', icon: RefreshCw, onTap: handlePivot(onReset), badge: !!badges.reset },
  ];

  return (
    <nav
      aria-label="Sovereign navigation"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[min(440px,calc(100vw-16px))]"
      style={{ zIndex: 'var(--z-dock)' }}
    >
      <div
        className="relative h-[64px] flex items-center justify-between px-3"
        style={{
          backgroundColor: 'hsl(var(--obsidian))',
          borderRadius: '16px',
          boxShadow:
            '0 18px 48px hsl(var(--obsidian) / 0.32), 0 0 0 1px hsl(var(--obsidian) / 0.6)',
        }}
      >
        {/* Left pivots */}
        <div className="flex items-center gap-0.5">
          {left.map((p) => (
            <PivotButton key={p.id} action={p} />
          ))}
        </div>

        {/* Spacer for the centered Key */}
        <div className="w-[60px]" aria-hidden />

        {/* Right pivots */}
        <div className="flex items-center gap-0.5">
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
            {!active && !reduceMotion && (
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
      aria-label={action.badge ? `${action.label} — suggested` : action.label}
      title={action.label}
      className="relative w-10 h-10 flex items-center justify-center bg-transparent border-none cursor-pointer rounded-full"
      style={{ color: 'hsl(var(--parchment))' }}
    >
      <Icon size={18} strokeWidth={1.9} />
      {action.badge && (
        <motion.span
          aria-hidden
          className="absolute top-1.5 right-1.5 block rounded-full"
          style={{
            width: '7px',
            height: '7px',
            background: 'hsl(var(--gold))',
            boxShadow: '0 0 0 2px hsl(var(--obsidian)), 0 0 8px hsl(var(--gold) / 0.7)',
          }}
          {...(useReducedMotion()
            ? {}
            : {
                animate: { opacity: [1, 0.45, 1], scale: [1, 1.18, 1] },
                transition: { repeat: Infinity, duration: 1.8, ease: 'easeInOut' as const },
              })}
        />
      )}
    </motion.button>
  );
};

export default HearthDock;
