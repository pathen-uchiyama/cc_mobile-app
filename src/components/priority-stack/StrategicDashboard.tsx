import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  TrendingDown,
  Users,
  Utensils,
  Sparkles,
  Plus,
  Eye,
  Bell,
  Check,
  CalendarClock,
  Minus,
} from 'lucide-react';
import { toast } from 'sonner';
import { RESERVATIONS, formatTime, type Reservation } from '@/data/reservations';
import {
  INTEREST_POOL,
  scoreInterest,
  formatMinutes,
  type ReservationInterest,
} from '@/data/reservationInterests';
import { PARTY_WANTS, COMMUNITY_PICKS } from '@/data/wantToDos';
import {
  type ReservationWatchEntry,
} from '@/hooks/reservations/useReservationWatchlist';
import { useReservationWatchlistContext } from '@/contexts/ReservationWatchlistContext';
import { useCompanion } from '@/contexts/CompanionContext';
import { useHaptics } from '@/hooks/useHaptics';
import { formatCountdown } from '@/data/lightningLanes';

interface StrategicDashboardProps {
  open: boolean;
  onClose: () => void;
}

/** Today's park context — drives the park-aware filter. */
const TODAYS_PARK: ReservationInterest['park'] = 'magic-kingdom';

const STATUS_TONE: Record<Reservation['status'], { bg: string; fg: string; label: string }> = {
  'open-now': { bg: 'hsl(var(--accent) / 0.15)', fg: 'hsl(var(--accent))', label: 'open now' },
  'checked-in': { bg: 'hsl(var(--accent) / 0.15)', fg: 'hsl(var(--accent))', label: 'checked in' },
  upcoming: { bg: 'hsl(var(--gold) / 0.12)', fg: 'hsl(var(--gold))', label: 'upcoming' },
  used: { bg: 'hsl(var(--obsidian) / 0.06)', fg: 'hsl(var(--muted-foreground))', label: 'redeemed' },
};

