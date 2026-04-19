import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Heart, Camera, Clock, MapPin, Sparkles, Zap, RefreshCw, Mic } from 'lucide-react';
import { useJoyEvents, formatEventTime, type JoyEvent } from '@/contexts/JoyEventsContext';

const ICON_BY_TYPE: Record<JoyEvent['type'], typeof Star> = {
  arrival: MapPin,
  snipe: Zap,
  swap: RefreshCw,
  celebration: Sparkles,
  'check-in': Star,
  memory: Camera,
  recovery: Heart,
};

const COLOR_BY_TYPE: Record<JoyEvent['type'], string> = {
  arrival: 'text-foreground',
  snipe: 'text-accent',
  swap: 'text-primary',
  celebration: 'text-accent',
  'check-in': 'text-foreground',
  memory: 'text-foreground',
  recovery: 'text-destructive',
};

const JoyReport = () => {
  const navigate = useNavigate();
  const { events } = useJoyEvents();

  const sorted = useMemo(
    () => [...events].sort((a, b) => Number(a.at) - Number(b.at)),
    [events]
  );

  const stats = useMemo(() => {
    const savedMinutes = sorted.reduce((sum, e) => sum + (e.savedMinutes ?? 0), 0);
    const snipes = sorted.filter((e) => e.type === 'snipe').length;
    const swaps = sorted.filter((e) => e.type === 'swap').length;
    const memories = sorted.filter((e) => e.type === 'memory').length;
    const celebrations = sorted.filter((e) => e.type === 'celebration' || e.type === 'arrival').length;

    // Joy score: base 70 + 4/snipe + 3/swap + 2/memory + 2/celebration, capped at 100
    const score = Math.min(100, Math.round(70 + snipes * 4 + swaps * 3 + memories * 2 + celebrations * 2));
    return { savedMinutes, snipes, swaps, memories, celebrations, score };
  }, [sorted]);

  const hours = Math.floor(stats.savedMinutes / 60);
  const minutes = stats.savedMinutes % 60;

  const highlights = [
    { icon: Star, label: 'Joy Score', value: `${stats.score} / 100` },
    {
      icon: Clock,
      label: 'Time Saved',
      value: hours > 0 ? `${hours}h ${minutes}m via Lightning Lane` : `${minutes}m via Lightning Lane`,
    },
    { icon: Zap, label: 'Lightning Snipes', value: `${stats.snipes} caught mid-blink` },
    { icon: RefreshCw, label: 'Smart Swaps', value: `${stats.swaps} reroutes accepted` },
    { icon: Camera, label: 'Memories Captured', value: `${stats.memories} saved` },
  ];

  return (
    <div className="min-h-screen bg-background max-w-[480px] mx-auto relative pb-24">
      <motion.header
        initial={{ y: -60 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-50 bg-parchment/95 backdrop-blur-md border-b border-border px-4 py-4"
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer rounded-full hover:bg-muted transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={18} className="text-foreground" />
          </button>
          <div>
            <p className="font-sans text-[8px] uppercase tracking-sovereign text-muted-foreground">
              {new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })} · Magic Kingdom
            </p>
            <h1 className="font-display text-xl text-foreground leading-tight">Joy Report</h1>
          </div>
        </div>
      </motion.header>

      {/* Hero stat */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="mx-5 mt-6 bg-primary text-primary-foreground p-8 rounded-2xl shadow-boutique-hover text-center relative overflow-hidden"
      >
        <motion.div
          className="absolute inset-0 opacity-30"
          style={{ background: 'radial-gradient(circle at 30% 20%, hsl(var(--gold) / 0.4) 0%, transparent 50%)' }}
          animate={{ opacity: [0.2, 0.4, 0.2] }}
          transition={{ repeat: Infinity, duration: 4 }}
        />
        <Sparkles size={20} className="mx-auto mb-3 opacity-60 relative" />
        <p className="font-sans text-[9px] uppercase tracking-sovereign opacity-50 mb-2 relative">Your Day Score</p>
        <span className="font-display text-7xl relative tabular-nums">{stats.score}</span>
        <p className="font-sans text-[10px] opacity-50 mt-1 relative">out of 100</p>
      </motion.div>

      {/* Highlights */}
      <div className="px-5 mt-8">
        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="w-1.5 h-1.5 bg-accent rounded-full" />
          <span className="font-sans text-[9px] uppercase tracking-sovereign text-muted-foreground font-semibold">
            Highlights
          </span>
        </div>
        <div className="space-y-2.5">
          {highlights.map((h, i) => {
            const Icon = h.icon;
            return (
              <motion.div
                key={h.label}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.05 }}
                className="bg-card p-4 rounded-xl shadow-boutique flex items-center gap-4"
              >
                <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <Icon size={14} className="text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-sans text-[8px] uppercase tracking-sovereign text-muted-foreground block">
                    {h.label}
                  </span>
                  <span className="font-sans text-sm text-foreground">{h.value}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Timeline — live events */}
      <div className="px-5 mt-10">
        <div className="flex items-center gap-3 mb-4 px-1">
          <div className="w-1.5 h-1.5 bg-accent rounded-full" />
          <span className="font-sans text-[9px] uppercase tracking-sovereign text-muted-foreground font-semibold">
            Your Day in Whispers
          </span>
        </div>

        {sorted.length === 0 ? (
          <p className="text-center font-sans text-[11px] text-muted-foreground italic py-8">
            No moments captured yet. The day is still young.
          </p>
        ) : (
          <div className="relative pl-8">
            <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-border rounded-full" />
            {sorted.map((e, i) => {
              const Icon = ICON_BY_TYPE[e.type];
              const color = COLOR_BY_TYPE[e.type];
              return (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.04 }}
                  className="relative mb-5"
                >
                  <div className={`absolute left-[-22px] top-0.5 w-5 h-5 rounded-full bg-card border border-border flex items-center justify-center`}>
                    <Icon size={10} className={color} />
                  </div>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-sans tabular-nums text-[10px] text-muted-foreground">
                      {formatEventTime(e.at)}
                    </span>
                    <span className="font-sans text-sm text-foreground">{e.title}</span>
                    {e.savedMinutes && (
                      <span className="font-sans text-[9px] text-accent font-bold tabular-nums">
                        +{e.savedMinutes}m
                      </span>
                    )}
                  </div>
                  {e.quote && (
                    <p className="font-display italic text-[11px] text-muted-foreground leading-relaxed mt-1">
                      "{e.quote}"
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Share CTA */}
      <div className="px-5 mt-10">
        <button className="w-full bg-card p-5 rounded-xl shadow-boutique border-none cursor-pointer text-center hover:shadow-boutique-hover transition-shadow">
          <span className="font-sans text-[10px] uppercase tracking-sovereign text-foreground font-semibold">
            Share Your Joy Report
          </span>
        </button>
      </div>
    </div>
  );
};

export default JoyReport;
