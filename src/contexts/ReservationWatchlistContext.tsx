import { createContext, useCallback, useContext, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  useReservationWatchlist,
  type UseReservationWatchlistReturn,
} from '@/hooks/reservations/useReservationWatchlist';
import { INTEREST_POOL, type ReservationInterest } from '@/data/reservationInterests';
import { useHaptics } from '@/hooks/useHaptics';

/**
 * ReservationWatchlistProvider
 * ----------------------------
 * Lifts the reservation watchlist out of the StrategicDashboard so its
 * alert engine runs **ambiently** for the whole session — not only while
 * the dashboard sheet is mounted. That way a window opening at 11:30 still
 * fires a premium toast + haptic even if the guest has the dashboard
 * closed and is reading the Hero card.
 *
 * The provider owns:
 *   • the park-time clock (advances roughly 1 park-min per real second so
 *     the prototype actually triggers alerts in a session)
 *   • the watchlist state machine (watching → alerted/booked/missed)
 *   • the premium toast + haptic side-effects per tier:
 *       — sovereign + manager → success haptic + "Auto-booked" success toast
 *       — explorer            → recommendation haptic + tap-to-book toast
 *       — auto-book failure   → recommendation haptic + error toast w/ retry
 */

/** Mock park-time anchor mirrors the rest of /park (11:05 AM). */
const INITIAL_NOW_MIN = 11 * 60 + 5;
/** Accelerated tick so demo alerts surface in seconds, not hours. */
const TICK_MIN_PER_SEC = 0.5;

import { useEffect, useState } from 'react';

interface ReservationWatchlistContextValue extends UseReservationWatchlistReturn {
  /** Live park-time in minutes-since-midnight. */
  nowMinutes: number;
  /** One-shot booking helper — exposed so consumers can complete a tap-to-book. */
  bookInterest: (interest: ReservationInterest) => boolean;
}

const Ctx = createContext<ReservationWatchlistContextValue | null>(null);

export const ReservationWatchlistProvider = ({ children }: { children: ReactNode }) => {
  const { fire } = useHaptics();
  const navigate = useNavigate();

  const [nowMinutes, setNowMinutes] = useState<number>(INITIAL_NOW_MIN);
  useEffect(() => {
    const id = window.setInterval(() => {
      setNowMinutes((n) => n + TICK_MIN_PER_SEC);
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  // Mocked booking outcome — production hits the booking API. Always
  // succeeds for the prototype so the auto-book happy path is visible.
  const bookInterest = useCallback((_i: ReservationInterest) => true, []);

  const watchlist = useReservationWatchlist({
    nowMinutes,
    onAutoBook: (interest) => bookInterest(interest),
    onAlert: (interest, mode) => {
      if (mode === 'auto-book') {
        fire('bookingSuccess');
        toast.success(`Auto-booked · ${interest.name}`, {
          description: 'Now showing in your standing reservations.',
          duration: 6000,
          action: {
            label: 'View',
            onClick: () => navigate('/park'),
          },
        });
      } else if (mode === 'auto-book-failed') {
        fire('recommendation');
        toast.error(`Couldn't auto-book ${interest.name}`, {
          description: 'Window slipped. Tap to grab it manually.',
          duration: 8000,
          action: {
            label: 'Book now',
            onClick: () => {
              if (bookInterest(interest)) watchlist.markBooked(interest.id);
            },
          },
        });
      } else {
        // Explorer-tier "tap-to-book" alert.
        fire('recommendation');
        toast(`${interest.name} just opened`, {
          description: 'The booking window is live — tap to grab it.',
          duration: 8000,
          action: {
            label: 'Book now',
            onClick: () => {
              if (bookInterest(interest)) watchlist.markBooked(interest.id);
            },
          },
        });
      }
    },
  });

  return (
    <Ctx.Provider value={{ ...watchlist, nowMinutes, bookInterest }}>
      {children}
    </Ctx.Provider>
  );
};

export const useReservationWatchlistContext = () => {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error(
      'useReservationWatchlistContext must be used within ReservationWatchlistProvider',
    );
  }
  return ctx;
};