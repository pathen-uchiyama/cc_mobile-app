import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { INTEREST_POOL, type ReservationInterest } from '@/data/reservationInterests';
import { useCompanion, type ServiceTier } from '@/contexts/CompanionContext';

/**
 * Reservation Watchlist (dining + experiences)
 * --------------------------------------------
 * Mirrors the Lightning Lane watchlist pattern but for table-service ADRs,
 * character meals, dessert parties, tours, and other experience bookings.
 *
 * Lifecycle per entry:
 *   • watching  — pre-selected, countdown to `openAtMin` is running
 *   • alerted   — booking window has opened; explorer must tap to act
 *   • booked    — auto-booked (manager/sovereign) or explorer tapped through
 *   • missed    — alerted state aged past the grace window with no action
 *
 * Tier behavior matches the LL watchlist for consistency:
 *   • sovereign + manager → auto-book on open
 *   • explorer            → "Tap to book" alert only
 */

export interface ReservationWatchEntry {
  interestId: string;
  /** Park-time the watch was added (minutes since midnight). */
  addedAtMin: number;
  /** Park-time the booking window is expected to open. Frozen on add. */
  openAtMin: number;
  status: 'watching' | 'alerted' | 'booked' | 'missed';
}

const STORAGE_KEY = 'reservations.watchlist.v1';
const MISS_GRACE_MIN = 5;
const AUTO_BOOK_TIERS: ServiceTier[] = ['manager', 'sovereign'];

const readStored = (): ReservationWatchEntry[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ReservationWatchEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
};

const writeStored = (entries: ReservationWatchEntry[]): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    /* swallow — quota / private mode */
  }
};

export interface UseReservationWatchlistArgs {
  /** Park-time "now" in minutes-since-midnight. */
  nowMinutes: number;
  /**
   * Called when a watched interest should be auto-booked. Returns true if the
   * booking succeeded; false otherwise so the entry stays in alerted for the
   * guest to retry manually.
   */
  onAutoBook: (interest: ReservationInterest) => boolean;
  /** Side-effect callback for state transitions (toast, haptic). */
  onAlert: (
    interest: ReservationInterest,
    mode: 'auto-book' | 'tap-to-book' | 'auto-book-failed',
  ) => void;
}

export interface UseReservationWatchlistReturn {
  entries: ReservationWatchEntry[];
  isWatching: (interestId: string) => boolean;
  watch: (interestId: string, openAtMin?: number) => void;
  unwatch: (interestId: string) => void;
  dismiss: (interestId: string) => void;
  markBooked: (interestId: string) => void;
  rearm: (interestId: string, openAtMin: number) => void;
  alerted: ReservationWatchEntry[];
}

export const useReservationWatchlist = ({
  nowMinutes,
  onAutoBook,
  onAlert,
}: UseReservationWatchlistArgs): UseReservationWatchlistReturn => {
  const { tier } = useCompanion();
  const [entries, setEntries] = useState<ReservationWatchEntry[]>(() => readStored());

  useEffect(() => {
    writeStored(entries);
  }, [entries]);

  // De-dupe alert firing across re-renders within a session.
  const firedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let mutated = false;
    const next = entries.map((e) => {
      if (e.status !== 'watching') return e;
      if (nowMinutes < e.openAtMin) return e;

      const interest = INTEREST_POOL.find((i) => i.id === e.interestId);
      if (!interest) return e;

      if (firedRef.current.has(e.interestId)) return e;
      firedRef.current.add(e.interestId);

      const shouldAutoBook = AUTO_BOOK_TIERS.includes(tier);
      if (shouldAutoBook) {
        const ok = onAutoBook(interest);
        if (ok) {
          mutated = true;
          onAlert(interest, 'auto-book');
          return { ...e, status: 'booked' as const };
        }
        mutated = true;
        onAlert(interest, 'auto-book-failed');
        return { ...e, status: 'alerted' as const };
      }

      mutated = true;
      onAlert(interest, 'tap-to-book');
      return { ...e, status: 'alerted' as const };
    });

    const aged = next.map((e) => {
      if (e.status !== 'alerted') return e;
      if (nowMinutes - e.openAtMin <= MISS_GRACE_MIN) return e;
      mutated = true;
      return { ...e, status: 'missed' as const };
    });

    if (mutated) setEntries(aged);
    // Driven by clock + tier; entries mutated via setEntries inside.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nowMinutes, tier]);

  const isWatching = useCallback(
    (id: string) => entries.some((e) => e.interestId === id),
    [entries],
  );

  const watch = useCallback(
    (interestId: string, openAtMin?: number) => {
      setEntries((prev) => {
        if (prev.some((e) => e.interestId === interestId)) return prev;
        const fallback =
          openAtMin ??
          INTEREST_POOL.find((i) => i.id === interestId)?.bookingOpensAtMin ??
          nowMinutes;
        return [
          ...prev,
          {
            interestId,
            addedAtMin: nowMinutes,
            openAtMin: fallback,
            status: 'watching' as const,
          },
        ];
      });
    },
    [nowMinutes],
  );

  const unwatch = useCallback((interestId: string) => {
    setEntries((prev) => prev.filter((e) => e.interestId !== interestId));
    firedRef.current.delete(interestId);
  }, []);

  const dismiss = unwatch;

  const markBooked = useCallback((interestId: string) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.interestId === interestId ? { ...e, status: 'booked' as const } : e,
      ),
    );
  }, []);

  const rearm = useCallback((interestId: string, openAtMin: number) => {
    firedRef.current.delete(interestId);
    setEntries((prev) =>
      prev.map((e) =>
        e.interestId === interestId
          ? { ...e, status: 'watching' as const, openAtMin }
          : e,
      ),
    );
  }, []);

  const alerted = useMemo(
    () => entries.filter((e) => e.status === 'alerted'),
    [entries],
  );

  return { entries, isWatching, watch, unwatch, dismiss, markBooked, rearm, alerted };
};