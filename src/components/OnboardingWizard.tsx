import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, Check } from 'lucide-react';

interface OnboardingWizardProps {
  onComplete: () => void;
}

const pageVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? '-100%' : '100%', opacity: 0 }),
};

const NumberStepper = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
  <div className="flex items-center justify-between py-5 border-b border-slate-divider">
    <span className="font-sans text-sm text-foreground font-medium">{label}</span>
    <div className="flex items-center gap-5">
      <button
        onClick={() => onChange(Math.max(0, value - 1))}
        className="w-11 h-11 flex items-center justify-center bg-muted text-foreground border-none cursor-pointer"
        aria-label={`Decrease ${label}`}
      >
        <Minus size={16} />
      </button>
      <motion.span
        key={value}
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="font-sans text-2xl font-light tabular-nums w-8 text-center text-foreground"
      >
        {value}
      </motion.span>
      <button
        onClick={() => onChange(value + 1)}
        className="w-11 h-11 flex items-center justify-center bg-primary text-primary-foreground border-none cursor-pointer"
        aria-label={`Increase ${label}`}
      >
        <Plus size={16} />
      </button>
    </div>
  </div>
);

const OnboardingWizard = ({ onComplete }: OnboardingWizardProps) => {
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState(1);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [hasStroller, setHasStroller] = useState(false);
  const [diningPref, setDiningPref] = useState(50);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [smsConsent, setSmsConsent] = useState(false);

  const totalPages = 4;

  const goNext = () => {
    if (page < totalPages - 1) {
      setDirection(1);
      setPage(page + 1);
    } else {
      onComplete();
    }
  };

  const goBack = () => {
    if (page > 0) {
      setDirection(-1);
      setPage(page - 1);
    }
  };

  const canProceed = () => {
    if (page === 3) return name && email && phone && smsConsent;
    return true;
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-parchment flex flex-col">
      <div className="max-w-[480px] mx-auto w-full flex-1 flex flex-col px-6 pt-16 pb-8">
        {/* Progress */}
        <div className="flex gap-2 mb-12">
          {Array.from({ length: totalPages }).map((_, i) => (
            <div
              key={i}
              className={`h-[2px] flex-1 transition-colors duration-500 ${i <= page ? 'bg-obsidian' : 'bg-slate-divider'}`}
            />
          ))}
        </div>

        {/* Pages */}
        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={page}
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'tween', duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="absolute inset-0"
            >
              {page === 0 && (
                <div>
                  <h1 className="font-display text-3xl text-foreground mb-2">The Royal Charter</h1>
                  <p className="font-sans text-sm text-muted-foreground mb-10">Who shall we be composing this day for?</p>
                  <NumberStepper label="Adults" value={adults} onChange={setAdults} />
                  <NumberStepper label="Children (3–9)" value={children} onChange={setChildren} />
                  <NumberStepper label="Infants (under 3)" value={infants} onChange={setInfants} />
                </div>
              )}

              {page === 1 && (
                <div>
                  <h1 className="font-display text-3xl text-foreground mb-2">The Logistics</h1>
                  <p className="font-sans text-sm text-muted-foreground mb-10">Will your party require special transport?</p>
                  <button
                    onClick={() => setHasStroller(!hasStroller)}
                    className={`w-full py-5 px-6 text-left font-sans text-sm transition-all duration-300 shadow-boutique cursor-pointer border-none ${hasStroller ? 'bg-primary text-primary-foreground' : 'bg-card text-card-foreground'}`}
                  >
                    <span className="block font-medium mb-1">Stroller, Wheelchair, or ECV</span>
                    <span className={`text-xs ${hasStroller ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>Tap to {hasStroller ? 'remove' : 'add'}</span>
                  </button>
                  <AnimatePresence>
                    {hasStroller && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 p-5 bg-gold/10 border-l-4 border-gold">
                          <p className="font-sans text-xs text-foreground leading-relaxed">
                            <strong>Noted.</strong> We will automatically extend all walking time estimates by 1.35× to ensure a peaceful pace for your party.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {page === 2 && (
                <div>
                  <h1 className="font-display text-3xl text-foreground mb-2">The Appetite Anchor</h1>
                  <p className="font-sans text-sm text-muted-foreground mb-10">Define your culinary compass for the day.</p>
                  <div className="mt-8">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={diningPref}
                      onChange={(e) => setDiningPref(Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between mt-4">
                      <span className="font-sans text-[10px] uppercase tracking-sovereign text-muted-foreground">Quick Bites & Speed</span>
                      <span className="font-sans text-[10px] uppercase tracking-sovereign text-muted-foreground">Signature & Experience</span>
                    </div>
                    <motion.div
                      key={diningPref > 66 ? 'sig' : diningPref > 33 ? 'mid' : 'quick'}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-10 p-5 bg-card shadow-boutique"
                    >
                      <p className="font-display italic text-foreground text-sm">
                        {diningPref > 66
                          ? "\"We shall seek refined experiences. Be Our Guest, Victoria & Albert's await.\""
                          : diningPref > 33
                          ? "\"A balanced palate—fine table service with efficient counter stops.\""
                          : "\"Speed is the strategy. We'll route you through the fastest counter services.\""}
                      </p>
                    </motion.div>
                  </div>
                </div>
              )}

              {page === 3 && (
                <div>
                  <h1 className="font-display text-3xl text-foreground mb-2">The Sync Check</h1>
                  <p className="font-sans text-sm text-muted-foreground mb-8">Connect your concierge line.</p>
                  <div className="space-y-4">
                    <div>
                      <label className="font-sans text-[10px] uppercase tracking-sovereign text-muted-foreground block mb-2">Full Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-card border border-slate-divider py-3 px-4 font-sans text-sm text-foreground outline-none focus:border-obsidian transition-colors"
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <label className="font-sans text-[10px] uppercase tracking-sovereign text-muted-foreground block mb-2">Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-card border border-slate-divider py-3 px-4 font-sans text-sm text-foreground outline-none focus:border-obsidian transition-colors"
                        placeholder="you@email.com"
                      />
                    </div>
                    <div>
                      <label className="font-sans text-[10px] uppercase tracking-sovereign text-muted-foreground block mb-2">Phone Number</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-card border border-slate-divider py-3 px-4 font-sans text-sm text-foreground outline-none focus:border-obsidian transition-colors"
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                    <label className="flex items-start gap-3 mt-6 cursor-pointer">
                      <button
                        onClick={() => setSmsConsent(!smsConsent)}
                        className={`w-5 h-5 min-w-[20px] mt-0.5 flex items-center justify-center border transition-colors cursor-pointer ${smsConsent ? 'bg-obsidian border-obsidian' : 'bg-card border-slate-plaid'}`}
                      >
                        {smsConsent && <Check size={12} className="text-parchment" />}
                      </button>
                      <span className="font-sans text-xs text-muted-foreground leading-relaxed">
                        I agree to receive SMS text messages from Castle Companion regarding my concierge services. Message and data rates may apply. Reply STOP to opt out.
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {page > 0 && (
            <button
              onClick={goBack}
              className="flex-1 py-4 font-sans text-xs uppercase tracking-sovereign border border-obsidian text-foreground bg-transparent cursor-pointer min-h-[48px]"
            >
              Back
            </button>
          )}
          <button
            onClick={goNext}
            disabled={!canProceed()}
            className={`flex-1 py-4 font-sans text-xs uppercase tracking-sovereign min-h-[48px] border-none cursor-pointer transition-opacity ${canProceed() ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}
          >
            {page === totalPages - 1 ? 'Begin the Day' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
