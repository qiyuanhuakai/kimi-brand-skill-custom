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

// --- 6. no brand asset shipped ---
console.log('\n6. brand assets stay link-only');
const assetsDir = path.join(ROOT, 'assets');
const shipped = fs.readdirSync(assetsDir);
const brandFiles = shipped.filter((f) => /\.(svg|png|jpe?g|webp|zip)$/i.test(f));
ok('no logo or other brand-asset binary in assets/', brandFiles.length === 0,
  brandFiles.join(', ') || 'none');
ok('logo asset delivery is documented as link-only',
  /link-only/i.test(tokens.logo.assetDelivery));
ok('official logo zip URL is recorded', typeof tokens.logo.officialAssetZip === 'string'
  && tokens.logo.officialAssetZip.startsWith('https://'));

// --- 7. naming consistency ---
console.log('\n7. naming consistency');
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
