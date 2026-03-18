import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Check } from 'lucide-react';

const AudioVaultPlayer = () => {
  const [hasConsent, setHasConsent] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>();

  const memories = [
    { id: '1', title: 'First ride on Space Mountain', date: 'Dec 14, 2024', duration: '0:42' },
    { id: '2', title: 'The fireworks were breathtaking', date: 'Dec 14, 2024', duration: '1:15' },
    { id: '3', title: 'Lunch at Be Our Guest', date: 'Dec 14, 2024', duration: '0:28' },
  ];

  // Animated waveform
  useEffect(() => {
    if (!isRecording || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const bars = 40;
      const barWidth = canvas.width / bars;
      ctx.fillStyle = '#1A2530';

      for (let i = 0; i < bars; i++) {
        const height = Math.random() * canvas.height * 0.7 + 5;
        const y = (canvas.height - height) / 2;
        ctx.fillRect(i * barWidth + 2, y, barWidth - 4, height);
      }
      animFrameRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isRecording]);

  if (!hasConsent) {
    return (
      <div className="px-6 pt-4 pb-32">
        <h2 className="font-display text-2xl text-foreground mb-1">The Ghost Vault</h2>
        <p className="font-sans text-xs text-muted-foreground mb-8 uppercase tracking-sovereign">Your memories, preserved.</p>

        <div className="bg-card p-8 shadow-boutique">
          <h3 className="font-display text-xl text-foreground mb-4">The Golden Anchor</h3>
          <p className="font-sans text-sm text-muted-foreground leading-relaxed mb-6">
            Before we begin preserving your memories, we require your explicit consent.
          </p>

          <label className="flex items-start gap-3 cursor-pointer mb-8">
            <button
              onClick={() => setConsentChecked(!consentChecked)}
              className={`w-5 h-5 min-w-[20px] mt-0.5 flex items-center justify-center border transition-colors cursor-pointer ${consentChecked ? 'bg-obsidian border-obsidian' : 'bg-card border-slate-plaid'}`}
            >
              {consentChecked && <Check size={12} className="text-parchment" />}
            </button>
            <span className="font-sans text-xs text-muted-foreground leading-relaxed">
              I consent to Castle Companion processing my audio for memory keeping, in accordance with two-party consent laws.
            </span>
          </label>

          <button
            onClick={() => consentChecked && setHasConsent(true)}
            disabled={!consentChecked}
            className={`w-full py-4 font-sans text-xs uppercase tracking-sovereign border-none min-h-[48px] cursor-pointer transition-opacity ${consentChecked ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}
          >
            Unlock the Vault
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 pt-4 pb-32">
      <h2 className="font-display text-2xl text-foreground mb-1">The Ghost Vault</h2>
      <p className="font-sans text-xs text-muted-foreground mb-8 uppercase tracking-sovereign">Your memories, preserved.</p>

      {/* Recording UI */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9995] bg-obsidian/80 flex flex-col items-center justify-center"
          >
            <p className="font-display italic text-parchment text-lg mb-8">Speak your memory...</p>
            <canvas ref={canvasRef} width={300} height={60} className="mb-8 opacity-50" />
            <motion.button
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              onClick={() => setIsRecording(false)}
              className="w-20 h-20 bg-sienna flex items-center justify-center cursor-pointer border-none"
              style={{ borderRadius: '50%' }}
            >
              <Square size={24} className="text-parchment" />
            </motion.button>
            <p className="font-sans text-[10px] uppercase tracking-sovereign text-parchment/60 mt-4">Tap to stop</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Record Button */}
      <div className="flex justify-center mb-10">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsRecording(true)}
          className="w-16 h-16 bg-primary text-primary-foreground flex items-center justify-center cursor-pointer border-none shadow-boutique"
          style={{ borderRadius: '50%' }}
        >
          <Mic size={24} />
        </motion.button>
      </div>

      {/* Memory Cards */}
      <div className="space-y-4">
        {memories.map((memory) => (
          <div key={memory.id} className="bg-card p-5 shadow-boutique vellum-filter">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-display text-base text-foreground">{memory.title}</h3>
              <span className="font-sans tabular-nums text-xs text-muted-foreground">{memory.duration}</span>
            </div>
            <span className="font-sans text-[10px] uppercase tracking-sovereign text-muted-foreground">{memory.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AudioVaultPlayer;
