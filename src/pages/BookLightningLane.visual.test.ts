import { describe, it, expect } from 'vitest';
import { BURNISHED_GOLD } from './BookLightningLane';

/**
 * Visual Regression Checklist — Gold-Tone Lock
 * ============================================
 * /book-ll uses a *single* burnished-gold token (`BURNISHED_GOLD`) for three
 * surfaces that must always read as the same visual family:
 *
 *   1. ❤️  Heart toggle (watching / armed)        — `ink`
 *   2. ⚡ Watch CTA "Armed · Locked" pill         — `surface`
 *   3. ▭  Card outline + glow on a watching row   — `borderWatching`,
 *                                                   `borderArmed`, `glowArmed`
 *
 * Time-slot chips elsewhere in the app use a *solid* gold fill (different
 * role — "selected target") and intentionally diverge from this token. If
 * either palette drifts, the two roles start competing for attention and
 * the editorial hierarchy collapses.
 *
 * This file is the cheap, fast guard against that drift. It pins the exact
 * HSL strings produced by the token. Bumping a value here forces a
 * deliberate review of every consuming surface in `BookLightningLane.tsx`.
 *
 * Manual visual checklist (run when these tests change):
 *   □ Heart icon outlined on a non-watching row            → no gold leakage
 *   □ Heart icon filled on a watching+unlocked row         → BURNISHED_GOLD.ink
 *   □ Heart icon filled + dot on a watching+locked row     → BURNISHED_GOLD.ink
 *   □ Watch CTA in default state                            → obsidian (no gold)
 *   □ Watch CTA in armed-locked state                       → BURNISHED_GOLD.surface
 *   □ Card border on watching row                           → BURNISHED_GOLD.borderWatching
 *   □ Card border + glow on armed-locked row                → BURNISHED_GOLD.borderArmed + glowArmed
 *   □ Time-slot chip (selected) in BookSplitButton menu     → SOLID gold, NOT this token
 *   □ Urgency filter chips                                  → per-chip color, NOT this token
 */
describe('BookLightningLane — gold-tone visual contract', () => {
  describe('BURNISHED_GOLD token snapshot', () => {
    it('locks the surface treatment for the Watch CTA armed pill', () => {
      // 12% fill + saturated ink + 45% border. Any drift here will show up
      // as either a too-loud pill (over-saturated) or an invisible one
      // (under-saturated) against the parchment card.
      expect(BURNISHED_GOLD.surface).toEqual({
        backgroundColor: 'hsl(var(--gold) / 0.12)',
        color: 'hsl(var(--gold))',
        border: '1px solid hsl(var(--gold) / 0.45)',
      });
    });

    it('locks the ink color shared by the heart icon and footer countdown', () => {
      // Saturated, no opacity — the heart and the "Armed · …" countdown
      // must read at the same weight as the pill border.
      expect(BURNISHED_GOLD.ink).toBe('hsl(var(--gold))');
    });

    it('locks the watching-only card border (un-armed)', () => {
      // 1.5px @ 45% — same opacity as the pill border so the card outline
      // and the pill stroke look like one continuous gesture.
      expect(BURNISHED_GOLD.borderWatching).toBe('1.5px solid hsl(var(--gold) / 0.45)');
    });

    it('locks the armed card border (watching + locked)', () => {
      // Same hue as borderWatching, one weight up (45% → 65%) so the
      // armed state reads as a heightened version of the watching state,
      // not a different color.
      expect(BURNISHED_GOLD.borderArmed).toBe('1.5px solid hsl(var(--gold) / 0.65)');
    });

    it('locks the armed-only glow', () => {
      // Soft, low-opacity gold halo — never used in the un-armed state so
      // the eye can find the primed row in a long list.
      expect(BURNISHED_GOLD.glowArmed).toBe('0 6px 18px hsl(var(--gold) / 0.18)');
    });
  });

  describe('cross-surface invariants', () => {
    it('heart ink and pill ink stay locked to the same gold', () => {
      // If these ever diverge the heart will look "off" next to the pill —
      // the most common drift bug we want to catch.
      expect(BURNISHED_GOLD.ink).toBe(BURNISHED_GOLD.surface.color);
    });

    it('pill border opacity matches watching card-border opacity', () => {
      // Both should be 45% so the pill stroke and the card outline read
      // as one continuous gold line around the row.
      expect(BURNISHED_GOLD.surface.border).toContain('/ 0.45)');
      expect(BURNISHED_GOLD.borderWatching).toContain('/ 0.45)');
    });

    it('armed border is a stronger weight of the same hue, not a new color', () => {
      // Both must reference --gold; only the alpha changes between
      // watching (0.45) and armed (0.65). Catches accidental hue swaps
      // (e.g. someone reaching for --highlighter).
      expect(BURNISHED_GOLD.borderWatching).toContain('var(--gold)');
      expect(BURNISHED_GOLD.borderArmed).toContain('var(--gold)');
      expect(BURNISHED_GOLD.borderArmed).toContain('/ 0.65)');
    });

    it('every gold surface resolves through the --gold CSS variable', () => {
      // No raw HSL triplets, no --highlighter, no --sienna leaking in.
      // Keeps the theme switchable from a single token.
      const allValues = [
        BURNISHED_GOLD.ink,
        BURNISHED_GOLD.surface.backgroundColor,
        BURNISHED_GOLD.surface.color,
        BURNISHED_GOLD.surface.border,
        BURNISHED_GOLD.borderWatching,
        BURNISHED_GOLD.borderArmed,
        BURNISHED_GOLD.glowArmed,
      ];
      for (const v of allValues) {
        expect(v).toMatch(/var\(--gold\)/);
      }
    });
  });
});
