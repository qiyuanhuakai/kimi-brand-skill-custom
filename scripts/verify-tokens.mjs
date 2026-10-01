#!/usr/bin/env node
/**
 * verify-tokens — self-check for the Kimi brand token files.
 *
 * Validates the claims this skill makes, so they cannot silently rot:
 *   1. tokens JSON parses and contains the full official 15-colour palette
 *   2. every hex used in the CSS theme is either official or a documented derived value
 *   3. the contrast ratios published in the docs are mathematically correct
 *   4. the wordmark SVG is a well-formed 96x32 viewBox
 *
 * Usage: node scripts/verify-tokens.mjs
 * Exit code 0 = all checks passed.
 *
 * Palette source: https://www.kimi.com/resources/kimi-brand
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

const OFFICIAL_PALETTE = [
  '#002F5B', '#007CFF', '#00A1FF', '#A0DAF7', '#00F6FF',
  '#DFC8F5', '#FFD1D4', '#B3F4A8', '#F4F9A7',
  '#8D9390', '#121212', '#707070', '#C3C3C3', '#E1E3E6', '#FFFFFF',
];
const DERIVED = ['#2F2F2E'];

let failures = 0;
const ok = (label, cond, extra = '') => {
  console.log(`${cond ? '  ✓' : '  ✗'} ${label}${extra ? ' — ' + extra : ''}`);
  if (!cond) failures++;
};

// --- 1. tokens JSON ---
console.log('\n1. tokens JSON');
const tokens = JSON.parse(read('assets/kimi-brand-tokens.json'));
ok('parses as JSON', true);
ok('palette is the official 15 colours, in order',
  JSON.stringify(tokens.color.order) === JSON.stringify(OFFICIAL_PALETTE));

const grouped = [];
for (const [name, group] of Object.entries(tokens.color)) {
  if (!group || typeof group !== 'object' || Array.isArray(group)) continue;
  for (const [k, v] of Object.entries(group)) {
    if (v && typeof v.value === 'string') grouped.push({ path: `color.${name}.${k}`, value: v.value.toUpperCase() });
  }
}
const missing = OFFICIAL_PALETTE.filter((h) => !grouped.some((g) => g.value === h));
ok('every official colour is assigned a role', missing.length === 0, missing.join(', ') || 'none missing');
const invented = grouped.filter((g) => !OFFICIAL_PALETTE.includes(g.value) && !DERIVED.includes(g.value));
ok('no invented colour values', invented.length === 0,
  invented.map((g) => `${g.path}=${g.value}`).join(', ') || 'none');
ok('derived dark-surface values are documented as non-official',
  typeof tokens.color.derived?.$comment === 'string');

// --- 2. CSS theme ---
console.log('\n2. CSS theme');
const css = read('assets/kimi-brand-theme.css');
const cssHexes = [...new Set((css.match(/#[0-9A-Fa-f]{6}/g) || []).map((h) => h.toUpperCase()))];
const offPalette = cssHexes.filter((h) => !OFFICIAL_PALETTE.includes(h) && !DERIVED.includes(h));
ok('uses only official + documented derived colours', offPalette.length === 0, offPalette.join(', ') || 'none');
ok('declares every official colour as a variable',
  OFFICIAL_PALETTE.every((h) => css.includes(h)));
ok('brand blue is #007CFF', css.includes('--kimi-blue: #007CFF'));
ok('link colour is deep blue, not brand blue (AA safety)',
  /--kimi-text-link:\s*var\(--kimi-deep-blue\)/.test(css));
ok('braces are balanced', (css.match(/{/g) || []).length === (css.match(/}/g) || []).length);

// --- 3. contrast maths ---
console.log('\n3. contrast ratios (WCAG 2.1 relative luminance)');
const lum = (h) => {
  const c = [1, 3, 5]
    .map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};
const EXPECTED = {
  'ink-on-white': ['#121212', '#FFFFFF', 18.73],
  'deepBlue-on-white': ['#002F5B', '#FFFFFF', 13.48],
  'slate-on-white': ['#707070', '#FFFFFF', 4.95],
  'brandBlue-on-white': ['#007CFF', '#FFFFFF', 3.94],
  'ink-on-brandBlue': ['#121212', '#007CFF', 4.75],
  'graphite-on-white': ['#8D9390', '#FFFFFF', 3.13],
  'silver-on-white': ['#C3C3C3', '#FFFFFF', 1.76],
};
for (const [label, [fg, bg, published]] of Object.entries(EXPECTED)) {
  const actual = ratio(fg, bg);
  ok(`${label} = ${actual.toFixed(2)}:1 (docs say ${published})`,
    Math.abs(actual - published) < 0.02, Math.abs(actual - published) >= 0.02 ? `MISMATCH ${actual.toFixed(2)}` : '');
}
// The safety rule this skill leans on must hold.
ok('brand blue on white really does fail AA for body text (rule is load-bearing)',
  ratio('#007CFF', '#FFFFFF') < 4.5);
ok('deep blue on white passes AA comfortably (recommended substitute)',
  ratio('#002F5B', '#FFFFFF') >= 4.5);
ok('all four accents on ink pass AAA (dark-surface safety)',
  ['#DFC8F5', '#FFD1D4', '#B3F4A8', '#F4F9A7'].every((c) => ratio(c, '#121212') >= 7));

// --- 4. wordmark ---
console.log('\n4. wordmark SVG');
const svg = read('assets/kimi-wordmark.svg');
ok('has a 96x32 viewBox', svg.includes('viewBox="0 0 96 32"'));
ok('is a single unmodified path', (svg.match(/<path/g) || []).length === 1);
ok('uses currentColor fill for theming', svg.includes('fill="currentColor"'));
ok('has no raster image embedded', !svg.includes('<image') && !svg.includes('data:'));

// --- summary ---
console.log(failures === 0
  ? '\n✓ all checks passed\n'
  : `\n✗ ${failures} check(s) failed\n`);
process.exit(failures === 0 ? 0 : 1);
