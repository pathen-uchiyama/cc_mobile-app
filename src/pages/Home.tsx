import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, RefreshCw, LogIn, Settings } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background max-w-[480px] mx-auto flex flex-col">
      {/* Uber Black-style: single dominant action fills the top */}
      <div className="flex-1 flex flex-col justify-center px-6 pt-16">
        {/* Minimal brand mark */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="w-6 h-6 bg-primary mb-4" />
          <p className="font-sans text-[9px] uppercase tracking-sovereign text-muted-foreground">
            Castle Companion
          </p>
        </motion.div>

        {/* Primary CTA — dominates the viewport like Uber Black's ride button */}
        <motion.button
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          whileTap={{ scale: 0.985 }}
          onClick={() => navigate('/park')}
          className="w-full bg-primary p-10 shadow-boutique cursor-pointer border-none text-left group hover:shadow-boutique-hover transition-shadow mb-4"
        >
          <div className="flex items-end justify-between">
            <div>
              <span className="font-sans text-[8px] uppercase tracking-sovereign text-primary-foreground/50 block mb-3">
                The Horizon
              </span>
              <h1 className="font-display text-4xl text-primary-foreground leading-none">
                Follow<br />My Plan
              </h1>
            </div>
            <ArrowRight size={28} className="text-primary-foreground/40 group-hover:text-primary-foreground transition-colors mb-1" />
          </div>
        </motion.button>

        {/* Secondary — recedes visually */}
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          whileTap={{ scale: 0.985 }}
          className="w-full bg-card p-6 shadow-boutique cursor-pointer border-none text-left group hover:shadow-boutique-hover transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <BookOpen size={18} className="text-muted-foreground" />
              <div>
                <h2 className="font-display text-lg text-foreground">Past Voyages</h2>
                <span className="font-sans text-[9px] text-muted-foreground uppercase tracking-sovereign">The Vault</span>
              </div>
            </div>
            <ArrowRight size={16} className="text-muted-foreground/30" />
          </div>
        </motion.button>
      </div>

      {/* Bottom utility — minimal, Uber-style */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="px-6 pb-10 pt-8"
      >
        {/* Sync */}
        <div className="flex justify-center mb-5">
          <button className="flex items-center gap-2 bg-transparent border-none cursor-pointer group">
            <RefreshCw size={11} className="text-muted-foreground/50 group-hover:text-foreground transition-colors" />
            <span className="font-sans text-[10px] text-muted-foreground/50 group-hover:text-foreground transition-colors">
              Sync Upcoming Voyage
            </span>
          </button>
        </div>

        {/* Nav row */}
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={() => navigate('/auth')}
            className="flex items-center gap-1.5 bg-transparent border-none cursor-pointer group"
          >
            <LogIn size={11} className="text-muted-foreground/40 group-hover:text-foreground transition-colors" />
            <span className="font-sans text-[10px] text-muted-foreground/40 group-hover:text-foreground transition-colors">
              Sign In
            </span>
          </button>
          <span className="text-muted-foreground/20 text-[8px]">·</span>
          <button
            onClick={() => navigate('/auth')}
            className="flex items-center gap-1.5 bg-transparent border-none cursor-pointer group"
          >
            <Settings size={11} className="text-muted-foreground/40 group-hover:text-foreground transition-colors" />
            <span className="font-sans text-[10px] text-muted-foreground/40 group-hover:text-foreground transition-colors">
              Account
            </span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Home;
