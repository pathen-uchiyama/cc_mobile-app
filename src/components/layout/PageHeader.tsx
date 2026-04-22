import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  /** Small uppercase gold eyebrow above the title. */
  eyebrow?: ReactNode;
  /** The display-font page title. */
  title: ReactNode;
  /** Optional subtitle / description (Inter, muted). */
  subtitle?: ReactNode;
  /**
   * Where back navigates. String routes use `navigate(path)`; passing
   * `'back'` falls back to history. Defaults to `/park` so users always
   * land somewhere meaningful instead of escaping the app.
   */
  backTo?: string | 'back';
  /** Custom label for the back link. Defaults to "Your day". */
  backLabel?: string;
  /** Optional right-aligned slot (e.g. tier badge, edit pencil). */
  rightSlot?: ReactNode;
  /** When true, header sticks to the top with backdrop blur. Default true. */
  sticky?: boolean;
  /** Optional content rendered below the title block (chips, meters). */
  children?: ReactNode;
}

/**
 * Unified page header for all secondary routes.
 *
 * Replaces the ad-hoc back-arrow + title pattern that drifted across
 * `/upgrades`, `/joy-report`, `/edit-itinerary`, `/settings`, `/book-ll`.
 * Shares one motion signature (gentle 12px settle), one spacing rhythm,
 * and a single back affordance with a deterministic destination.
 */
const PageHeader = ({
  eyebrow,
  title,
  subtitle,
  backTo = '/park',
  backLabel = 'Your day',
  rightSlot,
  sticky = true,
  children,
}: PageHeaderProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backTo === 'back') navigate(-1);
    else navigate(backTo);
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={
        sticky
          ? 'sticky top-0 z-10 bg-background/95 backdrop-blur-sm px-5 pt-5 pb-3'
          : 'px-5 pt-5 pb-3'
      }
      style={{ borderBottom: '1px solid hsl(var(--obsidian) / 0.06)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1 bg-transparent border-none cursor-pointer p-1 -ml-1 mb-2 text-muted-foreground hover:text-foreground transition-colors min-h-[32px]"
            aria-label={`Back to ${backLabel.toLowerCase()}`}
          >
            <ChevronLeft size={16} />
            <span className="font-sans text-[11px]">{backLabel}</span>
          </button>
          {eyebrow && (
            <span
              className="font-sans text-[9px] uppercase tracking-sovereign font-bold block"
              style={{ color: 'hsl(var(--gold))', letterSpacing: '0.16em' }}
            >
              {eyebrow}
            </span>
          )}
          <h1 className="font-display text-[26px] leading-tight text-foreground mt-1">
            {title}
          </h1>
          {subtitle && (
            <p className="font-sans text-[11px] text-muted-foreground mt-1.5 leading-snug">
              {subtitle}
            </p>
          )}
        </div>
        {rightSlot && <div className="shrink-0 mt-7">{rightSlot}</div>}
      </div>
      {children && <div className="mt-3">{children}</div>}
    </motion.header>
  );
};

export default PageHeader;