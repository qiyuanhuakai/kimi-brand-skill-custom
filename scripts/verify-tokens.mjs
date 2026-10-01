#!/usr/bin/env node
/**
 * verify-tokens — self-check for the Kimi brand token files.
 *
 * Validates the claims this skill makes, so they cannot silently rot:
 *   1. tokens JSON parses and contains the full official 15-colour palette
 *   2. every hex used in the CSS theme is either official or a documented derived value
 *   3. the contrast ratios published in the docs are mathematically correct
 *   4. the CSS parses: balanced comments, no rules leaked into the theme file
 *   5. init-brand.mjs parses arguments correctly (option values are not paths)
 *   6. no brand asset file is shipped in this repo (logo stays link-only)
 *   7. naming stays consistent across SKILL.md, the remote and the README
 *
 * Usage: node scripts/verify-tokens.mjs
 * Exit code 0 = all checks passed.
 *
 * Palette source: https://www.kimi.com/resources/kimi-brand
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
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
let total = 0;
const ok = (label, cond, extra = '') => {
  total++;
  console.log(`${cond ? '  [PASS]' : '  [FAIL]'} ${label}${extra ? ' — ' + extra : ''}`);
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
ok('brand blue is still used for fills/emphasis (not removed from the theme)',
  /--kimi-accent:\s*var\(--kimi-blue\)/.test(css));
ok('braces are balanced', (css.match(/{/g) || []).length === (css.match(/}/g) || []).length);

// --- 4. real CSS parsing ---
// The theme file must contain only custom properties and at-rules. A nested
// comment bug previously terminated an outer block comment early and silently
// activated component rules, so this parses rather than pattern-matches.
console.log('\n3. CSS parsing');
function stripComments(src) {
  let out = '';
  let inComment = false;
  let commentCount = 0;
  for (let i = 0; i < src.length; i++) {
    if (!inComment && src[i] === '/' && src[i + 1] === '*') { inComment = true; commentCount++; i++; continue; }
    if (inComment && src[i] === '*' && src[i + 1] === '/') { inComment = false; i++; continue; }
    if (!inComment) out += src[i];
  }
  return { code: out, unterminated: inComment, comments: commentCount };
}
const themeParsed = stripComments(css);
ok('theme: every block comment is terminated', !themeParsed.unterminated);
ok('theme: no stray comment terminator left in code', !themeParsed.code.includes('*/'));

// Real recursive CSS parser: walks nested blocks with brace matching, so rules
// inside @media / @supports are reported too. The previous regex scan only
// matched selectors at the top level and silently passed a component rule
// placed inside a media query.
function parseRules(src) {
  const out = [];
  let i = 0, prelude = '';
  while (i < src.length) {
    const c = src[i];
    if (c === '{') {
      const p = prelude.trim();
      prelude = '';
      const atRule = p.startsWith('@');
      if (!atRule) out.push({ selector: p, depth: 0 });
      i++;
      let depth = 1, inner = '';
      while (i < src.length && depth > 0) {
        if (src[i] === '{') depth++;
        else if (src[i] === '}') { depth--; if (depth === 0) { i++; break; } }
        inner += src[i];
        i++;
      }
      for (const r of parseRules(inner)) out.push({ ...r, depth: r.depth + 1 });
    } else if (c === ';') {
      prelude = '';
      i++;
    } else {
      prelude += c;
      i++;
    }
  }
  return out;
}

