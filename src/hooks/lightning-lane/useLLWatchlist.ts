import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LL_INVENTORY, type LLAttraction } from '@/data/lightningLanes';
import { useCompanion, type ServiceTier } from '@/contexts/CompanionContext';

/**
 * Lightning Lane Watchlist
 * ------------------------
 * The guest "pre-selects" lanes they want booked the moment a slot opens.
 * What "opens" means depends on the lane:
 *
 *   • For lanes that are *currently locked* because the user is at their
 *     held-cap or in the post-booking gap, "open" = the moment
 *     `summary.canBookLLNow` becomes true. The lock is global (capacity)
 *     so we simply watch the unlock countdown.
 *
 *   • For lanes whose `nextWindow` is in the future and the user wants to
 *     queue up *that* window the second it becomes bookable, we watch the
 *     wall clock against the per-lane window-opens time.
 *
 * For this prototype we treat the global capacity-unlock as the trigger and
 * compare each watched lane's stored "openAtMin" against an in-memory
 * `now()` tick. Real production would subscribe to a server event.
 *
 * Tier behavior (per product decision):
 *   • sovereign + manager — auto-book the moment the window opens, surface
 *     a confirmation toast.
 *   • explorer — surface a "Tap to book" alert; never books on its own.
 */

export interface WatchEntry {
  attractionId: string;
  /** Park-time (minutes since midnight) when the watch was added. */
  addedAtMin: number;
  /**
   * Park-time when the lane is expected to become bookable. For capacity
   * locks this is `now + llUnlocksInMin` snapshotted at add-time; for
   * future windows it's the window's own opens-time. Frozen on add so the
   * UI shows a stable countdown.
   */
  openAtMin: number;
  /**
   * Lifecycle:
   *   • watching  — countdown active, nothing has fired yet
   *   • alerted   — the open moment hit; for explorer this is the resting
   *                 "Tap to book" state. The guest must act.
   *   • booked    — auto-booked (manager/sovereign) or the guest tapped
   *                 through. Stays in the list briefly so the UI can show
   *                 the success state, then is cleaned up by `dismiss`.
   *   • missed    — the open moment passed >5min ago without action
   *                 (explorer who didn't tap). Sinks to the bottom and is
   *                 dimmed so the guest can re-arm or dismiss.
   */
  status: 'watching' | 'alerted' | 'booked' | 'missed';
}

const STORAGE_KEY = 'll.watchlist.v1';

const readStored = (): WatchEntry[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as WatchEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
};

const writeStored = (entries: WatchEntry[]): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    /* swallow — quota / private mode */
  }
};

/** How long after `openAtMin` an un-acted alert ages into "missed". */
const MISS_GRACE_MIN = 5;

/** Tiers that should auto-book the moment a window opens. */
const AUTO_BOOK_TIERS: ServiceTier[] = ['manager', 'sovereign'];

export interface UseLLWatchlistArgs {
  /** Park-time "now" in minutes-since-midnight. Driven by the page so the
   *  hook plays nicely with the same mocked clock the rest of /book-ll uses. */
  nowMinutes: number;
  /** Whether the guest can currently book a standard LL — gates auto-book
   *  attempts so we never fire while still capped. */
  canBookNow: boolean;
  /** Called when a watched lane should be auto-booked. Returns true if the
   *  booking succeeded (capacity, etc.); false otherwise so we leave the
   *  entry in the alerted state for the guest to retry manually. */
  onAutoBook: (attraction: LLAttraction) => boolean;
  /** Called once per state transition into 'alerted' so the page can fire
   *  a toast, haptic, etc. The hook itself never imports sonner so it stays
   *  free of UI dependencies. */
  onAlert: (
    attraction: LLAttraction,
    mode: 'auto-book' | 'tap-to-book' | 'auto-book-failed',
  ) => void;
}

export interface UseLLWatchlistReturn {
  entries: WatchEntry[];
  isWatching: (attractionId: string) => boolean;
  /** Add a lane to the watchlist. `openAtMin` should be the park-time the
   *  lane is expected to become bookable; if omitted, defaults to `now`
   *  (i.e. the lane is currently bookable but the guest wants to be
   *  reminded — used rarely). */
  watch: (attractionId: string, openAtMin?: number) => void;
  unwatch: (attractionId: string) => void;
  /** Clear an `alerted` entry once the guest has acted on it (or any
   *  entry, regardless of status, when the guest dismisses it). */
  dismiss: (attractionId: string) => void;
  /** Manually mark an entry as booked — used by the explorer flow when the
   *  guest taps the alert through to a successful booking. */
  markBooked: (attractionId: string) => void;
  /** Re-arm a missed entry by snapshotting a fresh `openAtMin`. */
  rearm: (attractionId: string, openAtMin: number) => void;
  /** Currently active "openings" — entries whose status === 'alerted'. */
  alerted: WatchEntry[];
}

