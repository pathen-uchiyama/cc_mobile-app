import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, MapPin, Clock, Check, Star, Lock, ArrowRight, Sparkles, Hourglass, Heart, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LL_INVENTORY,
  formatCountdown,
  formatClockTime,
  isMustDo,
  isRidden,
  type LLAttraction,
  type HeldLL,
  type MustDoState,
} from '@/data/lightningLanes';
import { useLightningLane } from '@/contexts/LightningLaneContext';
import CapacityMeter from '@/components/lightning-lane/CapacityMeter';
import WatchlistStrip from '@/components/lightning-lane/WatchlistStrip';
import { useLLWatchlist } from '@/hooks/lightning-lane/useLLWatchlist';
import { useCompanion } from '@/contexts/CompanionContext';
import { useHaptics } from '@/hooks/useHaptics';
import PageHeader from '@/components/layout/PageHeader';
import EmptyState from '@/components/layout/EmptyState';

// Mocked Must-Do state — in production this comes from the same store
// that drives the MustDoRibbon on /park.
const MOCK_MUST_DOS: MustDoState[] = [
  { attraction: 'Pirates of the Caribbean', desired: 1, done: 1 },     // ridden — de-emphasized
  { attraction: 'Haunted Mansion', desired: 2, done: 0 },                // pinned top
  { attraction: 'Big Thunder Mountain', desired: 2, done: 0 },           // pinned top (already held)
  { attraction: 'Space Mountain', desired: 1, done: 0 },                 // pinned top (already held)
  { attraction: "Peter Pan\u2019s Flight", desired: 1, done: 0 },        // pinned top
];

/**
 * Booking time-of-day windows. Each window's `startMin` is the park-time
 * we'll request as the start of the return slot. `null` for ASAP — we use
 * `nowMinutes + 60` (the standard 1-hour return window from the API).
 */
type BookWindowId = 'asap' | 'morning' | 'afternoon' | 'early-evening' | 'evening';
interface BookWindow {
  id: BookWindowId;
  label: string;
  /** Range hint shown in the menu (display only). */
  hint: string;
  /** Park-time minutes we'll request, or null for ASAP. */
  startMin: number | null;
  /** Window end (used to grey out a slot once it has fully passed). */
  endMin: number;
}
const BOOK_WINDOWS: BookWindow[] = [
  { id: 'asap',          label: 'Book ASAP',         hint: 'Next available',   startMin: null,    endMin: 24 * 60 },
  { id: 'morning',       label: 'Morning',           hint: '9 AM – 12 PM',     startMin: 9 * 60,  endMin: 12 * 60 },
  { id: 'afternoon',     label: 'Afternoon',         hint: '12 PM – 3 PM',     startMin: 12 * 60, endMin: 15 * 60 },
  { id: 'early-evening', label: 'Early evening',     hint: '3 PM – 6 PM',      startMin: 15 * 60, endMin: 18 * 60 },
  { id: 'evening',       label: 'Evening',           hint: '7 PM – close',     startMin: 19 * 60, endMin: 23 * 60 },
];

/**
 * Burnished-gold treatment — the single source of truth for any surface that
 * communicates "armed / watching" on /book-ll. Heart toggle, Watch CTA's
 * armed pill, and the watching card border all consume these tokens so the
 * three never drift apart visually.
 *
 * NOTE: this is a *tinted* gold (low-opacity fill + saturated ink + soft
 * border). It deliberately differs from the *solid* gold fill used on
 * selected time-slot chips elsewhere in the app, so the two roles ("armed"
 * vs. "selected target") never compete for attention.
 *
 * Exported so the visual-regression checklist in
 * `BookLightningLane.visual.test.ts` can pin the exact HSL strings and
 * catch any silent gold-tone drift.
 */
export const BURNISHED_GOLD = {
  /** Pill / chip surface — tint fill + gold ink + soft gold border. */
  surface: {
    backgroundColor: 'hsl(var(--gold) / 0.12)',
    color: 'hsl(var(--gold))',
    border: '1px solid hsl(var(--gold) / 0.45)',
  } as const,
  /** Inked-only — heart icon, footer countdown text. */
  ink: 'hsl(var(--gold))',
  /** Standard watching card border (un-locked / un-armed). */
  borderWatching: '1.5px solid hsl(var(--gold) / 0.45)',
  /** Stronger border when the row is BOTH watching AND locked — same hue,
   *  one weight up so the priming reads at a glance. */
  borderArmed: '1.5px solid hsl(var(--gold) / 0.65)',
  /** Ambient glow paired with `borderWatching` — used on any surface that
   *  collects or represents one or more watching rows (e.g. the watchlist
   *  strip header). Quieter than the armed glow so a non-armed watching
   *  surface doesn't compete with an armed row inside it. */
  glowWatching: '0 4px 14px hsl(var(--gold) / 0.10)',
  /** Stronger glow paired with `borderArmed` — only used on a row that is
   *  BOTH watching AND locked, where the heightened halo signals "primed,
   *  ready to fire the moment the lock lifts". */
  glowArmed: '0 6px 18px hsl(var(--gold) / 0.18)',
  /**
   * Borderless tinted pill — used for small editorial labels that wear gold
   * as a category badge (Must-Do, ILL price). Differs from `surface` by
   * design: no border, since these badges are typographic micro-pills, not
   * interactive surfaces. Both prior call-sites used slightly different
   * opacities (0.10 vs 0.15) — collapsed to 0.12 to lock parity with
   * `surface.backgroundColor`.
   */
  pill: {
    backgroundColor: 'hsl(var(--gold) / 0.12)',
    color: 'hsl(var(--gold))',
  } as const,
  /**
   * Must-Do row border — heavier than `borderWatching` so the user's own
   * Must-Do pin reads as the editorial peak of the gold ladder, even when
   * sitting next to a watching/armed row. Watching > Must-Do > ordinary.
   */
  borderMustDo: '1.5px solid hsl(var(--gold) / 0.6)',
  /** Glow paired with `borderMustDo` — same intensity as `glowWatching` so
   *  the Must-Do row sits one notch *under* the armed row in halo weight. */
  glowMustDo: '0 4px 14px hsl(var(--gold) / 0.10)',
  /**
   * Recommendation hero card — the editorial banner that surfaces the
   * suggested must-do pick the moment the booking window opens. Mirrors
   * the LL alert banner's gold gradient + ring so the two surfaces feel
   * like one family. Grouped here so the gold-purity test passes and so
   * any future tweak flows through one place.
   */
  recommendation: {
    surface: {
      background:
        'linear-gradient(180deg, hsl(var(--gold) / 0.14) 0%, hsl(var(--gold) / 0.05) 100%)',
      boxShadow:
        '0 0 0 1px hsl(var(--gold) / 0.32), 0 8px 22px hsl(var(--obsidian) / 0.05)',
    } as const,
    /** Filled medallion — same family as the alert banner icon chip. */
    medallion: {
      background: 'hsl(var(--gold))',
      color: 'hsl(var(--parchment))',
    } as const,
    /** Primary "Book now" CTA inside the card. */
    action: {
      background: 'hsl(var(--gold))',
      color: 'hsl(var(--parchment))',
    } as const,
  },
} as const;

