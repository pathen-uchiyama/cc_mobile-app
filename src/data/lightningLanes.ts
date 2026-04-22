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
  /**
   * Typical sell-out time on a comparable day, expressed as minutes since
   * midnight (park-time). Drives the "Usually gone by …" data point on the
   * booking card and the default sort order on /book-ll. Lower number = sells
   * out earlier in the day = more urgent.
   *
   * Headliners (TRON, Seven Dwarfs) typically sell out within an hour of park
   * open; classics like Pirates routinely last into mid-afternoon.
   */
  typicalSelloutMin: number;
}

/**
 * The day's available Lightning Lane inventory.
 *
 * Includes both standard LL and Individual LL options. Sorted alphabetically;
 * the booking page re-sorts dynamically (Must-Dos pinned, ridden de-emphasized).
 */
export const LL_INVENTORY: LLAttraction[] = [
  // typicalSelloutMin: minutes since midnight on a comparable day.
  // 600 = 10:00 AM, 660 = 11:00 AM, 720 = 12:00 PM, 780 = 1:00 PM, 840 = 2:00 PM, 900 = 3:00 PM
  { id: 'll-peterpan',  name: "Peter Pan's Flight",            land: 'Fantasyland',    type: 'll', tier: 'family',  standbyMin: 65, nextWindow: '3:10 PM', typicalSelloutMin: 615, blurb: 'Sail over Neverland in a pirate galleon.' },
  { id: 'll-space',     name: 'Space Mountain',                land: 'Tomorrowland',   type: 'll', tier: 'thrill',  standbyMin: 70, nextWindow: '12:30 PM', typicalSelloutMin: 660, blurb: 'Indoor coaster in pitch-black starscape.' },
  { id: 'll-splash',    name: 'Tiana\u2019s Bayou Adventure',  land: 'Frontierland',   type: 'll', tier: 'thrill',  standbyMin: 60, nextWindow: '3:45 PM', typicalSelloutMin: 690, blurb: 'Log flume reimagined with Tiana.' },
  { id: 'll-bigthunder',name: 'Big Thunder Mountain',          land: 'Frontierland',   type: 'll', tier: 'thrill',  standbyMin: 55, nextWindow: '2:15 PM', typicalSelloutMin: 750, blurb: 'Runaway mine train through the desert.' },
  { id: 'll-haunted',   name: 'Haunted Mansion',               land: 'Liberty Square', type: 'll', tier: 'classic', standbyMin: 35, nextWindow: '12:50 PM', typicalSelloutMin: 810, blurb: 'Doom buggies through 999 happy haunts.' },
  { id: 'll-jungle',    name: 'Jungle Cruise',                 land: 'Adventureland',  type: 'll', tier: 'classic', standbyMin: 45, nextWindow: '1:25 PM', typicalSelloutMin: 840, blurb: 'Skipper-led safari, pun-filled.' },
  { id: 'll-winnie',    name: 'Many Adventures of Winnie the Pooh', land: 'Fantasyland', type: 'll', tier: 'family', standbyMin: 30, nextWindow: '12:20 PM', typicalSelloutMin: 870, blurb: 'Cozy honey-pot dark ride.' },
  { id: 'll-pirates',   name: 'Pirates of the Caribbean',      land: 'Adventureland',  type: 'll', tier: 'classic', standbyMin: 30, nextWindow: '12:05 PM', typicalSelloutMin: 900, blurb: 'Boat ride through swashbuckling tableaux.' },
  { id: 'll-buzz',      name: 'Buzz Lightyear Space Ranger Spin', land: 'Tomorrowland', type: 'll', tier: 'family', standbyMin: 25, nextWindow: '11:40 AM', typicalSelloutMin: 960, blurb: 'Score-keeping laser dark ride.' },
  { id: 'll-dumbo',     name: 'Dumbo the Flying Elephant',     land: 'Fantasyland',    type: 'll', tier: 'family',  standbyMin: 20, nextWindow: '11:15 AM', typicalSelloutMin: 990, blurb: 'Iconic spinner — gentle and beloved.' },

  // Individual Lightning Lane — premium, day-of priced.
  { id: 'ill-tron',         name: 'TRON Lightcycle / Run',     land: 'Tomorrowland', type: 'ill', tier: 'headliner', standbyMin: 110, nextWindow: '4:00 PM', priceUsd: 22, typicalSelloutMin: 555, blurb: 'Launch coaster through the Grid.' },
  { id: 'ill-sevendwarfs',  name: 'Seven Dwarfs Mine Train',   land: 'Fantasyland',  type: 'ill', tier: 'headliner', standbyMin: 85,  nextWindow: '2:30 PM', priceUsd: 16, typicalSelloutMin: 585, blurb: 'Family coaster through the gem mine.' },
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
 * IANA timezone for the park whose inventory this module models. Walt Disney
 * World runs on Eastern time year-round (it observes DST). When we expand to
 * Disneyland or international parks, plumb a per-park override down from the
 * route — keep this default so every existing call stays correct.
 */
export const PARK_TIMEZONE = 'America/New_York';

/**
 * Best-effort detection of the viewer's IANA timezone. Falls back to the park
 * timezone if the browser doesn't expose `resolvedOptions().timeZone` (rare,
 * but happens on locked-down WebViews).
 */
const getViewerTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || PARK_TIMEZONE;
  } catch {
    return PARK_TIMEZONE;
  }
};

