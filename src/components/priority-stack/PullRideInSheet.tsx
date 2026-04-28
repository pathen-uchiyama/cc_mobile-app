import { useId, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  ChevronRight,
  Star,
  Users,
  Ticket,
  Drama,
  Sparkles,
  Flag,
  UtensilsCrossed,
  Wand2,
  Plus,
  Clock,
  CalendarPlus,
  Info,
  ClipboardList,
  Search,
  Zap,
} from 'lucide-react';
import type { MustDo } from '@/hooks/park/usePlanStack';
import type { PartyWant, AttractionKind } from '@/data/wantToDos';
import type { PlanItem } from '@/components/priority-stack/HeroHorizonStack';
import { LL_INVENTORY } from '@/data/lightningLanes';

/**
 * Live wait + LL return-window lookup for any attraction by name. Matches
 * case-insensitively against `LL_INVENTORY` so rides surfaced in Must-Dos,
 * Party Wants, the active Plan, and the Recommended card all show the same
 * key concierge data: current standby and the next LL return time. Returns
 * `null` for non-ride attractions (shows, parades, dining) that aren't on
 * the LL system — those rows simply omit the meta strip.
 */
const lookupAttractionMeta = (
  name: string,
): { standbyMin: number; nextWindow: string; isLL: boolean; isILL: boolean } | null => {
  const needle = name.trim().toLowerCase();
  const hit = LL_INVENTORY.find((a) => a.name.toLowerCase() === needle);
  if (!hit) return null;
  return {
    standbyMin: hit.standbyMin,
    nextWindow: hit.nextWindow,
    isLL: hit.type === 'll',
    isILL: hit.type === 'ill',
  };
};

type Tab = 'recommended' | 'mustdo' | 'plan';

interface PullRideInSheetProps {
  open: boolean;
  onClose: () => void;
  mustDos: MustDo[];
  partyWants: PartyWant[];
  /** Names of attractions already locked in the active plan — filtered out. */
  excludedAttractions?: string[];
  /** The active 3-card plan, surfaced on the "Plan" tab. */
  plan?: PlanItem[];
  /**
   * Inject any attraction onto the active stack as the new "Now" card.
   * The id is a synthetic key (e.g. `must-m1`, `party-w1`) — usePlanStack
   * already handles the case where the attraction is brand new.
   */
  onPromote: (sourceId: string, attraction: string) => void;
}

const KIND_META: Record<AttractionKind, { label: string; Icon: typeof Ticket }> = {
  ride:   { label: 'Ride',           Icon: Ticket },
  show:   { label: 'Show',           Icon: Drama },
  meet:   { label: 'Meet & Greet',   Icon: Sparkles },
  parade: { label: 'Parade',         Icon: Flag },
  dining: { label: 'Dining',         Icon: UtensilsCrossed },
};

/**
 * "Pull an attraction in" — the unified injection sheet. Two tiers:
 *
 *   1. Must-Do (gold)         — pre-locked priorities, ranked by remaining rides.
 *   2. Party Wants (magenta)  — survey wishlist, ranked by yes/total ratio.
 *
 * "Attraction" here covers rides, shows, character meet & greets, parades,
 * and signature dining experiences. Tapping any row promotes it to the Hero
 * "Right Now" slot via the existing `promoteMustDoToHero` plumbing.
 */
