import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, MapPin, Clock, Check, Star, Lock, ArrowRight, Sparkles, Hourglass, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  LL_INVENTORY,
  INITIAL_HOLDS,
  DEFAULT_CAPACITY,
  summarizeCapacity,
  formatCountdown,
  formatClockTime,
  isMustDo,
  isRidden,
  type LLAttraction,
  type HeldLL,
  type MustDoState,
} from '@/data/lightningLanes';
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
 * Mock park-time anchor — 11:05 AM. The page now ticks `nowMinutes` forward
 * every few seconds so the watchlist countdown progresses and "open" events
 * can fire in a session. In production this would be replaced by the device
 * clock (or a server-issued park-time header).
 */
const INITIAL_NOW_MINUTES = 11 * 60 + 5;
/**
 * How fast the mocked park clock advances. 1 wall-second = TICK_MIN_PER_SEC
 * park-minutes. We accelerate it heavily for the prototype so a guest can see
 * a "watch" mature into an "alert" without waiting hours; real usage would
 * use a 1:1 ratio (or just `new Date()`).
 */
const TICK_MIN_PER_SEC = 0.5; // ~30 park-minutes per real minute

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
  const [holds, setHolds] = useState<HeldLL[]>(INITIAL_HOLDS);
  // Stateful park-time clock — drives countdowns, sell-out chips, and the
  // watchlist alert engine. See INITIAL_NOW_MINUTES / TICK_MIN_PER_SEC for
  // the prototype's accelerated tick.
  const [nowMinutes, setNowMinutes] = useState<number>(INITIAL_NOW_MINUTES);
  useEffect(() => {
    const interval = window.setInterval(() => {
      setNowMinutes((n) => n + TICK_MIN_PER_SEC);
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);
  // Track holds added in this session so we can offer a "see it on your stack"
  // ribbon — keeps the user oriented after a booking instead of stranding them.
  const [sessionAdds, setSessionAdds] = useState(0);
  // Urgency filter — narrows the LL list by typical sell-out window so a guest
  // racing the clock can focus on what's actually slipping away. `all` is the
  // default so nothing is hidden until the guest opts in.
  const [urgency, setUrgency] = useState<'all' | '1h' | '2h' | 'later'>('all');

  const summary = useMemo(
    () => summarizeCapacity(holds, nowMinutes, DEFAULT_CAPACITY),
    [holds, nowMinutes],
  );

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

  const handleBook = (a: LLAttraction) => {
    const isILL = a.type === 'ill';
    if (isILL && !summary.canBookILL) {
      toast.error('Daily Individual Lightning Lane cap reached.');
      return false;
    }
    if (!isILL && !summary.canBookLLNow) {
      toast.error(`Next standard slot unlocks in ${formatCountdown(summary.llUnlocksInMin)}.`);
      return false;
    }
    fire('bookingSuccess');
    const newHold: HeldLL = {
      id: `h-${Date.now()}`,
      attractionId: a.id,
      type: a.type,
      bookedAtMin: nowMinutes,
      windowStartMin: nowMinutes + 60,
      status: 'held',
    };
    setHolds((prev) => [...prev, newHold]);
    setSessionAdds((n) => n + 1);
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

        {/* Standard LL section */}
        <section>
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="font-sans text-[9px] uppercase tracking-sovereign text-muted-foreground font-semibold">
              Standard Multi-Pass
            </span>
            <span className="font-sans text-[9px] tabular-nums" style={{ color: 'hsl(var(--gold))' }}>
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
                  onBook={() => handleBook(a)}
                  nowMinutes={nowMinutes}
                  isWatching={watchlist.isWatching(a.id)}
                  onToggleWatch={() =>
                    watchlist.isWatching(a.id)
                      ? watchlist.unwatch(a.id)
                      : watchlist.watch(a.id, nowMinutes + Math.max(1, summary.llUnlocksInMin))
                  }
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
            <span className="font-sans text-[9px] tabular-nums" style={{ color: 'hsl(var(--gold))' }}>
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
                  onBook={() => handleBook(a)}
                  nowMinutes={nowMinutes}
                  isWatching={watchlist.isWatching(a.id)}
                  onToggleWatch={() =>
                    watchlist.isWatching(a.id)
                      ? watchlist.unwatch(a.id)
                      : watchlist.watch(a.id, nowMinutes)
                  }
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
              <Check size={14} style={{ color: 'hsl(var(--gold))' }} />
              {sessionAdds === 1 ? '1 new hold secured' : `${sessionAdds} new holds secured`}
            </span>
            <span className="flex items-center gap-1.5" style={{ color: 'hsl(var(--gold))' }}>
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
  onBook: () => void;
  /** Park-time used by the Sellout chip. */
  nowMinutes: number;
  /** Whether this lane is on the watchlist — drives the heart-toggle icon. */
  isWatching: boolean;
  onToggleWatch: () => void;
}

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
  onToggleWatch,
}: RideRowProps) => {
  const isILL = attraction.type === 'ill';
  return (
    <li
      className="rounded-2xl p-4 bg-card transition-opacity"
      style={{
        border: isWatching
          ? '1.5px solid hsl(var(--gold) / 0.45)'
          : mustDo
            ? '1.5px solid hsl(var(--gold) / 0.6)'
            : '1px solid hsl(var(--obsidian) / 0.05)',
        boxShadow: mustDo ? '0 4px 14px hsl(var(--gold) / 0.10)' : '0 4px 12px hsl(var(--obsidian) / 0.03)',
        opacity: dim ? 0.55 : 1,
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
            {mustDo && (
              <span className="inline-flex items-center gap-1 font-sans text-[8px] uppercase tracking-sovereign font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'hsl(var(--gold) / 0.15)', color: 'hsl(var(--gold))' }}>
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
              <span className="font-sans text-[8px] uppercase tracking-sovereign font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'hsl(var(--gold) / 0.10)', color: 'hsl(var(--gold))' }}>
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
        {/* Heart toggle — pre-select this lane to be alerted (or auto-booked,
            depending on tier) the moment its booking window opens. Always
            visible, including for held lanes (so the guest can re-watch
            after a hold expires) and ridden lanes (low cost, future-proof). */}
        <button
          type="button"
          onClick={onToggleWatch}
          aria-pressed={isWatching}
          aria-label={isWatching ? `Stop watching ${attraction.name}` : `Watch ${attraction.name} for opening`}
          title={isWatching ? 'Watching — tap to remove' : 'Pre-select to alert at open'}
          className="shrink-0 rounded-full p-2 bg-transparent border-none cursor-pointer flex items-center justify-center min-h-[36px] min-w-[36px] outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary/40"
          style={{
            color: isWatching ? 'hsl(var(--gold))' : 'hsl(var(--slate-plaid))',
          }}
        >
          <Heart size={16} fill={isWatching ? 'currentColor' : 'none'} />
        </button>
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
        <motion.button
          whileTap={disabled ? undefined : { scale: 0.97 }}
          onClick={onBook}
          disabled={disabled}
          aria-label={held ? 'Already held' : `Book ${attraction.name}`}
          title={lockReason}
          className="rounded-xl px-4 py-2.5 border-none font-sans text-[12px] font-semibold flex items-center gap-1.5 min-h-[40px]"
          style={{
            backgroundColor: held ? 'hsl(var(--accent) / 0.15)' : disabled ? 'hsl(var(--obsidian) / 0.06)' : 'hsl(var(--primary))',
            color: held ? 'hsl(var(--accent))' : disabled ? 'hsl(var(--slate-plaid))' : 'hsl(var(--primary-foreground))',
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        >
          {held ? (<><Check size={12} /> Held</>) : disabled ? (<><Lock size={12} /> Locked</>) : 'Book'}
        </motion.button>
      </div>
      {lockReason && !held && (
        <p className="font-sans text-[9px] mt-1.5 tabular-nums text-right" style={{ color: 'hsl(var(--slate-plaid))' }}>
          {lockReason}
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