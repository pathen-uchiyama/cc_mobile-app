import { Fragment } from 'react';
import { Zap, Clock } from 'lucide-react';
import { formatCountdown, type CapacitySummary } from '@/data/lightningLanes';

interface CapacityMeterProps {
  summary: CapacitySummary;
  /** Compact variant for chips/dashboards — no headline, smaller pips. */
  compact?: boolean;
}

/**
 * The Capacity Meter — the always-visible "what can I book right now?" widget.
 *
 * Renders two pip rows:
 *   • LL Multi-Pass: filled gold when held, hollow when open. Bonus slots
 *     (Premier / Hopper) get a subtler gold ring so guests can see they're
 *     above the standard 3-cap.
 *   • Individual LL: same model, capped at Disney's 2/day rule.
 *
 * When standard LL is locked (waiting on the 2hr gap), the row shows the
 * countdown with a lock affordance — never blocks the booking surface.
 */
const CapacityMeter = ({ summary, compact = false }: CapacityMeterProps) => {
  const { llHeldCount, llCapTotal, canBookLLNow, llUnlocksInMin, illUsedCount, illCapTotal } = summary;

  return (
    <div
      className="rounded-2xl p-4 bg-card"
      style={{
        border: '1px solid hsl(var(--gold) / 0.18)',
        boxShadow: '0 6px 18px hsl(var(--obsidian) / 0.04)',
      }}
    >
      {!compact && (
        <div className="flex items-center justify-between mb-3" aria-live="polite">
          <span
            className="font-sans text-[9px] uppercase tracking-sovereign font-bold"
            style={{ color: 'hsl(var(--gold))', letterSpacing: '0.16em' }}
          >
            Lightning Lane Capacity
          </span>
          {canBookLLNow ? (
            <span className="font-sans text-[10px] font-semibold" style={{ color: 'hsl(var(--accent))' }}>
              Slot open
            </span>
          ) : (
            <span className="font-sans text-[10px] tabular-nums flex items-center gap-1" style={{ color: 'hsl(var(--slate-plaid))' }}>
              <Clock size={10} />
              unlocks in {formatCountdown(llUnlocksInMin)}
            </span>
          )}
        </div>
      )}

      {/* Standard LL row */}
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <Zap size={11} style={{ color: 'hsl(var(--gold))' }} />
          <span className="font-sans text-[10px] uppercase tracking-sovereign font-semibold text-muted-foreground">
            Multi-Pass
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: llCapTotal }).map((_, i) => {
            const filled = i < llHeldCount;
            const isBonus = i >= 3; // anything past base cap is a bonus pip
            return (
              <Fragment key={i}>
                {/* Visual divider between base 3 and bonus pips —
                    celebrates the upgrade rather than fading it. */}
                {i === 3 && (
                  <span
                    aria-hidden
                    className="inline-block"
                    style={{
                      width: '1px',
                      height: compact ? '10px' : '12px',
                      backgroundColor: 'hsl(var(--gold) / 0.45)',
                      margin: '0 2px',
                    }}
                  />
                )}
                <span
                  aria-label={filled ? 'held' : isBonus ? 'bonus open' : 'open'}
                  title={isBonus ? 'Bonus slot from your tier' : undefined}
                  className="inline-block rounded-full"
                  style={{
                    width: compact ? '7px' : '9px',
                    height: compact ? '7px' : '9px',
                    backgroundColor: filled
                      ? 'hsl(var(--gold))'
                      : isBonus
                        ? 'hsl(var(--gold) / 0.06)'
                        : 'transparent',
                    border: '1.5px solid hsl(var(--gold))',
                  }}
                />
              </Fragment>
            );
          })}
          <span className="font-sans text-[10px] tabular-nums font-bold ml-1.5" style={{ color: 'hsl(var(--gold))' }}>
            {llHeldCount} / {llCapTotal}
            {llCapTotal > 3 && (
              <span
                className="ml-1 font-sans text-[8px] font-semibold"
                style={{ color: 'hsl(var(--gold) / 0.7)' }}
                title="Includes bonus slots from Premier / Hopper"
              >
                +{llCapTotal - 3} bonus
              </span>
            )}
          </span>
        </div>
      </div>

      {/* ILL row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 min-w-0">
          <Zap size={11} style={{ color: 'hsl(var(--gold))' }} fill="hsl(var(--gold))" />
          <span className="font-sans text-[10px] uppercase tracking-sovereign font-semibold text-muted-foreground">
            Individual LL
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: illCapTotal }).map((_, i) => {
            const filled = i < illUsedCount;
            return (
              <span
                key={i}
                aria-label={filled ? 'used' : 'available'}
                className="inline-block rounded-full"
                style={{
                  width: compact ? '7px' : '9px',
                  height: compact ? '7px' : '9px',
                  backgroundColor: filled ? 'hsl(var(--gold))' : 'transparent',
                  border: '1.5px solid hsl(var(--gold))',
                }}
              />
            );
          })}
          <span className="font-sans text-[10px] tabular-nums font-bold ml-1.5" style={{ color: 'hsl(var(--gold))' }}>
            {illUsedCount} / {illCapTotal}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CapacityMeter;