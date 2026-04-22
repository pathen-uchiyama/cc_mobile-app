/**
 * Want-To-Do pools — rides the guest can inject into the active card
 * but didn't formally lock as Must-Dos.
 *
 * Two tiers:
 *  • Party Wants — drawn from the pre-trip survey. Each row carries a
 *    yes/total tally so the sheet can show "3 of 5 want this".
 *  • Community Picks — top-voted rides for today across all guests in
 *    the park. Vote count drives ranking.
 */

export interface PartyWant {
  id: string;
  attraction: string;
  location: string;
  /** How many of the traveling party flagged this in the pre-trip survey. */
  party: { yes: number; total: number };
}

export interface CommunityPick {
  id: string;
  attraction: string;
  location: string;
  /** Total guests who voted this a "must do today" across the park. */
  votes: number;
  trend?: 'up' | 'flat';
}

export const PARTY_WANTS: PartyWant[] = [
  { id: 'w1', attraction: 'it\u2019s a small world',         location: 'Fantasyland',   party: { yes: 4, total: 5 } },
  { id: 'w2', attraction: 'Tiana\u2019s Bayou Adventure',    location: 'Frontierland',  party: { yes: 3, total: 5 } },
  { id: 'w3', attraction: 'Mickey\u2019s PhilharMagic',      location: 'Fantasyland',   party: { yes: 2, total: 5 } },
];

export const COMMUNITY_PICKS: CommunityPick[] = [
  { id: 'c1', attraction: 'Tron Lightcycle Run',     location: 'Tomorrowland',  votes: 4_812, trend: 'up' },
  { id: 'c2', attraction: 'Seven Dwarfs Mine Train', location: 'Fantasyland',   votes: 3_647, trend: 'up' },
  { id: 'c3', attraction: 'Space Mountain',          location: 'Tomorrowland',  votes: 2_984, trend: 'flat' },
  { id: 'c4', attraction: 'Big Thunder Mountain',    location: 'Frontierland',  votes: 2_215, trend: 'up' },
  { id: 'c5', attraction: 'Pirates of the Caribbean',location: 'Adventureland', votes: 1_708, trend: 'flat' },
];