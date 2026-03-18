import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Map, Compass, Clock, BookOpen } from 'lucide-react';

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

      {/* Primary Actions */}
      <div className="space-y-4 flex-1">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/park')}
          className="w-full bg-card p-6 shadow-boutique cursor-pointer border-none text-left group hover:shadow-boutique-hover transition-shadow"
        >
          <div className="flex items-start gap-5">
            <div className="w-12 h-12 bg-primary flex items-center justify-center shrink-0">
              <Compass size={20} className="text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-display text-xl text-foreground mb-1">Follow My Plan</h2>
              <p className="font-sans text-xs text-muted-foreground leading-relaxed">
                Your itinerary is locked. Enter the park with your concierge active.
              </p>
            </div>
          </div>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/plan')}
          className="w-full bg-card p-6 shadow-boutique cursor-pointer border-none text-left group hover:shadow-boutique-hover transition-shadow"
        >
          <div className="flex items-start gap-5">
            <div className="w-12 h-12 bg-accent flex items-center justify-center shrink-0">
              <Map size={20} className="text-accent-foreground" />
            </div>
            <div>
              <h2 className="font-display text-xl text-foreground mb-1">Build a Plan</h2>
              <p className="font-sans text-xs text-muted-foreground leading-relaxed">
                Tell us about your party, preferences, and let the concierge compose your day.
              </p>
            </div>
          </div>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/itinerary')}
          className="w-full bg-card p-6 shadow-boutique cursor-pointer border-none text-left group hover:shadow-boutique-hover transition-shadow"
        >
          <div className="flex items-start gap-5">
            <div className="w-12 h-12 bg-muted flex items-center justify-center shrink-0">
              <Clock size={20} className="text-foreground" />
            </div>
            <div>
              <h2 className="font-display text-xl text-foreground mb-1">Edit My Plan</h2>
              <p className="font-sans text-xs text-muted-foreground leading-relaxed">
                Rearrange, swap, or adjust your existing itinerary before heading out.
              </p>
            </div>
          </div>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-card p-6 shadow-boutique cursor-pointer border-none text-left group hover:shadow-boutique-hover transition-shadow"
        >
          <div className="flex items-start gap-5">
            <div className="w-12 h-12 bg-muted flex items-center justify-center shrink-0">
              <BookOpen size={20} className="text-foreground" />
            </div>
            <div>
              <h2 className="font-display text-xl text-foreground mb-1">Past Voyages</h2>
              <p className="font-sans text-xs text-muted-foreground leading-relaxed">
                Relive your memories and review past park days.
              </p>
            </div>
          </div>
        </motion.button>
      </div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="font-sans text-[9px] uppercase tracking-sovereign text-muted-foreground text-center mt-12"
      >
        The Sovereign Protocol — v1.0
      </motion.p>
    </div>
  );
};

export default Landing;
