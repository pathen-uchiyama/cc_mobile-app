import { ReactNode, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';

type SnapPoint = 'peek' | 'half' | 'full';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  /** Initial snap point. Default: 'half' */
  snap?: SnapPoint;
  /** Optional eyebrow label above title */
  eyebrow?: ReactNode;
  /** Optional sheet title */
  title?: ReactNode;
  /** Optional subtitle/description under title */
  subtitle?: ReactNode;
  children: ReactNode;
  /** zIndex override (default 9990) */
  zIndex?: number;
}

const HEIGHTS: Record<SnapPoint, string> = {
  peek: '120px',
  half: '50vh',
  full: '90vh',
};

/**
 * Unified bottom-sheet primitive — every overlay in the app inherits from this.
 *
 * Consistent rules:
 * - 3 snap points: peek (120px), half (50vh), full (90vh)
 * - Gold drag-handle at top
 * - Vellum-blur backdrop
 * - Swipe-down-to-dismiss
 */
const BottomSheet = ({
  open,
  onClose,
  snap = 'half',
  eyebrow,
  title,
  subtitle,
  children,
  zIndex = 9990,
}: BottomSheetProps) => {
  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0"
          style={{ zIndex }}
        >
          {/* Vellum-blur backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-foreground/40"
            style={{ backdropFilter: 'blur(8px) contrast(1.1) brightness(0.9)', WebkitBackdropFilter: 'blur(8px) contrast(1.1) brightness(0.9)' }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={handleDragEnd}
            className="absolute bottom-0 inset-x-0 bg-background max-w-[480px] mx-auto rounded-t-2xl shadow-boutique-hover overflow-hidden flex flex-col"
            style={{ height: HEIGHTS[snap], maxHeight: '90vh' }}
          >
            {/* Gold drag handle — drag affordance lives here */}
            <div className="shrink-0 pt-2 pb-1 flex items-center justify-center cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1 rounded-full bg-accent/60" />
            </div>

            {/* Header */}
            {(eyebrow || title || subtitle) && (
              <div className="px-6 pt-2 pb-4 shrink-0">
                {eyebrow && (
                  <div className="font-sans text-[9px] uppercase tracking-sovereign text-accent font-bold mb-2">
                    {eyebrow}
                  </div>
                )}
                {title && (
                  <h2 className="font-display text-2xl text-foreground leading-tight">
                    {title}
                  </h2>
                )}
                {subtitle && (
                  <p className="font-sans text-[11px] text-muted-foreground mt-1.5">
                    {subtitle}
                  </p>
                )}
              </div>
            )}

            {/* Body — scrolls if it overflows */}
            <div className="flex-1 overflow-y-auto px-6 pb-8">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BottomSheet;
