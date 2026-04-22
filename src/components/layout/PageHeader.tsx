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
          ? 'sticky top-0 z-10 bg-background/95 backdrop-blur-sm px-6 pt-5 pb-5'
          : 'px-6 pt-5 pb-5'
      }
      // No-line rule: separation comes from the surface-tone shift of the
      // section beneath, not a drawn 1px border.
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1 bg-transparent border-none cursor-pointer p-1 -ml-1 mb-3 text-on-surface-variant hover:text-primary transition-colors min-h-[32px]"
            aria-label={`Back to ${backLabel.toLowerCase()}`}
          >
            <ChevronLeft size={16} />
            <span className="font-sans text-[11px] font-medium">{backLabel}</span>
          </button>
          {eyebrow && (
            <p className="font-sans text-[11px] font-bold uppercase text-secondary mb-2"
               style={{ letterSpacing: '0.2em' }}
            >
              {eyebrow}
            </p>
          )}
          <h1 className="font-display font-black text-[34px] leading-[1.05] tracking-tight text-primary">
            {title}
          </h1>
          {subtitle && (
            <p className="font-sans text-[13px] text-on-surface-variant mt-3 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
        {rightSlot && <div className="shrink-0 mt-7">{rightSlot}</div>}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </motion.header>
  );
};

export default PageHeader;