/**
 * Compare two IANA timezones for *current* equivalence by checking the wall
 * clock they produce for the same instant. Two zones with different IDs but
 * identical offsets today (e.g. America/New_York vs America/Detroit) read as
 * the same — which is what we want for "should we tag this with ET?".
 */
const sameWallClock = (zoneA: string, zoneB: string): boolean => {
  if (zoneA === zoneB) return true;
  try {
    const sample = new Date();
    const fmt = (zone: string) =>
      new Intl.DateTimeFormat('en-US', {
        timeZone: zone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(sample);
    return fmt(zoneA) === fmt(zoneB);
  } catch {
    return false;
  }
};

/**
 * Short, friendly abbreviation for a timezone (e.g. "ET", "PT", "CT", "MT").
 * Falls back to the long generic name from `Intl` when no short alias maps.
 */
const shortZoneLabel = (zone: string, sample: Date = new Date()): string => {
  // Hand-mapped US aliases — the only ones we ship parks in today. Everything
  // else degrades to the Intl-provided "GMT+N" string, which is still correct.
  const KNOWN: Record<string, string> = {
    'America/New_York': 'ET',
    'America/Detroit': 'ET',
    'America/Indiana/Indianapolis': 'ET',
    'America/Chicago': 'CT',
    'America/Denver': 'MT',
    'America/Phoenix': 'MST',
    'America/Los_Angeles': 'PT',
    'America/Anchorage': 'AKT',
    'Pacific/Honolulu': 'HST',
  };
  if (KNOWN[zone]) return KNOWN[zone];
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      timeZoneName: 'short',
    }).formatToParts(sample);
    return parts.find((p) => p.type === 'timeZoneName')?.value ?? zone;
  } catch {
    return zone;
  }
};

/**
 * Format a "minutes since midnight at the park" value as a wall-clock time
 * **in the park's local timezone**, e.g. 555 → "9:15 AM", 690 → "11:30 AM".
 *
 * When the viewer's timezone differs from the park's (e.g. a guest in
 * California viewing a Walt Disney World schedule), the park's short zone
 * tag is appended so the time is unambiguous: "9:15 AM ET".
 *
 * The number of minutes is interpreted relative to *today's* park-local
 * midnight, which means the formatter automatically respects DST: a park
 * that springs forward shows the correct wall-clock hour without the caller
 * having to think about offsets.
 */
export const formatClockTime = (
  minutesSinceMidnight: number,
  options: { parkZone?: string; viewerZone?: string } = {},
): string => {
  const parkZone = options.parkZone ?? PARK_TIMEZONE;
  const viewerZone = options.viewerZone ?? getViewerTimezone();
  const totalMin = Math.max(0, Math.min(24 * 60 - 1, Math.round(minutesSinceMidnight)));
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;

  // Anchor to today's park-local midnight, then add the offset. We build the
  // anchor via `Intl` so DST is handled correctly — naively constructing a
  // Date with `new Date(y, m, d)` would use the viewer's local zone.
  const now = new Date();
  const parkDateParts = new Intl.DateTimeFormat('en-US', {
    timeZone: parkZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const get = (type: string) => Number(parkDateParts.find((p) => p.type === type)?.value ?? 0);
  const py = get('year');
  const pm = get('month');
  const pd = get('day');
  // Build an ISO-ish wall-clock string for the requested park-local time and
  // ask Intl to format it back. Round-tripping through Intl makes this safe
  // across DST boundaries.
  const sample = new Date(Date.UTC(py, pm - 1, pd, hours, mins, 0));
  // The UTC instant above does NOT correspond to the same wall clock in the
  // park, so we re-format using the park zone — that yields "h:mm AM/PM" in
  // park-local terms regardless of where the viewer sits.
  const wallClock = new Intl.DateTimeFormat('en-US', {
    timeZone: parkZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(sample);

  // Only tag the timezone when the viewer is somewhere else — locals don't
  // need "ET" on every chip.
  if (sameWallClock(parkZone, viewerZone)) return wallClock;
  return `${wallClock} ${shortZoneLabel(parkZone, sample)}`;
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
