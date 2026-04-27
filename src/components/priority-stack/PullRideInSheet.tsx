import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  ChevronRight,
  Star,
  Users,
  TrendingUp,
  Ticket,
  Drama,
  Sparkles,
  Flag,
  UtensilsCrossed,
  Wand2,
  Plus,
  Clock,
  CalendarPlus,
} from 'lucide-react';
import type { MustDo } from '@/hooks/park/usePlanStack';
import type { PartyWant, CommunityPick, AttractionKind } from '@/data/wantToDos';
import type { PlanItem } from '@/components/priority-stack/HeroHorizonStack';

type Tab = 'recommended' | 'mustdo' | 'plan';

interface PullRideInSheetProps {
  open: boolean;
  onClose: () => void;
  mustDos: MustDo[];
  partyWants: PartyWant[];
  communityPicks: CommunityPick[];
  /** Names of attractions already locked in the active plan — filtered out. */
  excludedAttractions?: string[];
  /** The active 3-card plan, surfaced on the "Plan" tab. */
  plan?: PlanItem[];
  /**
   * Inject any attraction onto the active stack as the new "Now" card.
   * The id is a synthetic key (e.g. `must-m1`, `party-w1`, `comm-c3`) — usePlanStack
   * already handles the case where the attraction is brand new.
   */
  onPromote: (sourceId: string, attraction: string) => void;
  /** Open the editor / picker for adding a brand-new attraction to the plan. */
  onAddToPlan?: () => void;
}

const formatVotes = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k` : n.toString();

const KIND_META: Record<AttractionKind, { label: string; Icon: typeof Ticket }> = {
  ride:   { label: 'Ride',           Icon: Ticket },
  show:   { label: 'Show',           Icon: Drama },
  meet:   { label: 'Meet & Greet',   Icon: Sparkles },
  parade: { label: 'Parade',         Icon: Flag },
  dining: { label: 'Dining',         Icon: UtensilsCrossed },
};

/**
 * "Pull an attraction in" — the unified injection sheet. Three tiers:
 *
 *   1. Must-Do (gold)         — pre-locked priorities, ranked by remaining rides.
 *   2. Party Wants (magenta)  — survey wishlist, ranked by yes/total ratio.
 *   3. Community Picks (slate)— park-wide votes for today, ranked by votes.
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
  communityPicks,
  excludedAttractions = [],
  plan = [],
  onPromote,
  onAddToPlan,
}: PullRideInSheetProps) => {
  const [tab, setTab] = useState<Tab>('recommended');

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
    return [...mustDos].sort((a, b) => score(b) - score(a));
  }, [mustDos]);

  const rankedParty = useMemo(() => {
    const mustNames = new Set(mustDos.map((m) => m.attraction.toLowerCase()));
    return [...partyWants]
      .filter(
        (p) =>
          !mustNames.has(p.attraction.toLowerCase()) &&
          !excluded.has(p.attraction.toLowerCase()),
      )
      .sort((a, b) => b.party.yes / b.party.total - a.party.yes / a.party.total);
  }, [partyWants, mustDos, excluded]);

  const rankedCommunity = useMemo(() => {
    const mustNames = new Set(mustDos.map((m) => m.attraction.toLowerCase()));
    const partyNames = new Set(partyWants.map((p) => p.attraction.toLowerCase()));
    return [...communityPicks]
      .filter(
        (c) =>
          !mustNames.has(c.attraction.toLowerCase()) &&
          !partyNames.has(c.attraction.toLowerCase()) &&
          !excluded.has(c.attraction.toLowerCase()),
      )
      .sort((a, b) => b.votes - a.votes);
  }, [communityPicks, mustDos, partyWants, excluded]);

  /**
   * Cross-tier recommendation — the single "do this next" pick.
   *
   * Strategy: Must-Do beats Party beats Community, but only when there's a
   * real signal in the higher tier. Each candidate gets a normalized score
   * 0–1 within its tier; we then bias by tier weight so a strong community
   * pick can still surface when the user has no live Must-Dos or party data.
   */
  const recommendation = useMemo(() => {
    type Rec = {
      key: string;            // unique row key matching the rendered list
      sourceId: string;       // id passed to onPromote
      attraction: string;
      location?: string;
      kind?: AttractionKind;
      tier: 'must' | 'party' | 'community';
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
    const topCommunity = rankedCommunity[0];
    if (topCommunity) {
      return {
        key: topCommunity.id,
        sourceId: `comm-${topCommunity.id}`,
        attraction: topCommunity.attraction,
        location: topCommunity.location,
        kind: topCommunity.kind,
        tier: 'community',
        reason: `${formatVotes(topCommunity.votes)} guests voted this today${topCommunity.trend === 'up' ? ' — trending up' : ''}`,
      } as Rec;
    }
    return null;
  }, [rankedMustDos, rankedParty, rankedCommunity]);

  const handlePromote = (sourceId: string, attraction: string) => {
    onClose();
    onPromote(sourceId, attraction);
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
              <h3 className="font-display text-[18px] text-foreground leading-tight">
                What goes on the active card next?
              </h3>

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
                      No new recommendation right now — your plan is on track.
                    </p>
                  )}

                  {rankedParty.length > 0 && (
                    <Section label="Also worth pulling in" accent="magenta">
                      {rankedParty.slice(0, 3).map((p, i) => (
                        <Row
                          key={p.id}
                          rank={i + 1}
                          accent="magenta"
                          title={p.attraction}
                          sub={p.location}
                          kind={p.kind}
                          meta={`${p.party.yes} of ${p.party.total} want this`}
                          metaIcon={<Users size={10} />}
                          onTap={() => handlePromote(`party-${p.id}`, p.attraction)}
                        />
                      ))}
                    </Section>
                  )}

                  {rankedCommunity.length > 0 && (
                    <Section label="Trending in the park today" accent="slate">
                      {rankedCommunity.slice(0, 3).map((c, i) => (
                        <Row
                          key={c.id}
                          rank={i + 1}
                          accent="slate"
                          title={c.attraction}
                          sub={c.location}
                          kind={c.kind}
                          meta={formatVotes(c.votes)}
                          metaIcon={<Users size={10} />}
                          metaTrail={c.trend === 'up' ? <TrendingUp size={9} /> : null}
                          onTap={() => handlePromote(`comm-${c.id}`, c.attraction)}
                        />
                      ))}
                    </Section>
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
                      onAdd={() => {
                        onClose();
                        onAddToPlan?.();
                      }}
                    />
                  )}
                </>
              )}
            </div>

            {/* Persistent footer — always offers a single way to add to plan. */}
            <div className="shrink-0 flex items-center gap-2 m-3 mt-1">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onAddToPlan?.();
                }}
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

/* ─── Featured "Recommended Next" card ─────────────────────────── */

interface RecommendedCardProps {
  attraction: string;
  location?: string;
  kind?: AttractionKind;
  tier: 'must' | 'party' | 'community';
  reason: string;
  onTap: () => void;
}

const TIER_LABEL: Record<RecommendedCardProps['tier'], string> = {
  must: 'From your Must-Do list',
  party: 'From your party survey',
  community: 'From the community',
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