// Self-test: prove the parser catches a rule hidden inside a media query.
const probe = stripComments(css.replace(
  /@media \(prefers-color-scheme: dark\)\s*\{\s*\n(\s*):root/,
  (m, ind) => `@media (prefers-color-scheme: dark) {\n${ind}.probe-leak { color: red; }\n${ind}:root`
)).code;
const probeLeaks = parseRules(probe).filter((r) => !r.selector.includes(':root'));
ok('parser self-test: detects a rule nested inside @media', probeLeaks.length > 0,
  probeLeaks.length ? probeLeaks.map((r) => r.selector).join(', ') : 'not detected — parser is broken');
const probeTop = parseRules(probe).filter((r) => r.depth === 0);
ok('parser self-test: top-level view alone would have missed it', probeTop.every((r) => r.selector.includes(':root')));
// After stripping comments, only `:root` blocks and @media should remain.
const themeSelectors = parseRules(themeParsed.code).filter((s) => !s.atRule);
const nonRoot = themeSelectors.filter((s) => !s.selector.includes(':root'));
ok('theme: contains no component rules outside :root', nonRoot.length === 0,
  nonRoot.slice(0, 5).map((r) => r.selector).join(' | ') || `${themeSelectors.length} selector block(s), all :root`);

const components = read('assets/kimi-components.css');
const compParsed = stripComments(components);
ok('components: every block comment is terminated', !compParsed.unterminated);
const compRules = (compParsed.code.match(/{/g) || []).length;
ok('components: actually defines rules (not fully commented out)', compRules > 0, `${compRules} rule block(s)`);
ok('components: button defaults to ink on brand blue',
  /\.kimi-btn\s*\{[^}]*color:\s*var\(--kimi-on-accent\)/s.test(compParsed.code));
ok('components: white-on-blue variant pins a large-text size and weight',
  /\.kimi-btn--white\s*\{[^}]*font-size:\s*19px[^}]*font-weight:\s*var\(--kimi-weight-bold\)/s.test(compParsed.code));

// Dark chart palette must override labels and focus, not just the surface.
ok('theme: dark block overrides chart label to silver',
  /--kimi-chart-label:\s*var\(--kimi-silver\)/.test(css));
ok('theme: light focus colour is deep blue, not cyan (cyan is 1.34:1 on white)',
  /--kimi-chart-series-focus:\s*var\(--kimi-deep-blue\)/.test(css));
ok('theme: dark block sets cyan as the focus colour',
  /prefers-color-scheme:\s*dark[\s\S]*--kimi-chart-series-focus:\s*var\(--kimi-electric-cyan\)/.test(css));

// --- 3. contrast maths ---
console.log('\n4. contrast ratios (WCAG 2.1 relative luminance)');
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
  'silver-on-ink': ['#C3C3C3', '#121212', 10.63],
  'slate-on-ink': ['#707070', '#121212', 3.78],
  'slate-on-raisedDark': ['#707070', '#2F2F2E', 2.71],
  'electricCyan-on-white': ['#00F6FF', '#FFFFFF', 1.34],
  'electricCyan-on-ink': ['#00F6FF', '#121212', 13.94],
};
for (const [label, [fg, bg, published]] of Object.entries(EXPECTED)) {
  const actual = ratio(fg, bg);
  ok(`${label} = ${actual.toFixed(2)}:1 (docs say ${published})`,
    Math.abs(actual - published) < 0.02, Math.abs(actual - published) >= 0.02 ? `MISMATCH ${actual.toFixed(2)}` : '');
}

// WCAG 2.1 thresholds. Large text is 18pt (24px) or 14pt bold (18.66px).
const AA_NORMAL = 4.5, AA_LARGE = 3.0;
const LARGE_PX = 24, LARGE_PX_BOLD = 18.66;
ok('token file states the correct large-text definition',
  tokens.contrast.thresholds.largeTextDefinition.includes('24px')
  && tokens.contrast.thresholds.largeTextDefinition.includes('18.66px'));

// These pin the *measured facts* behind the pairing rules, so a future colour
// edit cannot quietly invalidate the guidance.
ok('white on brand blue does NOT meet AA for normal text (3.94 < 4.5)',
  ratio('#FFFFFF', '#007CFF') < AA_NORMAL);
ok('...but it does meet the 3:1 large-text threshold',
  ratio('#FFFFFF', '#007CFF') >= AA_LARGE);
ok('ink on brand blue is the AA-safe default on a blue fill (4.75 >= 4.5)',
  ratio('#121212', '#007CFF') >= AA_NORMAL);
