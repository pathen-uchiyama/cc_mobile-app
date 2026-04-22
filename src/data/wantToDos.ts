/**
 * Attraction Want-To-Do pools — anything the guest can inject into the
 * active card. "Attraction" here is the broad sense: rides, shows, character
 * meet & greets, parades, and signature dining experiences.
 *
 * Two tiers:
 *  • Party Wants — drawn from the pre-trip survey. Each row carries a
 *    yes/total tally so the sheet can show "3 of 5 want this".
 *  • Community Picks — top-voted attractions for today across all guests
 *    in the park. Vote count drives ranking.
 */

export type AttractionKind = 'ride' | 'show' | 'meet' | 'parade' | 'dining';

export interface PartyWant {
  id: string;
  attraction: string;
  location: string;
  kind: AttractionKind;
  /** How many of the traveling party flagged this in the pre-trip survey. */
  party: { yes: number; total: number };
}

export interface CommunityPick {
  id: string;
  attraction: string;
  location: string;
  kind: AttractionKind;
  /** Total guests who voted this a "must do today" across the park. */
  votes: number;
  trend?: 'up' | 'flat';
}

export const PARTY_WANTS: PartyWant[] = [
  { id: 'w1', attraction: 'it\u2019s a small world',         location: 'Fantasyland',   kind: 'ride',  party: { yes: 4, total: 5 } },
  { id: 'w2', attraction: 'Mickey & Minnie at Town Square',  location: 'Main Street',   kind: 'meet',  party: { yes: 5, total: 5 } },
  { id: 'w3', attraction: 'Mickey\u2019s PhilharMagic',      location: 'Fantasyland',   kind: 'show',  party: { yes: 3, total: 5 } },
  { id: 'w4', attraction: 'Festival of Fantasy Parade',      location: 'Frontierland \u2192 Main Street', kind: 'parade', party: { yes: 4, total: 5 } },
  { id: 'w5', attraction: 'Be Our Guest Lunch',              location: 'Fantasyland',   kind: 'dining', party: { yes: 3, total: 5 } },
];

export const COMMUNITY_PICKS: CommunityPick[] = [
  { id: 'c1', attraction: 'Tron Lightcycle Run',             location: 'Tomorrowland',  kind: 'ride',   votes: 4_812, trend: 'up' },
  { id: 'c2', attraction: 'Happily Ever After Fireworks',    location: 'Cinderella Castle', kind: 'show', votes: 4_510, trend: 'up' },
  { id: 'c3', attraction: 'Seven Dwarfs Mine Train',         location: 'Fantasyland',   kind: 'ride',   votes: 3_647, trend: 'up' },
  { id: 'c4', attraction: 'Princess Tiana at Princess Fairytale Hall', location: 'Fantasyland', kind: 'meet', votes: 3_120, trend: 'up' },
  { id: 'c5', attraction: 'Space Mountain',                  location: 'Tomorrowland',  kind: 'ride',   votes: 2_984, trend: 'flat' },
  { id: 'c6', attraction: 'Festival of Fantasy Parade',      location: 'Frontierland \u2192 Main Street', kind: 'parade', votes: 2_640, trend: 'flat' },
  { id: 'c7', attraction: 'Big Thunder Mountain',            location: 'Frontierland',  kind: 'ride',   votes: 2_215, trend: 'up' },
  { id: 'c8', attraction: 'Pirates of the Caribbean',        location: 'Adventureland', kind: 'ride',   votes: 1_708, trend: 'flat' },
];