/**
 * /book-ll — the manual Browse & Book surface.
 *
 * Sort logic:
 *   1. Must-Dos NOT yet ridden, NOT yet held → top
 *   2. Standard inventory by shortest standby (best value)
 *   3. Already-held → small "Held" pill, kept in list, dimmed
 *   4. Ridden Must-Dos → de-emphasized at the bottom of the standard section
 *
 * ILLs render in their own section below.
 */
const BookLightningLane = () => {
  const navigate = useNavigate();
  const { fire } = useHaptics();
  const { tier } = useCompanion();
  // Shared LL state — held bookings and the park-time clock live in
  // LightningLaneProvider so the /park alert banner stays aligned with
  // anything booked here, even after navigating away and back.
  const { holds, addHold, nowMinutes, summary } = useLightningLane();
  // Track holds added in this session so we can offer a "see it on your stack"
  // ribbon — keeps the user oriented after a booking instead of stranding them.
  const [sessionAdds, setSessionAdds] = useState(0);
  // Urgency filter — narrows the LL list by typical sell-out window so a guest
  // racing the clock can focus on what's actually slipping away. `all` is the
  // default so nothing is hidden until the guest opts in.
  const [urgency, setUrgency] = useState<'all' | '1h' | '2h' | 'later'>('all');

  const heldIds = useMemo(() => new Set(holds.map((h) => h.attractionId)), [holds]);

  // Tier-aware sorting for the LL section.
  //
  // Primary signal is now "earliest typical sell-out time" — the most urgent
  // grabs surface first. Must-Dos still pin to the top of their bucket so the
  // guest never has to scroll past noise to find their priorities; held and
  // ridden rows sink. Within each bucket, earlier sellout wins.
  const llOrdered = useMemo(() => {
    const ll = LL_INVENTORY.filter((a) => a.type === 'll');
    // Apply the urgency filter first so bucket counts reflect what the guest
    // is actually seeing.
    const filtered = ll.filter((a) => {
      if (urgency === 'all') return true;
      const minsUntil = a.typicalSelloutMin - nowMinutes;
      if (urgency === '1h') return minsUntil <= 60;          // includes already-past
      if (urgency === '2h') return minsUntil > 60 && minsUntil <= 120;
      return minsUntil > 120;                                // 'later'
    });
    const bucket = (a: LLAttraction) => {
      const held = heldIds.has(a.id);
      const ridden = isRidden(a.name, MOCK_MUST_DOS);
      const must = isMustDo(a.name, MOCK_MUST_DOS);
      if (must && !held && !ridden) return 0; // pinned Must-Do
      if (held) return 2;
      if (ridden) return 3;
      return 1; // standard inventory
    };
    return filtered
      .slice()
      .sort((a, b) => {
        const ba = bucket(a);
        const bb = bucket(b);
        if (ba !== bb) return ba - bb;
        return a.typicalSelloutMin - b.typicalSelloutMin;
      });
  }, [heldIds, urgency, nowMinutes]);

  // ILLs always sort by earliest sellout — these go fastest.
  const illOrdered = useMemo(
    () =>
      LL_INVENTORY.filter((a) => a.type === 'ill').sort(
        (a, b) => a.typicalSelloutMin - b.typicalSelloutMin,
      ),
    [],
  );

  /**
   * Recommended pick — surfaces the highest-value standard LL the guest
   * should grab right now, so the booking window never opens to a blank
   * slate. Selection rules, in order:
   *
   *   1. Must-Do, not yet held, not yet ridden, with the earliest typical
   *      sellout time — i.e. the priority ride most likely to be gone.
   *   2. If no must-dos qualify, fall back to the earliest-sellout standard
   *      LL that's still grabbable (not held, not ridden).
   *
   * Returns `null` when nothing is bookable (capacity locked or list empty)
   * so the card can stay hidden rather than mislead.
   */
  const recommendedPick = useMemo(() => {
    if (!summary.canBookLLNow) return null;
    const grabbable = LL_INVENTORY.filter(
      (a) =>
        a.type === 'll' &&
        !heldIds.has(a.id) &&
        !isRidden(a.name, MOCK_MUST_DOS),
    );
    if (grabbable.length === 0) return null;
    const mustDos = grabbable
      .filter((a) => isMustDo(a.name, MOCK_MUST_DOS))
      .sort((a, b) => a.typicalSelloutMin - b.typicalSelloutMin);
    if (mustDos.length > 0) {
      return { attraction: mustDos[0], reason: 'must-do' as const };
    }
    const fallback = grabbable
      .slice()
      .sort((a, b) => a.typicalSelloutMin - b.typicalSelloutMin);
    return { attraction: fallback[0], reason: 'urgency' as const };
  }, [heldIds, summary.canBookLLNow]);

  const handleBook = (a: LLAttraction, windowId: BookWindowId = 'asap') => {
    const isILL = a.type === 'ill';
    if (isILL && !summary.canBookILL) {
      toast.error('Daily Individual Lightning Lane cap reached.');
      return false;
    }
    if (!isILL && !summary.canBookLLNow) {
      toast.error(`Next standard slot unlocks in ${formatCountdown(summary.llUnlocksInMin)}.`);
      return false;
    }
    const window = BOOK_WINDOWS.find((w) => w.id === windowId) ?? BOOK_WINDOWS[0];
    // ASAP → standard 1-hour return from now. Time-of-day → that window's
    // start, but never earlier than the next available slot (now + 60).
    const earliest = nowMinutes + 60;
    const requestedStart =
      window.startMin === null ? earliest : Math.max(earliest, window.startMin);
    if (window.startMin !== null && nowMinutes >= window.endMin) {
      toast.error(`${window.label} window has already passed today.`);
      return false;
    }
    fire('bookingSuccess');
    const newHold: HeldLL = {
      id: `h-${Date.now()}`,
      attractionId: a.id,
      type: a.type,
      bookedAtMin: nowMinutes,
      windowStartMin: requestedStart,
      status: 'held',
    };
    addHold(newHold);
    setSessionAdds((n) => n + 1);
    if (window.id !== 'asap') {
      toast.success(`Requested ${window.label.toLowerCase()} · ${a.name}`, {
        description: `Window starts ${formatClockTime(requestedStart)}.`,
        duration: 5000,
      });
    }
    // Single confirmation surface — the sticky "Return to your day" ribbon
    // already announces session adds. Avoid double-firing the same signal.
    return true;
  };

  // Watchlist — pre-selected lanes the guest wants alerted/auto-booked when
  // their slot opens. The hook decides per-tier whether to auto-book or just
  // surface a tap-to-book alert. We mark the booked entry once handleBook
  // succeeds so the strip can show the success state.
  const watchlist = useLLWatchlist({
    nowMinutes,
    canBookNow: summary.canBookLLNow,
    onAutoBook: (attraction) => handleBook(attraction),
    onAlert: (attraction, mode) => {
      if (mode === 'auto-book') {
        // Long pulse — the booking landed cleanly.
        fire('bookingSuccess');
        toast.success(`Auto-booked · ${attraction.name}`, {
          description: 'Your held stack just grew. Window opens in 60 min.',
          duration: 6000,
          action: {
            label: 'View stack',
            onClick: () => navigate('/park'),
          },
        });
      } else if (mode === 'auto-book-failed') {
        // Double pulse + error toast — auto-book tried and missed; the guest
        // needs to step in.
        fire('recommendation');
        toast.error(`Couldn't auto-book ${attraction.name}`, {
          description: 'Capacity slipped. Tap to try booking it now.',
          duration: 8000,
          action: {
            label: 'Book now',
            onClick: () => handleWatchlistBookNow(attraction),
          },
        });
      } else {
        // Watching → alerted for explorers. Double pulse signals "new
        // opportunity surfaced", matching the recommendation language.
        fire('recommendation');
        toast(`${attraction.name} is open!`, {
          description: 'Your watched window just opened. Tap to grab it.',
          duration: 8000,
          action: {
            label: 'Book now',
            onClick: () => handleWatchlistBookNow(attraction),
          },
        });
      }
    },
  });

  // When the guest taps "Book" on an alerted entry, run the standard
  // booking flow and reflect the outcome on the watchlist row.
  const handleWatchlistBookNow = useCallback(
    (attraction: LLAttraction) => {
      const ok = handleBook(attraction);
      if (ok) watchlist.markBooked(attraction.id);
    },
    // handleBook closes over nowMinutes/summary which are already reactive
    // through the parent render. Keeping deps minimal to avoid stale closures
    // on watchlist methods.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [watchlist.markBooked, nowMinutes, summary.canBookLLNow, summary.canBookILL],
  );

  return (
    <div className="min-h-screen bg-background digital-plaid-bg max-w-[480px] mx-auto pb-32">
      <PageHeader
        backTo="/park"
        backLabel="Your day"
        eyebrow="Browse & Book"
        title="Lightning Lane"
      >
        <CapacityMeter summary={summary} />
      </PageHeader>

      <main className="px-5 pt-5 space-y-6">
        <WatchlistStrip
          entries={watchlist.entries}
          nowMinutes={nowMinutes}
          tier={tier}
          onUnwatch={watchlist.unwatch}
          onBookNow={handleWatchlistBookNow}
          onRearm={watchlist.rearm}
        />

        {/*
         * Recommended pick — never let the booking window open to a
         * blank slate. Surfaces the must-do that's selling out soonest
         * (or the most urgent grabbable LL if no must-dos qualify) with
         * a single one-tap Book affordance.
         */}
        {recommendedPick && (
          <section
            aria-label="Concierge recommendation"
            className="rounded-xl px-4 py-3.5 flex items-center gap-3"
            style={BURNISHED_GOLD.recommendation.surface}
          >
            <span
              className="shrink-0 flex items-center justify-center rounded-full"
              style={{
                width: '36px',
                height: '36px',
                ...BURNISHED_GOLD.recommendation.medallion,
              }}
              aria-hidden="true"
            >
              <Sparkles size={16} />
            </span>
            <div className="flex-1 min-w-0">
              <p
                className="font-sans text-[8px] uppercase font-bold leading-none mb-1"
                style={{ color: BURNISHED_GOLD.ink, letterSpacing: '0.16em' }}
              >
                {recommendedPick.reason === 'must-do'
                  ? 'Recommended · Your Must-Do'
                  : 'Recommended · Going Fast'}
              </p>
              <p className="font-display text-[15px] leading-tight text-foreground truncate">
                {recommendedPick.attraction.name}
              </p>
              <p className="font-sans text-[10px] mt-0.5 text-muted-foreground tabular-nums truncate">
                Typically sells out by {formatClockTime(recommendedPick.attraction.typicalSelloutMin)}
                {' · '}
                {recommendedPick.attraction.standbyMin}m standby
              </p>
            </div>
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => handleBook(recommendedPick.attraction, 'asap')}
              className="shrink-0 inline-flex items-center justify-center gap-1 rounded-lg px-3 font-sans text-[11px] font-semibold border-none cursor-pointer"
              style={{
                minHeight: '44px',
                ...BURNISHED_GOLD.recommendation.action,
                letterSpacing: '0.04em',
              }}
              aria-label={`Book ${recommendedPick.attraction.name} now`}
            >
              Book now
            </motion.button>
          </section>
        )}

        {/* Standard LL section */}
        <section>
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="font-sans text-[9px] uppercase tracking-sovereign text-muted-foreground font-semibold">
              Standard Multi-Pass
            </span>
            <span className="font-sans text-[9px] tabular-nums" style={{ color: BURNISHED_GOLD.ink }}>
              {llOrdered.length} options
            </span>
          </div>
          {/* Color legend for the SelloutChip — tiny, persistent affordance so
              guests learn the urgency mapping without needing to hover each
              chip. Mirrors the exact thresholds used inside SelloutChip. */}
          <SelloutLegend />
          {/* Urgency filter — chip row that narrows the list by typical
              sell-out window. Sits between the legend (which teaches the
              color scale) and the list (which uses it). */}
          <UrgencyFilter value={urgency} onChange={setUrgency} />
          {llOrdered.length === 0 ? (
            <EmptyState
              eyebrow="All caught up"
              title={urgency === 'all' ? 'No standard lanes left to grab.' : 'Nothing in this window.'}
              hint={urgency === 'all' ? 'Tap Refresh on your day to recheck the inventory.' : 'Try a different urgency filter above.'}
            />
          ) : (
          <ul className="list-none p-0 m-0 space-y-2">
            {llOrdered.map((a) => {
              const held = heldIds.has(a.id);
              const ridden = isRidden(a.name, MOCK_MUST_DOS);
              const must = isMustDo(a.name, MOCK_MUST_DOS) && !ridden;
              const dim = held || ridden;
              const disabled = held || !summary.canBookLLNow;
              return (
                <RideRow
                  key={a.id}
                  attraction={a}
                  held={held}
                  ridden={ridden}
                  mustDo={must}
                  dim={dim}
                  disabled={disabled}
                  lockReason={!summary.canBookLLNow && !held ? `Unlocks in ${formatCountdown(summary.llUnlocksInMin)}` : undefined}
                  onBook={(windowId) => handleBook(a, windowId)}
                  nowMinutes={nowMinutes}
                  isWatching={watchlist.isWatching(a.id)}
                  onUnwatch={() => {
                    // Snapshot the entry's frozen openAt so the undo button
                    // can restore the exact same watch (preferred window
                    // included) instead of starting a fresh "next available".
                    const prev = watchlist.entries.find((e) => e.attractionId === a.id);
                    watchlist.unwatch(a.id);
                    fire('selection');
                    toast(`Removed · ${a.name}`, {
                      description: 'No longer watching for an opening.',
                      duration: 4500,
                      action: prev
                        ? {
                            label: 'Undo',
                            onClick: () => {
                              watchlist.watch(a.id, prev.openAtMin);
                              toast.success(`Watching · ${a.name}`, {
                                description: 'Watch restored.',
                                duration: 3000,
                              });
                            },
                          }
                        : undefined,
                    });
                  }}
                  onWatchWindow={(windowId) => {
                    const w = BOOK_WINDOWS.find((x) => x.id === windowId) ?? BOOK_WINDOWS[0];
                    const nextAvail = nowMinutes + Math.max(1, summary.llUnlocksInMin);
                    const openAt = w.startMin === null ? nextAvail : Math.max(nextAvail, w.startMin);
                    watchlist.watch(a.id, openAt);
                    fire('selection');
                    toast.success(`Watching · ${a.name}`, {
                      description:
                        w.id === 'asap'
                          ? `Added to your watchlist — we'll alert the moment a slot opens.`
                          : `Added to your watchlist — targeting the ${w.label.toLowerCase()} window (${w.hint}).`,
                      duration: 4500,
                      action: {
                        label: 'Undo',
                        onClick: () => {
                          watchlist.unwatch(a.id);
                          toast(`Removed · ${a.name}`, {
                            description: 'Watch cancelled.',
                            duration: 3000,
                          });
                        },
                      },
                    });
                  }}
                />
              );
            })}
          </ul>
          )}
        </section>

        {/* ILL section */}
        <section>
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="font-sans text-[9px] uppercase tracking-sovereign text-muted-foreground font-semibold">
              Individual Lightning Lane
            </span>
            <span className="font-sans text-[9px] tabular-nums" style={{ color: BURNISHED_GOLD.ink }}>
              {summary.illUsedCount} / {summary.illCapTotal} used
            </span>
          </div>
          {illOrdered.length === 0 ? (
            <EmptyState
              eyebrow="None today"
              title="No headliners on the menu."
              hint="Individual lanes refresh nightly."
            />
          ) : (
          <ul className="list-none p-0 m-0 space-y-2">
            {illOrdered.map((a) => {
              const held = heldIds.has(a.id);
              const disabled = held || !summary.canBookILL;
              return (
                <RideRow
                  key={a.id}
                  attraction={a}
                  held={held}
                  ridden={false}
                  mustDo={false}
                  dim={held}
                  disabled={disabled}
                  lockReason={!summary.canBookILL && !held ? 'Daily cap reached' : undefined}
                  onBook={(windowId) => handleBook(a, windowId)}
                  nowMinutes={nowMinutes}
                  isWatching={watchlist.isWatching(a.id)}
                  onUnwatch={() => {
                    const prev = watchlist.entries.find((e) => e.attractionId === a.id);
                    watchlist.unwatch(a.id);
                    fire('selection');
                    toast(`Removed · ${a.name}`, {
                      description: 'No longer watching for an opening.',
                      duration: 4500,
                      action: prev
                        ? {
                            label: 'Undo',
                            onClick: () => {
                              watchlist.watch(a.id, prev.openAtMin);
                              toast.success(`Watching · ${a.name}`, {
                                description: 'Watch restored.',
                                duration: 3000,
                              });
                            },
                          }
                        : undefined,
                    });
                  }}
                  onWatchWindow={(windowId) => {
                    const w = BOOK_WINDOWS.find((x) => x.id === windowId) ?? BOOK_WINDOWS[0];
                    const openAt = w.startMin === null ? nowMinutes : Math.max(nowMinutes, w.startMin);
                    watchlist.watch(a.id, openAt);
                    fire('selection');
                    toast.success(`Watching · ${a.name}`, {
                      description:
                        w.id === 'asap'
                          ? `Added to your watchlist — we'll alert the moment a slot opens.`
                          : `Added to your watchlist — targeting the ${w.label.toLowerCase()} window (${w.hint}).`,
                      duration: 4500,
                      action: {
                        label: 'Undo',
                        onClick: () => {
                          watchlist.unwatch(a.id);
                          toast(`Removed · ${a.name}`, {
                            description: 'Watch cancelled.',
                            duration: 3000,
                          });
                        },
                      },
                    });
                  }}
                />
              );
            })}
          </ul>
          )}
        </section>
      </main>

      {/* Sticky "Return to your day" ribbon — appears after the user has
          secured at least one new hold this session. Keeps the booking
          surface from feeling like a dead-end and pulls the user back to
          /park where the new hold is reflected on the Hero stack. */}
      {sessionAdds > 0 && (
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 w-[min(440px,calc(100vw-24px))]"
        >
          <button
            type="button"
            onClick={() => navigate('/park')}
            className="w-full rounded-2xl py-3.5 px-5 flex items-center justify-between gap-2 border-none cursor-pointer min-h-[48px] font-sans text-[12px] font-semibold"
            style={{
              backgroundColor: 'hsl(var(--obsidian))',
              color: 'hsl(var(--parchment))',
              boxShadow: '0 16px 36px hsl(var(--obsidian) / 0.32)',
            }}
          >
            <span className="flex items-center gap-2">
              <Check size={14} style={{ color: BURNISHED_GOLD.ink }} />
              {sessionAdds === 1 ? '1 new hold secured' : `${sessionAdds} new holds secured`}
            </span>
            <span className="flex items-center gap-1.5" style={{ color: BURNISHED_GOLD.ink }}>
              See it on your stack
              <ArrowRight size={14} />
            </span>
          </button>
        </motion.div>
      )}
    </div>
  );
};

