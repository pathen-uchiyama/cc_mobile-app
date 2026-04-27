import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  INITIAL_HOLDS,
  DEFAULT_CAPACITY,
  summarizeCapacity,
  type HeldLL,
  type CapacitySummary,
} from '@/data/lightningLanes';

/**
 * LightningLaneProvider
 * ---------------------
 * Single source of truth for the guest's held Lightning Lanes and the
 * shared park-time clock. Lifting `holds` out of /book-ll is what makes
 * the LL alert banner on /park stay aligned across navigation: a hold
 * added on the booking surface is immediately visible to the InPark
 * focus card on return, and a redeem-ready tap-in window keeps ticking
 * down whether the guest is on /park or anywhere else in the app.
 *
 * The clock advances at the same accelerated rate used elsewhere in the
 * prototype so countdowns remain demoable in a single session.
 */

/** Mock park-time anchor — 10:45 AM, matches the existing /park mock. */
const INITIAL_NOW_MINUTES = 10 * 60 + 45;
/** Accelerated tick so countdowns visibly progress in a demo session. */
const TICK_MIN_PER_SEC = 0.5;

interface LightningLaneContextValue {
  /** Held Lightning Lane bookings (standard + ILL). */
  holds: HeldLL[];
  /** Append a freshly-booked hold. */
  addHold: (hold: HeldLL) => void;
  /** Mutate a single hold by id (used to mark redeemed). */
  updateHold: (id: string, patch: Partial<HeldLL>) => void;
  /** Live park-time in minutes-since-midnight. */
  nowMinutes: number;
  /** Capacity summary derived from holds + clock. */
  summary: CapacitySummary;
}

const LightningLaneContext = createContext<LightningLaneContextValue | null>(null);

export const LightningLaneProvider = ({ children }: { children: ReactNode }) => {
  const [holds, setHolds] = useState<HeldLL[]>(INITIAL_HOLDS);
  const [nowMinutes, setNowMinutes] = useState<number>(INITIAL_NOW_MINUTES);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNowMinutes((n) => n + TICK_MIN_PER_SEC);
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const addHold = useCallback((hold: HeldLL) => {
    setHolds((prev) => [...prev, hold]);
  }, []);

  const updateHold = useCallback((id: string, patch: Partial<HeldLL>) => {
    setHolds((prev) => prev.map((h) => (h.id === id ? { ...h, ...patch } : h)));
  }, []);

  const summary = useMemo(
    () => summarizeCapacity(holds, nowMinutes, DEFAULT_CAPACITY),
    [holds, nowMinutes],
  );

  const value = useMemo<LightningLaneContextValue>(
    () => ({ holds, addHold, updateHold, nowMinutes, summary }),
    [holds, addHold, updateHold, nowMinutes, summary],
  );

  return (
    <LightningLaneContext.Provider value={value}>{children}</LightningLaneContext.Provider>
  );
};

export const useLightningLane = (): LightningLaneContextValue => {
  const ctx = useContext(LightningLaneContext);
  if (!ctx) {
    throw new Error('useLightningLane must be used within a LightningLaneProvider');
  }
  return ctx;
};