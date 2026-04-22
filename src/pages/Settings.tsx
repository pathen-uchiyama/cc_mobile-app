import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, Zap, Sparkles, Vibrate, FlaskConical } from 'lucide-react';
import { useCompanion, type ServiceTier } from '@/contexts/CompanionContext';
import PageHeader from '@/components/layout/PageHeader';

const TIERS: { id: ServiceTier; label: string; tagline: string }[] = [
  { id: 'explorer', label: 'Explorer', tagline: 'See the plan, walk the park.' },
  { id: 'manager', label: 'Lightning Manager', tagline: 'AI swaps + witty interventions.' },
  { id: 'sovereign', label: 'Sovereign', tagline: 'Fully autonomous. We just happen.' },
];

const ToggleRow = ({
  icon: Icon, label, description, value, onChange,
}: {
  icon: typeof Eye;
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) => (
  <div className="flex items-start justify-between gap-4 py-4 border-b border-border last:border-b-0">
    <div className="flex items-start gap-3 flex-1 min-w-0">
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={14} className="text-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-sans text-sm font-semibold text-foreground">{label}</p>
        <p className="font-sans text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
      </div>
    </div>
    <button
      onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 mt-1 border-none cursor-pointer ${
        value ? 'bg-accent' : 'bg-muted'
      }`}
      aria-label={`Toggle ${label}`}
      aria-pressed={value}
    >
      <motion.div
        layout
        transition={{ type: 'spring', damping: 22, stiffness: 320 }}
        className="absolute top-0.5 w-5 h-5 rounded-full bg-card shadow-boutique"
        style={{ left: value ? 'calc(100% - 22px)' : '2px' }}
      />
    </button>
  </div>
);

const Settings = () => {
  const navigate = useNavigate();
  const {
    minimalist, setMinimalist,
    tier, setTier,
    llTrackerVisible, setLlTrackerVisible,
    hapticsEnabled, setHapticsEnabled,
    celebrationsEnabled, setCelebrationsEnabled,
    devPanelEnabled, setDevPanelEnabled,
  } = useCompanion();

  return (
    <div className="min-h-screen bg-background max-w-[480px] mx-auto pb-32">
      <PageHeader
        backTo="/park"
        backLabel="Your day"
        eyebrow="Companion"
        title="Settings"
      />

      <div className="px-5 pt-6 space-y-8">
        {/* Service tier */}
        <section>
          <p className="font-sans text-[9px] uppercase tracking-sovereign text-muted-foreground font-semibold mb-3 px-1">
            Service Tier
          </p>
          <div className="space-y-2">
            {TIERS.map((t) => {
              const active = tier === t.id;
              return (
                <motion.button
                  key={t.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setTier(t.id)}
                  className={`w-full text-left p-4 rounded-xl border cursor-pointer transition-colors bg-transparent ${
                    active
                      ? 'border-accent bg-accent/5'
                      : 'border-border hover:border-muted-foreground/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-base text-foreground">{t.label}</p>
                      <p className="font-sans text-[10px] text-muted-foreground mt-0.5">{t.tagline}</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 shrink-0 transition-colors ${
                      active ? 'border-accent bg-accent' : 'border-border'
                    }`} />
                  </div>
                </motion.button>
              );
            })}
          </div>
          <button
            onClick={() => navigate('/upgrades')}
            className="w-full mt-3 py-3 bg-transparent border border-border rounded-xl cursor-pointer text-foreground font-sans text-[10px] uppercase tracking-sovereign font-semibold hover:bg-muted transition-colors"
          >
            View tier details & pricing
          </button>
        </section>

        {/* Display & behavior */}
        <section>
          <p className="font-sans text-[9px] uppercase tracking-sovereign text-muted-foreground font-semibold mb-1 px-1">
            Display & Behavior
          </p>
          <div className="bg-card rounded-xl px-4 shadow-boutique">
            <ToggleRow
              icon={Eye}
              label="Minimalist Mode"
              description="Hide everything except a single whisper. Two-finger swipe down anywhere also toggles this."
              value={minimalist}
              onChange={setMinimalist}
            />
            <ToggleRow
              icon={Zap}
              label="Lightning Lane Tracker"
              description="Show the Pocket Concierge strip in the in-park view."
              value={llTrackerVisible}
              onChange={setLlTrackerVisible}
            />
          </div>
        </section>

        {/* Whimsy */}
        <section>
          <p className="font-sans text-[9px] uppercase tracking-sovereign text-muted-foreground font-semibold mb-1 px-1">
            Whimsy
          </p>
          <div className="bg-card rounded-xl px-4 shadow-boutique">
            <ToggleRow
              icon={Sparkles}
              label="Whimsical Wins"
              description="Celebrate snipes and arrivals with sparkles and a Library of Whispers tip."
              value={celebrationsEnabled}
              onChange={setCelebrationsEnabled}
            />
            <ToggleRow
              icon={Vibrate}
              label="Haptics"
              description="Subtle taps when the Sovereign Key fires."
              value={hapticsEnabled}
              onChange={setHapticsEnabled}
            />
          </div>
        </section>

        {/* Developer */}
        <section>
          <p className="font-sans text-[9px] uppercase tracking-sovereign text-muted-foreground font-semibold mb-1 px-1">
            Developer
          </p>
          <div className="bg-card rounded-xl px-4 shadow-boutique">
            <ToggleRow
              icon={FlaskConical}
              label="Snipe Simulator"
              description="Show a dev panel in the bottom-left of the in-park view to manually fire celebrations."
              value={devPanelEnabled}
              onChange={setDevPanelEnabled}
            />
          </div>
        </section>

        {/* Footer note */}
        <p className="font-sans text-[9px] text-muted-foreground/60 text-center italic px-4 pt-2">
          Settings save automatically to this device.
        </p>
      </div>
    </div>
  );
};

export default Settings;
