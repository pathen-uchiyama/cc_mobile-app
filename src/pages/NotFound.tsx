import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Compass } from "lucide-react";

/**
 * 404 — "Off the Path"
 *
 * Branded recovery surface that mirrors the parchment / obsidian / gold
 * vocabulary of the rest of the app. Offers a single Obsidian CTA back
 * to the active journey and a quiet ghost link to the welcome screen.
 */
const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background max-w-[480px] mx-auto px-6 py-16 flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex-1 flex flex-col justify-center"
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mb-6"
          style={{
            backgroundColor: "hsl(var(--gold) / 0.12)",
            border: "1px solid hsl(var(--gold) / 0.4)",
          }}
        >
          <Compass size={20} style={{ color: "hsl(var(--gold))" }} />
        </div>

        <span
          className="font-sans text-[9px] uppercase tracking-sovereign font-bold mb-3"
          style={{ color: "hsl(var(--gold))", letterSpacing: "0.2em" }}
        >
          404 · Off the Path
        </span>

        <h1 className="font-display text-[34px] leading-[1.05] text-foreground mb-3">
          This corner of the
          <br />
          park is uncharted.
        </h1>

        <p className="font-sans italic text-[13px] text-foreground/70 leading-snug mb-8 max-w-[320px]">
          The page you were chasing isn't on the map. Let's get you back to the
          plan that's already in motion.
        </p>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/park")}
          className="w-full rounded-2xl py-4 px-5 flex items-center justify-between gap-2 border-none cursor-pointer min-h-[52px] font-sans text-[13px] font-semibold mb-3"
          style={{
            backgroundColor: "hsl(var(--obsidian))",
            color: "hsl(var(--parchment))",
            boxShadow: "0 16px 36px hsl(var(--obsidian) / 0.28)",
          }}
        >
          <span>Return to your day</span>
          <ArrowRight size={16} style={{ color: "hsl(var(--gold))" }} />
        </motion.button>

        <button
          type="button"
          onClick={() => navigate("/")}
          className="w-full text-center bg-transparent border-none cursor-pointer py-2 font-sans text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          Or start over from the beginning
        </button>
      </motion.div>

      <p className="font-sans text-[9px] uppercase tracking-sovereign text-muted-foreground/60 text-center">
        Castle Companion · Logic over luck
      </p>
    </div>
  );
};

export default NotFound;
