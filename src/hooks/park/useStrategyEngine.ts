import { useEffect, useState } from 'react';

export type PivotId = 'restroom' | 'refuel' | 'break' | 'rain' | 'reset';
export type PivotBadges = Partial<Record<PivotId, boolean>>;

interface UseStrategyEngineArgs {
  /** Disable when the user is in Minimalist / Sovereign quiet view. */
  enabled?: boolean;
}

/**
 * Mocked strategy engine — flips proactive flags after fixed delays so the
 * UI can demonstrate "the system noticed something." In production this
 * subscribes to weather, party sentiment, queue deltas, etc.
 */
export const useStrategyEngine = ({ enabled = true }: UseStrategyEngineArgs = {}) => {
  const [pivotSuggested, setPivotSuggested] = useState(false);
  const [pivotBadges, setPivotBadges] = useState<PivotBadges>({});
  const [pivotLabel, setPivotLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const heroPulse = setTimeout(() => setPivotSuggested(true), 6000);
    const rainFlag = setTimeout(() => setPivotBadges((b) => ({ ...b, rain: true })), 8000);
    const refuelFlag = setTimeout(() => setPivotBadges((b) => ({ ...b, refuel: true })), 12000);
    return () => {
      clearTimeout(heroPulse);
      clearTimeout(rainFlag);
      clearTimeout(refuelFlag);
    };
  }, [enabled]);

  const clearBadge = (id: PivotId) => setPivotBadges((b) => ({ ...b, [id]: false }));

  /**
   * Run the parchment shimmer for ~1.4s, then execute the side-effect.
   * Mirrors the strategy engine "thinking" before surfacing the new Top 3.
   */
  const pivotWith = (label: string, after: () => void) => {
    setPivotLabel(label);
    window.setTimeout(() => {
      setPivotLabel(null);
      after();
    }, 1400);
  };

  return {
    pivotSuggested,
    setPivotSuggested,
    pivotBadges,
    clearBadge,
    pivotLabel,
    pivotWith,
  };
};
