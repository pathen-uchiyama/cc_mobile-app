import { motion, AnimatePresence } from 'framer-motion';

interface LoomingHorizonProps {
  parkName?: string;
  isThinking?: boolean;
  statusText?: string;
}

const LoomingHorizon = ({ parkName = "Magic Kingdom", isThinking = false, statusText = "" }: LoomingHorizonProps) => {
  return (
    <motion.header
      layout
      className="fixed top-0 left-0 right-0 z-[9999] bg-parchment border-b border-slate-divider px-6 py-4"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 100 }}
    >
      <div className="max-w-[480px] mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="w-2 h-2 bg-slate-plaid"
            style={{ borderRadius: '50%' }}
          />
          <span className="font-sans text-[10px] uppercase tracking-sovereign text-foreground font-semibold">
            {parkName}
          </span>
        </div>

        <AnimatePresence mode="wait">
          {isThinking && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-3 text-thistle"
            >
              <span className="font-display italic text-sm">{statusText}</span>
              <div className="w-4 h-4 border-2 border-thistle border-t-transparent animate-spin" style={{ borderRadius: '50%' }} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
};

export default LoomingHorizon;
