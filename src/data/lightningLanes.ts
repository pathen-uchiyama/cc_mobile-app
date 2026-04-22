/**
 * Lightning Lane inventory + booking-capacity logic.
 *
 * Models Disney's actual stacking rules without breaking them:
 *  - Standard LL Multi-Pass: max 3 held at once. After the first selection
 *    you wait 2 hours OR until you tap-into a held LL (whichever first)
 *    before the next slot unlocks.
 *  - Individual LL (ILL): a-la-carte, max 2 per day, no holding cap.
 *  - Lightning Lane Premier Pass / Hopper extras add capacity on top.
 *
 * The Capacity Meter UI reads `summarizeCapacity()` to render pip counts and
 * the "next unlock in Xm" countdown. Booking buttons disable when capped but
 * the inventory always remains visible — the guest never loses sight of what's
 * available, only of what they can grab right now.
 */

export type LLAttractionType = 'll' | 'ill';
export type LLTier = 'headliner' | 'family' | 'classic' | 'thrill';

export interface LLAttraction {
  id: string;
  name: string;
  land: string;
  type: LLAttractionType;
  tier: LLTier;
  /** Current standby wait in minutes — drives "save Xm" math. */
  standbyMin: number;
  /** Next available LL return window, e.g. "12:30 PM". */
  nextWindow: string;
  /** ILL price in USD when type === 'ill'. */
  priceUsd?: number;
  /** Brief description of the experience for the guest. */
  blurb: string;
}

/**
 * The day's available Lightning Lane inventory.
 *
 * Includes both standard LL and Individual LL options. Sorted alphabetically;
 * the booking page re-sorts dynamically (Must-Dos pinned, ridden de-emphasized).
 */
export const LL_INVENTORY: LLAttraction[] = [
  { id: 'll-bigthunder', name: 'Big Thunder Mountain', land: 'Frontierland', type: 'll', tier: 'thrill', standbyMin: 55, nextWindow: '2:15 PM', blurb: 'Runaway mine train through the desert.' },
  { id: 'll-buzz', name: 'Buzz Lightyear Space Ranger Spin', land: 'Tomorrowland', type: 'll', tier: 'family', standbyMin: 25, nextWindow: '11:40 AM', blurb: 'Score-keeping laser dark ride.' },
  { id: 'll-dumbo', name: 'Dumbo the Flying Elephant', land: 'Fantasyland', type: 'll', tier: 'family', standbyMin: 20, nextWindow: '11:15 AM', blurb: 'Iconic spinner — gentle and beloved.' },
  { id: 'll-haunted', name: 'Haunted Mansion', land: 'Liberty Square', type: 'll', tier: 'classic', standbyMin: 35, nextWindow: '12:50 PM', blurb: 'Doom buggies through 999 happy haunts.' },
  { id: 'll-jungle', name: 'Jungle Cruise', land: 'Adventureland', type: 'll', tier: 'classic', standbyMin: 45, nextWindow: '1:25 PM', blurb: 'Skipper-led safari, pun-filled.' },
  { id: 'll-peterpan', name: "Peter Pan's Flight", land: 'Fantasyland', type: 'll', tier: 'family', standbyMin: 65, nextWindow: '3:10 PM', blurb: 'Sail over Neverland in a pirate galleon.' },
  { id: 'll-pirates', name: 'Pirates of the Caribbean', land: 'Adventureland', type: 'll', tier: 'classic', standbyMin: 30, nextWindow: '12:05 PM', blurb: 'Boat ride through swashbuckling tableaux.' },
  { id: 'll-space', name: 'Space Mountain', land: 'Tomorrowland', type: 'll', tier: 'thrill', standbyMin: 70, nextWindow: '12:30 PM', blurb: 'Indoor coaster in pitch-black starscape.' },
  { id: 'll-splash', name: 'Tiana\u2019s Bayou Adventure', land: 'Frontierland', type: 'll', tier: 'thrill', standbyMin: 60, nextWindow: '3:45 PM', blurb: 'Log flume reimagined with Tiana.' },
  { id: 'll-winnie', name: 'Many Adventures of Winnie the Pooh', land: 'Fantasyland', type: 'll', tier: 'family', standbyMin: 30, nextWindow: '12:20 PM', blurb: 'Cozy honey-pot dark ride.' },

  // Individual Lightning Lane — premium, day-of priced.
  { id: 'ill-tron', name: 'TRON Lightcycle / Run', land: 'Tomorrowland', type: 'ill', tier: 'headliner', standbyMin: 110, nextWindow: '4:00 PM', priceUsd: 22, blurb: 'Launch coaster through the Grid.' },
  { id: 'ill-sevendwarfs', name: 'Seven Dwarfs Mine Train', land: 'Fantasyland', type: 'ill', tier: 'headliner', standbyMin: 85, nextWindow: '2:30 PM', priceUsd: 16, blurb: 'Family coaster through the gem mine.' },
];

/**
 * Capacity configuration — represents the guest's purchased extras.
 *
 * Real-world stacking case from the user: Premier Pass + Hopper experience
 * pushes the LL hold cap from 3 to 5. ILL stays capped at 2/day independently.
 */