interface RideRowProps {
  attraction: LLAttraction;
  held: boolean;
  ridden: boolean;
  mustDo: boolean;
  dim: boolean;
  disabled: boolean;
  lockReason?: string;
  onBook: (windowId: BookWindowId) => void;
  /** Park-time used by the Sellout chip. */
  nowMinutes: number;
  /** Whether this lane is on the watchlist — drives the heart-toggle icon. */
  isWatching: boolean;
  /** Remove this lane from the watchlist. */
  onUnwatch: () => void;
  /** Add this lane to the watchlist with a preferred booking window. */
  onWatchWindow: (windowId: BookWindowId) => void;
}

/**
 * Split-button booking control. Primary tap = "Book ASAP" (next available
 * 1-hour return slot); the chevron opens a menu of time-of-day windows
 * (morning / afternoon / early evening / evening) so guests can request a
 * return slot that fits the rest of their day. Past windows are disabled
 * automatically based on park-time.
 */
interface BookSplitButtonProps {
  attraction: LLAttraction;
  held: boolean;
  disabled: boolean;
  lockReason?: string;
  nowMinutes: number;
  onBook: (windowId: BookWindowId) => void;
  /** When true, the lane is locked AND the guest has armed a watch on it.
   *  Renders a gold "Armed · Locked" pill instead of the neutral grey one
   *  so the locked CTA reads as "primed, waiting for unlock" rather than
   *  "dead-end". */
  armed?: boolean;
}

