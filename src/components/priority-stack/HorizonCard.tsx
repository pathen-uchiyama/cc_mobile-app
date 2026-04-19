import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

interface HorizonCardProps {
  rank: 'next' | 'later';
  time: string;
  attraction: string;
  logic: string;
  wait?: string;
  llSecured?: boolean;
}

/**
 * Horizon Card — Priority 2 & 3.
 *
 * Smaller than Hero. 16px radius. Lighter shadow @ 4% opacity.
 * Logic text uses Slate Plaid to reduce visual noise.
 */
const HorizonCard = ({
  rank,
  time,
  attraction,
  logic,
  wait,
  llSecured,
}: HorizonCardProps) => {
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: rank === 'next' ? 0.08 : 0.16 }}
      className="bg-card rounded-2xl px-5 py-4"
      style={{ boxShadow: '0 8px 24px hsl(var(--obsidian) / 0.04)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-sans text-[8px] uppercase tracking-sovereign text-muted-foreground font-semibold">
              {rank === 'next' ? 'Next' : 'Later'} · {time}
            </span>
            {llSecured && (
              <span className="flex items-center gap-1 bg-accent/12 px-1.5 py-0.5 rounded-full">
                <Zap size={8} className="text-accent" />
                <span className="font-sans text-[7px] uppercase tracking-sovereign text-accent font-bold">LL</span>
              </span>
            )}
          </div>
          <h3 className="font-display text-[17px] leading-tight text-foreground truncate">
            {attraction}
          </h3>
          {/* Slate Plaid logic — explicit token to dial down noise */}
          <p className="font-sans italic text-[12px] mt-1 leading-snug" style={{ color: 'hsl(var(--slate-plaid))' }}>
            {logic}
          </p>
        </div>
        {wait && (
          <div className="shrink-0 text-right">
            <span className="font-sans text-[10px] uppercase tracking-sovereign font-semibold tabular-nums" style={{ color: 'hsl(var(--slate-plaid))' }}>
              {wait}
            </span>
          </div>
        )}
      </div>
    </motion.article>
  );
};

export default HorizonCard;
