import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Heart, Camera, Clock, MapPin, Sparkles, Zap, RefreshCw, Mic, FileText, Video, BookOpen, Check } from 'lucide-react';
import { useJoyEvents, formatEventTime, type JoyEvent } from '@/contexts/JoyEventsContext';
import { useMemoryVault, formatMemoryTime, type Memory } from '@/contexts/MemoryContext';
import InterviewSheet from '@/components/memory/InterviewSheet';
import PageHeader from '@/components/layout/PageHeader';
import EmptyState from '@/components/layout/EmptyState';

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
  const { events } = useJoyEvents();
  const { memories, interviews, postCompleted } = useMemoryVault();
  const [postOpen, setPostOpen] = useState(false);

  const sortedMemories = useMemo(
    () => [...memories].sort((a, b) => a.at - b.at),
    [memories]
  );
  const preAnswers = useMemo(() => interviews.filter((i) => i.phase === 'pre'), [interviews]);
  const postAnswers = useMemo(() => interviews.filter((i) => i.phase === 'post'), [interviews]);

  const sorted = useMemo(
    () => [...events].sort((a, b) => Number(a.at) - Number(b.at)),
    [events]
  );

  const stats = useMemo(() => {
    const savedMinutes = sorted.reduce((sum, e) => sum + (e.savedMinutes ?? 0), 0);
    const snipes = sorted.filter((e) => e.type === 'snipe').length;
    const swaps = sorted.filter((e) => e.type === 'swap').length;
    const memoryEvents = sorted.filter((e) => e.type === 'memory').length;
    const celebrations = sorted.filter((e) => e.type === 'celebration' || e.type === 'arrival').length;

    // Joy score: base 70 + 4/snipe + 3/swap + 2/memory + 2/celebration, capped at 100
    const memoryCount = memoryEvents + memories.length;
    const score = Math.min(100, Math.round(70 + snipes * 4 + swaps * 3 + memoryCount * 2 + celebrations * 2));
    return { savedMinutes, snipes, swaps, memories: memoryCount, celebrations, score };
  }, [sorted, memories.length]);

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
      <PageHeader
        backTo="/park"
        backLabel="Your day"
        eyebrow={`${new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric' })} · Magic Kingdom`}
        title="Joy Report"
      />

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
          <EmptyState
            eyebrow="Quiet so far"
            title="No moments captured yet."
            hint="The day is still young — your whispers will land here."
          />
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

      {/* The Vault — captured memories gallery */}
      <section className="px-5 mt-12">
        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="w-1.5 h-1.5 bg-accent rounded-full" />
          <span className="font-sans text-[9px] uppercase tracking-sovereign text-muted-foreground font-semibold">
            The Vault
          </span>
          <span className="font-sans text-[9px] tabular-nums text-muted-foreground ml-auto">
            {sortedMemories.length} {sortedMemories.length === 1 ? 'memory' : 'memories'}
          </span>
        </div>

        {sortedMemories.length === 0 ? (
          <EmptyState
            eyebrow="Empty so far"
            title="No memories captured yet."
            hint="Tap Record Memory on any priority card to begin."
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {sortedMemories.map((m) => <MemoryCard key={m.id} m={m} />)}
          </div>
        )}
      </section>

      {/* Pre-park interview answers */}
      {preAnswers.length > 0 && (
        <section className="px-5 mt-12">
          <div className="flex items-center gap-3 mb-3 px-1">
            <BookOpen size={12} className="text-accent" />
            <span className="font-sans text-[9px] uppercase tracking-sovereign text-muted-foreground font-semibold">
              Before the gates · Your hopes
            </span>
          </div>
          <div className="space-y-3">
            {preAnswers.map((a) => <InterviewCard key={a.id} answer={a} />)}
          </div>
        </section>
      )}

      {/* Post-trip interview — CTA or answers */}
      <section className="px-5 mt-12">
        {!postCompleted ? (
          <button
            onClick={() => setPostOpen(true)}
            className="w-full bg-primary text-primary-foreground p-5 rounded-2xl shadow-boutique-hover border-none cursor-pointer text-center"
          >
            <Sparkles size={16} className="mx-auto mb-2 opacity-70" />
            <span className="font-display text-base block mb-0.5">Seal the day in your own words</span>
            <span className="font-sans text-[11px] opacity-70 block">A 3-question interview · about a minute.</span>
          </button>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-3 px-1">
              <Check size={12} className="text-accent" />
              <span className="font-sans text-[9px] uppercase tracking-sovereign text-muted-foreground font-semibold">
                The Vault is sealed · What you\u2019ll remember
              </span>
            </div>
            <div className="space-y-3">
              {postAnswers.map((a) => <InterviewCard key={a.id} answer={a} />)}
            </div>
          </>
        )}
      </section>

      <InterviewSheet open={postOpen} onClose={() => setPostOpen(false)} phase="post" />
    </div>
  );
};

// ─── Sub-components ─────────────────────────────────────────────────────

const KIND_ICON: Record<Memory['kind'], typeof Camera> = {
  photo: Camera,
  video: Video,
  voice: Mic,
  note: FileText,
};

const MemoryCard = ({ m }: { m: Memory }) => {
  const Icon = KIND_ICON[m.kind];
  return (
    <motion.article
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl shadow-boutique overflow-hidden flex flex-col"
    >
      <div className="relative aspect-square bg-muted flex items-center justify-center overflow-hidden">
        {m.kind === 'photo' && <img src={m.payload} alt={m.caption} className="w-full h-full object-cover" />}
        {m.kind === 'video' && (
          <video src={m.payload} muted playsInline className="w-full h-full object-cover" />
        )}
        {m.kind === 'voice' && (
          <div className="flex flex-col items-center gap-2">
            <Mic size={28} className="text-muted-foreground" />
            {m.durationMs && (
              <span className="font-sans text-[10px] tabular-nums text-muted-foreground">
                {Math.ceil(m.durationMs / 1000)}s
              </span>
            )}
          </div>
        )}
        {m.kind === 'note' && (
          <p className="font-display italic text-[12px] text-foreground p-3 leading-snug line-clamp-6 text-center">
            "{m.payload.slice(0, 120)}{m.payload.length > 120 ? '\u2026' : ''}"
          </p>
        )}
        <div className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm rounded-full p-1.5">
          <Icon size={11} className="text-accent" />
        </div>
      </div>
      <div className="p-3">
        <p className="font-display text-[13px] text-foreground leading-tight line-clamp-2">{m.caption}</p>
        <div className="flex items-center justify-between mt-1.5">
          <span className="font-sans text-[9px] tabular-nums text-muted-foreground">{formatMemoryTime(m.at)}</span>
          {m.tags.length > 0 && (
            <span className="font-sans text-[9px] text-accent font-semibold truncate ml-2">
              {m.tags.slice(0, 2).map((t) => t.label).join(' · ')}
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
};

const InterviewCard = ({ answer }: { answer: import('@/contexts/MemoryContext').InterviewAnswer }) => (
  <article className="bg-card rounded-xl p-4 shadow-boutique">
    <p className="font-sans text-[10px] uppercase tracking-sovereign text-muted-foreground mb-2 font-semibold">
      {answer.question}
    </p>
    {answer.kind === 'note' ? (
      <p className="font-display italic text-[14px] text-foreground leading-relaxed">"{answer.payload}"</p>
    ) : (
      <audio src={answer.payload} controls className="w-full" />
    )}
  </article>
);

export default JoyReport;
