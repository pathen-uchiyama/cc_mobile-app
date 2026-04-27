/**
 * Attraction Want-To-Do pool — anything the guest can inject into the
 * active card. "Attraction" here is the broad sense: rides, shows, character
 * meet & greets, parades, and signature dining experiences.
 *
 * Source:
 *  • Party Wants — drawn from the pre-trip survey. Each row carries a
 *    yes/total tally so the sheet can show "3 of 5 want this".
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

export const PARTY_WANTS: PartyWant[] = [
  { id: 'w1', attraction: 'it\u2019s a small world',         location: 'Fantasyland',   kind: 'ride',  party: { yes: 4, total: 5 } },
  { id: 'w2', attraction: 'Mickey & Minnie at Town Square',  location: 'Main Street',   kind: 'meet',  party: { yes: 5, total: 5 } },
  { id: 'w3', attraction: 'Mickey\u2019s PhilharMagic',      location: 'Fantasyland',   kind: 'show',  party: { yes: 3, total: 5 } },
  { id: 'w4', attraction: 'Festival of Fantasy Parade',      location: 'Frontierland \u2192 Main Street', kind: 'parade', party: { yes: 4, total: 5 } },
  { id: 'w5', attraction: 'Be Our Guest Lunch',              location: 'Fantasyland',   kind: 'dining', party: { yes: 3, total: 5 } },
];