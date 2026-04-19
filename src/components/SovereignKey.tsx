import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  User, Bath, TreePine, Mic, Heart, MapPin, RefreshCw,
  Home, Pencil, FileText, Zap, Apple, Frown, Battery, Settings as SettingsIcon,
} from 'lucide-react';
import { useCompanion } from '@/contexts/CompanionContext';

interface SovereignKeyProps {
  onBathroom: () => void;
  onQuietSpace: () => void;
  onMemory: () => void;
  onPulse: () => void;
  onCheckIn: () => void;
  onRecalibrate: () => void;
}

type Mode = 'closed' | 'radial' | 'menu' | 'recovery';

const radialActions = [
  { id: 'checkin', label: "I'm Here", icon: MapPin },
  { id: 'bathroom', label: 'Restroom', icon: Bath },
  { id: 'quiet', label: 'Quiet', icon: TreePine },
  { id: 'memory', label: 'Memory', icon: Mic },
  { id: 'pulse', label: 'Pulse', icon: Heart },
  { id: 'recalibrate', label: 'Pivot', icon: RefreshCw },
] as const;

const recoveryOptions = [
  { id: 'tired', label: 'Tired', icon: Battery, copy: "Let's find a calm spot." },
  { id: 'hungry', label: 'Hungry', icon: Apple, copy: 'Pulling nearby options now.' },
  { id: 'overwhelmed', label: 'Overwhelmed', icon: Frown, copy: 'Easing the schedule.' },
] as const;

const LONG_PRESS_MS = 500;

/**
 * The Sovereign Key — the single OS anchor.
 *
 * - Tap → radial action sheet (6 quick actions)
 * - Long-press → Recovery Pulse (the Audible feature)
 * - Swipe-up → global navigation menu
 */