ok('silver is unusable as light-surface text (< 4.5) yet strong on ink (>= 4.5)',
  ratio('#C3C3C3', '#FFFFFF') < AA_NORMAL && ratio('#C3C3C3', '#121212') >= AA_NORMAL);
ok('slate is too weak for dark-surface labels, silver is not',
  ratio('#707070', '#121212') < AA_NORMAL && ratio('#C3C3C3', '#121212') >= AA_NORMAL);
ok('electric cyan is a dark-surface accent only (1.34 on white, 13.94 on ink)',
  ratio('#00F6FF', '#FFFFFF') < AA_NORMAL && ratio('#00F6FF', '#121212') >= AA_NORMAL);
ok('all four accents on ink pass AAA (dark-surface safety)',
  ['#DFC8F5', '#FFD1D4', '#B3F4A8', '#F4F9A7'].every((c) => ratio(c, '#121212') >= 7));

// Every semantic text/background pair the theme actually ships.
const SEMANTIC_PAIRS = [
  ['ink on white (text-primary / surface)', '#121212', '#FFFFFF', true],
  ['slate on white (text-secondary / surface)', '#707070', '#FFFFFF', true],
  ['slate on mist (text-secondary / surface-sub)', '#707070', '#E1E3E6', false],
  ['ink on mist (text-secondary-strong / surface-sub)', '#121212', '#E1E3E6', true],
  ['deepBlue on white (text-link / surface)', '#002F5B', '#FFFFFF', true],
  ['deepBlue on mist (text-link / surface-sub)', '#002F5B', '#E1E3E6', true],
  ['brandBlue on white (accent fill, large text only)', '#007CFF', '#FFFFFF', false],
  ['ink on brandBlue (on-accent text)', '#121212', '#007CFF', true],
  ['silver on ink (dark secondary text)', '#C3C3C3', '#121212', true],
  ['sky on ink (dark link)', '#A0DAF7', '#121212', true],
];
for (const [label, fg, bg, shouldPassAA] of SEMANTIC_PAIRS) {
  const r = ratio(fg, bg);
  const passes = r >= AA_NORMAL;
  ok(`${label} = ${r.toFixed(2)}:1 ${passes ? 'AA' : 'below AA'}`,
    passes === shouldPassAA, passes === shouldPassAA ? '' : `EXPECTED ${shouldPassAA ? 'AA' : 'below AA'}`);
}

// The theme must not route normal-size text through a below-AA pairing.
ok('light chart label is ink, so it survives both white and mist canvases',
  /--kimi-chart-label:\s*var\(--kimi-ink\)/.test(css));
ok('light link colour is deep blue, not brand blue (3.94 is below AA)',
  /--kimi-text-link:\s*var\(--kimi-deep-blue\)/.test(css));
ok('a tinted-surface secondary text token exists',
  /--kimi-text-secondary-strong:\s*var\(--kimi-ink\)/.test(css));

