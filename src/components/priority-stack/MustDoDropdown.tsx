import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Star, ArrowUp } from 'lucide-react';

export interface MustDoEntry {
  id: string;
  attraction: string;
  /** Whether this Must-Do is currently in the visible 3-card stack. */
  inStack?: boolean;
  done?: boolean;
}

interface MustDoDropdownProps {
  items: MustDoEntry[];
  /** Called when the user picks an off-stack Must-Do — promotes it into the Hero slot. */
  onPromote?: (mustDoId: string, attraction: string) => void;
}

/**
 * Must-Do Dropdown — surfaces the Must-Do attractions that are NOT
 * currently in the Sovereign Stack. Each row is tappable and promotes
 * the attraction into the Hero slot via the parent's onPromote handler.
 */
const MustDoDropdown = ({ items, onPromote }: MustDoDropdownProps) => {
  const [open, setOpen] = useState(false);
  const offStack = items.filter((i) => !i.inStack && !i.done);

  if (offStack.length === 0) return null;

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between bg-transparent border-none cursor-pointer px-3 py-2"
        style={{
          borderRadius: '10px',
          background: 'hsl(var(--gold) / 0.04)',
          border: '1px solid hsl(var(--gold) / 0.18)',
        }}
        aria-expanded={open}
        aria-label="Other Must-Do attractions"
      >
        <span
          className="font-sans text-[10px] uppercase tracking-sovereign font-semibold"
          style={{ color: 'hsl(var(--gold))', letterSpacing: '0.16em' }}
        >
          {offStack.length} more Must-Do{offStack.length === 1 ? '' : 's'} on deck
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} style={{ color: 'hsl(var(--gold))' }} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="list-none m-0 p-0 overflow-hidden"
          >
            <div className="pt-2 flex flex-col gap-1.5">
              {offStack.map((it) => (
                <motion.li
                  key={it.id}
                  whileTap={{ scale: 0.98 }}
                  className="list-none"
                >
                  <button
                    type="button"
                    onClick={() => {
                      onPromote?.(it.id, it.attraction);
                      setOpen(false);
                    }}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2.5 cursor-pointer text-left"
                    style={{
                      borderRadius: '8px',
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--obsidian) / 0.06)',
                    }}
                    aria-label={`Promote ${it.attraction} to the main card`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <Star size={11} style={{ color: 'hsl(var(--gold))' }} />
                      <span className="font-sans text-[12px] text-foreground truncate">
                        {it.attraction}
                      </span>
                    </span>
                    <ArrowUp
                      size={12}
                      style={{ color: 'hsl(var(--gold))' }}
                      strokeWidth={2.2}
                    />
                  </button>
                </motion.li>
              ))}
            </div>
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MustDoDropdown;