export const useLLWatchlist = ({
  nowMinutes,
  canBookNow,
  onAutoBook,
  onAlert,
}: UseLLWatchlistArgs): UseLLWatchlistReturn => {
  const { tier } = useCompanion();
  const [entries, setEntries] = useState<WatchEntry[]>(() => readStored());

  // Persist on every change. localStorage is durable across reloads which
  // matches user expectation: "I told it to watch, it should still be
  // watching when I come back".
  useEffect(() => {
    writeStored(entries);
  }, [entries]);

  // Track which entries we've already fired callbacks for in this session
  // so a re-render with the same `nowMinutes` doesn't re-fire alerts.
  // Keyed by attractionId.
  const firedRef = useRef<Set<string>>(new Set());

  // Window-opens detector. Runs on every tick of `nowMinutes`.
  useEffect(() => {
    let mutated = false;
    const next = entries.map((e) => {
      // Only "watching" entries can transition to "alerted". Re-arm clears
      // the fired marker so a re-armed entry can fire again.
      if (e.status !== 'watching') return e;
      if (nowMinutes < e.openAtMin) return e;

      // Window has opened. Fire the right side-effect for the tier.
      const attraction = LL_INVENTORY.find((a) => a.id === e.attractionId);
      if (!attraction) return e; // inventory drift — leave the entry alone

      if (firedRef.current.has(e.attractionId)) return e;
      firedRef.current.add(e.attractionId);

      const shouldAutoBook = AUTO_BOOK_TIERS.includes(tier) && canBookNow;
      if (shouldAutoBook) {
        const ok = onAutoBook(attraction);
        if (ok) {
          mutated = true;
          onAlert(attraction, 'auto-book');
          return { ...e, status: 'booked' as const };
        }
        // Auto-book failed (capacity gone, etc). Drop into the alerted state
        // so the guest can retry. Treat this exactly like an explorer alert.
        mutated = true;
        onAlert(attraction, 'tap-to-book');
        return { ...e, status: 'alerted' as const };
      }

      mutated = true;
      onAlert(attraction, 'tap-to-book');
      return { ...e, status: 'alerted' as const };
    });

    // Age out alerts that have sat unacknowledged past the grace window.
    const aged = next.map((e) => {
      if (e.status !== 'alerted') return e;
      if (nowMinutes - e.openAtMin <= MISS_GRACE_MIN) return e;
      mutated = true;
      return { ...e, status: 'missed' as const };
    });

    if (mutated) setEntries(aged);
    // We deliberately exclude `entries` from deps — we mutate it via
    // setEntries inside the effect, and including it would cause a
    // re-fire loop. The effect is correctly driven by clock + tier.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nowMinutes, tier, canBookNow]);

  const isWatching = useCallback(
    (id: string) => entries.some((e) => e.attractionId === id),
    [entries],
  );

  const watch = useCallback(
    (attractionId: string, openAtMin?: number) => {
      setEntries((prev) => {
        if (prev.some((e) => e.attractionId === attractionId)) return prev;
        return [
          ...prev,
          {
            attractionId,
            addedAtMin: nowMinutes,
            openAtMin: openAtMin ?? nowMinutes,
            status: 'watching' as const,
          },
        ];
      });
    },
    [nowMinutes],
  );

  const unwatch = useCallback((attractionId: string) => {
    setEntries((prev) => prev.filter((e) => e.attractionId !== attractionId));
    firedRef.current.delete(attractionId);
  }, []);

  const dismiss = useCallback((attractionId: string) => {
    setEntries((prev) => prev.filter((e) => e.attractionId !== attractionId));
    firedRef.current.delete(attractionId);
  }, []);

  const markBooked = useCallback((attractionId: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.attractionId === attractionId ? { ...e, status: 'booked' as const } : e)),
    );
  }, []);

  const rearm = useCallback((attractionId: string, openAtMin: number) => {
    firedRef.current.delete(attractionId);
    setEntries((prev) =>
      prev.map((e) =>
        e.attractionId === attractionId
          ? { ...e, status: 'watching' as const, openAtMin }
          : e,
      ),
    );
  }, []);

  const alerted = useMemo(() => entries.filter((e) => e.status === 'alerted'), [entries]);

  return { entries, isWatching, watch, unwatch, dismiss, markBooked, rearm, alerted };
};