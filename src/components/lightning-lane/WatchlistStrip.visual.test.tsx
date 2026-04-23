import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';

/**
 * Cross-component invariant — the WatchlistStrip outer surface is one of
 * the canonical "watching collection" surfaces and MUST consume the
 * BURNISHED_GOLD pair, not a free-floating gold string.
 *
 * Why a source-text test instead of render + style inspection: jsdom drops
 * `border` shorthand values that use `var()` expressions (they're
 * unparseable to its CSS engine), so the serialized style attribute loses
 * the border entirely and a render-based assertion can't see it. Anchoring
 * on the source guarantees the consumer keeps reaching for the token by
 * name — which is the actual contract we care about.
 *
 * If you need to change the watching outline, change `BURNISHED_GOLD` —
 * then every consumer updates in lockstep.
 */
describe('WatchlistStrip — burnished-gold outline parity with /book-ll', () => {
  const source = readFileSync(
    resolve(__dirname, 'WatchlistStrip.tsx'),
    'utf8',
  );

  it('imports BURNISHED_GOLD from the canonical /book-ll source', () => {
    // Locks the import path. If anyone re-defines a local copy of the
    // token in this file, the import line disappears and this fails.
    expect(source).toMatch(
      /import\s*\{[^}]*\bBURNISHED_GOLD\b[^}]*\}\s*from\s*['"]@\/pages\/BookLightningLane['"]/,
    );
  });

  it('uses BURNISHED_GOLD.borderWatching for its outer outline', () => {
    // Ensures the watching strip and a watching RideRow share one
    // border recipe. Prevents anyone from inlining `1px solid hsl(var(--gold) / 0.25)`
    // (the previous drifted value) ever again.
    expect(source).toMatch(/border:\s*BURNISHED_GOLD\.borderWatching/);
  });

  it('uses BURNISHED_GOLD.glowWatching for its outer halo', () => {
    // Glow must come from the watching pair, NOT the armed pair — the
    // strip wraps individual armed rows and must never visually outrank them.
    expect(source).toMatch(/boxShadow:\s*BURNISHED_GOLD\.glowWatching/);
  });

  it('never reaches for the armed glow or armed border (would outshout rows inside)', () => {
    // Negative assertion — the strip is a collection of watching rows.
    // Adopting glowArmed/borderArmed would make the wrapper louder than
    // the primed row it contains, collapsing the hierarchy.
    expect(source).not.toMatch(/BURNISHED_GOLD\.glowArmed/);
    expect(source).not.toMatch(/BURNISHED_GOLD\.borderArmed/);
  });

  it('contains no free-floating gold border or shadow strings', () => {
    // Sweep for any inline `hsl(var(--gold) ...)` literal in border or
    // box-shadow context — every gold visual must flow through the token.
    const goldBorder = /border[^;,}]*hsl\(var\(--gold\)/.test(source);
    const goldShadow = /boxShadow[^;,}]*hsl\(var\(--gold\)/.test(source);
    expect(goldBorder).toBe(false);
    expect(goldShadow).toBe(false);
  });
});
