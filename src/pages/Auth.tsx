import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    // Magic link would be sent here via backend
    // For now, simulate success and allow entry after delay
    setTimeout(() => navigate('/'), 2000);
  };

  return (
    <div className="min-h-screen bg-background digital-plaid-bg max-w-[480px] mx-auto flex flex-col justify-center px-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="flex flex-col"
      >
        {/* Brand Mark */}
        <div className="flex items-center gap-1.5 mb-10">
          <div className="w-7 h-7 bg-primary" />
          <div className="w-1.5 h-7 bg-tertiary" />
        </div>

        <h1 className="text-masthead text-primary mb-2">
          Castle<br /><span className="text-secondary">Companion.</span>
        </h1>
        <p className="font-sans text-xs text-muted-foreground leading-relaxed max-w-[260px] mb-14">
          Your private concierge awaits. Enter your credentials to unlock your voyage.
        </p>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="font-sans text-[10px] uppercase tracking-sovereign text-muted-foreground block mb-3"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full bg-card px-5 py-4 font-sans text-sm text-foreground placeholder:text-muted-foreground shadow-boutique border-none outline-none focus:ring-2 focus:ring-ring min-h-[48px]"
              />
            </div>

            <motion.button
              type="submit"
              whileTap={{ scale: 0.98 }}
              className="w-full bg-primary text-primary-foreground font-sans text-sm tracking-wide py-4 min-h-[48px] shadow-boutique cursor-pointer border-none"
            >
              Request Access Key
            </motion.button>
          </form>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card p-6 shadow-boutique"
          >
            <p className="font-sans text-[10px] uppercase tracking-sovereign text-accent mb-3">
              Access Key Dispatched
            </p>
            <p className="font-sans text-sm text-foreground leading-relaxed">
              A magic link has been sent to <span className="font-medium">{email}</span>. Check your inbox to enter.
            </p>
          </motion.div>
        )}

        {/* Waitlist Link */}
        <p className="text-center mt-16">
          <a
            href="#waitlist"
            className="font-sans text-[11px] text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4 decoration-muted-foreground/30"
          >
            Seeking a Concierge? Join the Waitlist.
          </a>
        </p>
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="font-sans text-[9px] uppercase tracking-sovereign text-muted-foreground text-center mt-20"
      >
        The Sovereign Protocol — v1.0
      </motion.p>
    </div>
  );
};

export default Auth;
