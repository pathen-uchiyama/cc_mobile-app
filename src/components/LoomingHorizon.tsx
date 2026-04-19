import { motion } from 'framer-motion';

interface LoomingHorizonProps {
  parkName?: string;
  pulseStatus?: string;
}

/**
 * Top header — shows the Current Realm + Pulse Status.
 * Sits flush on parchment background (no white sections).
 */
const LoomingHorizon = ({
  parkName = 'Magic Kingdom',
  pulseStatus = 'Strategy is Active',
}: LoomingHorizonProps) => {
  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-[9999] bg-background px-6 py-4"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 100 }}
    >
      <div className="max-w-[480px] mx-auto flex items-center justify-between">
        {/* Current Realm */}
        <div className="flex items-center gap-2.5">
          <motion.div
            animate={{ scale: [1, 1.25, 1] }}
            transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
            className="w-2 h-2 rounded-full"
            style={{ background: 'hsl(var(--gold))' }}
          />
          <span className="font-sans text-[10px] uppercase tracking-sovereign text-foreground font-semibold">
            {parkName}
          </span>
        </div>

        {/* Pulse Status */}
        <div className="flex items-center gap-2">
          <span className="font-sans text-[9px] uppercase tracking-sovereign font-semibold" style={{ color: 'hsl(var(--gold))' }}>
            {pulseStatus}
          </span>
        </div>
      </div>
    </motion.header>
  );
};

export default LoomingHorizon;