// Explicit dark theme must live outside the media query, and the two dark
// blocks must stay in sync.
function blockBody(src, headerPattern) {
  const m = src.match(headerPattern);
  if (!m) return null;
  const start = src.indexOf('{', m.index);
  if (start === -1) return null;
  let depth = 1, i = start + 1;
  while (i < src.length && depth > 0) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') depth--;
    i++;
  }
  return src.slice(start + 1, i - 1);
}
const explicitDarkBody = blockBody(css, /:root\[data-theme="dark"\]\s*\{/);
ok('explicit :root[data-theme="dark"] block exists', !!explicitDarkBody);
if (explicitDarkBody) {
  // The explicit block must not sit inside the media query.
  const mediaStart = css.indexOf('@media (prefers-color-scheme: dark)');
  const explicitStart = css.indexOf(':root[data-theme="dark"]');
  ok('explicit dark block is declared before/outside the media query',
    mediaStart === -1 || explicitStart < mediaStart,
    `explicit@${explicitStart} media@${mediaStart}`);
  const mediaBody = blockBody(css, /:root:not\(\[data-theme="light"\]\)\s*\{/);
  const norm = (s) => (s || '').split('\n').map((l) => l.trim())
    .filter((l) => l.startsWith('--')).sort().join('\n');
  ok('explicit and media dark blocks declare the same variables',
    !!mediaBody && norm(explicitDarkBody) === norm(mediaBody),
    mediaBody ? '' : 'media dark block not found');
}

// --- 5. init-brand argument behaviour ---
// The previous parser let `--format css` treat "css" as the target directory.
// These cases run the real script in throwaway directories.
console.log('\n5. init-brand argument handling');
const INIT = path.join(ROOT, 'scripts', 'init-brand.mjs');
const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'kimi-argcheck-'));
const runInit = (args, cwd) => {
  const r = spawnSync(process.execPath, [INIT, ...args], { cwd, encoding: 'utf8' });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
};
const listTree = (dir) => {
  const out = [];
  const walk = (d, prefix) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.name === '.git') continue;
      if (e.isDirectory()) { out.push(prefix + e.name + '/'); walk(path.join(d, e.name), prefix + e.name + '/'); }
      else out.push(prefix + e.name);
    }
  };
  walk(dir, '');
  return out;
};
try {
  // (a) option value must not become the target directory
  const a = path.join(tmpRoot, 'a'); fs.mkdirSync(a);
  runInit(['--format', 'css'], a);
  const aTree = listTree(a);
  ok('--format css writes to the target dir, not ./css/',
    aTree.includes('kimi-brand-theme.css') && !aTree.includes('css/'),
    aTree.join(', ') || 'nothing written');

  // (b) positional target after an option must be honoured
  const b = path.join(tmpRoot, 'b', 'actual-target');
  fs.mkdirSync(b, { recursive: true });
  runInit(['--format', 'json', 'actual-target'], path.join(tmpRoot, 'b'));
  const bTree = listTree(path.join(tmpRoot, 'b'));
  ok('--format json <dir> writes into <dir>, not ./json/',
    bTree.includes('actual-target/kimi-brand-tokens.json') && !bTree.includes('json/'),
    bTree.join(', ') || 'nothing written');

  // (c) a value option with no value is an error, not a silent default
  const c = path.join(tmpRoot, 'c'); fs.mkdirSync(c);
  const rc = runInit(['--format'], c);
  ok('--format with no value exits non-zero', rc.code !== 0, `exit ${rc.code}`);
  ok('--format with no value writes nothing', listTree(c).length === 0, listTree(c).join(', ') || 'clean');

  // (d) unknown option is rejected
  const d = path.join(tmpRoot, 'd'); fs.mkdirSync(d);
  const rd = runInit(['--formt', 'css'], d);
  ok('unknown option exits non-zero', rd.code !== 0, `exit ${rd.code}`);

  // (e) invalid format value is rejected
  const e = path.join(tmpRoot, 'e'); fs.mkdirSync(e);
  const re = runInit(['--format', 'scss'], e);
  ok('invalid --format value exits non-zero', re.code !== 0, `exit ${re.code}`);

  // (f) two positionals is rejected
  const f = path.join(tmpRoot, 'f'); fs.mkdirSync(f);
  const rf = runInit(['a', 'b'], f);
  ok('two target directories exits non-zero', rf.code !== 0, `exit ${rf.code}`);

  // (g) --target is equivalent to the positional
  const g = path.join(tmpRoot, 'g'); fs.mkdirSync(g);
  runInit(['--format', 'json', '--target', 'here'], g);
  const gTree = listTree(g);
  ok('--target writes into the named directory',
    gTree.includes('here/kimi-brand-tokens.json'), gTree.join(', ') || 'nothing written');

  // (h) --target plus a positional is rejected rather than silently picking one
  const h = path.join(tmpRoot, 'h'); fs.mkdirSync(h);
  const rh = runInit(['--target', 'x', 'y'], h);
  ok('--target plus positional exits non-zero', rh.code !== 0, `exit ${rh.code}`);

  // (i) help exits cleanly
  const i = path.join(tmpRoot, 'i'); fs.mkdirSync(i);
  const ri = runInit(['--help'], i);
  ok('--help exits 0 and writes nothing', ri.code === 0 && listTree(i).length === 0);
} finally {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
}

