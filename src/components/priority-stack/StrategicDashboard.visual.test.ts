import { describe, it, expect } from 'vitest';
import { SOLID_GOLD_TARGET } from './StrategicDashboard';
import { BURNISHED_GOLD } from '@/pages/BookLightningLane';

/**
 * Visual Regression Checklist — Solid-Gold "Selected Target"
 * ==========================================================
 * Time-slot chips on the Strategic Dashboard are the canonical home of the
 * *solid* gold treatment. The rule:
 *
 *   A chip that represents a chosen target wears SOLID_GOLD_TARGET.selected
 *   (full-saturation gold fill + parchment ink).
 *
 *   A chip that does NOT yet represent the target wears either:
 *     • SOLID_GOLD_TARGET.unselectedSentinel — gold outline only, kept as an
 *       always-on affordance (used by "Next available").
 *     • SOLID_GOLD_TARGET.unselectedSlot     — neutral outline, used by
 *       ordinary 30-minute slot chips.
 *
 *   It MUST NEVER reach for the BURNISHED_GOLD recipe used by
 *   /book-ll's heart, Watch CTA, and watching card outline. Those surfaces
 *   communicate "armed / waiting" — an ambient state. A chip is always a
 *   hard pick or a quiet candidate; conflating the two collapses the
 *   editorial hierarchy.
 *
 * Manual visual checklist (run when these tests change):
 *   □ "Next available" sentinel, not chosen     → gold outline, transparent fill
 *   □ "Next available" sentinel, chosen          → SOLID gold fill, parchment ink
 *   □ Ordinary time-slot chip, not chosen        → neutral outline, slate ink
 *   □ Ordinary time-slot chip, chosen            → SOLID gold fill, parchment ink
 *   □ No chip ever reads as a 12% tint           → that recipe is BURNISHED_GOLD only
 *   □ /book-ll heart / Watch pill never reads as solid gold → that's SOLID_GOLD_TARGET only
 */
describe('StrategicDashboard — solid-gold selected-target contract', () => {
  describe('SOLID_GOLD_TARGET token snapshot', () => {
    it('locks the selected-chip surface to solid gold + parchment ink', () => {
      // Full-saturation fill is non-negotiable — this is what makes the
      // chosen chip visibly different from any "armed" surface in the app.
      expect(SOLID_GOLD_TARGET.selected).toEqual({
        backgroundColor: 'hsl(var(--gold))',
        color: 'hsl(var(--parchment))',
        borderColor: 'hsl(var(--gold))',
      });
    });

    it('locks the unselected-sentinel surface (always-on gold outline)', () => {
      // The sentinel ("Next available") wears gold even when not chosen so
      // the affordance is permanently in view. Transparent fill keeps it
      // from competing with the actual selected chip.
      expect(SOLID_GOLD_TARGET.unselectedSentinel).toEqual({
        backgroundColor: 'transparent',
        color: 'hsl(var(--gold))',
        borderColor: 'hsl(var(--gold))',
      });
    });

    it('locks the unselected ordinary slot to neutral outline', () => {
      // Ordinary slots stay quiet until chosen — slate ink + a 12%
      // obsidian outline reads as "candidate" without pulling focus.
      expect(SOLID_GOLD_TARGET.unselectedSlot).toEqual({
        backgroundColor: 'transparent',
        color: 'hsl(var(--slate-plaid))',
        borderColor: 'hsl(var(--obsidian) / 0.12)',
      });
    });
  });

  describe('selected vs. unselected invariants', () => {
    it('selected fill is full-saturation gold (no opacity modifier)', () => {
      // The signature move — `hsl(var(--gold))` with no `/ 0.NN` suffix.
      // Catches anyone reaching for a tinted shorthand.
      expect(SOLID_GOLD_TARGET.selected.backgroundColor).toBe('hsl(var(--gold))');
      expect(SOLID_GOLD_TARGET.selected.backgroundColor).not.toMatch(/\/\s*0\./);
    });

    it('selected ink is parchment (the inverse of every burnished surface)', () => {
      // Burnished surfaces always ink with gold. A solid chip flips that
      // — gold becomes the field, parchment becomes the ink. This is the
      // single attribute that makes the two recipes legible at a glance.
      expect(SOLID_GOLD_TARGET.selected.color).toBe('hsl(var(--parchment))');
    });

    it('unselected slots never carry any gold ink, fill, or border', () => {
      // Critical: an ordinary unselected slot must read as truly neutral.
      // Any gold leakage here would make the selected chip stop popping.
      const slot = SOLID_GOLD_TARGET.unselectedSlot;
      expect(slot.backgroundColor).not.toMatch(/var\(--gold\)/);
      expect(slot.color).not.toMatch(/var\(--gold\)/);
      expect(slot.borderColor).not.toMatch(/var\(--gold\)/);
    });
  });

  describe('cross-token rule — solid gold ≠ burnished gold', () => {
    it('selected-chip fill is NEVER the burnished pill fill', () => {
      // 100% gold (chip) vs. 12% gold (pill). If these ever match, the
      // "armed" pill on /book-ll will look like a chosen chip.
      expect(SOLID_GOLD_TARGET.selected.backgroundColor).not.toBe(
        BURNISHED_GOLD.surface.backgroundColor,
      );
    });

    it('selected-chip ink is NEVER the burnished surface ink', () => {
      // Parchment vs. gold. The two recipes invert ink/field roles by
      // design — this assertion prevents anyone from "harmonizing" them.
      expect(SOLID_GOLD_TARGET.selected.color).not.toBe(BURNISHED_GOLD.surface.color);
    });

    it('selected-chip border is solid 100% gold, NOT the 45% burnished border', () => {
      // The pill border is `1px solid hsl(var(--gold) / 0.45)`. A chip
      // border has no opacity. They must stay structurally distinct.
      expect(SOLID_GOLD_TARGET.selected.borderColor).toBe('hsl(var(--gold))');
      expect(BURNISHED_GOLD.surface.border).toContain('/ 0.45)');
    });

    it('no chip surface uses any opacity-modified gold', () => {
      // The defining trait of SOLID_GOLD_TARGET: every gold reference is
      // either fully-saturated or absent. Tinted gold belongs exclusively
      // to BURNISHED_GOLD. This sweep catches sneaky `/ 0.NN` additions.
      const allChipValues = [
        ...Object.values(SOLID_GOLD_TARGET.selected),
        ...Object.values(SOLID_GOLD_TARGET.unselectedSentinel),
        ...Object.values(SOLID_GOLD_TARGET.unselectedSlot),
      ];
      const tintedGold = allChipValues.filter(
        (v) => /var\(--gold\)\s*\/\s*0\./.test(v),
      );
      expect(tintedGold).toEqual([]);
    });
  });
});
