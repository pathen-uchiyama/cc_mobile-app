import { motion } from 'framer-motion';
import { Zap, Crown, Sparkles, Check } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';

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
  return (
    <div className="min-h-screen bg-background digital-plaid-bg max-w-[480px] mx-auto relative">
      <PageHeader
        backTo="/settings"
        backLabel="Settings"
        eyebrow="Tier & Pricing"
        title="Upgrade your experience"
        subtitle="Unlock automation, AI strategy, and concierge-grade pivots."
      />

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
