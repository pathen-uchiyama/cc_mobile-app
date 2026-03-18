import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, Crown, Sparkles, Check } from 'lucide-react';

const tiers = [
  {
    id: 'free',
    name: 'Explorer',
    price: 'Free',
    description: 'Essential park companion',
    features: ['Basic itinerary', 'Wait time alerts', 'Restroom finder'],
    current: true,
  },
  {
    id: 'manager',
    name: 'Lightning Manager',
    price: '$9.99',
    period: '/trip',
    description: 'AI-powered Lightning Lane strategy',
    icon: Zap,
    features: ['Everything in Explorer', 'LL reservation tracker', 'AI swap suggestions', 'Sniping alerts'],
    highlight: true,
  },
  {
    id: 'autonomous',
    name: 'Sovereign',
    price: '$19.99',
    period: '/trip',
    description: 'Fully autonomous park optimization',
    icon: Crown,
    features: ['Everything in Lightning Manager', 'Auto-booking LL slots', 'Real-time itinerary pivots', 'Priority concierge'],
  },
];

const Upgrades = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background max-w-[480px] mx-auto relative">
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
            <h1 className="font-display text-lg text-foreground">Upgrade Your Experience</h1>
            <p className="font-sans text-[9px] uppercase tracking-sovereign text-muted-foreground">
              Unlock automation & intelligence
            </p>
          </div>
        </div>
      </motion.header>

      <div className="px-6 py-8 space-y-4">
        {tiers.map((tier, i) => {
          const Icon = tier.icon || Sparkles;
          return (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`p-6 shadow-boutique ${
                tier.highlight
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-card-foreground'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon size={16} className={tier.highlight ? 'text-primary-foreground' : 'text-accent'} />
                    <span className="font-sans text-[9px] uppercase tracking-sovereign opacity-60">
                      {tier.name}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-3xl">{tier.price}</span>
                    {tier.period && (
                      <span className="font-sans text-[10px] opacity-50">{tier.period}</span>
                    )}
                  </div>
                </div>
                {tier.current && (
                  <span className="font-sans text-[8px] uppercase tracking-sovereign px-2 py-1 bg-muted text-muted-foreground">
                    Current
                  </span>
                )}
              </div>

              <p className={`font-sans text-xs mb-4 ${tier.highlight ? 'opacity-70' : 'text-muted-foreground'}`}>
                {tier.description}
              </p>

              <ul className="space-y-2 mb-5">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check size={12} className={tier.highlight ? 'text-primary-foreground' : 'text-accent'} />
                    <span className="font-sans text-[11px]">{f}</span>
                  </li>
                ))}
              </ul>

              {!tier.current && (
                <button
                  className={`w-full py-3 font-sans text-[10px] uppercase tracking-sovereign font-semibold border-none cursor-pointer transition-colors ${
                    tier.highlight
                      ? 'bg-primary-foreground text-primary hover:opacity-90'
                      : 'bg-primary text-primary-foreground hover:opacity-90'
                  }`}
                >
                  Upgrade to {tier.name}
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Upgrades;