/** Renders a single confirmed reservation row. */
const ReservationRow = ({ r }: { r: Reservation }) => {
  const tone = STATUS_TONE[r.status];
  const Icon = r.kind === 'dining' ? Utensils : Sparkles;
  const window = r.endsAt
    ? `${formatTime(r.startsAt)} – ${formatTime(r.endsAt)}`
    : formatTime(r.startsAt);
  return (
    <li
      className="flex items-center justify-between px-4 py-3 rounded-xl bg-background/60"
      style={{ border: '1px solid hsl(var(--obsidian) / 0.04)' }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <Icon size={14} className="shrink-0" style={{ color: 'hsl(var(--gold))' }} />
        <div className="min-w-0">
          <p className="font-display text-[14px] text-foreground truncate">{r.name}</p>
          <p className="font-sans text-[10px] tabular-nums" style={{ color: 'hsl(var(--slate-plaid))' }}>
            {window}
            {r.location ? ` · ${r.location}` : ''}
            {r.partySize ? ` · party of ${r.partySize}` : ''}
          </p>
        </div>
      </div>
      <span
        className="shrink-0 font-sans text-[8px] uppercase tracking-sovereign font-bold px-2 py-1 rounded-full"
        style={{ backgroundColor: tone.bg, color: tone.fg }}
      >
        {tone.label}
      </span>
    </li>
  );
};

interface InterestRowProps {
  interest: ReservationInterest;
  entry: ReservationWatchEntry;
  nowMinutes: number;
  onUnwatch: (id: string) => void;
  onBookNow: (interest: ReservationInterest) => void;
  onRearm: (id: string, openAtMin: number) => void;
}

/**
 * A row for an interest the guest is *watching* — not yet a confirmed
 * reservation, but on deck to be alerted or auto-booked when the window
 * opens.
 */
const InterestRow = ({
  interest,
  entry,
  nowMinutes,
  onUnwatch,
  onBookNow,
  onRearm,
}: InterestRowProps) => {
  const Icon = interest.kind === 'dining' ? Utensils : Sparkles;
  const minsUntil = entry.openAtMin - nowMinutes;
  return (
    <li
      className="rounded-xl px-3 py-2.5 flex items-center justify-between gap-2"
      style={{
        backgroundColor:
          entry.status === 'alerted'
            ? 'hsl(316 95% 35% / 0.06)'
            : entry.status === 'booked'
              ? 'hsl(var(--accent) / 0.08)'
              : entry.status === 'missed'
                ? 'hsl(var(--obsidian) / 0.04)'
                : 'hsl(var(--background) / 0.6)',
        border:
          entry.status === 'alerted'
            ? '1px solid hsl(316 95% 35% / 0.45)'
            : '1px solid hsl(var(--obsidian) / 0.05)',
        opacity: entry.status === 'missed' ? 0.65 : 1,
      }}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <Icon size={13} className="shrink-0" style={{ color: 'hsl(var(--gold))' }} />
        <div className="min-w-0 flex-1">
          <p className="font-sans text-[12px] font-semibold text-foreground truncate">
            {interest.name}
          </p>
          <p className="font-sans text-[10px] mt-0.5 tabular-nums" style={{ color: 'hsl(var(--slate-plaid))' }}>
            {entry.status === 'watching' &&
              `Targeting ${formatMinutes(entry.desiredTimeMin)} · party ${entry.partySize} · opens in ${formatCountdown(Math.max(0, minsUntil))}`}
            {entry.status === 'alerted' && (
              <span className="font-bold" style={{ color: 'hsl(316 95% 35%)' }}>
                Open now — tap to book {formatMinutes(entry.desiredTimeMin)} for {entry.partySize}
              </span>
            )}
            {entry.status === 'booked' && (
              <span className="font-semibold" style={{ color: 'hsl(var(--accent))' }}>
                Auto-booked {formatMinutes(entry.desiredTimeMin)} · party {entry.partySize}
              </span>
            )}
            {entry.status === 'missed' && 'Window passed — re-arm?'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {entry.status === 'alerted' && (
          <button
            type="button"
            onClick={() => onBookNow(interest)}
            className="rounded-lg px-2.5 py-1.5 border-none cursor-pointer font-sans text-[10px] font-bold flex items-center gap-1 min-h-[32px]"
            style={{
              backgroundColor: 'hsl(316 95% 35%)',
              color: 'hsl(var(--parchment))',
            }}
            aria-label={`Book ${interest.name} now`}
          >
            <Bell size={10} /> Book
          </button>
        )}
        {entry.status === 'booked' && (
          <span
            className="rounded-lg px-2 py-1 font-sans text-[10px] font-bold flex items-center gap-1"
            style={{
              backgroundColor: 'hsl(var(--accent) / 0.18)',
              color: 'hsl(var(--accent))',
            }}
          >
            <Check size={10} /> Held
          </span>
        )}
        {entry.status === 'missed' && (
          <button
            type="button"
            onClick={() => onRearm(interest.id, nowMinutes + 30)}
            className="rounded-lg px-2 py-1 bg-transparent border cursor-pointer font-sans text-[10px] font-semibold min-h-[28px]"
            style={{
              borderColor: 'hsl(var(--obsidian) / 0.12)',
              color: 'hsl(var(--slate-plaid))',
            }}
            aria-label={`Re-arm ${interest.name}`}
          >
            Re-arm
          </button>
        )}
        <button
          type="button"
          onClick={() => onUnwatch(interest.id)}
          className="rounded-lg p-1.5 bg-transparent border-none cursor-pointer flex items-center justify-center"
          style={{ color: 'hsl(var(--slate-plaid))' }}
          aria-label={`Stop watching ${interest.name}`}
        >
          <X size={12} />
        </button>
      </div>
    </li>
  );
};

/**
 * Suggestion row (in the "Add an interest" picker). Captures the two pieces
 * of info Disney needs to actually book — desired arrival time and party
 * size — so the moment the booking window opens we can either:
 *   • auto-fire the request (manager + sovereign), or
 *   • surface a single "Book" tap (explorer)
 * without ever asking the guest to type or pick anything else.
 *
 * Inline validation prevents a watch being saved with payloads Disney's
 * booking API would reject — party sizes outside 1–10 or arrival times
 * that are already in the past or after dining service ends.
 */
interface SuggestionRowProps {
  interest: ReservationInterest;
  defaultPartySize: number;
  nowMinutes: number;
  onWatch: (payload: { desiredTimeMin: number; partySize: number }) => void;
}

/** Booking constraints — match Disney's same-day reservation API limits. */
const MIN_PARTY = 1;
const MAX_PARTY = 10;
/** Latest allowed seating (9:30 PM) — last service for most table-service. */
const LATEST_SEATING_MIN = 21 * 60 + 30;
/** Min lead time between window-open and arrival (15 min). */
const MIN_LEAD_MIN = 15;

/** Fixed time-slot grid (5 PM – 9 PM, every 30 min) — matches typical ADR slots. */
const TIME_SLOTS: number[] = (() => {
  const slots: number[] = [];
  for (let m = 17 * 60; m <= 21 * 60; m += 30) slots.push(m);
  return slots;
})();

const SuggestionRow = ({ interest, defaultPartySize, nowMinutes, onWatch }: SuggestionRowProps) => {
  const Icon = interest.kind === 'dining' ? Utensils : Sparkles;
  const [desiredTimeMin, setDesiredTimeMin] = useState<number>(18 * 60 + 30);
  const [partySize, setPartySize] = useState<number>(defaultPartySize);

  // Validate the captured payload. We reject:
  //   • party sizes outside 1–10 (Disney's per-reservation cap)
  //   • arrival times that have already passed in park-time
  //   • arrival times before the booking window even opens (+ lead time)
  //   • arrival times after the latest seating slot
  const validationError = useMemo<string | null>(() => {
    if (partySize < MIN_PARTY || partySize > MAX_PARTY) {
      return `Party size must be ${MIN_PARTY}–${MAX_PARTY}.`;
    }
    if (desiredTimeMin <= nowMinutes) {
      return 'Pick a time later than now.';
    }
    if (desiredTimeMin < interest.bookingOpensAtMin + MIN_LEAD_MIN) {
      return `Needs ${MIN_LEAD_MIN}+ min after the window opens.`;
    }
    if (desiredTimeMin > LATEST_SEATING_MIN) {
      return `Latest seating is ${formatMinutes(LATEST_SEATING_MIN)}.`;
    }
    return null;
  }, [partySize, desiredTimeMin, nowMinutes, interest.bookingOpensAtMin]);

  const isValid = validationError === null;

  return (
    <li
      className="rounded-xl px-3 py-3 flex flex-col gap-2.5"
      style={{
        backgroundColor: 'hsl(var(--background) / 0.6)',
        border: '1px solid hsl(var(--obsidian) / 0.05)',
      }}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        <Icon size={13} className="shrink-0 mt-0.5" style={{ color: 'hsl(var(--gold))' }} />
        <div className="min-w-0 flex-1">
          <p className="font-sans text-[12px] font-semibold text-foreground truncate">
            {interest.name}
          </p>
          <p className="font-sans text-[10px] mt-0.5" style={{ color: 'hsl(var(--slate-plaid))' }}>
            {interest.location}
            {interest.priceTier ? ` · ${interest.priceTier}` : ''}
            {' · '}
            <span className="tabular-nums">opens {formatMinutes(interest.bookingOpensAtMin)}</span>
          </p>
          <p className="font-sans text-[10px] mt-1 text-muted-foreground leading-snug">
            {interest.pitch}
          </p>
        </div>
      </div>

      <div>
        <p className="font-sans text-[8px] uppercase tracking-sovereign font-bold mb-1.5" style={{ color: 'hsl(var(--slate-plaid))' }}>
          Preferred time
        </p>
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          {TIME_SLOTS.map((m) => {
            const active = m === desiredTimeMin;
            // Mark slots that would fail validation so guests see why
            // certain times aren't selectable as targets.
            const slotInvalid =
              m <= nowMinutes ||
              m < interest.bookingOpensAtMin + MIN_LEAD_MIN ||
              m > LATEST_SEATING_MIN;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setDesiredTimeMin(m)}
                className="shrink-0 rounded-lg px-2.5 py-1.5 border font-sans text-[10px] font-semibold tabular-nums min-h-[30px] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                style={{
                  backgroundColor: active ? 'hsl(var(--gold))' : 'transparent',
                  color: active ? 'hsl(var(--parchment))' : 'hsl(var(--slate-plaid))',
                  borderColor: active ? 'hsl(var(--gold))' : 'hsl(var(--obsidian) / 0.12)',
                }}
                aria-pressed={active}
                disabled={slotInvalid && !active}
                aria-label={`Target ${formatMinutes(m)}`}
              >
                {formatMinutes(m)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-sans text-[8px] uppercase tracking-sovereign font-bold" style={{ color: 'hsl(var(--slate-plaid))' }}>
            Party
          </span>
          <div
            className="flex items-center rounded-lg overflow-hidden"
            style={{ border: '1px solid hsl(var(--obsidian) / 0.12)' }}
          >
            <button
              type="button"
              onClick={() => setPartySize((n) => Math.max(MIN_PARTY, n - 1))}
              className="bg-transparent border-none cursor-pointer px-2 py-1 flex items-center justify-center min-h-[30px]"
              style={{ color: 'hsl(var(--slate-plaid))' }}
              aria-label="Decrease party size"
              disabled={partySize <= MIN_PARTY}
            >
              <Minus size={12} />
            </button>
            <span className="font-sans text-[12px] font-bold tabular-nums px-2 min-w-[20px] text-center text-foreground">
              {partySize}
            </span>
            <button
              type="button"
              onClick={() => setPartySize((n) => Math.min(MAX_PARTY, n + 1))}
              className="bg-transparent border-none cursor-pointer px-2 py-1 flex items-center justify-center min-h-[30px]"
              style={{ color: 'hsl(var(--slate-plaid))' }}
              aria-label="Increase party size"
              disabled={partySize >= MAX_PARTY}
            >
              <Plus size={12} />
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => isValid && onWatch({ desiredTimeMin, partySize })}
          disabled={!isValid}
          className="shrink-0 rounded-lg px-3 py-1.5 border-none font-sans text-[10px] font-bold flex items-center gap-1 min-h-[32px] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
          style={{
            backgroundColor: 'hsl(var(--obsidian))',
            color: 'hsl(var(--parchment))',
          }}
          aria-disabled={!isValid}
          aria-label={`Watch ${interest.name} at ${formatMinutes(desiredTimeMin)} for party of ${partySize}`}
        >
          <Eye size={10} /> Watch
        </button>
      </div>

      {validationError && (
        <p
          role="alert"
          className="font-sans text-[10px] font-semibold m-0"
          style={{ color: 'hsl(316 95% 35%)' }}
        >
          {validationError}
        </p>
      )}
    </li>
  );
};

/**
 * Strategic Dashboard — "The Plumbing"
 *
 * Focused on table-service dining and experiences. Two stacks:
 *   1. Standing Reservations — what's already on the books
 *   2. Watching — interests pre-selected by the guest. Tier decides whether
 *      the system auto-books on open (manager + sovereign) or just alerts
 *      (explorer).
 *
 * The "Add an interest" picker is filtered by today's park and ranked
 * against the guest's pre-trip survey + live community picks so the most
 * relevant options surface first.
 *
 * Lightning Lane inventory now lives entirely on the dedicated /book-ll
 * page — this surface stays focused on hospitality bookings.
 */
const StrategicDashboard = ({ open, onClose }: StrategicDashboardProps) => {
  const { tier } = useCompanion();
  const { fire } = useHaptics();
  const [pickerOpen, setPickerOpen] = useState(false);

  const standing = useMemo(
    () =>
      RESERVATIONS.filter((r) => r.kind === 'dining' || r.kind === 'experience').sort(
        (a, b) => a.startsAt.localeCompare(b.startsAt),
      ),
    [],
  );

  // Sensible default party size for the watch picker — we try to infer the
  // typical group size from the guest's existing standing reservations so
  // they don't have to adjust the stepper for the common case.
  const defaultPartySize = useMemo(() => {
    const sizes = standing.map((r) => r.partySize ?? 0).filter((n) => n > 0);
    if (!sizes.length) return 4;
    return Math.round(sizes.reduce((a, b) => a + b, 0) / sizes.length);
  }, [standing]);

  // Aggregate party-stated interest signals so the picker can rank by
  // relevance. We fold in attraction names from the survey *and* the top
  // community picks because guests often defer to "what everyone's doing".
  const interestSignals = useMemo(() => {
    const fromParty = PARTY_WANTS.map((w) => w.attraction);
    const fromCommunity = COMMUNITY_PICKS.slice(0, 5).map((c) => c.attraction);
    return [...fromParty, ...fromCommunity];
  }, []);

  // Park-aware: only candidates in today's park survive.
  const parkAwarePool = useMemo(
    () => INTEREST_POOL.filter((i) => i.park === TODAYS_PARK),
    [],
  );

  // Watchlist + clock now live in a top-level provider so alerts (toast +
  // haptic) keep firing even when this sheet is closed. We just consume.
  const { nowMinutes, bookInterest: handleBookInterest, ...watchlist } =
    useReservationWatchlistContext();

  // Sort watchlist: alerted first, then watching by soonest, then booked, then missed.
  const sortedEntries = useMemo(() => {
    const order: Record<ReservationWatchEntry['status'], number> = {
      alerted: 0,
      watching: 1,
      booked: 2,
      missed: 3,
    };
    return [...watchlist.entries].sort((a, b) => {
      const so = order[a.status] - order[b.status];
      if (so !== 0) return so;
      return a.openAtMin - b.openAtMin;
    });
  }, [watchlist.entries]);

  // Picker candidates: park-aware, not already watched, not already standing,
  // ranked by relevance to the party.
  const standingNames = useMemo(
    () => new Set(standing.map((r) => r.name.toLowerCase())),
    [standing],
  );
  const pickerCandidates = useMemo(() => {
    return parkAwarePool
      .filter((i) => !watchlist.isWatching(i.id))
      .filter((i) => !standingNames.has(i.name.toLowerCase()))
      .map((i) => ({ i, score: scoreInterest(i, interestSignals) }))
      .sort((a, b) => b.score - a.score)
      .map(({ i }) => i);
  }, [parkAwarePool, watchlist, standingNames, interestSignals]);

  const tierCopy =
    tier === 'sovereign' || tier === 'manager'
      ? 'Auto-books the moment a window opens'
      : 'Alerts you the moment a window opens';

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-foreground/30 z-[9995]"
            style={{
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
          />
          <motion.aside
            role="dialog"
            aria-label="Strategic dashboard"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 280 }}
            className="fixed bottom-[108px] left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-card flex flex-col z-[9999]"
            style={{
              maxHeight: 'calc(80vh - 108px)',
              borderRadius: '16px',
              boxShadow: '0 -24px 60px hsl(var(--obsidian) / 0.2)',
            }}
          >
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-foreground/15" />
            </div>

            <header className="flex items-start justify-between px-6 pt-3 pb-4 shrink-0">
              <div>
                <span
                  className="font-sans text-[9px] uppercase tracking-sovereign font-bold"
                  style={{ color: 'hsl(var(--gold))' }}
                >
                  Strategic Dashboard
                </span>
                <h3 className="font-display text-[22px] text-foreground mt-1">
                  Dining & Experiences
                </h3>
                <p className="font-sans text-[11px] text-muted-foreground mt-1">
                  {tierCopy}.
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close dashboard"
                className="bg-transparent border-none cursor-pointer p-1.5 -mr-1.5"
              >
                <X size={18} className="text-muted-foreground" />
              </button>
            </header>

            <div className="px-5 pb-8 overflow-y-auto space-y-4">
              {/* KPI grid */}
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { label: 'On the books', value: String(standing.length), icon: CalendarClock },
                  { label: 'Watching', value: String(watchlist.entries.length), icon: Eye },
                  { label: 'Time saved', value: '1h 42m', icon: TrendingDown },
                ].map((k) => {
                  const I = k.icon;
                  return (
                    <div
                      key={k.label}
                      className="rounded-2xl bg-background/60 px-3 py-3.5 text-center"
                      style={{ border: '1px solid hsl(var(--obsidian) / 0.05)' }}
                    >
                      <I size={14} className="mx-auto mb-1.5" style={{ color: 'hsl(var(--gold))' }} />
                      <p className="font-display text-[18px] text-foreground leading-none tabular-nums">
                        {k.value}
                      </p>
                      <p className="font-sans text-[8px] uppercase tracking-sovereign text-muted-foreground font-semibold mt-1.5">
                        {k.label}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Standing Reservations */}
              {standing.length > 0 && (
                <section>
                  <p className="font-sans text-[9px] uppercase tracking-sovereign text-muted-foreground font-semibold mb-2 px-1">
                    On the books
                  </p>
                  <ul className="list-none p-0 m-0 space-y-1.5">
                    {standing.map((r) => (
                      <ReservationRow key={r.id} r={r} />
                    ))}
                  </ul>
                </section>
              )}

              {/* Watchlist */}
              <section>
                <div className="flex items-center justify-between mb-2 px-1">
                  <p className="font-sans text-[9px] uppercase tracking-sovereign text-muted-foreground font-semibold m-0">
                    Watching for openings
                  </p>
                  <span
                    className="font-sans text-[9px] tabular-nums"
                    style={{ color: 'hsl(var(--gold))' }}
                  >
                    {watchlist.entries.length} {watchlist.entries.length === 1 ? 'interest' : 'interests'}
                  </span>
                </div>
                {watchlist.entries.length === 0 ? (
                  <div
                    className="rounded-2xl px-4 py-5 text-center"
                    style={{
                      backgroundColor: 'hsl(var(--background) / 0.6)',
                      border: '1px dashed hsl(var(--obsidian) / 0.1)',
                    }}
                  >
                    <p className="font-sans text-[12px] text-muted-foreground">
                      Nothing watched yet. Add an interest below and we'll {tier === 'explorer' ? 'alert you' : 'book it'} the moment a window opens.
                    </p>
                  </div>
                ) : (
                  <ul className="list-none p-0 m-0 space-y-1.5">
                    {sortedEntries.map((entry) => {
                      const interest = INTEREST_POOL.find((i) => i.id === entry.interestId);
                      if (!interest) return null;
                      return (
                        <InterestRow
                          key={entry.interestId}
                          interest={interest}
                          entry={entry}
                          nowMinutes={nowMinutes}
                          onUnwatch={watchlist.unwatch}
                          onBookNow={(i) => {
                            if (handleBookInterest(i)) watchlist.markBooked(i.id);
                          }}
                          onRearm={watchlist.rearm}
                        />
                      );
                    })}
                  </ul>
                )}

                {/* Add an interest */}
                <button
                  type="button"
                  onClick={() => setPickerOpen((v) => !v)}
                  className="w-full mt-3 rounded-2xl py-3 px-5 flex items-center justify-center gap-2 border-none cursor-pointer min-h-[44px] font-sans text-[12px] font-semibold"
                  style={{
                    backgroundColor: 'hsl(var(--gold) / 0.12)',
                    color: 'hsl(var(--gold))',
                    border: '1px solid hsl(var(--gold) / 0.3)',
                  }}
                  aria-expanded={pickerOpen}
                >
                  <Plus size={14} />
                  {pickerOpen ? 'Hide suggestions' : 'Add an interest'}
                </button>

                <AnimatePresence initial={false}>
                  {pickerOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="font-sans text-[9px] uppercase tracking-sovereign text-muted-foreground font-semibold mt-3 mb-2 px-1">
                        Matched to your party
                      </p>
                      {pickerCandidates.length === 0 ? (
                        <p className="font-sans text-[11px] text-muted-foreground px-1 py-2">
                          You're watching every relevant option. Nice work.
                        </p>
                      ) : (
                        <ul className="list-none p-0 m-0 space-y-1.5">
                          {pickerCandidates.map((i) => (
                            <SuggestionRow
                              key={i.id}
                              interest={i}
                              defaultPartySize={defaultPartySize}
                              onWatch={(payload) => {
                                watchlist.watch(i.id, payload);
                                fire('selection');
                                toast(`Watching · ${i.name}`, {
                                  description:
                                    tier === 'explorer'
                                      ? `We'll alert you to grab ${formatMinutes(payload.desiredTimeMin)} for ${payload.partySize} the moment the window opens.`
                                      : `We'll auto-book ${formatMinutes(payload.desiredTimeMin)} for ${payload.partySize} the moment the window opens.`,
                                  duration: 4500,
                                });
                              }}
                            />
                          ))}
                        </ul>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>

              {/* Crowd pulse */}
              <section>
                <p className="font-sans text-[9px] uppercase tracking-sovereign text-muted-foreground font-semibold mb-2 px-1">
                  Dining pulse
                </p>
                <div
                  className="rounded-2xl px-4 py-3.5 flex items-center gap-3"
                  style={{
                    backgroundColor: 'hsl(var(--gold) / 0.08)',
                    border: '1px solid hsl(var(--gold) / 0.2)',
                  }}
                >
                  <Users size={16} style={{ color: 'hsl(var(--gold))' }} />
                  <p className="font-sans text-[12px] text-foreground/85 leading-snug flex-1">
                    Same-day cancellations are running{' '}
                    <span className="font-semibold tabular-nums">2.3×</span> the weekly average.
                    Watching anything popular pays off today.
                  </p>
                </div>
              </section>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default StrategicDashboard;