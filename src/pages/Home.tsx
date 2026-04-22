import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, RefreshCw, LogIn, Settings as SettingsIcon } from 'lucide-react';

/**
 * Home — the launch pad. Single dominant CTA into the day, a quiet
 * secondary into the Vault, and a row of low-emphasis utilities.
 *
 * Refactored to share the brand vocabulary used by /park: editorial
 * eyebrow, Playfair display, parchment surfaces, gold accent.
 */
const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background digital-plaid-bg max-w-[480px] mx-auto flex flex-col px-6">
      {/* Brand mark + editorial eyebrow */}
      <motion.header
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="pt-12 pb-4"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-gold mb-3" />
        <span className="font-sans text-[9px] uppercase tracking-sovereign text-muted-foreground font-semibold">
          Castle Companion
        </span>
        <h1 className="text-masthead text-primary mt-2">
          Your day,<br /><span className="text-secondary">composed.</span>
        </h1>
      </motion.header>

      {/* Primary CTA — The Sovereign Plan */}
      <motion.button
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.45 }}
        whileTap={{ scale: 0.985 }}
        onClick={() => navigate('/park')}
        aria-label="Follow my plan — open the Sovereign Stack"
        className="group w-full text-left rounded-2xl bg-primary text-primary-foreground border-none cursor-pointer mt-6 p-7 shadow-boutique hover:shadow-boutique-hover transition-shadow"
      >
        <span className="font-sans text-[9px] uppercase tracking-sovereign text-primary-foreground/55 font-bold block mb-3">
          The Horizon
        </span>
        <div className="flex items-end justify-between">
          <h2 className="text-masthead text-primary-foreground">
            Follow<br />my plan
          </h2>
          <ArrowRight size={22} className="text-primary-foreground/50 group-hover:text-primary-foreground transition-colors mb-1" />
        </div>
      </motion.button>

      {/* Secondary CTA — The Vault */}
      <motion.button
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22, duration: 0.45 }}
        whileTap={{ scale: 0.985 }}
        onClick={() => navigate('/joy-report')}
        aria-label="Past voyages — open the Vault"
        className="group w-full text-left rounded-2xl bg-card border border-border/40 cursor-pointer mt-3 p-5 shadow-boutique hover:shadow-boutique-hover transition-shadow"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-9 h-9 rounded-xl bg-gold/12 flex items-center justify-center shrink-0">
              <BookOpen size={16} className="text-gold" />
            </span>
            <div className="min-w-0">
              <h3 className="font-display text-[18px] leading-tight text-foreground truncate">
                Past voyages
              </h3>
              <span className="font-sans text-[9px] uppercase tracking-sovereign text-muted-foreground font-semibold">
                The Vault
              </span>
            </div>
          </div>
          <ArrowRight size={16} className="text-muted-foreground/40 shrink-0" />
        </div>
      </motion.button>

      {/* Low-emphasis utility row */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="mt-auto pb-10 pt-8"
      >
        <button
          type="button"
          className="w-full flex items-center justify-center gap-2 bg-transparent border-none cursor-pointer mb-5 group"
          aria-label="Sync your upcoming voyage"
        >
          <RefreshCw size={11} className="text-muted-foreground/55 group-hover:text-foreground transition-colors" />
          <span className="font-sans text-[10px] text-muted-foreground/70 group-hover:text-foreground transition-colors">
            Sync upcoming voyage
          </span>
        </button>

        <div className="flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={() => navigate('/auth')}
            className="flex items-center gap-1.5 bg-transparent border-none cursor-pointer group"
          >
            <LogIn size={11} className="text-muted-foreground/55 group-hover:text-foreground transition-colors" />
            <span className="font-sans text-[10px] text-muted-foreground/70 group-hover:text-foreground transition-colors">
              Sign in
            </span>
          </button>
          <span className="text-muted-foreground/20 text-[8px]">·</span>
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="flex items-center gap-1.5 bg-transparent border-none cursor-pointer group"
          >
            <SettingsIcon size={11} className="text-muted-foreground/55 group-hover:text-foreground transition-colors" />
            <span className="font-sans text-[10px] text-muted-foreground/70 group-hover:text-foreground transition-colors">
              Settings
            </span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Home;