const SovereignKey = ({
  onBathroom, onQuietSpace, onMemory, onPulse, onCheckIn, onRecalibrate,
}: SovereignKeyProps) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('closed');
  const longPressTimer = useRef<number | null>(null);
  const longPressFired = useRef(false);

  const handlers: Record<string, () => void> = {
    checkin: onCheckIn,
    bathroom: onBathroom,
    quiet: onQuietSpace,
    memory: onMemory,
    pulse: onPulse,
    recalibrate: onRecalibrate,
  };

  const triggerHaptic = (pattern: number | number[] = 10) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(pattern); } catch { /* ignore */ }
    }
  };

  const startPress = useCallback(() => {
    longPressFired.current = false;
    longPressTimer.current = window.setTimeout(() => {
      longPressFired.current = true;
      triggerHaptic([20, 40, 20]);
      setMode('recovery');
    }, LONG_PRESS_MS);
  }, []);

  const endPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleTap = () => {
    if (longPressFired.current) return;
    triggerHaptic(8);
    setMode((m) => (m === 'closed' ? 'radial' : 'closed'));
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y < -40) {
      triggerHaptic(8);
      setMode('menu');
    }
  };

  const close = () => setMode('closed');

  const pickAction = (id: string) => {
    close();
    handlers[id]?.();
  };

  return (
    <>
      {/* Backdrop when any overlay is open */}
      <AnimatePresence>
        {mode !== 'closed' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 bg-foreground/30 z-[9970]"
            style={{ backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
          />
        )}
      </AnimatePresence>

      {/* Radial action sheet — 6 quick actions in a 3x2 grid above the orb */}
      <AnimatePresence>
        {mode === 'radial' && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className="fixed bottom-[112px] left-1/2 -translate-x-1/2 z-[9985] w-[300px] bg-card rounded-2xl shadow-boutique-hover p-4"
          >
            <div className="grid grid-cols-3 gap-2">
              {radialActions.map((a) => {
                const Icon = a.icon;
                return (
                  <motion.button
                    key={a.id}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => pickAction(a.id)}
                    className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-transparent border-none cursor-pointer hover:bg-muted/50 transition-colors min-h-[64px]"
                  >
                    <Icon size={18} className="text-foreground" />
                    <span className="font-sans text-[8px] uppercase tracking-sovereign text-muted-foreground">
                      {a.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recovery Pulse — long-press destination */}
      <AnimatePresence>
        {mode === 'recovery' && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.22 }}
            className="fixed bottom-[112px] left-1/2 -translate-x-1/2 z-[9985] w-[320px] bg-card rounded-2xl shadow-boutique-hover p-5"
          >
            <p className="font-sans text-[8px] uppercase tracking-sovereign text-accent font-bold mb-2">
              Recovery Pulse
            </p>
            <h3 className="font-display text-xl text-foreground mb-4">What's shifting?</h3>
            <div className="grid grid-cols-3 gap-2">
              {recoveryOptions.map((opt) => {
                const Icon = opt.icon;
                return (
                  <motion.button
                    key={opt.id}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => {
                      close();
                      // Map recovery to the closest existing action
                      if (opt.id === 'overwhelmed') onRecalibrate();
                      else if (opt.id === 'tired') onQuietSpace();
                      else onPulse();
                    }}
                    className="flex flex-col items-center gap-2 py-4 rounded-xl bg-muted/40 hover:bg-muted border-none cursor-pointer min-h-[88px]"
                  >
                    <Icon size={20} className="text-foreground" />
                    <span className="font-sans text-[9px] uppercase tracking-sovereign text-foreground font-semibold">
                      {opt.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
            <p className="font-sans text-[10px] text-muted-foreground italic text-center mt-4">
              We'll handle the rest.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global navigation menu — swipe-up destination */}
      <AnimatePresence>
        {mode === 'menu' && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="fixed bottom-[112px] left-1/2 -translate-x-1/2 z-[9985] w-[240px] bg-card rounded-2xl shadow-boutique-hover py-2"
          >
            {[
              { label: 'Home', icon: Home, to: '/home' },
              { label: 'Account', icon: User, to: '/auth' },
              { label: 'Edit Plan', icon: Pencil, to: '/edit-itinerary' },
              { label: 'Joy Report', icon: FileText, to: '/joy-report' },
              { label: 'Settings', icon: SettingsIcon, to: '/settings' },
              { label: 'Upgrades', icon: Zap, to: '/upgrades', accent: true },
            ].map((item, i, arr) => {
              const Icon = item.icon;
              return (
                <div key={item.to}>
                  <button
                    onClick={() => { close(); navigate(item.to); }}
                    className="w-full flex items-center gap-3 px-5 py-3 bg-transparent border-none cursor-pointer text-left hover:bg-muted/50 transition-colors min-h-[44px]"
                  >
                    <Icon size={15} className={item.accent ? 'text-accent' : 'text-foreground'} />
                    <span className="font-sans text-[11px] text-foreground">{item.label}</span>
                  </button>
                  {i < arr.length - 1 && <div className="h-px bg-border mx-4" />}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* The Sovereign Key — gold orb anchored bottom-center */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9990]">
        <motion.button
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          whileTap={{ scale: 0.92 }}
          onPointerDown={startPress}
          onPointerUp={endPress}
          onPointerLeave={endPress}
          onPointerCancel={endPress}
          onClick={handleTap}
          aria-label="Sovereign Key — tap for actions, long-press for Recovery, swipe up for menu"
          className="relative w-16 h-16 rounded-full bg-accent shadow-boutique-hover border-none cursor-pointer flex items-center justify-center touch-none"
          style={{
            background: 'radial-gradient(circle at 30% 30%, hsl(var(--gold)) 0%, hsl(var(--gold) / 0.85) 60%, hsl(var(--sienna) / 0.8) 100%)',
          }}
        >
          {/* Soft pulse ring when closed */}
          {mode === 'closed' && (
            <motion.div
              className="absolute inset-0 rounded-full border border-accent/40"
              animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ repeat: Infinity, duration: 2.4, ease: 'easeOut' }}
            />
          )}
          {/* Center mark */}
          <motion.div
            animate={mode !== 'closed' ? { rotate: 45 } : { rotate: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 220 }}
            className="w-3 h-3 bg-primary"
            style={{ borderRadius: '2px' }}
          />
        </motion.button>
      </div>
    </>
  );
};

export default SovereignKey;