// --- 6. generated Tailwind config must not shadow Tailwind defaults ---
// Emitting bare keys like spacing "4" or fontFamily.sans rewrites existing
// utilities: p-4 silently went from 1rem to 4px. Everything must be namespaced.
console.log('\n6. generated Tailwind config');
const twRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'kimi-tw-'));
try {
  spawnSync(process.execPath, [INIT, twRoot, '--format', 'tailwind'], { encoding: 'utf8' });
  const twPath = path.join(twRoot, 'tailwind.kimi-brand.js');
  const twSrc = fs.existsSync(twPath) ? fs.readFileSync(twPath, 'utf8') : '';
  const twCfg = twSrc ? (spawnSync(process.execPath, ['-e', `console.log(JSON.stringify(require(${JSON.stringify(twPath)})))`], { encoding: 'utf8' }).stdout || '').trim() : '';
  const cfg = twCfg ? JSON.parse(twCfg) : null;
  ok('tailwind config is generated and loads', !!cfg && !!cfg.theme?.extend);
  if (cfg) {
    const ext = cfg.theme.extend;
    // Default keys Tailwind already defines under these scales.
    const TAILWIND_DEFAULT_SPACING = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '16', '20', '24', '32', '40', '48', '64', '72', '80', '96'];
    const TAILWIND_DEFAULT_FONT = ['sans', 'serif', 'mono'];
    const TAILWIND_DEFAULT_RADIUS = ['none', 'sm', 'DEFAULT', 'md', 'lg', 'xl', '2xl', '3xl', 'full'];

    const spacingKeys = Object.keys(ext.spacing || {});
    const clashingSpacing = spacingKeys.filter((k) => TAILWIND_DEFAULT_SPACING.includes(k));
    ok('spacing does not redefine bare Tailwind numeric keys', clashingSpacing.length === 0,
      clashingSpacing.join(', ') || `keys: ${spacingKeys.slice(0, 6).join(',')}…`);
    ok('spacing is flat and prefixed (no bare numeric keys)', spacingKeys.length > 0
      && spacingKeys.every((k) => k.startsWith('kimi-')),
      `keys: ${spacingKeys.slice(0, 3).join(',')}…`);

    // These scales are NOT nested-capable: theme.extend.spacing.kimi.4 emits no
    // class at all (verified against tailwindcss 3.4.17), while a flat
    // "kimi-4" emits p-kimi-4. Every value must be a flat, prefixed key.
    for (const [nm, scale] of [['spacing', ext.spacing], ['fontFamily', ext.fontFamily], ['borderRadius', ext.borderRadius]]) {
      const keys = Object.keys(scale || {});
      const nested = keys.filter((k) => scale[k] && typeof scale[k] === 'object' && !Array.isArray(scale[k]));
      ok(`${nm}: all keys are flat values, not nested objects`, keys.length > 0 && nested.length === 0,
        nested.join(', ') || `${keys.length} flat keys`);
      const unprefixed = keys.filter((k) => !k.startsWith('kimi-'));
      ok(`${nm}: every key is prefixed kimi-`, keys.length > 0 && unprefixed.length === 0,
        unprefixed.join(', ') || 'all prefixed');
    }

    const fontKeys = Object.keys(ext.fontFamily || {});
    const clashingFont = fontKeys.filter((k) => TAILWIND_DEFAULT_FONT.includes(k));
    ok('fontFamily does not redefine Tailwind sans/serif/mono', clashingFont.length === 0,
      clashingFont.join(', ') || `keys: ${fontKeys.join(',') || 'none'}`);

    const radiusKeys = Object.keys(ext.borderRadius || {});
    const clashingRadius = radiusKeys.filter((k) => TAILWIND_DEFAULT_RADIUS.includes(k));
    ok('borderRadius does not redefine Tailwind radius keys', clashingRadius.length === 0,
      clashingRadius.join(', ') || `keys: ${radiusKeys.join(',') || 'none'}`);

    ok('kimi spacing scale carries the brand steps',
      Object.keys(ext.spacing || {}).length >= 8, `${Object.keys(ext.spacing || {}).length} steps`);
    ok('the emitted config explains the flat-prefix rule', /namespac|prefix|flat/i.test(twSrc));

    // Real compile when tailwindcss is resolvable here. The structural checks
    // above run either way; this proves the classes actually generate and that
    // Tailwind's own defaults survive injection.
    let twResolvable = false;
    try {
      twResolvable = spawnSync(process.execPath, ['-e', 'require.resolve("tailwindcss")'],
        { encoding: 'utf8' }).status === 0;
    } catch { twResolvable = false; }

    if (twResolvable) {
      const marker = '<div class="p-kimi-4 gap-kimi-8 font-kimi-sans rounded-kimi-card p-4 gap-8"></div>';
      const cfgFile = path.join(twRoot, 'tw.compile.js');
      const cssFile = path.join(twRoot, 'tw.out.css');
      fs.writeFileSync(cfgFile, 'module.exports = ' + JSON.stringify({ ...cfg, content: [{ raw: marker, extension: 'html' }] }) + ';');
      const runner = 'const postcss=require("postcss"),tw=require("tailwindcss"),fs=require("fs");'
        + 'postcss([tw(' + JSON.stringify(cfgFile) + ')]).process("@tailwind utilities;",{from:undefined})'
        + '.then(x=>fs.writeFileSync(' + JSON.stringify(cssFile) + ',x.css)).catch(e=>{console.error(e.message);process.exit(1)});';
      const run = spawnSync(process.execPath, ['-e', runner], { encoding: 'utf8' });
      const out = fs.existsSync(cssFile) ? fs.readFileSync(cssFile, 'utf8') : '';
      for (const cls of ['p-kimi-4', 'gap-kimi-8', 'font-kimi-sans', 'rounded-kimi-card']) {
        ok(`tailwind really generates .${cls}`, out.includes('.' + cls),
          run.stderr ? run.stderr.slice(0, 90) : '');
      }
      // Note: Tailwind omits the semicolon on a rule's last declaration, so the
      // trailing ";" here must be optional.
      const grab = (cls, prop) => {
        const m = out.match(new RegExp('\\.' + cls + '\\s*\\{[^}]*' + prop + '\\s*:\\s*([^;}]+)'));
        return m ? m[1].trim() : null;
      };
      ok('Tailwind default p-4 survives the injected config',
        grab('p-4', 'padding') === '1rem', grab('p-4', 'padding') || 'not found');
      ok('Tailwind default gap-8 survives the injected config',
        grab('gap-8', 'gap') === '2rem', grab('gap-8', 'gap') || 'not found');
    } else {
      console.log('  – skipped  real tailwindcss compile (tailwindcss not resolvable here)');
    }
  }
} finally {
  fs.rmSync(twRoot, { recursive: true, force: true });
}

