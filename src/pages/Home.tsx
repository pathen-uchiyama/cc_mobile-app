import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Compass, BookOpen, RefreshCw, LogIn, Settings } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();

  const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12 } },
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="min-h-screen bg-background max-w-[480px] mx-auto flex flex-col px-6 pt-14 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10"
      >
        <div className="w-8 h-8 bg-primary mb-5" />
        <h1 className="font-display text-3xl text-foreground mb-2">
          Castle Companion
        </h1>
        <p className="font-sans text-xs text-muted-foreground leading-relaxed max-w-[260px]">
          Your concierge for the parks.
        </p>
      </motion.div>

      {/* Primary Actions */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="space-y-4 flex-1"
      >
        <motion.button
          variants={fadeUp}
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
          variants={fadeUp}
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
      </motion.div>

      {/* Utility Links */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-10 space-y-3"
      >
        {/* Sync */}
        <div className="flex justify-center">
          <button className="flex items-center gap-2 bg-transparent border-none cursor-pointer group">
            <RefreshCw size={13} className="text-muted-foreground group-hover:text-foreground transition-colors" />
            <span className="font-sans text-[11px] text-muted-foreground group-hover:text-foreground transition-colors underline underline-offset-4 decoration-muted-foreground/30">
              Sync Upcoming Voyage
            </span>
          </button>
        </div>

        {/* Navigation Row */}
        <div className="flex items-center justify-center gap-6 pt-2">
          <button
            onClick={() => navigate('/auth')}
            className="flex items-center gap-2 bg-transparent border-none cursor-pointer group"
          >
            <LogIn size={13} className="text-muted-foreground group-hover:text-foreground transition-colors" />
            <span className="font-sans text-[11px] text-muted-foreground group-hover:text-foreground transition-colors">
              Sign In
            </span>
          </button>

          <span className="text-border text-[10px]">|</span>

          <button
            onClick={() => navigate('/auth')}
            className="flex items-center gap-2 bg-transparent border-none cursor-pointer group"
          >
            <Settings size={13} className="text-muted-foreground group-hover:text-foreground transition-colors" />
            <span className="font-sans text-[11px] text-muted-foreground group-hover:text-foreground transition-colors">
              Account
            </span>
          </button>
        </div>
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="font-sans text-[9px] uppercase tracking-sovereign text-muted-foreground text-center mt-10"
      >
        The Sovereign Protocol — v1.0
      </motion.p>
    </div>
  );
};

export default Home;
