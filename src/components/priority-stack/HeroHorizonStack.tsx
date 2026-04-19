import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import FocusMove from './FocusMove';
import HorizonCard from './HorizonCard';
import WalkingCard from './WalkingCard';
import FullLedgerSheet from './FullLedgerSheet';

export interface PlanItem {
  id: string;
  rank: 'now' | 'next' | 'later';
  time: string;
  attraction: string;
  location: string;
  logic: string;
  wait?: string;
  llSecured?: boolean;
  /** Party poll result: how many of the traveling party flagged this as a must-do. */
  party?: { yes: number; total: number };
  /** Keepsake prompt — surfaces in the Memory Ribbon of the card. */
  questPrompt?: string;
  questType?: 'photo' | 'voice';
}

export interface WalkingPrompt {
  id: string;
  /** Where in the stack this prompt appears. 0 = above Hero, 1 = between Hero and Next, 2 = between Next and Later. */
  afterIndex: 0 | 1 | 2;
  whimsy: string;
  type?: 'photo' | 'voice' | 'observe';
  nearby?: string;
}

interface HeroHorizonStackProps {
  items: PlanItem[];
  walkingPrompts?: WalkingPrompt[];
  onCommitHero: () => void;
  onCaptureMemory?: (planItemId: string) => void;
  onCaptureWalking?: (walkingId: string) => void;
  onFindAndSeek?: (planItemId: string) => void;
  /** When true, the Hero card glows gold + shows "A New Path is Available". */
  pivotSuggested?: boolean;
  pivotHeadline?: string;
}

/**
 * Hero & Horizon Stack — depth-based plan surface.
 *
 * Top: Hero (≥25vh, dual-purpose).
 * Beneath: 2 Horizon cards peeking.
 * Interleaved: optional Walking Cards (Keepsakes only).
 * Overflow: Full Ledger sheet.
 */
const HeroHorizonStack = ({
  items,
  walkingPrompts = [],
  onCommitHero,
  onCaptureMemory,
  onCaptureWalking,
  onFindAndSeek,
  pivotSuggested = false,
  pivotHeadline,
}: HeroHorizonStackProps) => {
  const [ledgerOpen, setLedgerOpen] = useState(false);

  const hero = items.find((i) => i.rank === 'now') ?? items[0];
  const horizon = items.filter((i) => i.id !== hero?.id).slice(0, 2);
  const overflow = items.filter((i) => i.id !== hero?.id).slice(2);

  if (!hero) return null;

  const walkingAfter = (idx: 0 | 1 | 2) => walkingPrompts.filter((w) => w.afterIndex === idx);

  const renderWalking = (idx: 0 | 1 | 2) =>
    walkingAfter(idx).map((w) => (
      <WalkingCard
        key={w.id}
        whimsy={w.whimsy}
        type={w.type}
        nearby={w.nearby}
        onCapture={() => onCaptureWalking?.(w.id)}
      />
    ));

  return (
    <>
      {/* Forced-Focus eyebrow */}
      <div className="flex items-center justify-between mb-2 px-1">
        <span
          className="font-sans text-[9px] uppercase tracking-sovereign font-bold"
          style={{ color: 'hsl(var(--gold))' }}
        >
          Top 3 Priorities
        </span>
        <span
          className="font-sans text-[9px] uppercase tracking-sovereign"
          style={{ color: 'hsl(var(--slate-plaid))' }}
        >
          The rest is folded
        </span>
      </div>

      {/* Optional walking prompt above the Hero */}
      {walkingAfter(0).length > 0 && <div className="mb-3 space-y-2">{renderWalking(0)}</div>}

      {/* Priority 1 — The Hero. 50% of viewport height. The "Now". */}
      <div
        className="relative"
        style={{ height: '50vh', minHeight: '420px', marginBottom: '12px' }}
      >
        <FocusMove
          attraction={hero.attraction}
          location={hero.location}
          logic={hero.logic}
          wait={hero.wait}
          party={hero.party}
          ctaLabel="On Our Way"
          onCommit={onCommitHero}
          onSecureLL={onSecureLL}
          questPrompt={hero.questPrompt}
          questType={hero.questType}
          onCaptureMemory={() => onCaptureMemory?.(hero.id)}
          onFindAndSeek={() => onFindAndSeek?.(hero.id)}
          pivotSuggested={pivotSuggested}
          pivotHeadline={pivotHeadline}
        />
      </div>

      {/* Walking prompt between Hero and Next */}
      {walkingAfter(1).length > 0 && <div className="mt-4 space-y-2">{renderWalking(1)}</div>}

      {/* Priority 2 & 3 — The Horizon. ~20% smaller than the Hero. The "Near Future". */}
      {horizon.length > 0 && (
        <div className="relative mt-4 space-y-2.5">
          {horizon.map((it, idx) => (
            <motion.div
              key={it.id}
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 + idx * 0.08 }}
              style={{
                // 20% smaller: scale(0.8) for both Horizon cards. Equal width — uniform "horizon line".
                width: '92%',
                margin: '0 auto',
                position: 'relative',
                zIndex: 10 - idx,
                transform: 'scale(0.8)',
                transformOrigin: 'top center',
                // Pull the next card up to absorb the scale gap so spacing reads as intentional.
                marginTop: idx === 0 ? '0' : '-32px',
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
                party={it.party}
                questPrompt={it.questPrompt}
                onCaptureMemory={() => onCaptureMemory?.(it.id)}
              />
              {/* Walking prompt between Next and Later */}
              {idx === 0 && walkingAfter(2).length > 0 && (
                <div className="mt-3 space-y-2">{renderWalking(2)}</div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* The Fade — Full Ledger trigger */}
      {overflow.length > 0 && (
        <button
          onClick={() => setLedgerOpen(true)}
          className="mt-4 mx-auto flex items-center gap-1.5 px-3 py-2 bg-transparent border-none cursor-pointer"
          style={{ borderRadius: '16px' }}
        >
          <span
            className="font-sans text-[10px] uppercase tracking-sovereign font-semibold"
            style={{ color: 'hsl(var(--slate-plaid))' }}
          >
            Full ledger · {overflow.length} more
          </span>
          <ChevronDown size={12} style={{ color: 'hsl(var(--slate-plaid))' }} />
        </button>
      )}

      <FullLedgerSheet
        open={ledgerOpen}
        onClose={() => setLedgerOpen(false)}
        items={items}
        onSecureLL={onSecureLLForItem}
        onOpenVault={onOpenLLVault}
      />
    </>
  );
};

export default HeroHorizonStack;
