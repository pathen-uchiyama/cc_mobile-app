import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';

/**
 * Token-Purity Sweep — BURNISHED_GOLD has the monopoly on gold styling
 * ====================================================================
 * This is a static-source guard. It scans `BookLightningLane.tsx` for any
 * raw `hsl(var(--gold) ...)` literal and flags it unless it appears in a
 * pre-approved exception:
 *
 *   1. Inside the `BURNISHED_GOLD` token definition itself (lines that
 *      DEFINE the token can't reference the token recursively).
 *   2. Inside the sell-out urgency taxonomy (`SelloutLegend`,
 *      `URGENCY_CHIPS`, and `SelloutChip`) — gold is a *data value* in a
 *      3-color scale (magenta → gold → slate), NOT an editorial accent.
 *      Documented in inline comments above each call site.
 *
 * Anything else is drift, and the test fails.
 */
describe('BookLightningLane.tsx — gold token purity', () => {
  const sourcePath = resolve(__dirname, 'BookLightningLane.tsx');
  const source = readFileSync(sourcePath, 'utf8');
  const lines = source.split('\n');

  /**
   * A line is "in the BURNISHED_GOLD definition" if it falls between the
   * `export const BURNISHED_GOLD = {` opener and its matching `} as const;`.
   * We compute this once so the test stays correct as the token grows.
   */
  const tokenDefRange = (() => {
    const start = lines.findIndex((l) => /export const BURNISHED_GOLD\s*=\s*\{/.test(l));
    if (start === -1) throw new Error('Could not find BURNISHED_GOLD definition');
    let depth = 0;
    let end = -1;
    for (let i = start; i < lines.length; i++) {
      depth += (lines[i].match(/\{/g) ?? []).length;
      depth -= (lines[i].match(/\}/g) ?? []).length;
      if (depth === 0 && i > start) {
        end = i;
        break;
      }
    }
    if (end === -1) throw new Error('Could not find end of BURNISHED_GOLD definition');
    return { start, end };
  })();

  /**
   * Lines belonging to the sell-out urgency taxonomy. Identified by their
   * containing constructs — `SelloutLegend` items array, `URGENCY_CHIPS`
   * array, and `SelloutChip`'s `color = ...` ternary. We anchor on stable
   * surrounding text rather than line numbers so the exception list
   * survives unrelated edits to the file.
   */
  const isInUrgencyTaxonomy = (lineIdx: number): boolean => {
    // Walk up at most 30 lines to find the nearest enclosing construct.
    for (let i = lineIdx; i >= Math.max(0, lineIdx - 30); i--) {
      const l = lines[i];
      if (/const SelloutLegend\s*=/.test(l)) return true;
      if (/const URGENCY_CHIPS\s*:/.test(l)) return true;
      if (/const SelloutChip\s*=/.test(l)) return true;
      // Hard floor: a top-level `};` or function closing brace.
      if (/^\}\s*;?\s*$/.test(l) && i !== lineIdx) return false;
    }
    return false;
  };

  it('locks the only allowed gold-literal exceptions', () => {
    const offenders: Array<{ line: number; text: string }> = [];
    lines.forEach((text, idx) => {
      if (!/hsl\(var\(--gold\)/.test(text)) return;
      const lineNumber = idx + 1; // human-readable
      // Exception 1 — inside the token definition.
      if (idx >= tokenDefRange.start && idx <= tokenDefRange.end) return;
      // Exception 2 — inside the sell-out urgency taxonomy.
      if (isInUrgencyTaxonomy(idx)) return;
      offenders.push({ line: lineNumber, text: text.trim() });
    });

    if (offenders.length > 0) {
      const detail = offenders
        .map((o) => `  L${o.line}: ${o.text}`)
        .join('\n');
      throw new Error(
        `Found ${offenders.length} raw gold literal(s) outside the approved ` +
          `exception list. Refactor each to consume BURNISHED_GOLD instead, ` +
          `or extend the urgency-taxonomy exception with documentation.\n${detail}`,
      );
    }
    expect(offenders).toEqual([]);
  });

  it('every JSX `style={...}` attribute that mentions gold goes through BURNISHED_GOLD', () => {
    // Target the most common drift vector specifically: an inline `style`
    // prop referencing a raw gold string. The taxonomy uses bare `color`
    // values inside data arrays (no `style=` prefix), so it's exempt by
    // construction.
    const styleAttrGold = /style=\{[^}]*hsl\(var\(--gold\)/g;
    const matches = source.match(styleAttrGold) ?? [];
    expect(matches).toEqual([]);
  });

  it('exposes the new BURNISHED_GOLD members consumers depend on', () => {
    // Lightweight signature pin. If any of these member names get renamed,
    // every consumer breaks at compile-time AND this test fails first with
    // a clearer message naming the missing keys.
    const required = ['ink', 'surface', 'pill', 'borderWatching', 'borderArmed',
                      'glowWatching', 'glowArmed', 'borderMustDo', 'glowMustDo'];
    const missing = required.filter((k) => !new RegExp(`\\b${k}\\s*:`).test(source));
    expect(missing).toEqual([]);
  });
});
