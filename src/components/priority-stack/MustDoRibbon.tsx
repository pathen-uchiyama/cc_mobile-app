import { Star } from 'lucide-react';

export interface MustDoIcon {
  id: string;
  /** Short label, e.g. attraction name. Surfaces in the tooltip / aria. */
  label: string;
  /** Whether this Must-Do is currently rendered as one of the 3 stack cards. */
  inStack?: boolean;
  /** Total rides desired for this attraction (e.g. 2 = ride twice). Defaults to 1. */
  desired?: number;
  /** How many rides have been completed so far. Defaults to 0. */
  done?: number;
}

interface MustDoRibbonProps {
  items: MustDoIcon[];
}

/**
 * Sovereign Progress Bar — the "Must-Do Guide".
 *
 * Each Must-Do can be ridden multiple times (e.g. survey says "ride Tron twice").
 * The ribbon shows:
 *  - A gold pip with a tiny "n/m" overlay for multi-ride targets
 *  - Filled gold once doneCount >= desiredCount
 *  - Gold ring while currently in the stack
 */
const MustDoRibbon = ({ items }: MustDoRibbonProps) => {
  if (items.length === 0) return null;

  const totalRides = items.reduce((s, i) => s + (i.desired ?? 1), 0);
  const completedRides = items.reduce((s, i) => s + Math.min(i.done ?? 0, i.desired ?? 1), 0);

  return (
    <div className="w-full" aria-label="Must-Do guide">
      <div className="flex items-center justify-between mb-1.5 px-1">
        <span
          className="font-sans text-[8px] uppercase tracking-sovereign font-bold"
          style={{ color: 'hsl(var(--gold))', letterSpacing: '0.18em' }}
        >
          Must-Do Guide
        </span>
        <span
          className="font-sans text-[8px] tabular-nums"
          style={{ color: 'hsl(var(--slate-plaid))' }}
        >
          {completedRides} of {totalRides} rides
        </span>
      </div>

      <ol
        className="list-none flex items-center gap-2 px-1 py-1.5 m-0 overflow-x-auto no-scrollbar"
        style={{
          borderTop: '1px solid hsl(var(--gold) / 0.18)',
          borderBottom: '1px solid hsl(var(--gold) / 0.18)',
        }}
      >
        {items.map((it) => {
          const desired = Math.max(1, it.desired ?? 1);
          const done = Math.min(it.done ?? 0, desired);
          const isComplete = done >= desired;
          const ring = it.inStack
            ? '0 0 0 2px hsl(var(--gold))'
            : isComplete
              ? '0 0 0 1px hsl(var(--gold) / 0.6)'
              : '0 0 0 1px hsl(var(--slate-plaid) / 0.3)';
          const fill = isComplete
            ? 'hsl(var(--gold))'
            : it.inStack
              ? 'hsl(var(--gold) / 0.16)'
              : 'transparent';
          const iconColor = isComplete
            ? 'hsl(var(--card))'
            : it.inStack
              ? 'hsl(var(--gold))'
              : 'hsl(var(--slate-plaid))';

          const status = isComplete
            ? `done ${done} of ${desired}`
            : it.inStack
              ? `in stack now, ${done} of ${desired} done`
              : `pending, ${done} of ${desired} done`;

          return (
            <li
              key={it.id}
              title={`${it.label} — ${status}`}
              aria-label={`${it.label} — ${status}`}
              className="shrink-0 relative flex items-center justify-center rounded-full"
              style={{
                width: '24px',
                height: '24px',
                background: fill,
                boxShadow: ring,
              }}
            >
              <Star size={10} style={{ color: iconColor }} fill={isComplete ? iconColor : 'transparent'} />
              {desired > 1 && (
                <span
                  aria-hidden
                  className="absolute -top-1.5 -right-1.5 flex items-center justify-center rounded-full font-sans font-bold tabular-nums shadow-sm"
                  style={{
                    minWidth: '15px',
                    height: '13px',
                    padding: '0 3px',
                    fontSize: '8px',
                    lineHeight: 1,
                    background: 'hsl(var(--card))',
                    color: 'hsl(var(--obsidian))',
                    border: '1px solid hsl(var(--gold))',
                  }}
                >
                  {done}/{desired}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default MustDoRibbon;
