import { Star } from 'lucide-react';

export interface MustDoIcon {
  id: string;
  /** Short label, e.g. attraction name. Surfaces in the tooltip / aria. */
  label: string;
  /** Whether this Must-Do is currently rendered as one of the 3 stack cards. */
  inStack?: boolean;
  /** True once the user has experienced (committed to) this attraction. */
  done?: boolean;
}

interface MustDoRibbonProps {
  items: MustDoIcon[];
}

/**
 * Sovereign Progress Bar — the "Must-Do Guide".
 *
 * A thin ribbon under the page header showing only icons of the user's
 * must-do attractions for the day. Items currently sitting in the
 * Priority Stack glow Burnished Gold so the user can immediately see
 * which of their must-dos are being worked on right now.
 *
 * - Done = filled gold star
 * - In stack = gold ring (live, being worked on)
 * - Pending = quiet outline
 */
const MustDoRibbon = ({ items }: MustDoRibbonProps) => {
  if (items.length === 0) return null;

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
          {items.filter((i) => i.done).length} of {items.length}
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
          const ring = it.inStack
            ? '0 0 0 2px hsl(var(--gold))'
            : it.done
              ? '0 0 0 1px hsl(var(--gold) / 0.6)'
              : '0 0 0 1px hsl(var(--slate-plaid) / 0.3)';
          const fill = it.done
            ? 'hsl(var(--gold))'
            : it.inStack
              ? 'hsl(var(--gold) / 0.16)'
              : 'transparent';
          const iconColor = it.done
            ? 'hsl(var(--card))'
            : it.inStack
              ? 'hsl(var(--gold))'
              : 'hsl(var(--slate-plaid))';

          return (
            <li
              key={it.id}
              title={it.label}
              aria-label={`${it.label} — ${it.done ? 'done' : it.inStack ? 'in stack now' : 'pending'}`}
              className="shrink-0 flex items-center justify-center rounded-full"
              style={{
                width: '24px',
                height: '24px',
                background: fill,
                boxShadow: ring,
              }}
            >
              <Star size={10} style={{ color: iconColor }} fill={it.done ? iconColor : 'transparent'} />
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default MustDoRibbon;
