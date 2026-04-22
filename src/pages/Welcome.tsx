import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const ENTERED_KEY = 'cc.entered';

const Welcome = () => {
  const navigate = useNavigate();

  // Returning users skip Welcome — once they've crossed the threshold,
  // we land them straight on /home so the app feels owned, not introduced.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.localStorage.getItem(ENTERED_KEY) === '1') {
      navigate('/home', { replace: true });
    }
  }, [navigate]);

  const handleEnter = () => {
    try {
      window.localStorage.setItem(ENTERED_KEY, '1');
    } catch {
      // Private mode / storage disabled — non-blocking.
    }
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-background digital-plaid-bg flex flex-col items-center justify-center px-8 max-w-[480px] mx-auto">
      {/* Brand Mark — placeholder for future animation */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="flex flex-col items-center"
      >
        <div className="flex items-center gap-2 mb-8">
          <div className="w-14 h-14 bg-primary" />
          <div className="w-3 h-14 bg-tertiary" />
        </div>
        <h1 className="text-masthead text-primary text-center mb-3">
          Castle<br /><span className="text-secondary">Companion.</span>
        </h1>
        <p className="font-sans text-xs text-muted-foreground text-center leading-relaxed max-w-[240px] mb-16">
          The Sovereign Protocol
        </p>
      </motion.div>

      {/* Enter Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleEnter}
        className="w-full bg-primary text-primary-foreground font-sans text-sm tracking-wide py-4 min-h-[48px] shadow-boutique cursor-pointer border-none"
      >
        Enter
      </motion.button>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="font-sans text-[9px] uppercase tracking-sovereign text-muted-foreground text-center mt-20"
      >
        Logic over luck — v1.0
      </motion.p>
    </div>
  );
};

export default Welcome;
