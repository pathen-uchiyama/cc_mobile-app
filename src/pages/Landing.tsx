import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Compass, BookOpen, RefreshCw } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background max-w-[480px] mx-auto flex flex-col px-6 pt-16 pb-12">
      {/* Brand */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="mb-16"
      >
        <div className="w-10 h-10 bg-primary mb-6" />
        <h1 className="font-display text-4xl text-foreground mb-3">
          Castle<br />Companion
        </h1>
        <p className="font-sans text-sm text-muted-foreground leading-relaxed max-w-[280px]">
          Logic over luck. Your concierge for the parks.
        </p>
      </motion.div>

      {/* Two Primary Actions */}
      <div className="space-y-4 flex-1">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/park')}
          className="w-full bg-card p-8 shadow-boutique cursor-pointer border-none text-left group hover:shadow-boutique-hover transition-shadow"
        >
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 bg-primary flex items-center justify-center shrink-0">
              <Compass size={24} className="text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-display text-2xl text-foreground mb-2">Follow My Plan</h2>
              <p className="font-sans text-xs text-muted-foreground leading-relaxed">
                Your itinerary is locked. Enter the park with your concierge active.
              </p>
            </div>
          </div>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-card p-8 shadow-boutique cursor-pointer border-none text-left group hover:shadow-boutique-hover transition-shadow"
        >
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 bg-accent flex items-center justify-center shrink-0">
              <BookOpen size={24} className="text-accent-foreground" />
            </div>
            <div>
              <h2 className="font-display text-2xl text-foreground mb-2">Past Voyages</h2>
              <p className="font-sans text-xs text-muted-foreground leading-relaxed">
                Relive your memories and review past park days.
              </p>
            </div>
          </div>
        </motion.button>
      </div>

      {/* Sync Utility Link */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex justify-center mt-12 mb-8"
      >
        <button className="flex items-center gap-2 bg-transparent border-none cursor-pointer group">
          <RefreshCw size={13} className="text-muted-foreground group-hover:text-foreground transition-colors" />
          <span className="font-sans text-[11px] text-muted-foreground group-hover:text-foreground transition-colors underline underline-offset-4 decoration-muted-foreground/30">
            Sync Upcoming Voyage
          </span>
        </button>
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="font-sans text-[9px] uppercase tracking-sovereign text-muted-foreground text-center"
      >
        The Sovereign Protocol — v1.0
      </motion.p>
    </div>
  );
};

export default Landing;
