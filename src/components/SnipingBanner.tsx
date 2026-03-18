import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

interface SnipingBannerProps {
  message: string;
  isVisible: boolean;
  onDismiss: () => void;
}

const SnipingBanner = ({ message, isVisible, onDismiss }: SnipingBannerProps) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -120, opacity: 0 }}
          transition={{ type: 'spring', damping: 18, stiffness: 120 }}
          className="fixed top-[60px] left-4 right-4 z-[9999] max-w-[448px] mx-auto bg-card p-4 shadow-boutique-hover border-l-4 border-gold cursor-pointer"
          onClick={onDismiss}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle size={16} className="text-gold mt-0.5 shrink-0" />
            <div>
              <p className="font-sans text-xs text-foreground leading-relaxed">{message}</p>
              <span className="font-sans text-[9px] text-muted-foreground uppercase tracking-sovereign mt-1 block">Tap to dismiss</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SnipingBanner;
