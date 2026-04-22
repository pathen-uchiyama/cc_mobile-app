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
/**
 * Audible Menu — radial "fan" opened from the Pivot tab.
 *
 * Items pop out one-by-one along an arc that sweeps from straight-left
 * to straight-up above the Pivot tab (rightmost tab in the bottom nav).
 * Tapping the parchment scrim closes the fan.
 */
const AudibleMenu = ({
  open,
  onClose,
  onBreak,
  onRefuel,
  onClosure,
  onReset,
  onRestroom,
}: AudibleMenuProps) => {
  const handlers: Record<string, (() => void) | undefined> = {
    break: onBreak,
    refuel: onRefuel,
    closure: onClosure,
    reset: onReset,
    restroom: onRestroom,
  };

  // Distribute items evenly across the arc.
  const step = (FAN_END_DEG - FAN_START_DEG) / Math.max(1, items.length - 1);

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
            className="fixed inset-0 z-[9970]"
            style={{
              background: 'hsl(var(--parchment) / 0.78)',
              backdropFilter: 'blur(6px) saturate(120%)',
              WebkitBackdropFilter: 'blur(6px) saturate(120%)',
            }}
          />

          {/* Fan anchor — positioned over the Pivot tab.
              Bottom nav is fixed bottom-4, max-w-[448px], 3 evenly-spaced tabs.
              The Pivot tab center sits at ~5/6 of the nav width.
              We render an absolutely-positioned anchor and lay items around it. */}
          <div
            className="fixed inset-x-0 bottom-0 z-[9985] pointer-events-none mx-auto max-w-[448px] px-4"
            style={{ height: '0px' }}
          >
            <div
              className="absolute pointer-events-none"
              style={{
                // Pivot tab center: nav padded px-4 + tabs in a flex row, the
                // 3rd of 3 tab centers is at ~5/6 of the inner width.
                left: '83.3%',
                bottom: '88px',
                width: 0,
                height: 0,
              }}
            >
              {items.map((it, i) => {
                const Icon = it.icon;
                const angleDeg = FAN_START_DEG + step * i;
                const angleRad = (angleDeg * Math.PI) / 180;
                const x = Math.cos(angleRad) * FAN_RADIUS;
                const y = Math.sin(angleRad) * FAN_RADIUS;

                return (
                  <motion.button
                    key={it.id}
                    initial={{ opacity: 0, x: 0, y: 0, scale: 0.4 }}
                    animate={{ opacity: 1, x, y, scale: 1 }}
                    exit={{ opacity: 0, x: 0, y: 0, scale: 0.4 }}
                    transition={{
                      type: 'spring',
                      damping: 18,
                      stiffness: 240,
                      delay: i * 0.04,
                    }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => {
                      onClose();
                      handlers[it.id]?.();
                    }}
                    aria-label={it.label}
                    className="absolute pointer-events-auto flex flex-col items-center justify-center gap-1 rounded-full bg-card border-none cursor-pointer"
                    style={{
                      width: '64px',
                      height: '64px',
                      // y is positive-down in screen space; framer-motion x/y
                      // are added to the element's natural position. We anchor
                      // the button so its center sits at (x, y) relative to anchor.
                      marginLeft: '-32px',
                      marginTop: '-32px',
                      boxShadow:
                        '0 12px 28px hsl(var(--obsidian) / 0.18), 0 0 0 1.5px hsl(var(--gold))',
                      color: 'hsl(var(--gold))',
                    }}
                  >
                    <Icon size={20} />
                    <span className="font-sans text-[8px] uppercase font-bold tracking-widest">
                      {it.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AudibleMenu;
