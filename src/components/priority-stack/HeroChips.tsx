import { Utensils, Sparkles, Zap } from 'lucide-react';

export interface UpcomingHold {
  kind: 'dining' | 'experience';
  name: string;
  minutesAway: number;
  walkMinutes?: number;
}

export interface LLCapacity {
  canBookNow: boolean;
  unlocksInMin: number;
  held: number;
  cap: number;
}

interface HeroChipsProps {
  upcomingHold?: UpcomingHold;
  onUpcomingHoldTap?: () => void;
  llCapacity?: LLCapacity;
  onLLChipTap?: () => void;
  /** When the pivot banner is shown above the chips, suppress the lower-priority chip
   *  so we never stack more than ONE active alert above the title. */
  pivotActive?: boolean;
}

/**
 * Above-title chip rail with strict priority ordering.
 *
 * Priority (highest first):
 *   1. Pivot banner (rendered by parent — when active, only ONE chip below it)
 *   2. Slot Open Lightning Lane  (accent)
 *   3. On the Books               (gold)
 *   4. Locked Lightning Lane countdown (passive obsidian)
 *
 * Hard rule: max 2 chips visible. If pivot is active, max 1 chip.
 */
const HeroChips = ({
  upcomingHold,
  onUpcomingHoldTap,
  llCapacity,
  onLLChipTap,
  pivotActive = false,
}: HeroChipsProps) => {
  type Chip = { key: string; node: JSX.Element };
  const chips: Chip[] = [];

  // P2 — Slot Open LL (urgent, accent)
  if (llCapacity?.canBookNow) {
    chips.push({
      key: 'll-open',
      node: (
        <button
          key="ll-open"
          type="button"
          onClick={onLLChipTap}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border-none cursor-pointer transition-opacity hover:opacity-85"
          style={{
            background: 'hsl(var(--accent) / 0.12)',
            border: '1px solid hsl(var(--accent) / 0.35)',
          }}
          aria-label="Lightning Lane slot open — tap to browse"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Zap size={12} style={{ color: 'hsl(var(--accent))' }} />
            <span
              className="font-sans text-[9px] uppercase tracking-sovereign font-bold shrink-0 text-accent"
              style={{ letterSpacing: '0.14em' }}
            >
              Slot Open
            </span>
            <span className="font-sans text-[11px] text-foreground truncate min-w-0">
              Browse Lightning Lanes
            </span>
          </div>
          <span
            className="font-sans text-[10px] tabular-nums shrink-0"
            style={{ color: 'hsl(var(--slate-plaid))' }}
          >
            {llCapacity.held}/{llCapacity.cap}
          </span>
        </button>
      ),
    });
  }

  // P3 — On the Books (next dining/experience hold)
  if (upcomingHold) {
    chips.push({
      key: 'on-books',
      node: (
        <button
          key="on-books"
          type="button"
          onClick={onUpcomingHoldTap}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border-none cursor-pointer transition-opacity hover:opacity-85"
          style={{
            background: 'hsl(var(--gold) / 0.10)',
            border: '1px solid hsl(var(--gold) / 0.25)',
          }}
          aria-label={`On the Books: ${upcomingHold.name} in ${upcomingHold.minutesAway} minutes`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {upcomingHold.kind === 'dining' ? (
              <Utensils size={12} style={{ color: 'hsl(var(--gold))' }} />
            ) : (
              <Sparkles size={12} style={{ color: 'hsl(var(--gold))' }} />
            )}
            <span
              className="font-sans text-[9px] uppercase tracking-sovereign font-bold shrink-0"
              style={{ color: 'hsl(var(--gold))', letterSpacing: '0.14em' }}
            >
              On the Books
            </span>
            <span className="font-sans text-[11px] text-foreground truncate min-w-0">
              {upcomingHold.name}
            </span>
          </div>
          <span className="font-sans text-[10px] text-muted-foreground tabular-nums shrink-0">
            {upcomingHold.minutesAway}m
            {upcomingHold.walkMinutes !== undefined ? ` · ${upcomingHold.walkMinutes}w` : ''}
          </span>
        </button>
      ),
    });
  }

  // P4 — Locked LL countdown (passive)
  if (llCapacity && !llCapacity.canBookNow) {
    chips.push({
      key: 'll-locked',
      node: (
        <button
          key="ll-locked"
          type="button"
          onClick={onLLChipTap}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border-none cursor-pointer transition-opacity hover:opacity-85"
          style={{
            background: 'hsl(var(--obsidian) / 0.04)',
            border: '1px solid hsl(var(--obsidian) / 0.08)',
          }}
          aria-label={`Next Lightning Lane unlocks in ${llCapacity.unlocksInMin} minutes`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Zap size={12} style={{ color: 'hsl(var(--slate-plaid))' }} />
            <span
              className="font-sans text-[9px] uppercase tracking-sovereign font-bold shrink-0"
              style={{ color: 'hsl(var(--slate-plaid))', letterSpacing: '0.14em' }}
            >
              Next LL
            </span>
            <span className="font-sans text-[11px] text-foreground truncate min-w-0">
              Unlocks in {llCapacity.unlocksInMin}m
            </span>
          </div>
          <span
            className="font-sans text-[10px] tabular-nums shrink-0"
            style={{ color: 'hsl(var(--slate-plaid))' }}
          >
            {llCapacity.held}/{llCapacity.cap}
          </span>
        </button>
      ),
    });
  }

  // Hard cap — pivot active = 1 chip max, otherwise 2.
  const maxChips = pivotActive ? 1 : 2;
  const visible = chips.slice(0, maxChips);

  if (visible.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5 mb-4">
      {visible.map((c) => c.node)}
    </div>
  );
};

export default HeroChips;