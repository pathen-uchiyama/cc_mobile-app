import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

interface HorizonItem {
  id: string;
  rank: 'next' | 'later';
  time: string;
  attraction: string;
  wait?: string;
  llSecured?: boolean;
}

interface QuietHorizonProps {
  items: HorizonItem[];
}

/**
 * Quiet Horizon — the rest of the day, no chrome.
 *
 * No cards, no shadows, no expand toggles. Just a typographic list
 * that recedes into the parchment. Reads like a journal entry.
 */
const QuietHorizon = ({ items }: QuietHorizonProps) => {
  if (items.length === 0) return null;

  return (
    <ul className="list-none p-0 m-0 space-y-3">
      {items.map((item, i) => (
        <motion.li
          key={item.id}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: i * 0.06 }}
          className="flex items-baseline gap-3 px-1"
        >
          <span
            className="font-sans text-[10px] uppercase tracking-sovereign font-semibold tabular-nums shrink-0 w-16"
            style={{ color: 'hsl(var(--slate-plaid))' }}
          >
            {item.rank} · {item.time}
          </span>
          <span className="font-display text-[15px] text-foreground/85 leading-tight flex-1 min-w-0 truncate">
            {item.attraction}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {item.llSecured && (
              <Zap size={10} className="text-accent" />
            )}
            {item.wait && (
              <span
                className="font-sans text-[10px] tabular-nums"
                style={{ color: 'hsl(var(--slate-plaid))' }}
              >
                {item.wait}
              </span>
            )}
          </div>
        </motion.li>
      ))}
    </ul>
  );
};

export default QuietHorizon;