// Non-text contrast (WCAG 1.4.11): a series that is the only cue for its
// value must clear 3:1 against the canvas it sits on. Checked against BOTH
// the primary and the alt canvas of each theme.
const NT = 3.0;
const LIGHT = [tokens.dataViz.surface, tokens.dataViz.surfaceAlt];
const DARK = [tokens.dataViz.darkSurface.surface, tokens.dataViz.darkSurface.surfaceAlt];
for (const hex of tokens.dataViz.lightSeries.order) {
  const ratios = LIGHT.map((c) => ratio(hex, c));
  ok(`light series ${hex} clears 3:1 on white and mist`,
    ratios.every((r) => r >= NT), ratios.map((r) => r.toFixed(2)).join(' / '));
}
for (const hex of tokens.dataViz.darkSeries.order) {
  const ratios = DARK.map((c) => ratio(hex, c));
  ok(`dark series ${hex} clears 3:1 on ink and raised dark`,
    ratios.every((r) => r >= NT), ratios.map((r) => r.toFixed(2)).join(' / '));
}
ok('the documented light series count matches the measured pool',
  tokens.dataViz.lightSeries.max === tokens.dataViz.lightSeries.order.length
  && tokens.dataViz.lightSeries.max <= 4);
// A colour is "rejected" if it fails on AT LEAST ONE canvas of that theme.
ok('every light-rejected colour is below 3:1 on at least one light canvas',
  Object.keys(tokens.dataViz.lightSeriesRejected)
    .filter((h) => /^#[0-9A-F]{6}$/i.test(h))
    .every((h) => LIGHT.some((c) => ratio(h.toUpperCase(), c) < NT)));
ok('every dark-rejected colour is below 3:1 on at least one dark canvas',
  Object.keys(tokens.dataViz.darkSeriesRejected)
    .filter((h) => /^#[0-9A-F]{6}$/i.test(h))
    .every((h) => DARK.some((c) => ratio(h.toUpperCase(), c) < NT)));
ok('no rejected colour is actually usable (guards against a stale list)',
  Object.keys(tokens.dataViz.lightSeriesRejected)
    .filter((h) => /^#[0-9A-F]{6}$/i.test(h) && !LIGHT.some((c) => ratio(h.toUpperCase(), c) < NT)).length === 0);
ok('the tokens state the non-text threshold explicitly',
  tokens.dataViz.nonTextThreshold === NT);

// The dark cap is a design recommendation, not a contrast limit — the claim
// must not be over-stated, and the published set must still be separable.
ok('the tokens admit the dark cap is a design choice, not a contrast limit',
  /not contrast|restraint/i.test(tokens.dataViz.darkSeries.basis),
  tokens.dataViz.darkSeries.basis);
ok('the tokens report how many colours contrast actually allows on dark',
  tokens.dataViz.darkSeries.contrastAllows > tokens.dataViz.darkSeries.max,
  `allows ${tokens.dataViz.darkSeries.contrastAllows}, recommends ${tokens.dataViz.darkSeries.max}`);
{
  const lums = tokens.dataViz.darkSeries.order.map((h) => ratio(h, '#121212'));
  const gaps = lums.slice(1).map((v, i) => Math.abs(v - lums[i]));
  const min = Math.min(...gaps);
  ok(`published dark series stay separable on ink (min gap ${min.toFixed(2)}:1)`,
    min >= (tokens.dataViz.darkSeries.minSeparation ?? 1.0),
    gaps.map((g) => g.toFixed(2)).join(', '));
}
{
  const lums = tokens.dataViz.lightSeries.order.map((h) => ratio(h, '#FFFFFF'));
  const gaps = lums.slice(1).map((v, i) => Math.abs(v - lums[i]));
  const min = Math.min(...gaps);
  ok(`published light series stay separable on white (min gap ${min.toFixed(2)}:1)`, min >= 1.0,
    gaps.map((g) => g.toFixed(2)).join(', '));
}

// CSS and JSON must publish the same series, or a project using the stylesheet
// silently keeps the old below-threshold colours.
const CSS_TO_HEX = {
  'deep-blue': '#002F5B', blue: '#007CFF', azure: '#00A1FF', sky: '#A0DAF7',
  'electric-cyan': '#00F6FF', lavender: '#DFC8F5', blush: '#FFD1D4', mint: '#B3F4A8',
  citron: '#F4F9A7', graphite: '#8D9390', ink: '#121212', slate: '#707070',
  silver: '#C3C3C3', mist: '#E1E3E6', white: '#FFFFFF',
};
const lightBlock = css.slice(css.indexOf(':root {'), css.indexOf(':root[data-theme="dark"]'));
const cssSeriesHex = (n) => {
  const m = lightBlock.match(new RegExp('--kimi-chart-series-' + n + ':\\s*var\\(--kimi-([a-z-]+)\\)'));
  return m ? CSS_TO_HEX[m[1]] : null;
};
for (let i = 1; i <= tokens.dataViz.lightSeries.order.length; i++) {
  ok(`CSS light series ${i} matches JSON (${tokens.dataViz.lightSeries.order[i - 1]})`,
    cssSeriesHex(String(i)) === tokens.dataViz.lightSeries.order[i - 1],
    `css=${cssSeriesHex(String(i))}`);
}
{
  const nums = [...new Set((lightBlock.match(/--kimi-chart-series-(\d):/g) || []).map((s) => Number(s.match(/(\d)/)[1])))];
  ok('CSS light series count matches JSON',
    Math.max(...nums) === tokens.dataViz.lightSeries.order.length, `css max=${Math.max(...nums)}`);
}
ok('CSS no longer publishes the below-threshold light series (azure / graphite)',
  !/--kimi-chart-series-deep:\s*var\(--kimi-azure\)/.test(css));
{
  const darkBlock = css.slice(css.indexOf(':root[data-theme="dark"]'), css.indexOf('@media (prefers-color-scheme: dark)'));
  const darkHex = (n) => {
    const m = darkBlock.match(new RegExp('--kimi-chart-series-' + n + ':\\s*var\\(--kimi-([a-z-]+)\\)'));
    return m ? CSS_TO_HEX[m[1]] : null;
  };
  for (let i = 1; i <= tokens.dataViz.darkSeries.order.length; i++) {
    ok(`CSS dark series ${i} matches JSON (${tokens.dataViz.darkSeries.order[i - 1]})`,
      darkHex(String(i)) === tokens.dataViz.darkSeries.order[i - 1], `css=${darkHex(String(i))}`);
  }
}

// --- 7. no brand asset shipped ---
console.log('\n7. brand assets stay link-only');
const assetsDir = path.join(ROOT, 'assets');
const shipped = fs.readdirSync(assetsDir);
const brandFiles = shipped.filter((f) => /\.(svg|png|jpe?g|webp|zip)$/i.test(f));
ok('no logo or other brand-asset binary in assets/', brandFiles.length === 0,
  brandFiles.join(', ') || 'none');
ok('logo asset delivery is documented as link-only',
  /link-only/i.test(tokens.logo.assetDelivery));
ok('official logo zip URL is recorded', typeof tokens.logo.officialAssetZip === 'string'
  && tokens.logo.officialAssetZip.startsWith('https://'));

// --- 8. naming consistency ---
console.log('\n8. naming consistency');
const skill = read('SKILL.md');
const nameMatch = skill.match(/^---\r?\n([\s\S]*?)\r?\n---/);
ok('SKILL.md has YAML frontmatter', !!nameMatch);
const skillName = nameMatch && (nameMatch[1].match(/^name:\s*(.+)$/m) || [])[1]?.trim();
ok('frontmatter declares a kebab-case name', !!skillName && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(skillName),
  skillName || 'missing');
ok('frontmatter declares a description', !!nameMatch && /^description:\s*\S/m.test(nameMatch[1]));

// The repo name, the skill name, and the install directory must all agree,
// so cloning the repo yields a correctly named skill directory.
let repoName = null;
try {
  const cfg = fs.readFileSync(path.join(ROOT, '.git', 'config'), 'utf8');
  const url = (cfg.match(/^\s*url\s*=\s*(\S+)\s*$/m) || [])[1];
  if (url) {
    const clean = url.replace(/\.git$/, '');
    repoName = clean.split('/').filter(Boolean).pop() || null;
  }
} catch { /* not a git checkout — skip */ }
if (repoName) {
  ok('skill name matches the repository name', skillName === repoName, `${skillName} vs ${repoName}`);
} else {
  console.log('  – skipped  repo-name check (no git remote detected)');
}

ok('README documents the same install path',
  skillName ? read('README.md').includes(`skills/${skillName}`) : false,
  skillName ? `skills/${skillName}` : '');

// --- summary ---
console.log(failures === 0
  ? `\nALL CHECKS PASSED (${total} checks)\n`
  : `\n${failures} of ${total} CHECKS FAILED\n`);
process.exit(failures === 0 ? 0 : 1);
