/**
 * Reservation Interest Pool — the menu of dining and experience bookings the
 * guest *might* want to add to their day. The Strategic Dashboard ("The
 * Plumbing") surfaces these so the guest can pre-select interests; depending
 * on their service tier, the system will either alert them when a window
 * opens or auto-book on their behalf.
 *
 * Each candidate carries:
 *   • park-aware metadata (park, land) so we never offer something that
 *     isn't reachable today
 *   • a `bookingOpensAtMin` window (park-time minutes since midnight) so
 *     the watchlist countdown is honest
 *   • optional `popularitySignal` tags that we cross-reference against the
 *     guest's pre-trip survey (PARTY_WANTS) to filter / prioritize the list.
 */

export type InterestKind = 'dining' | 'experience';

export interface ReservationInterest {
  id: string;
  kind: InterestKind;
  /** Display name. */
  name: string;
  /** Park this candidate lives in — drives park-awareness filtering. */
  park: 'magic-kingdom' | 'epcot' | 'hollywood-studios' | 'animal-kingdom';
  /** Land or venue context, surfaced in the meta line. */
  location: string;
  /**
   * Park-time the booking window opens (minutes since midnight). For walk-up
   * lists and same-day drops this is "now" or near-now; for ADRs this might
   * already be in the past (drop already happened, the system is just
   * listening for cancellations). Drives the watchlist countdown.
   */
  bookingOpensAtMin: number;
  /**
   * Tags the matcher uses to score relevance against the party's stated
   * interests. Loose, fuzzy strings — names from PARTY_WANTS or category
   * labels like "character", "fireworks".
   */
  popularitySignal?: string[];
  /** Short editorial line — why this is worth a slot. */
  pitch: string;
  /** Typical price tier — "$$"–"$$$$" for dining, descriptive for experiences. */
  priceTier?: string;
  /** Suggested party-size fit. */
  partyFit?: string;
}

/**
 * Magic Kingdom-focused pool for the prototype. Real implementation would
 * pull from a backend that already filters by `park === todaysPark`.
 */
export const INTEREST_POOL: ReservationInterest[] = [
  {
    id: 'int-cinderella',
    kind: 'dining',
    name: "Cinderella's Royal Table",
    park: 'magic-kingdom',
    location: 'Cinderella Castle',
    bookingOpensAtMin: 11 * 60 + 15, // ~10 min from NOW=11:05
    popularitySignal: ['princess', 'character', 'castle'],
    pitch: 'Princess character meal inside the castle. Holy grail of MK dining.',
    priceTier: '$$$$',
    partyFit: 'Families with young guests',
  },
  {
    id: 'int-jungle-skipper',
    kind: 'dining',
    name: 'Jungle Skipper Canteen',
    park: 'magic-kingdom',
    location: 'Adventureland',
    bookingOpensAtMin: 11 * 60 + 30,
    popularitySignal: ['Pirates of the Caribbean', 'adventure'],
    pitch: 'Themed table service steps from Pirates. Skipper puns included.',
    priceTier: '$$',
  },
  {
    id: 'int-liberty-tree',
    kind: 'dining',
    name: 'Liberty Tree Tavern',
    park: 'magic-kingdom',
    location: 'Liberty Square',
    bookingOpensAtMin: 12 * 60,
    popularitySignal: ['comfort', 'all-you-care'],
    pitch: 'All-you-care-to-enjoy Thanksgiving feast. A reliable big-meal anchor.',
    priceTier: '$$$',
    partyFit: 'Hungry parties of 4+',
  },
  {
    id: 'int-crystal-palace',
    kind: 'dining',
    name: 'The Crystal Palace',
    park: 'magic-kingdom',
    location: 'Main Street, U.S.A.',
    bookingOpensAtMin: 11 * 60 + 45,
    popularitySignal: ['Mickey & Minnie at Town Square', 'character', 'Pooh'],
    pitch: 'Winnie the Pooh character buffet under the Victorian skylights.',
    priceTier: '$$$',
    partyFit: 'Young guests + characters',
  },
  {
    id: 'int-fireworks-dessert',
    kind: 'experience',
    name: 'Fireworks Dessert Party — Plaza Garden',
    park: 'magic-kingdom',
    location: 'Plaza Garden View',
    bookingOpensAtMin: 11 * 60 + 10,
    popularitySignal: ['Happily Ever After Fireworks', 'fireworks', 'castle'],
    pitch: 'Reserved viewing + dessert spread for the nightly fireworks.',
    priceTier: '$$$',
  },
  {
    id: 'int-bbb',
    kind: 'experience',
    name: 'Bibbidi Bobbidi Boutique',
    park: 'magic-kingdom',
    location: 'Cinderella Castle',
    bookingOpensAtMin: 11 * 60 + 8,
    popularitySignal: ['princess', 'character', 'castle'],
    pitch: 'Royal makeover for little princes & princesses.',
    priceTier: '$$$$',
    partyFit: 'Ages 3–12',
  },
  {
    id: 'int-keys-kingdom',
    kind: 'experience',
    name: 'Keys to the Kingdom Tour',
    park: 'magic-kingdom',
    location: 'Town Square',
    bookingOpensAtMin: 11 * 60 + 20,
    popularitySignal: ['behind-the-scenes', 'utilidors'],
    pitch: '5-hour walking tour including the legendary utilidors.',
    priceTier: '$$$$',
    partyFit: 'Adults only (ages 16+)',
  },
  {
    id: 'int-pirates-league',
    kind: 'experience',
    name: "The Pirates League",
    park: 'magic-kingdom',
    location: 'Adventureland',
    bookingOpensAtMin: 11 * 60 + 25,
    popularitySignal: ['Pirates of the Caribbean', 'adventure', 'character'],
    pitch: 'Swashbuckling makeover next door to Pirates.',
    priceTier: '$$$',
  },
];

/**
 * Score a candidate against the guest's stated interests. Higher score = more
 * relevant. Used to sort the "Add an interest" picker so the most party-
 * appropriate options surface first.
 */
export const scoreInterest = (
  candidate: ReservationInterest,
  signals: string[],
): number => {
  if (!candidate.popularitySignal?.length) return 0;
  const lowered = signals.map((s) => s.toLowerCase());
  let score = 0;
  for (const tag of candidate.popularitySignal) {
    const t = tag.toLowerCase();
    if (lowered.some((s) => s.includes(t) || t.includes(s))) score += 1;
  }
  return score;
};

/** Pretty 12h time for display (e.g. 11*60+30 → "11:30 AM"). */
export const formatMinutes = (mins: number): string => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${m.toString().padStart(2, '0')} ${period}`;
};