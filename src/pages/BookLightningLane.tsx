import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, MapPin, Clock, Check, Star, Lock, ArrowRight, Sparkles, Hourglass } from 'lucide-react';
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

const NOW_MINUTES = 11 * 60 + 5; // mock 11:05 AM park-time

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
  const [holds, setHolds] = useState<HeldLL[]>(INITIAL_HOLDS);
  // Track holds added in this session so we can offer a "see it on your stack"
  // ribbon — keeps the user oriented after a booking instead of stranding them.
  const [sessionAdds, setSessionAdds] = useState(0);

  const summary = useMemo(
    () => summarizeCapacity(holds, NOW_MINUTES, DEFAULT_CAPACITY),
    [holds],
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
    const bucket = (a: LLAttraction) => {
      const held = heldIds.has(a.id);
      const ridden = isRidden(a.name, MOCK_MUST_DOS);
      const must = isMustDo(a.name, MOCK_MUST_DOS);
      if (must && !held && !ridden) return 0; // pinned Must-Do
      if (held) return 2;
      if (ridden) return 3;
      return 1; // standard inventory
    };
    return ll
      .slice()
      .sort((a, b) => {
        const ba = bucket(a);
        const bb = bucket(b);
        if (ba !== bb) return ba - bb;
        return a.typicalSelloutMin - b.typicalSelloutMin;
      });
  }, [heldIds]);

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
      return;
    }
    if (!isILL && !summary.canBookLLNow) {
      toast.error(`Next standard slot unlocks in ${formatCountdown(summary.llUnlocksInMin)}.`);
      return;
    }
    fire('bookingSuccess');
    const newHold: HeldLL = {
      id: `h-${Date.now()}`,
      attractionId: a.id,
      type: a.type,
      bookedAtMin: NOW_MINUTES,
      windowStartMin: NOW_MINUTES + 60,
      status: 'held',
    };
    setHolds((prev) => [...prev, newHold]);
    setSessionAdds((n) => n + 1);
    // Single confirmation surface — the sticky "Return to your day" ribbon
    // already announces session adds. Avoid double-firing the same signal.
  };

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
          {llOrdered.length === 0 ? (
            <EmptyState
              eyebrow="All caught up"
              title="No standard lanes left to grab."
              hint="Tap Refresh on your day to recheck the inventory."
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
}

const RideRow = ({ attraction, held, ridden, mustDo, dim, disabled, lockReason, onBook }: RideRowProps) => {
  const isILL = attraction.type === 'ill';
  return (
    <li
      className="rounded-2xl p-4 bg-card transition-opacity"
      style={{
        border: mustDo ? '1.5px solid hsl(var(--gold) / 0.6)' : '1px solid hsl(var(--obsidian) / 0.05)',
        boxShadow: mustDo ? '0 4px 14px hsl(var(--gold) / 0.10)' : '0 4px 12px hsl(var(--obsidian) / 0.03)',
        opacity: dim ? 0.55 : 1,
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-1.5">
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
            <SelloutChip selloutMin={attraction.typicalSelloutMin} />
          </div>
        </div>
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
const SelloutChip = ({ selloutMin }: { selloutMin: number }) => {
  const minsUntil = selloutMin - NOW_MINUTES;
  const past = minsUntil <= 0;
  const urgent = !past && minsUntil <= 60;
  const soon = !past && !urgent && minsUntil <= 120;

  const color = past || urgent
    ? 'hsl(316 95% 35%)'
    : soon
      ? 'hsl(var(--gold))'
      : 'hsl(var(--slate-plaid))';

  const label = past
    ? `Usually gone by ${formatClockTime(selloutMin)} · cutting it close`
    : `Usually gone by ${formatClockTime(selloutMin)}`;

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
            aria-label={`${label}. ${disclaimer}`}
            className="font-sans text-[10px] flex items-center gap-1 tabular-nums cursor-help underline decoration-dotted underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary/40 rounded"
            style={{ color }}
            title={`${label} — ${disclaimer}`}
          >
            <Hourglass size={9} />
            {label}
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