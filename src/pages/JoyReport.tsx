import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Heart, Camera, Clock, MapPin, Sparkles } from 'lucide-react';

const highlights = [
  { icon: Star, label: 'Top Moment', value: 'Space Mountain — 2× ride streak' },
  { icon: Clock, label: 'Time Saved', value: '1h 42m via Lightning Lane' },
  { icon: MapPin, label: 'Steps Walked', value: '14,283 steps · 6.2 mi' },
  { icon: Camera, label: 'Memories Captured', value: '12 photos · 3 audio clips' },
  { icon: Heart, label: 'Joy Score', value: '94 / 100' },
];

const timeline = [
  { time: '09:00', event: 'Entered Magic Kingdom', mood: '😊' },
  { time: '09:25', event: 'Space Mountain — 12m wait', mood: '🎢' },
  { time: '10:30', event: 'Pirates of the Caribbean', mood: '🏴‍☠️' },
  { time: '11:45', event: 'Be Our Guest Lunch', mood: '🍽️' },
  { time: '13:15', event: 'Haunted Mansion — walked on', mood: '👻' },
  { time: '14:30', event: 'Big Thunder Mountain', mood: '⛰️' },
  { time: '16:00', event: 'Enchantment Fireworks', mood: '✨' },
];

const JoyReport = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background max-w-[480px] mx-auto relative pb-16">
      <motion.header
        initial={{ y: -60 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-50 bg-background border-b border-border px-6 py-4"
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-11 h-11 flex items-center justify-center bg-transparent border-none cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft size={20} className="text-foreground" />
          </button>
          <div>
            <h1 className="font-display text-lg text-foreground">Joy Report</h1>
            <p className="font-sans text-[9px] uppercase tracking-sovereign text-muted-foreground">
              March 18, 2026 · Magic Kingdom
            </p>
          </div>
        </div>
      </motion.header>

      {/* Hero stat */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="mx-6 mt-8 bg-primary text-primary-foreground p-8 shadow-boutique text-center"
      >
        <Sparkles size={20} className="mx-auto mb-3 opacity-60" />
        <p className="font-sans text-[9px] uppercase tracking-sovereign opacity-50 mb-2">Your Day Score</p>
        <span className="font-display text-6xl">94</span>
        <p className="font-sans text-[10px] opacity-40 mt-1">out of 100</p>
      </motion.div>

      {/* Highlights */}
      <div className="px-6 mt-8">
        <div className="flex items-center gap-3 mb-4 px-1">
          <div className="w-1.5 h-1.5 bg-accent" />
          <span className="font-sans text-[9px] uppercase tracking-sovereign text-muted-foreground font-semibold">
            Highlights
          </span>
        </div>
        <div className="space-y-3">
          {highlights.map((h, i) => {
            const Icon = h.icon;
            return (
              <motion.div
                key={h.label}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.05 }}
                className="bg-card p-4 shadow-boutique flex items-center gap-4"
              >
                <Icon size={16} className="text-accent shrink-0" />
                <div>
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

      {/* Timeline */}
      <div className="px-6 mt-10">
        <div className="flex items-center gap-3 mb-4 px-1">
          <div className="w-1.5 h-1.5 bg-accent" />
          <span className="font-sans text-[9px] uppercase tracking-sovereign text-muted-foreground font-semibold">
            Your Timeline
          </span>
        </div>
        <div className="relative pl-8">
          <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-border" />
          {timeline.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              className="relative mb-5"
            >
              <div className="absolute left-[-21px] top-1.5 w-3 h-3 bg-accent" />
              <div className="flex items-baseline gap-3">
                <span className="font-sans tabular-nums text-sm font-light text-muted-foreground">{t.time}</span>
                <span className="font-sans text-sm text-foreground">{t.event}</span>
                <span className="text-sm">{t.mood}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Share CTA */}
      <div className="px-6 mt-10">
        <button className="w-full bg-card p-5 shadow-boutique border-none cursor-pointer text-center hover:shadow-boutique-hover transition-shadow">
          <span className="font-sans text-[10px] uppercase tracking-sovereign text-muted-foreground">
            Share Your Joy Report
          </span>
        </button>
      </div>
    </div>
  );
};

export default JoyReport;
