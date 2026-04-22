/**
 * Standing Reservations — the unified holds-on-time data model.
 *
 * Covers every committed slot in the day:
 *  - dining       (table-service ADRs)
 *  - experience   (character meals, dessert parties, tours, Bibbidi Bobbidi)
 *  - ll           (standard Lightning Lane)
 *  - ill          (Individual Lightning Lane / a la carte)
 *
 * Both the Strategic Dashboard ("The Plumbing") and the Hero "On the Books"
 * chip render from this single source so the two surfaces never drift.
 */

export type ReservationKind = 'dining' | 'experience' | 'll' | 'ill';
export type ReservationStatus = 'upcoming' | 'open-now' | 'checked-in' | 'used';

export interface Reservation {
  id: string;
  kind: ReservationKind;
  /** Display name — restaurant, ride, or experience title. */
  name: string;
  /** Park-time start (24h "HH:MM"). Used for sorting and countdown math. */
  startsAt: string;
  /** Optional end time for windowed slots (LL return windows, dining seating). */
  endsAt?: string;
  /** Land or venue context, surfaced in the meta line. */
  location?: string;
  /** Party size on the booking. */
  partySize?: number;
  /** Walk minutes from current position — null when unknown. */
  walkMinutes?: number;
  status: ReservationStatus;
  /** Confirmation / locator code, when the booking system provides one. */
  confirmation?: string;
}

export const RESERVATIONS: Reservation[] = [
  { id: 'din-1', kind: 'dining', name: 'Be Our Guest', startsAt: '11:30', location: 'Fantasyland', partySize: 5, walkMinutes: 8, status: 'upcoming', confirmation: 'BOG-4421' },
  { id: 'exp-1', kind: 'experience', name: 'Bibbidi Bobbidi Boutique', startsAt: '15:00', location: 'Cinderella Castle', partySize: 1, walkMinutes: 6, status: 'upcoming', confirmation: 'BBB-9012' },
  { id: 'll-1', kind: 'll', name: 'Haunted Mansion', startsAt: '11:00', endsAt: '12:00', location: 'Liberty Square', status: 'open-now' },
  { id: 'll-2', kind: 'll', name: 'Space Mountain', startsAt: '12:30', endsAt: '13:30', location: 'Tomorrowland', status: 'upcoming' },
  { id: 'll-3', kind: 'll', name: 'Big Thunder', startsAt: '14:45', endsAt: '15:45', location: 'Frontierland', status: 'upcoming' },
  { id: 'ill-1', kind: 'ill', name: 'Tron Lightcycle', startsAt: '13:15', endsAt: '14:15', location: 'Tomorrowland', status: 'upcoming' },
];

/** Convert "HH:MM" park-time to minutes since midnight. */
const toMinutes = (t: string): number => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

/** Minutes until the reservation starts, given a "now" in minutes-since-midnight. */
export const minutesUntil = (startsAt: string, nowMinutes: number): number =>
  toMinutes(startsAt) - nowMinutes;

/**
 * The next dining or experience reservation within `withinMinutes` of now.
 * Used by the Hero card to show the "On the Books" chip.
 */
export const nextHospitalityReservation = (
  reservations: Reservation[],
  nowMinutes: number,
  withinMinutes = 60,
): Reservation | null => {
  const eligible = reservations
    .filter((r) => (r.kind === 'dining' || r.kind === 'experience') && r.status === 'upcoming')
    .map((r) => ({ r, delta: minutesUntil(r.startsAt, nowMinutes) }))
    .filter(({ delta }) => delta >= 0 && delta <= withinMinutes)
    .sort((a, b) => a.delta - b.delta);
  return eligible[0]?.r ?? null;
};

/** Pretty 12h time for display (e.g. "11:30" → "11:30 AM"). */
export const formatTime = (t: string): string => {
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${m.toString().padStart(2, '0')} ${period}`;
};
