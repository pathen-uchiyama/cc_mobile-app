import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import FocusMove from './FocusMove';
import HorizonCard from './HorizonCard';
import FullLedgerSheet from './FullLedgerSheet';

interface PlanItem {
  id: string;
  rank: 'now' | 'next' | 'later';
  time: string;
  attraction: string;
  location: string;
  logic: string;
  wait?: string;
  llSecured?: boolean;
  votes?: number;
}

interface HeroHorizonStackProps {
  items: PlanItem[];
  onCommitHero: () => void;
}

/**
 * Hero & Horizon Stack — depth-based plan surface.
 *
 * Top 40% = Hero (the only active CTA).
 * Beneath: 2 Horizon cards peeking at 90% / 84% width.
 * Anything beyond Top 3 lives in the Full Ledger sheet.
 */
const HeroHorizonStack = ({ items, onCommitHero }: HeroHorizonStackProps) => {
  const [ledgerOpen, setLedgerOpen] = useState(false);

  const hero = items.find((i) => i.rank === 'now') ?? items[0];
  const horizon = items.filter((i) => i.id !== hero?.id).slice(0, 2);
  const overflow = items.filter((i) => i.id !== hero?.id).slice(2);

  if (!hero) return null;

  return (
    <>
      {/* Priority 1 — Hero (top 40% of viewport) */}
      <div className="relative" style={{ minHeight: '40vh' }}>
        <FocusMove
          attraction={hero.attraction}
          location={hero.location}
          logic={hero.logic}
          wait={hero.wait}
          votes={hero.votes}
          ctaLabel="On Our Way"
          onCommit={onCommitHero}
        />
      </div>

      {/* Priority 2 & 3 — Horizon peeks */}
      {horizon.length > 0 && (
        <div className="relative -mt-3 space-y-2">
          {horizon.map((it, idx) => (
            <motion.div
              key={it.id}
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 + idx * 0.08 }}
              style={{
                width: idx === 0 ? '94%' : '88%',
                margin: '0 auto',
                position: 'relative',
                zIndex: 10 - idx,
              }}
            >
              <HorizonCard
                rank={it.rank as 'next' | 'later'}
                time={it.time}
                attraction={it.attraction}
                logic={it.logic}
                wait={it.wait}
                llSecured={it.llSecured}
                depth={(idx + 1) as 1 | 2}
                votes={it.votes}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* The Fade — Full Ledger trigger */}
      {overflow.length > 0 && (
        <button
          onClick={() => setLedgerOpen(true)}
          className="mt-4 mx-auto flex items-center gap-1.5 px-3 py-2 bg-transparent border-none cursor-pointer"
        >
          <span
            className="font-sans text-[10px] uppercase tracking-sovereign font-semibold"
            style={{ color: 'hsl(var(--slate-plaid))' }}
          >
            View full plan · {overflow.length} more
          </span>
          <ChevronDown size={12} style={{ color: 'hsl(var(--slate-plaid))' }} />
        </button>
      )}

      <FullLedgerSheet
        open={ledgerOpen}
        onClose={() => setLedgerOpen(false)}
        items={items}
      />
    </>
  );
};

export default HeroHorizonStack;
