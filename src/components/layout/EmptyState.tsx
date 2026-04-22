import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface EmptyStateProps {
  /** Tiny gold uppercase label above the title. */
  eyebrow?: ReactNode;
  /** Primary line — Playfair display. */
  title: ReactNode;
  /** Secondary hint line — Inter italic, muted. */
  hint?: ReactNode;
  /** Optional action element (CTA button, link). */
  action?: ReactNode;
}

/**
 * Brand placeholder for empty / loading-finished surfaces.
 *
 * Used wherever a list, ribbon, or section has no content. Keeps the
 * parchment voice ("All caught up", "On the books", etc.) instead of
 * dropping the user into a void.
 */
const EmptyState = ({ eyebrow, title, hint, action }: EmptyStateProps) => (
  <motion.div
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, ease: 'easeOut' }}
    className="rounded-2xl px-5 py-8 text-center bg-card"
    style={{
      border: '1px dashed hsl(var(--gold) / 0.35)',
    }}
  >
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center mx-auto mb-3"
      style={{
        backgroundColor: 'hsl(var(--gold) / 0.10)',
        border: '1px solid hsl(var(--gold) / 0.3)',
      }}
    >
      <Sparkles size={14} style={{ color: 'hsl(var(--gold))' }} />
    </div>
    {eyebrow && (
      <span
        className="font-sans text-[9px] uppercase tracking-sovereign font-bold block mb-1.5"
        style={{ color: 'hsl(var(--gold))', letterSpacing: '0.16em' }}
      >
        {eyebrow}
      </span>
    )}
    <p className="font-display text-[15px] leading-snug text-foreground">{title}</p>
    {hint && (
      <p className="font-sans italic text-[11px] text-muted-foreground mt-1.5 leading-snug">
        {hint}
      </p>
    )}
    {action && <div className="mt-4 flex justify-center">{action}</div>}
  </motion.div>
);

export default EmptyState;