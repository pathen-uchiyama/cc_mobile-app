import { useCallback } from 'react';
import { useCompanion } from '@/contexts/CompanionContext';

/**
 * Haptic patterns for the Sovereign OS.
 *
 * - `recommendation` — a double pulse: a new strategic opportunity has surfaced.
 * - `bookingSuccess` — a single long pulse: an automated booking landed cleanly.
 * - `tap` — light tactile confirmation for primary taps.
 * - `selection` — gentle 8ms pulse for menu/option changes.
 *
 * Falls back gracefully when the device or browser does not support `navigator.vibrate`.
 */
export const HAPTIC_PATTERNS = {
  /** Double pulse — new recommendation lands. */
  recommendation: [40, 80, 40] as const,
  /** Single long pulse — confirmed automated booking. */
  bookingSuccess: 220 as const,
  /** Light tap — primary CTA confirmation. */
  tap: 12 as const,
  /** Selection / menu change. */
  selection: 8 as const,
} as const;

type HapticName = keyof typeof HAPTIC_PATTERNS;

export const useHaptics = () => {
  const { hapticsEnabled } = useCompanion();

  const fire = useCallback(
    (name: HapticName) => {
      if (!hapticsEnabled) return;
      if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return;
      try {
        const pattern = HAPTIC_PATTERNS[name];
        navigator.vibrate(pattern as number | number[]);
      } catch {
        /* swallow — haptics are best-effort */
      }
    },
    [hapticsEnabled],
  );

  return { fire };
};

export default useHaptics;
