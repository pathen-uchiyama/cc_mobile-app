import { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

interface RouteTransitionProps {
  children: ReactNode;
}

/**
 * Per-route transition wrapper.
 *
 * Lives just inside `<Routes>` so each page mounts with a soft fade +
 * 6px settle, matching the in-page motion language. Honours
 * `prefers-reduced-motion` automatically — when reduced, the wrapper
 * collapses to an instantaneous render so navigation stays sharp.
 */
const RouteTransition = ({ children }: RouteTransitionProps) => {
  const location = useLocation();
  const reduce = useReducedMotion();

  if (reduce) return <>{children}</>;

  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.22, ease: [0.2, 0.0, 0.2, 1] }}
      className="min-h-screen"
    >
      {children}
    </motion.div>
  );
};

export default RouteTransition;