const PullRideInSheet = ({
  open,
  onClose,
  mustDos,
  partyWants,
  excludedAttractions = [],
  plan = [],
  onPromote,
}: PullRideInSheetProps) => {
  const [tab, setTab] = useState<Tab>('recommended');
  /**
   * "Include low-confidence party picks" — when off (default), Party Wants
   * with a yes-rate under 50% are hidden so the picker stays focused on
   * what the party actually agreed on. Flipping it on surfaces the softer
   * suggestions (e.g. 1-of-5 yes) for guests who want to explore wider.
   */
  const [includeLowConfidence, setIncludeLowConfidence] = useState(false);
  /** Inline legend popover toggle — explains the two source tiers. */
  const [legendOpen, setLegendOpen] = useState(false);
  /**
   * Custom-add composer toggle. When true the persistent footer swaps the
   * primary CTA for a small text input so guests can drop in any attraction
   * that isn't on their Must-Dos or Party Wants (e.g. a brand-new ride or
   * something the survey missed). Submitting promotes it to the active card
   * via the same `onPromote` plumbing — `usePlanStack` synthesizes the
   * PlanItem from the typed name.
   */
  const [customOpen, setCustomOpen] = useState(false);
  const [customName, setCustomName] = useState('');

  const excluded = useMemo(
    () => new Set(excludedAttractions.map((a) => a.toLowerCase())),
    [excludedAttractions],
  );

  const rankedMustDos = useMemo(() => {
    const score = (m: MustDo) => {
      const remaining = Math.max(0, m.desired - m.done);
      if (remaining === 0) return -1;
      return remaining * 100 + m.desired;
    };
    // Hide anything already locked into the active plan — the picker is
    // for *adding*, not duplicating what's on the stack.
    return [...mustDos]
      .filter((m) => !excluded.has(m.attraction.toLowerCase()))
      .sort((a, b) => score(b) - score(a));
  }, [mustDos, excluded]);

  const rankedParty = useMemo(() => {
    const mustNames = new Set(mustDos.map((m) => m.attraction.toLowerCase()));
    return [...partyWants]
      .filter(
        (p) =>
          !mustNames.has(p.attraction.toLowerCase()) &&
          !excluded.has(p.attraction.toLowerCase()) &&
          (includeLowConfidence || p.party.yes / p.party.total >= 0.5),
      )
      .sort((a, b) => b.party.yes / b.party.total - a.party.yes / a.party.total);
  }, [partyWants, mustDos, excluded, includeLowConfidence]);

  /**
   * Cross-tier recommendation — the single "do this next" pick.
   *
   * Strategy: Must-Do beats Party Wants. Each candidate gets a normalized
   * score within its tier; only the top one in the higher-priority tier
   * surfaces as the lead recommendation.
   */
  const recommendation = useMemo(() => {
    type Rec = {
      key: string;            // unique row key matching the rendered list
      sourceId: string;       // id passed to onPromote
      attraction: string;
      location?: string;
      kind?: AttractionKind;
      tier: 'must' | 'party';
      reason: string;         // short "why" line
    };

    const topMust = rankedMustDos.find((m) => m.desired - m.done > 0);
    if (topMust) {
      const remaining = topMust.desired - topMust.done;
      return {
        key: topMust.id,
        sourceId: topMust.id,
        attraction: topMust.attraction,
        tier: 'must',
        reason: `Top Must-Do — ${remaining} ride${remaining === 1 ? '' : 's'} still to go`,
      } as Rec;
    }
    const topParty = rankedParty[0];
    if (topParty && topParty.party.yes / topParty.party.total >= 0.5) {
      return {
        key: topParty.id,
        sourceId: `party-${topParty.id}`,
        attraction: topParty.attraction,
        location: topParty.location,
        kind: topParty.kind,
        tier: 'party',
        reason: `${topParty.party.yes} of ${topParty.party.total} in your party want this`,
      } as Rec;
    }
                    // Will-do only: Must-Dos + Party Wants. There's no
                    // park-wide community signal in the product.
    return null;
  }, [rankedMustDos, rankedParty]);

  const handlePromote = (sourceId: string, attraction: string) => {
    onClose();
    onPromote(sourceId, attraction);
  };

  const handleCustomSubmit = () => {
    const name = customName.trim();
    if (name.length < 2) return;
    setCustomName('');
    setCustomOpen(false);
    handlePromote(`custom-${Date.now()}`, name);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[9995]"
            style={{
              background: 'hsl(var(--parchment) / 0.78)',
              backdropFilter: 'blur(6px) saturate(120%)',
              WebkitBackdropFilter: 'blur(6px) saturate(120%)',
            }}
          />

          <motion.aside
            role="dialog"
            aria-label="Pull a ride into your active journey"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: 'spring', damping: 24, stiffness: 280 }}
            className="fixed bottom-[100px] left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[400px] bg-card rounded-2xl flex flex-col z-[9999]"
            style={{
              maxHeight: '78vh',
              boxShadow:
                '0 24px 60px hsl(var(--obsidian) / 0.22), 0 0 0 1px hsl(var(--gold) / 0.2)',
            }}
          >
            <header className="px-5 pt-5 pb-3 shrink-0">
              <p
                className="font-sans text-[8px] uppercase tracking-sovereign font-bold mb-1"
                style={{ color: 'hsl(var(--gold))' }}
              >
                Attractions
              </p>
              <div className="flex items-start gap-2">
                <h3 className="font-display text-[18px] text-foreground leading-tight flex-1">
                  What goes on the active card next?
                </h3>
                <button
                  type="button"
                  onClick={() => setLegendOpen((v) => !v)}
                  aria-expanded={legendOpen}
                  aria-controls="pull-ride-legend"
                  aria-label={legendOpen ? 'Hide source legend' : 'What are these sources?'}
                  className="shrink-0 inline-flex items-center justify-center rounded-full bg-transparent border-none cursor-pointer"
                  style={{
                    width: '28px',
                    height: '28px',
                    minHeight: '28px',
                    color: 'hsl(var(--slate-plaid))',
                  }}
                >
                  <Info size={16} />
                </button>
              </div>

              <AnimatePresence initial={false}>
                {legendOpen && (
                  <motion.div
                    id="pull-ride-legend"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="overflow-hidden"
                  >
                    <div
                      className="mt-2 rounded-xl px-3 py-2.5 space-y-2"
                      style={{ background: 'hsl(var(--obsidian) / 0.04)' }}
                    >
                      <LegendRow
                        accent="gold"
                        label="Must-Dos"
                        body="Today's locked priorities. Example: Tron Lightcycle Run · 2 of 3 ridden."
                      />
                      <LegendRow
                        accent="magenta"
                        label="Party Wants"
                        body="From your pre-trip survey on the web app. Example: it's a small world · 4 of 5 in your party voted yes."
                      />
                      <p
                        className="font-sans italic text-[10px] leading-snug pt-1"
                        style={{ color: 'hsl(var(--slate-plaid))' }}
                      >
                        Survey responses are managed on the web — adjust them there to update what shows up here.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Tabs — three clean segments. */}
              <div
                role="tablist"
                aria-label="Attractions sections"
                className="flex items-center gap-1 mt-3 p-1 rounded-xl"
                style={{ background: 'hsl(var(--obsidian) / 0.04)' }}
              >
                {([
                  { id: 'recommended', label: 'Recommended' },
                  { id: 'mustdo', label: 'Must-Dos' },
                  { id: 'plan', label: 'Plan' },
                ] as { id: Tab; label: string }[]).map((t) => {
                  const active = tab === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setTab(t.id)}
                      className="flex-1 px-3 py-1.5 rounded-lg font-sans text-[10px] uppercase tracking-sovereign font-bold cursor-pointer border-none transition-colors"
                      style={{
                        background: active ? 'hsl(var(--primary))' : 'transparent',
                        color: active
                          ? 'hsl(var(--highlighter))'
                          : 'hsl(var(--slate-plaid))',
                      }}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </header>

            <div className="overflow-y-auto px-3 pb-2">
              {/* ── RECOMMENDED ── single best cross-tier pick + the runners-up. */}
              {tab === 'recommended' && (
                <>
                  {/* Toggle: include low-confidence Party Wants (under 50%
                      of the party voted yes). Off by default so the picker
                      stays focused on what the party actually committed to. */}
                  <div className="flex items-center justify-between gap-3 px-2 pt-2 pb-1">
                    <div className="min-w-0">
                      <p
                        className="font-sans text-[10px] font-semibold leading-tight text-foreground"
                      >
                        Include softer party picks
                      </p>
                      <p
                        className="font-sans text-[9px] leading-snug mt-0.5"
                        style={{ color: 'hsl(var(--slate-plaid))' }}
                      >
                        Adds wishlist items fewer than half the party voted for.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={includeLowConfidence}
                      onClick={() => setIncludeLowConfidence((v) => !v)}
                      className="shrink-0 relative rounded-full cursor-pointer border-none transition-colors"
                      style={{
                        width: '36px',
                        height: '22px',
                        minHeight: '22px',
                        background: includeLowConfidence
                          ? 'hsl(var(--primary))'
                          : 'hsl(var(--obsidian) / 0.18)',
                      }}
                      aria-label={
                        includeLowConfidence
                          ? 'Hide low-confidence party picks'
                          : 'Show low-confidence party picks'
                      }
                    >
                      <motion.span
                        layout
                        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                        className="absolute top-1/2 -translate-y-1/2 rounded-full"
                        style={{
                          width: '16px',
                          height: '16px',
                          background: 'hsl(var(--card))',
                          left: includeLowConfidence ? '17px' : '3px',
                          boxShadow: '0 1px 3px hsl(var(--obsidian) / 0.25)',
                        }}
                      />
                    </button>
                  </div>

                  {recommendation ? (
                    <RecommendedCard
                      attraction={recommendation.attraction}
                      location={recommendation.location}
                      kind={recommendation.kind}
                      tier={recommendation.tier}
                      reason={recommendation.reason}
                      onTap={() => handlePromote(recommendation.sourceId, recommendation.attraction)}
                    />
                  ) : (
                    <p
                      className="font-sans text-[12px] text-center py-8"
                      style={{ color: 'hsl(var(--slate-plaid))' }}
                    >
                      Nothing new on your will-do list — your plan is on track.
                    </p>
                  )}

                  {/* Runners-up — capped at 2 total to keep the tab calm.
                      Will-do only: Party Wants the guest hasn't already
                      added. */}
                  {(() => {
                    const runnersUp: JSX.Element[] = [];
                    // Skip whatever is already showing as the recommendation.
                    rankedParty
                      .filter((p) => `party-${p.id}` !== recommendation?.sourceId)
                      .slice(0, 2)
                      .forEach((p, i) =>
                      runnersUp.push(
                        <Row
                          key={`party-${p.id}`}
                          rank={i + 1}
                          accent="magenta"
                          title={p.attraction}
                          sub={p.location}
                          kind={p.kind}
                          meta={`${p.party.yes} of ${p.party.total} want this`}
                          metaIcon={<Users size={10} />}
                          onTap={() => handlePromote(`party-${p.id}`, p.attraction)}
                        />,
                      ),
                    );
                    if (runnersUp.length === 0) return null;
                    return <Section label="Also worth pulling in" accent="slate">{runnersUp}</Section>;
                  })()}

                  {/* Survey-not-completed state — only shows when there
                      are zero party wants at all. Points guests back to
                      the pre-trip survey on the web app, which is the
                      only place those preferences can be entered. */}
                  {partyWants.length === 0 && (
                    <PartyWantsEmptyState />
                  )}

                  {/* Single hint to the full plan — replaces the second
                      runner-up section so density stays low. */}
                  {plan.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setTab('plan')}
                      className="w-full mt-2 mb-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-transparent border-none cursor-pointer font-sans text-[10px] uppercase tracking-sovereign font-bold transition-opacity hover:opacity-80"
                      style={{ color: 'hsl(var(--gold))', letterSpacing: '0.16em' }}
                      aria-label="View today's plan"
                    >
                      View today's plan
                      <ChevronRight size={12} />
                    </button>
                  )}
                </>
              )}

              {/* ── MUST-DOS ── */}
              {tab === 'mustdo' && (
                <>
                  {rankedMustDos.length > 0 ? (
                    <Section label="Must-Do · Locked priorities" accent="gold">
                      {rankedMustDos.map((m, i) => {
                        const remaining = Math.max(0, m.desired - m.done);
                        const isComplete = remaining === 0;
                        return (
                          <Row
                            key={m.id}
                            rank={i + 1}
                            accent="gold"
                            title={m.attraction}
                            meta={`${m.done}/${m.desired} ride${m.desired === 1 ? '' : 's'}`}
                            disabled={isComplete}
                            onTap={() => handlePromote(m.id, m.attraction)}
                          />
                        );
                      })}
                    </Section>
                  ) : (
                    <p
                      className="font-sans text-[12px] text-center py-8"
                      style={{ color: 'hsl(var(--slate-plaid))' }}
                    >
                      No Must-Dos set for today.
                    </p>
                  )}
                </>
              )}

              {/* ── FULL PLAN ── */}
              {tab === 'plan' && (
                <>
                  {plan.length > 0 ? (
                    <Section label="Today's plan" accent="gold">
                      {plan.map((p, i) => (
                        <Row
                          key={p.id}
                          rank={i + 1}
                          accent={p.rank === 'now' ? 'gold' : 'slate'}
                          title={p.attraction}
                          sub={p.location}
                          meta={p.time}
                          metaIcon={<Clock size={10} />}
                          onTap={() => handlePromote(p.id, p.attraction)}
                        />
                      ))}
                    </Section>
                  ) : (
                    <PlanEmptyState
                      onAdd={() => setTab('recommended')}
                    />
                  )}
                </>
              )}
            </div>

            {/* Persistent footer — always offers a single way to add to plan.
                Tapping it surfaces the Recommended tab inside this same
                sheet; picking any row commits the new item, closes the
                sheet, and returns the guest to Today. */}
            <div className="shrink-0 m-3 mt-1">
              {customOpen ? (
                /* Catalog picker — searchable dropdown of every attraction
                   in the LL inventory. Replaces the old free-text input so
                   guests pick a real ride (with live wait + LL return data
                   visible) instead of typing an arbitrary string. */
                <CatalogPicker
                  query={customName}
                  onQueryChange={setCustomName}
                  excluded={excluded}
                  onPick={(name) => {
                    setCustomName('');
                    setCustomOpen(false);
                    handlePromote(`custom-${Date.now()}`, name);
                  }}
                  onCancel={() => {
                    setCustomOpen(false);
                    setCustomName('');
                  }}
                />
              ) : (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTab('recommended')}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 cursor-pointer font-sans text-[11px] uppercase tracking-sovereign font-bold border-none"
                      style={{
                        background: 'hsl(var(--primary))',
                        color: 'hsl(var(--highlighter))',
                      }}
                    >
                      <Plus size={14} />
                      Add to plan
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="shrink-0 rounded-xl px-4 py-3 bg-transparent border cursor-pointer font-sans text-[10px] uppercase tracking-sovereign font-bold"
                      style={{
                        borderColor: 'hsl(var(--obsidian) / 0.12)',
                        color: 'hsl(var(--slate-plaid))',
                      }}
                    >
                      Close
                    </button>
                  </div>
                  {/* Escape hatch — for anything not on Must-Dos or party survey. */}
                  <button
                    type="button"
                    onClick={() => setCustomOpen(true)}
                    className="self-center inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-transparent border-none cursor-pointer font-sans text-[10px] uppercase tracking-sovereign font-bold transition-opacity hover:opacity-80"
                    style={{ color: 'hsl(var(--gold))', letterSpacing: '0.14em' }}
                  >
                    <Plus size={11} />
                    Don't see it? Add a custom attraction
                  </button>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

/* ─── Internal building blocks ─────────────────────────────────── */

type Accent = 'gold' | 'magenta' | 'slate';

const accentColor = (a: Accent) =>
  a === 'gold'
    ? 'hsl(var(--gold))'
    : a === 'magenta'
      ? 'hsl(316 95% 35%)'
      : 'hsl(var(--slate-plaid))';

const Section = ({
  label,
  accent,
  children,
}: {
  label: string;
  accent: Accent;
  children: React.ReactNode;
}) => (
  <section className="mt-2 mb-1">
    <p
      className="font-sans text-[8px] uppercase tracking-sovereign font-bold px-3 pb-1.5"
      style={{ color: accentColor(accent), letterSpacing: '0.16em' }}
    >
      {label}
    </p>
    <ul className="list-none p-0 m-0 space-y-1">{children}</ul>
  </section>
);

interface RowProps {
  rank: number;
  accent: Accent;
  title: string;
  sub?: string;
  kind?: AttractionKind;
  meta?: string;
  metaIcon?: React.ReactNode;
  metaTrail?: React.ReactNode;
  disabled?: boolean;
  /** When true, the row gets a subtle "Recommended" pip beside the kind chip. */
  recommended?: boolean;
  onTap: () => void;
}

const Row = ({
  rank,
  accent,
  title,
  sub,
  kind,
  meta,
  metaIcon,
  metaTrail,
  disabled,
  recommended,
  onTap,
}: RowProps) => {
  const color = accentColor(accent);
  const KindIcon = kind ? KIND_META[kind].Icon : null;
  const kindLabel = kind ? KIND_META[kind].label : null;
  return (
    <li>
      <motion.button
        whileTap={disabled ? undefined : { scale: 0.98 }}
        onClick={onTap}
        disabled={disabled}
        aria-label={`${title}${disabled ? ' — complete' : ' — pull onto active card'}`}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-transparent border-none cursor-pointer text-left transition-colors hover:bg-accent/5 disabled:cursor-not-allowed"
        style={{ minHeight: '52px', opacity: disabled ? 0.5 : 1 }}
      >
        <span
          className="shrink-0 flex items-center justify-center rounded-full font-display text-[13px] tabular-nums font-bold"
          style={{
            width: '26px',
            height: '26px',
            background: disabled ? 'hsl(var(--slate-plaid) / 0.15)' : `${color.replace(')', ' / 0.15)')}`,
            color: disabled ? 'hsl(var(--slate-plaid))' : color,
          }}
        >
          {disabled ? <Check size={13} /> : rank}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p
              className="font-display text-[14px] leading-tight text-foreground truncate"
              style={{ textDecoration: disabled ? 'line-through' : 'none' }}
            >
              {title}
            </p>
            {KindIcon && kindLabel && (
              <span
                className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full font-sans text-[8px] uppercase font-bold tracking-sovereign"
                style={{
                  background: 'hsl(var(--obsidian) / 0.05)',
                  color: 'hsl(var(--slate-plaid))',
                  letterSpacing: '0.12em',
                }}
                title={kindLabel}
                aria-label={kindLabel}
              >
                <KindIcon size={9} />
                {kindLabel}
              </span>
            )}
            {recommended && (
              <span
                className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full font-sans text-[8px] uppercase font-bold tracking-sovereign"
                style={{
                  background: 'hsl(316 95% 35% / 0.12)',
                  color: 'hsl(316 95% 35%)',
                  letterSpacing: '0.12em',
                }}
                title="Recommended next"
                aria-label="Recommended next"
              >
                <Wand2 size={9} />
                Pick
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {sub && (
              <span
                className="font-sans text-[10px]"
                style={{ color: 'hsl(var(--slate-plaid))' }}
              >
                {sub}
              </span>
            )}
            {meta && (
              <span
                className="font-sans text-[10px] tabular-nums flex items-center gap-1"
                style={{ color }}
              >
                {metaIcon}
                {meta}
                {metaTrail}
              </span>
            )}
          </div>
          {/* Wait-time + LL return-window chips. Renders only for rides
              we have inventory for; non-ride attractions stay clean. */}
          <WaitLLChips attraction={title} />
        </div>

        {!disabled ? (
          <ChevronRight size={16} className="shrink-0" style={{ color }} />
        ) : (
          <Star size={14} className="shrink-0" style={{ color: 'hsl(var(--slate-plaid))' }} fill="currentColor" />
        )}
      </motion.button>
    </li>
  );
};

export default PullRideInSheet;

/* ─── Catalog picker (custom-add dropdown) ─────────────────────── */

/**
 * Searchable dropdown of the entire LL attraction catalog. Used by the
 * custom-add escape hatch in the footer: rather than letting guests free-
 * type a ride name (which produces no wait/LL data), they pick a known
 * attraction from this list. Each option shows the same wait + LL chips
 * the rest of the sheet uses, so the selection feels informed.
 *
 * Filters out anything already locked into the active plan via the same
 * `excluded` Set used elsewhere in the sheet.
 */
const CatalogPicker = ({
  query,
  onQueryChange,
  excluded,
  onPick,
  onCancel,
}: {
  query: string;
  onQueryChange: (v: string) => void;
  excluded: Set<string>;
  onPick: (name: string) => void;
  onCancel: () => void;
}) => {
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return LL_INVENTORY
      .filter((a) => !excluded.has(a.name.toLowerCase()))
      .filter((a) =>
        q.length === 0
          ? true
          : a.name.toLowerCase().includes(q) || a.land.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [query, excluded]);

  return (
    <div className="flex flex-col gap-2">
      <label
        className="font-sans text-[8px] uppercase tracking-sovereign font-bold px-1"
        style={{ color: 'hsl(var(--gold))', letterSpacing: '0.16em' }}
        htmlFor="pull-ride-catalog-input"
      >
        Pick an attraction
      </label>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'hsl(var(--slate-plaid))' }}
            aria-hidden
          />
          <input
            id="pull-ride-catalog-input"
            autoFocus
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search rides or lands…"
            maxLength={60}
            className="w-full rounded-xl pl-9 pr-3 py-3 font-sans text-[13px] bg-transparent outline-none"
            style={{
              minHeight: '44px',
              background: 'hsl(var(--obsidian) / 0.04)',
              color: 'hsl(var(--foreground))',
            }}
            aria-label="Search the attraction catalog"
          />
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="shrink-0 rounded-xl px-3 bg-transparent border cursor-pointer font-sans text-[10px] uppercase tracking-sovereign font-bold"
          style={{
            minHeight: '44px',
            borderColor: 'hsl(var(--obsidian) / 0.12)',
            color: 'hsl(var(--slate-plaid))',
          }}
        >
          Cancel
        </button>
      </div>

      <ul
        className="list-none p-0 m-0 max-h-[240px] overflow-y-auto rounded-xl"
        style={{ background: 'hsl(var(--obsidian) / 0.03)' }}
        role="listbox"
        aria-label="Attraction catalog"
      >
        {matches.length === 0 ? (
          <li
            className="font-sans italic text-[11px] leading-snug px-3 py-4 text-center"
            style={{ color: 'hsl(var(--slate-plaid))' }}
          >
            No matches in the catalog.
          </li>
        ) : (
          matches.map((a) => (
            <li key={a.id}>
              <motion.button
                type="button"
                whileTap={{ scale: 0.985 }}
                onClick={() => onPick(a.name)}
                className="w-full flex items-start gap-2 px-3 py-2.5 bg-transparent border-none cursor-pointer text-left transition-colors hover:bg-accent/5"
                style={{ minHeight: '52px' }}
                role="option"
                aria-selected={false}
                aria-label={`Add ${a.name} from ${a.land}`}
              >
                <Ticket
                  size={14}
                  className="shrink-0 mt-0.5"
                  style={{ color: 'hsl(var(--gold))' }}
                  aria-hidden
                />
                <div className="flex-1 min-w-0">
                  <p className="font-display text-[13px] leading-tight text-foreground truncate">
                    {a.name}
                  </p>
                  <p
                    className="font-sans text-[10px] mt-0.5"
                    style={{ color: 'hsl(var(--slate-plaid))' }}
                  >
                    {a.land}
                  </p>
                  <WaitLLChips attraction={a.name} />
                </div>
                <Plus
                  size={14}
                  className="shrink-0 mt-1"
                  style={{ color: 'hsl(var(--gold))' }}
                  aria-hidden
                />
              </motion.button>
            </li>
          ))
        )}
      </ul>

      <p
        className="font-sans italic text-[10px] leading-snug px-1"
        style={{ color: 'hsl(var(--slate-plaid))' }}
      >
        Goes straight onto your active card. Won't change your Must-Dos or party survey.
      </p>
    </div>
  );
};

/* ─── Shared wait + LL chip strip ──────────────────────────────── */

/**
 * Tiny dual-chip strip that surfaces the two pieces of data a guest needs
 * before committing to a ride: current standby wait and next LL return
 * window. Renders nothing when the attraction isn't on the LL inventory
 * (e.g. shows, parades, dining) so the layout stays clean.
 */
const WaitLLChips = ({
  attraction,
  size = 'sm',
}: {
  attraction: string;
  size?: 'sm' | 'md';
}) => {
  const meta = lookupAttractionMeta(attraction);
  if (!meta) return null;
  const fontSize = size === 'md' ? '10px' : '9px';
  const padY = size === 'md' ? '3px' : '2px';
  return (
    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
      <span
        className="inline-flex items-center gap-1 rounded-full font-sans tabular-nums font-semibold"
        style={{
          fontSize,
          padding: `${padY} 6px`,
          background: 'hsl(var(--obsidian) / 0.06)',
          color: 'hsl(var(--slate-plaid))',
        }}
        title={`Standby ${meta.standbyMin} minutes`}
        aria-label={`Standby wait ${meta.standbyMin} minutes`}
      >
        <Clock size={9} />
        {meta.standbyMin}m wait
      </span>
      <span
        className="inline-flex items-center gap-1 rounded-full font-sans tabular-nums font-semibold"
        style={{
          fontSize,
          padding: `${padY} 6px`,
          background: meta.isILL ? 'hsl(var(--gold) / 0.18)' : 'hsl(var(--accent) / 0.14)',
          color: meta.isILL ? 'hsl(var(--gold))' : 'hsl(var(--accent))',
        }}
        title={`Next ${meta.isILL ? 'Individual LL' : 'Lightning Lane'} return: ${meta.nextWindow}`}
        aria-label={`Next ${meta.isILL ? 'Individual Lightning Lane' : 'Lightning Lane'} return ${meta.nextWindow}`}
      >
        <Zap size={9} />
        {meta.isILL ? 'ILL' : 'LL'} {meta.nextWindow}
      </span>
    </div>
  );
};

/* ─── Source-tier legend row ───────────────────────────────────── */

/**
 * Tiny color-coded entry used inside the header info popover. Mirrors the
 * accent colors of the actual `Row` component so guests can map "this dot"
 * → "that section" at a glance.
 */
const LegendRow = ({
  accent,
  label,
  body,
}: {
  accent: 'gold' | 'magenta';
  label: string;
  body: string;
}) => (
  <div className="flex items-start gap-2.5">
    <span
      aria-hidden="true"
      className="shrink-0 rounded-full mt-1"
      style={{
        width: '8px',
        height: '8px',
        background:
          accent === 'gold' ? 'hsl(var(--gold))' : 'hsl(316 95% 35%)',
      }}
    />
    <div className="min-w-0">
      <p className="font-sans text-[10px] font-bold leading-tight text-foreground">
        {label}
      </p>
      <p
        className="font-sans text-[10px] leading-snug mt-0.5"
        style={{ color: 'hsl(var(--slate-plaid))' }}
      >
        {body}
      </p>
    </div>
  </div>
);

/* ─── Plan tab · empty state ───────────────────────────────────── */

/**
 * Editorial empty state for the "Plan" tab. No chrome, no borders — just a
 * calm gold mark, a one-line invitation, and a single primary CTA. Tapping
 * the CTA switches the sheet to the Recommended tab so the guest can pick
 * an attraction in-place; selecting any row commits it and closes the sheet.
 */
const PlanEmptyState = ({ onAdd }: { onAdd: () => void }) => (
  <div className="flex flex-col items-center text-center px-6 py-10">
    <span
      aria-hidden
      className="flex items-center justify-center rounded-full mb-4"
      style={{
        width: '52px',
        height: '52px',
        background: 'hsl(var(--gold) / 0.12)',
        color: 'hsl(var(--gold))',
        boxShadow: '0 0 0 1px hsl(var(--gold) / 0.35)',
      }}
    >
      <CalendarPlus size={22} />
    </span>
    <p
      className="font-sans text-[8px] uppercase tracking-sovereign font-bold mb-1.5"
      style={{ color: 'hsl(var(--gold))', letterSpacing: '0.18em' }}
    >
      A Quiet Slate
    </p>
    <h4 className="font-display text-[18px] leading-tight text-foreground mb-1.5">
      Your day is unwritten.
    </h4>
    <p
      className="font-sans italic text-[12px] leading-snug max-w-[260px] mb-5"
      style={{ color: 'hsl(var(--slate-plaid))' }}
    >
      Sketch the first move and the rest of the strategy will follow.
    </p>
    <motion.button
      whileTap={{ scale: 0.98 }}
      type="button"
      onClick={onAdd}
      className="inline-flex items-center gap-2 rounded-xl px-5 py-3 cursor-pointer font-sans text-[11px] uppercase tracking-sovereign font-bold border-none min-h-[44px]"
      style={{
        background: 'hsl(var(--primary))',
        color: 'hsl(var(--highlighter))',
      }}
    >
      <Plus size={14} />
      Add to plan
    </motion.button>
  </div>
);

/* ─── Party Wants · survey-not-completed empty state ───────────── */

/**
 * Editorial empty state shown when the guest's party survey has no
 * responses yet. Party Wants are owned by the pre-trip survey on the
 * web app — the in-park app only consumes them — so the message points
 * back there rather than offering an in-app fix.
 *
 * Visual: magenta accent (matches the Party Wants tier dot), surface
 * card per the no-line rule, no CTA button (the action is off-device).
 *
 * Accessibility:
 *  · Wrapped as an ARIA `status` region with `aria-live="polite"` so
 *    screen readers announce the prompt when the Recommended tab opens
 *    to an empty Party Wants tier — without preempting the user.
 *  · `aria-labelledby` + `aria-describedby` map the heading and body to
 *    the region, so SR users hear "Party Wants — Your party hasn't
 *    weighed in yet… Open the pre-trip survey…" as one coherent block.
 *  · The decorative icon stays `aria-hidden`; its meaning is carried by
 *    the visible kicker label, which is also announced (visually styled
 *    as a small caption but exposed as a real heading via sr-only
 *    prefix for outline tools).
 *  · `useId` keeps ids unique if the empty state ever appears twice.
 */
const PartyWantsEmptyState = () => {
  const magenta = 'hsl(316 95% 35%)';
  const reactId = useId();
  const headingId = `${reactId}-party-empty-heading`;
  const bodyId = `${reactId}-party-empty-body`;
  return (
    <section
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-labelledby={headingId}
      aria-describedby={bodyId}
      className="mt-3 mb-1 mx-1 rounded-2xl p-4 flex items-start gap-3"
      style={{
        background:
          'linear-gradient(180deg, hsl(316 95% 35% / 0.07) 0%, hsl(316 95% 35% / 0.015) 100%)',
        boxShadow:
          '0 0 0 1px hsl(316 95% 35% / 0.22), 0 6px 18px hsl(var(--obsidian) / 0.05)',
      }}
    >
      <span
        aria-hidden="true"
        className="shrink-0 flex items-center justify-center rounded-full"
        style={{
          width: '36px',
          height: '36px',
          background: magenta,
          color: 'hsl(var(--card))',
        }}
      >
        <ClipboardList size={16} />
      </span>
      <div className="flex-1 min-w-0">
        {/* Visible kicker is also the section's accessible name. The
            sr-only prefix gives assistive tech a clearer outline anchor
            ("Party Wants section: …") without changing the visual. */}
        <p
          className="font-sans text-[8px] uppercase tracking-sovereign font-bold mb-1"
          style={{ color: magenta, letterSpacing: '0.16em' }}
        >
          Party Wants · Awaiting the survey
        </p>
        <h3
          id={headingId}
          className="font-display text-[15px] leading-tight text-foreground mb-1"
        >
          <span className="sr-only">Party Wants section: </span>
          Your party hasn't weighed in yet.
        </h3>
        <p
          id={bodyId}
          className="font-sans italic text-[11px] leading-snug"
          style={{ color: 'hsl(var(--foreground) / 0.75)' }}
        >
          Open the pre-trip survey on the Castle Companion web app and have everyone vote on the
          attractions they're hoping for. Their picks land here automatically.
        </p>
      </div>
    </section>
  );
};

/* ─── Featured "Recommended Next" card ─────────────────────────── */

interface RecommendedCardProps {
  attraction: string;
  location?: string;
  kind?: AttractionKind;
  tier: 'must' | 'party';
  reason: string;
  onTap: () => void;
}

const TIER_LABEL: Record<RecommendedCardProps['tier'], string> = {
  must: 'From your Must-Do list',
  party: 'From your party survey',
};

/**
 * The "what should we do next?" answer.
 *
 * Sits above all three tier sections inside the sheet. It's the same data
 * the row would carry, surfaced as a richer, magenta-trimmed card so the
 * guest's eye lands on the recommendation before scanning the full list.
 */
const RecommendedCard = ({
  attraction,
  location,
  kind,
  tier,
  reason,
  onTap,
}: RecommendedCardProps) => {
  const KindIcon = kind ? KIND_META[kind].Icon : null;
  const kindLabel = kind ? KIND_META[kind].label : null;
  return (
    <motion.button
      type="button"
      onClick={onTap}
      whileTap={{ scale: 0.985 }}
      aria-label={`Recommended next: ${attraction}. ${reason}. Pull onto active card.`}
      className="w-full text-left rounded-2xl mt-2 mb-3 p-4 cursor-pointer border-none flex items-start gap-3"
      style={{
        background:
          'linear-gradient(180deg, hsl(316 95% 35% / 0.10) 0%, hsl(316 95% 35% / 0.02) 100%)',
        boxShadow: '0 0 0 1px hsl(316 95% 35% / 0.35), 0 8px 22px hsl(var(--obsidian) / 0.06)',
      }}
    >
      <span
        className="shrink-0 flex items-center justify-center rounded-full"
        style={{
          width: '36px',
          height: '36px',
          background: 'hsl(316 95% 35%)',
          color: 'hsl(var(--card))',
        }}
      >
        <Wand2 size={16} />
      </span>

      <div className="flex-1 min-w-0">
        <p
          className="font-sans text-[8px] uppercase tracking-sovereign font-bold mb-1"
          style={{ color: 'hsl(316 95% 35%)', letterSpacing: '0.16em' }}
        >
          Recommended Next · {TIER_LABEL[tier]}
        </p>
        <p className="font-display text-[16px] leading-tight text-foreground">
          {attraction}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {KindIcon && kindLabel && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full font-sans text-[8px] uppercase font-bold tracking-sovereign"
              style={{
                background: 'hsl(var(--obsidian) / 0.05)',
                color: 'hsl(var(--slate-plaid))',
                letterSpacing: '0.12em',
              }}
            >
              <KindIcon size={9} />
              {kindLabel}
            </span>
          )}
          {location && (
            <span className="font-sans text-[10px]" style={{ color: 'hsl(var(--slate-plaid))' }}>
              {location}
            </span>
          )}
        </div>
        <WaitLLChips attraction={attraction} size="md" />
        <p
          className="font-sans italic text-[11px] leading-snug mt-1.5 pl-2 border-l-2"
          style={{ color: 'hsl(var(--foreground) / 0.75)', borderColor: 'hsl(316 95% 35% / 0.45)' }}
        >
          {reason}
        </p>
      </div>

      <ChevronRight size={18} className="shrink-0 mt-1" style={{ color: 'hsl(316 95% 35%)' }} />
    </motion.button>
  );
};