export interface CapacityConfig {
  /** Base LL Multi-Pass cap. Always 3 in current Disney rules. */
  baseLLCap: number;
  /** Bonus LL slots from Premier Pass (typically 1) or other add-ons. */
  bonusLLCap: number;
  /** ILL slots per day — Disney caps this at 2 by rule. */
  illDailyCap: number;
  /** Minutes after first booking before next standard LL slot unlocks. */
  unlockGapMinutes: number;
}

export const DEFAULT_CAPACITY: CapacityConfig = {
  baseLLCap: 3,
  bonusLLCap: 2, // simulating Premier Pass + Hopper bonus → 5 total LL slots
  illDailyCap: 2,
  unlockGapMinutes: 120,
};

export type HeldStatus = 'held' | 'tapped-in' | 'used';

export interface HeldLL {
  id: string;
  attractionId: string;
  type: LLAttractionType;
  /** Park-time the booking was made (minutes since midnight). */
  bookedAtMin: number;
  /** Return window start (minutes since midnight). */
  windowStartMin: number;
  status: HeldStatus;
}

export interface CapacitySummary {
  /** Total LL holds currently in 'held' status. */
  llHeldCount: number;
  /** Total LL slots available (base + bonus). */
  llCapTotal: number;
  /** Whether the guest can book a new standard LL right now. */
  canBookLLNow: boolean;
  /** Minutes until the next LL slot unlocks (0 when bookable). */
  llUnlocksInMin: number;
  /** ILL bookings so far today. */
  illUsedCount: number;
  /** ILL daily cap. */
  illCapTotal: number;
  /** Whether the guest can book another ILL today. */
  canBookILL: boolean;
}

/**
 * Compute the capacity meter state for a given moment.
 *
 * Logic — standard LL slot unlocks when EITHER:
 *   1. Held count is below the cap AND (no holds yet OR oldest hold is past
 *      the unlock-gap window OR at least one hold has been tapped-in/used).
 *   2. The active "wait window" elapses — measured from the most recent
 *      booking that hasn't yet been tapped in.
 *
 * ILL has no inter-booking wait — only the daily cap applies.
 */
export const summarizeCapacity = (
  holds: HeldLL[],
  nowMinutes: number,
  config: CapacityConfig = DEFAULT_CAPACITY,
): CapacitySummary => {
  const llHolds = holds.filter((h) => h.type === 'll' && h.status === 'held');
  const llHeldCount = llHolds.length;
  const llCapTotal = config.baseLLCap + config.bonusLLCap;

  // Tapped-in or used LLs unlock the next slot immediately.
  const hasTappedIn = holds.some((h) => h.type === 'll' && (h.status === 'tapped-in' || h.status === 'used'));

  // Most recent active booking — the timer runs from this one.
  const mostRecentBooking = llHolds
    .slice()
    .sort((a, b) => b.bookedAtMin - a.bookedAtMin)[0];

  let llUnlocksInMin = 0;
  let canBookLLNow = llHeldCount < llCapTotal;

  if (canBookLLNow && mostRecentBooking && !hasTappedIn) {
    const elapsed = nowMinutes - mostRecentBooking.bookedAtMin;
    const remaining = config.unlockGapMinutes - elapsed;
    if (remaining > 0) {
      canBookLLNow = false;
      llUnlocksInMin = remaining;
    }
  }

  const illUsedCount = holds.filter((h) => h.type === 'ill').length;
  const canBookILL = illUsedCount < config.illDailyCap;

  return {
    llHeldCount,
    llCapTotal,
    canBookLLNow,
    llUnlocksInMin,
    illUsedCount,
    illCapTotal: config.illDailyCap,
    canBookILL,
  };
};

/** Format a minute-count as "1h 47m" or "47m". */
export const formatCountdown = (mins: number): string => {
  if (mins <= 0) return 'now';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

/**
 * Initial held-LL state used by /park and /book-ll. Mocked to mirror the three
 * standard LLs already shown in `RESERVATIONS` so the two surfaces stay
 * consistent. Booked at 9:00 AM means the 2-hour gap elapsed by 11:00 AM —
 * matches the current 10:45 mock time leaving ~15m on the clock.
 */
export const INITIAL_HOLDS: HeldLL[] = [
  { id: 'h-1', attractionId: 'll-haunted', type: 'll', bookedAtMin: 9 * 60, windowStartMin: 11 * 60, status: 'held' },
  { id: 'h-2', attractionId: 'll-space', type: 'll', bookedAtMin: 9 * 60 + 5, windowStartMin: 12 * 60 + 30, status: 'held' },
  { id: 'h-3', attractionId: 'll-bigthunder', type: 'll', bookedAtMin: 9 * 60 + 30, windowStartMin: 14 * 60 + 45, status: 'held' },
  { id: 'h-4', attractionId: 'ill-tron', type: 'ill', bookedAtMin: 10 * 60, windowStartMin: 13 * 60 + 15, status: 'held' },
];

/**
 * The guest's Must-Do attractions, mapped by ride name.
 * Used to pin Must-Dos to the top of the booking list and de-emphasize ridden ones.
 */
export interface MustDoState {
  attraction: string;
  desired: number;
  done: number;
}

export const isRidden = (attractionName: string, mustDos: MustDoState[]): boolean => {
  const md = mustDos.find((m) => m.attraction === attractionName);
  return md ? md.done >= md.desired && md.desired > 0 : false;
};

export const isMustDo = (attractionName: string, mustDos: MustDoState[]): boolean =>
  mustDos.some((m) => m.attraction === attractionName);