const BookSplitButton = ({
  attraction,
  held,
  disabled,
  lockReason,
  nowMinutes,
  onBook,
  armed = false,
}: BookSplitButtonProps) => {
  if (held) {
    return (
      <span
        className="rounded-xl px-4 py-2.5 font-sans text-[12px] font-semibold flex items-center gap-1.5 min-h-[40px]"
        style={{
          backgroundColor: 'hsl(var(--accent) / 0.15)',
          color: 'hsl(var(--accent))',
        }}
      >
        <Check size={12} /> Held
      </span>
    );
  }

  if (disabled) {
    if (armed) {
      // Watch is armed AND lane is locked. Combined state: the system will
      // act for the guest as soon as the lock lifts. Gold-tinted pill +
      // heart icon ties this back to the heart in the row header.
      return (
        <span
          className="rounded-xl px-4 py-2.5 font-sans text-[12px] font-semibold flex items-center gap-1.5 min-h-[40px]"
          title={lockReason ? `Armed — ${lockReason}` : 'Armed — waiting to unlock'}
          style={{
            ...BURNISHED_GOLD.surface,
            cursor: 'not-allowed',
          }}
          aria-label={
            lockReason
              ? `Armed and waiting. ${lockReason}.`
              : 'Armed and waiting to unlock.'
          }
        >
          <Heart size={12} fill="currentColor" /> Armed · Locked
        </span>
      );
    }
    return (
      <span
        className="rounded-xl px-4 py-2.5 font-sans text-[12px] font-semibold flex items-center gap-1.5 min-h-[40px]"
        title={lockReason}
        style={{
          backgroundColor: 'hsl(var(--obsidian) / 0.06)',
          color: 'hsl(var(--slate-plaid))',
          cursor: 'not-allowed',
        }}
      >
        <Lock size={12} /> Locked
      </span>
    );
  }

  return (
    <div className="flex items-stretch overflow-hidden rounded-xl" style={{ backgroundColor: 'hsl(var(--primary))' }}>
      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={() => onBook('asap')}
        aria-label={`Book ${attraction.name} ASAP`}
        className="px-3.5 py-2.5 border-none font-sans text-[12px] font-semibold flex items-center gap-1.5 min-h-[40px] cursor-pointer"
        style={{
          backgroundColor: 'hsl(var(--primary))',
          color: 'hsl(var(--primary-foreground))',
        }}
      >
        Book ASAP
      </motion.button>
      <span className="w-px" style={{ backgroundColor: 'hsl(var(--primary-foreground) / 0.18)' }} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`Pick a time-of-day to book ${attraction.name}`}
            className="px-2.5 border-none cursor-pointer flex items-center justify-center min-h-[40px]"
            style={{
              backgroundColor: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
            }}
          >
            <ChevronDown size={14} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-sans text-[9px] uppercase tracking-sovereign text-muted-foreground">
            Pick a return window
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {BOOK_WINDOWS.map((w) => {
            const passed = w.startMin !== null && nowMinutes >= w.endMin;
            return (
              <DropdownMenuItem
                key={w.id}
                disabled={passed}
                onSelect={() => onBook(w.id)}
                className="flex items-center justify-between gap-3"
              >
                <span className="font-sans text-[12px] font-semibold">
                  {w.label}
                </span>
                <span
                  className="font-sans text-[10px] tabular-nums"
                  style={{ color: passed ? 'hsl(var(--slate-plaid) / 0.5)' : 'hsl(var(--slate-plaid))' }}
                >
                  {passed ? 'Passed' : w.hint}
                </span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

const RideRow = ({
  attraction,
  held,
  ridden,
  mustDo,
  dim,
  disabled,
  lockReason,
  onBook,
  nowMinutes,
  isWatching,
  onUnwatch,
  onWatchWindow,
}: RideRowProps) => {
  const isILL = attraction.type === 'ill';
  // Combined "armed + locked" state — the heart is engaged but the lane
  // can't be booked yet. We tighten the card border to gold and switch
  // both the heart and the CTA to a coordinated "Armed" treatment so the
  // two surfaces tell the same story.
  const armedLocked = isWatching && disabled && !held;
  return (
    <li
      className="rounded-2xl p-4 bg-card transition-opacity"
      style={{
        // Card border ladder — all gold weights flow from BURNISHED_GOLD so
        // the heart, the armed pill, and the row outline stay locked together.
        // Must-Do (no watch) keeps a slightly heavier border to preserve its
        // editorial pin without colliding with the burnished hue.
        border: armedLocked
          ? BURNISHED_GOLD.borderArmed
          : isWatching
            ? BURNISHED_GOLD.borderWatching
            : mustDo
              ? BURNISHED_GOLD.borderMustDo
              : '1px solid hsl(var(--obsidian) / 0.05)',
        boxShadow: armedLocked
          ? BURNISHED_GOLD.glowArmed
          : mustDo
            ? BURNISHED_GOLD.glowMustDo
            : '0 4px 12px hsl(var(--obsidian) / 0.03)',
        opacity: dim ? 0.55 : 1,
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
            {mustDo && (
              <span
                className="inline-flex items-center gap-1 font-sans text-[8px] uppercase tracking-sovereign font-bold px-1.5 py-0.5 rounded-full"
                style={BURNISHED_GOLD.pill}
              >
                <Star size={9} fill="currentColor" /> Must-Do
              </span>
            )}
            {ridden && (
              <span className="inline-flex items-center gap-1 font-sans text-[8px] uppercase tracking-sovereign font-semibold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'hsl(var(--obsidian) / 0.06)', color: 'hsl(var(--slate-plaid))' }}>
                <Check size={9} /> Ridden
              </span>
            )}
            {held && (
              <span className="inline-flex items-center gap-1 font-sans text-[8px] uppercase tracking-sovereign font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'hsl(var(--accent) / 0.18)', color: 'hsl(var(--accent))' }}>
                <Zap size={9} /> Held
              </span>
            )}
            {isILL && (
              <span
                className="font-sans text-[8px] uppercase tracking-sovereign font-bold px-1.5 py-0.5 rounded-full"
                style={BURNISHED_GOLD.pill}
              >
                ILL · ${attraction.priceUsd}
              </span>
            )}
          </div>
          <h3 className="text-headline text-primary truncate">
            {attraction.name}
          </h3>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="font-sans text-[10px] text-muted-foreground flex items-center gap-1">
              <MapPin size={9} /> {attraction.land}
            </span>
            <span className="font-sans text-[10px] text-muted-foreground flex items-center gap-1 tabular-nums">
              <Clock size={9} /> {attraction.standbyMin}m standby
            </span>
            <SelloutChip selloutMin={attraction.typicalSelloutMin} nowMinutes={nowMinutes} />
          </div>
        </div>
        {/* Heart watch picker — pre-select this lane to be alerted (or
            auto-booked, depending on tier) when its preferred booking window
            opens. If already watching, tapping the heart removes it. If not,
            tapping opens a window picker (Next Available + time-of-day). */}
        {isWatching ? (
          <button
            type="button"
            onClick={onUnwatch}
            aria-pressed
            aria-label={
              armedLocked
                ? `Armed — will alert when ${attraction.name} unlocks. Tap to remove.`
                : `Stop watching ${attraction.name}`
            }
            title={
              armedLocked
                ? 'Armed — waiting for the lane to unlock. Tap to remove.'
                : 'Watching — tap to remove'
            }
            className="relative shrink-0 rounded-full p-2 bg-transparent border-none cursor-pointer flex items-center justify-center min-h-[36px] min-w-[36px] outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary/40"
            style={{ color: BURNISHED_GOLD.ink }}
          >
            <Heart
              size={16}
              fill="currentColor"
              className={armedLocked ? 'animate-pulse' : ''}
            />
            {armedLocked && (
              <span
                aria-hidden="true"
                className="absolute top-1 right-1 rounded-full animate-pulse"
                style={{
                  width: 6,
                  height: 6,
                  backgroundColor: BURNISHED_GOLD.ink,
                  boxShadow: '0 0 0 2px hsl(var(--card))',
                }}
              />
            )}
          </button>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={`Watch ${attraction.name} — pick a preferred booking window`}
                title="Pre-select to alert at open"
                className="shrink-0 rounded-full p-2 bg-transparent border-none cursor-pointer flex items-center justify-center min-h-[36px] min-w-[36px] outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary/40"
                style={{ color: 'hsl(var(--slate-plaid))' }}
              >
                <Heart size={16} fill="none" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel className="font-sans text-[9px] uppercase tracking-sovereign text-muted-foreground">
                Watch for which window?
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {BOOK_WINDOWS.map((w) => {
                const passed = w.startMin !== null && nowMinutes >= w.endMin;
                return (
                  <DropdownMenuItem
                    key={w.id}
                    disabled={passed}
                    onSelect={() => onWatchWindow(w.id)}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="font-sans text-[12px] font-semibold">
                      {w.id === 'asap' ? 'Next available' : w.label}
                    </span>
                    <span
                      className="font-sans text-[10px] tabular-nums"
                      style={{ color: passed ? 'hsl(var(--slate-plaid) / 0.5)' : 'hsl(var(--slate-plaid))' }}
                    >
                      {passed ? 'Passed' : w.hint}
                    </span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <p className="font-sans italic text-[11px] text-foreground/65 leading-snug mb-3">
        {attraction.blurb}
      </p>

      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <span className="font-sans text-[8px] uppercase tracking-sovereign text-muted-foreground font-semibold block">
            Next window
          </span>
          <span className="font-display text-[14px] tabular-nums text-foreground">
            {attraction.nextWindow}
          </span>
        </div>
        <BookSplitButton
          attraction={attraction}
          held={held}
          disabled={disabled}
          lockReason={lockReason}
          nowMinutes={nowMinutes}
          onBook={onBook}
          armed={armedLocked}
        />
      </div>
      {lockReason && !held && (
        <p
          className="font-sans text-[9px] mt-1.5 tabular-nums text-right"
          style={{ color: armedLocked ? BURNISHED_GOLD.ink : 'hsl(var(--slate-plaid))' }}
        >
          {armedLocked ? `Armed · ${lockReason}` : lockReason}
        </p>
      )}
    </li>
  );
};

export default BookLightningLane;

/**
 * Compact three-dot legend that demystifies the SelloutChip color scale.
 * Sits directly under the section header so the affordance is in-view the
 * moment the guest scans the list. Uses the same HSL tokens the chip uses,
 * keeping the two surfaces visually locked.
 */
const SelloutLegend = () => {
  // NOTE — gold here is a *data value* in the sell-out urgency taxonomy
  // (magenta = "going fast", gold = "soon", slate = "plenty of time"),
  // NOT the burnished editorial gold. It deliberately stays as a raw HSL
  // string so a future palette swap of either scale is independent of
  // the other. Do not refactor to BURNISHED_GOLD.ink — see the test
  // `BookLightningLane.token-purity.test.ts` for the locked exceptions.
  const items: { color: string; label: string }[] = [
    { color: 'hsl(316 95% 35%)', label: 'Going fast' },
    { color: 'hsl(var(--gold))', label: 'Soon' },
    { color: 'hsl(var(--slate-plaid))', label: 'Plenty of time' },
  ];
  return (
    <div
      className="flex items-center gap-3 mb-2 px-2 py-1.5 rounded-lg flex-wrap"
      style={{ backgroundColor: 'hsl(var(--obsidian) / 0.03)' }}
      aria-label="Sell-out urgency color legend"
    >
      <span className="font-sans text-[8px] uppercase tracking-sovereign text-muted-foreground font-semibold">
        Usually gone by
      </span>
      {items.map((it) => (
        <span key={it.label} className="flex items-center gap-1 font-sans text-[9px] text-foreground/70">
          <span
            aria-hidden="true"
            className="inline-block rounded-full"
            style={{ width: 6, height: 6, backgroundColor: it.color }}
          />
          {it.label}
        </span>
      ))}
    </div>
  );
};

/**
 * Urgency filter chip row. Each chip narrows the LL list to a sell-out
 * window so a guest can focus on what's actually slipping. The active chip
 * uses the same HSL token as its corresponding SelloutChip color, reinforcing
 * the legend → filter → list color story.
 */
type UrgencyValue = 'all' | '1h' | '2h' | 'later';
// NOTE — see SelloutLegend above. Gold here is a taxonomy data value,
// intentionally not consumed through BURNISHED_GOLD.
const URGENCY_CHIPS: { value: UrgencyValue; label: string; color: string; description: string }[] = [
  { value: 'all',   label: 'All',         color: 'hsl(var(--obsidian))',     description: 'Show every standard Lightning Lane.' },
  { value: '1h',    label: 'Within 1h',   color: 'hsl(316 95% 35%)',         description: 'Lanes typically sold out within the next hour — going fast.' },
  { value: '2h',    label: 'Within 2h',   color: 'hsl(var(--gold))',         description: 'Lanes typically sold out within the next two hours — soon.' },
  { value: 'later', label: 'Later',       color: 'hsl(var(--slate-plaid))',  description: 'Lanes that usually stay available past two hours — plenty of time.' },
];

const UrgencyFilter = ({ value, onChange }: { value: UrgencyValue; onChange: (v: UrgencyValue) => void }) => {
  // Roving-tabindex pattern — only the active radio is in the tab order, and
  // arrow keys move focus + selection across the group. Matches WAI-ARIA
  // Authoring Practices for radiogroup and the keyboard model used elsewhere.
  const groupRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLButtonElement>, idx: number) => {
    const last = URGENCY_CHIPS.length - 1;
    let nextIdx: number | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') nextIdx = idx === last ? 0 : idx + 1;
    if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   nextIdx = idx === 0 ? last : idx - 1;
    if (e.key === 'Home') nextIdx = 0;
    if (e.key === 'End')  nextIdx = last;
    if (nextIdx === null) return;
    e.preventDefault();
    const next = URGENCY_CHIPS[nextIdx];
    onChange(next.value);
    // Move DOM focus to the newly-selected chip on the next paint so the
    // focus-visible ring follows the selection.
    requestAnimationFrame(() => {
      const btn = groupRef.current?.querySelector<HTMLButtonElement>(
        `[data-urgency="${next.value}"]`,
      );
      btn?.focus();
    });
  };

  return (
    <div
      ref={groupRef}
      className="flex items-center gap-1.5 mb-3 flex-wrap"
      role="radiogroup"
      aria-label="Filter Lightning Lanes by typical sell-out urgency"
    >
      {URGENCY_CHIPS.map((c, idx) => {
        const active = value === c.value;
        const descId = `urgency-desc-${c.value}`;
        return (
          <button
            key={c.value}
            type="button"
            role="radio"
            data-urgency={c.value}
            aria-checked={active}
            aria-label={`${c.label} urgency filter`}
            aria-describedby={descId}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(c.value)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className="font-sans text-[10px] font-semibold px-2.5 py-1.5 rounded-full border transition-colors min-h-[28px] flex items-center gap-1.5 outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary/40 focus-visible:ring-offset-background cursor-pointer"
            style={{
              backgroundColor: active ? `${c.color.replace(')', ' / 0.12)')}` : 'transparent',
              borderColor: active ? c.color : 'hsl(var(--obsidian) / 0.10)',
              color: active ? c.color : 'hsl(var(--slate-plaid))',
            }}
          >
            {c.value !== 'all' && (
              <span
                aria-hidden="true"
                className="inline-block rounded-full"
                style={{ width: 5, height: 5, backgroundColor: c.color }}
              />
            )}
            {c.label}
            {/* Visually-hidden description for screen readers — explains what
                the filter does so the chip label can stay terse. */}
            <span id={descId} className="sr-only">{c.description}</span>
          </button>
        );
      })}
    </div>
  );
};

/**
 * "Usually gone by …" chip — colors itself by urgency:
 *   • Magenta when sellout is within the next 60 minutes (or already past).
 *   • Gold for the next 2 hours.
 *   • Slate otherwise.
 *
 * Wrapped in a tooltip that surfaces a disclaimer on hover/focus: this is a
 * typical pattern from comparable days, NOT a guaranteed cutoff. Disney sells
 * lanes dynamically and any single day can run hotter or cooler.
 *
 * The `title` attribute is kept as a fallback for touch and assistive tech
 * environments where the Radix tooltip may not surface.
 */
const SelloutChip = ({ selloutMin, nowMinutes }: { selloutMin: number; nowMinutes: number }) => {
  const minsUntil = selloutMin - nowMinutes;
  const past = minsUntil <= 0;
  const urgent = !past && minsUntil <= 60;
  const soon = !past && !urgent && minsUntil <= 120;

  const color = past || urgent
    ? 'hsl(316 95% 35%)'
    : soon
      ? 'hsl(var(--gold))'
      : 'hsl(var(--slate-plaid))';

  // Urgency tier in plain words — surfaced both visually (next to the time)
  // and in the aria-label so screen-reader users and color-blind sighted
  // users get the same signal as someone reading the magenta/gold/slate hue.
  const tierLabel = past
    ? 'cutting it close'
    : urgent
      ? 'going fast'
      : soon
        ? 'soon'
        : 'plenty of time';

  const clockTime = formatClockTime(selloutMin);
  const visibleLabel = `Usually gone by ${clockTime}`;

  // Aria-label is built to read naturally: time first, then urgency, then
  // disclaimer. Avoids leaning on color as the sole conveyance.
  const ariaLabel = past
    ? `Sell-out estimate: ${clockTime} park-local time, ${tierLabel}. Estimate from comparable days, not a guaranteed cutoff.`
    : `Sell-out estimate: ${clockTime} park-local time, ${tierLabel}, in ${minsUntil} minutes. Estimate from comparable days, not a guaranteed cutoff.`;

  const disclaimer = past
    ? `Based on comparable days, this lane is usually sold out by ${formatClockTime(selloutMin)} park-local time. Today's actual cutoff can vary — keep checking.`
    : `Estimate from comparable days, shown in park-local time — not a guaranteed cutoff. Today's actual sell-out may run earlier or later.`;

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            tabIndex={0}
            role="button"
            aria-label={ariaLabel}
            className="font-sans text-[10px] flex items-center gap-1 tabular-nums cursor-help underline decoration-dotted underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary/40 rounded"
            style={{ color }}
            title={`${visibleLabel} — ${tierLabel}. ${disclaimer}`}
          >
            <Hourglass size={9} aria-hidden="true" />
            <span>{visibleLabel}</span>
            {/* Visible urgency token — redundant with color so the signal
                survives color-blindness and grayscale rendering. */}
            <span
              className="font-semibold uppercase tracking-sovereign text-[8px] px-1 py-0.5 rounded"
              style={{ backgroundColor: `${color.replace(')', ' / 0.12)')}` }}
            >
              {tierLabel}
            </span>
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" align="start" className="max-w-[240px] text-[11px] leading-snug">
          <p className="font-sans font-bold mb-0.5" style={{ color }}>
            Typical sell-out, not a guarantee
          </p>
          <p className="font-sans text-foreground/80">
            {disclaimer}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};