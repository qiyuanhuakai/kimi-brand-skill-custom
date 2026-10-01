#!/usr/bin/env node
/**
 * init-brand — inject Kimi brand tokens into an existing project.
 *
 * Usage:
 *   node scripts/init-brand.mjs [targetDir] [--format css|tailwind|json|all] [--force]
 *
 * Examples:
 *   node scripts/init-brand.mjs ./my-site --format css
 *   node scripts/init-brand.mjs ./my-app --format tailwind
 *   node scripts/init-brand.mjs . --format all
 *
 * Behaviour:
 *   - Never overwrites an existing file unless --force is passed.
 *   - Always prints a short brand-compliance checklist.
 *   - Reads tokens from assets/kimi-brand-tokens.json (single source of truth).
 *
 * Source: https://www.kimi.com/resources/kimi-brand
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const TOKENS_PATH = path.join(ROOT, 'assets', 'kimi-brand-tokens.json');
const THEME_PATH = path.join(ROOT, 'assets', 'kimi-brand-theme.css');
const COMPONENTS_PATH = path.join(ROOT, 'assets', 'kimi-components.css');

// ---------- args ----------
// Explicit parser: an option's value is consumed as a value, never as a
// positional. Unknown options and missing values are hard errors, so a typo
// can never silently write files to a directory named after the option value.
const VALID_FORMATS = ['css', 'tailwind', 'json', 'all'];
const VALUE_OPTIONS = new Set(['--format', '--target']);
const BOOL_OPTIONS = new Set(['--force', '--help', '-h']);
const KNOWN_OPTIONS = new Set([...VALUE_OPTIONS, ...BOOL_OPTIONS]);

function parseArgs(argv) {
  const out = { target: null, format: null, force: false, help: false };
  const rest = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === '--') { rest.push(...argv.slice(i + 1)); break; }

    // --key=value form
    const eq = arg.match(/^(--[a-z-]+)=(.*)$/);
    if (eq) {
      const [, key, value] = eq;
      if (!KNOWN_OPTIONS.has(key)) die(`Unknown option "${key}". Known options: ${[...KNOWN_OPTIONS].sort().join(', ')}`);
      if (!VALUE_OPTIONS.has(key)) die(`Option "${key}" does not take a value.`);
      if (value === '') die(`Option "${key}" requires a value.`);
      assign(out, key, value);
      continue;
    }

    if (arg.startsWith('-') && arg !== '-') {
      if (!KNOWN_OPTIONS.has(arg)) die(`Unknown option "${arg}". Known options: ${[...KNOWN_OPTIONS].sort().join(', ')}`);
      if (BOOL_OPTIONS.has(arg)) { assign(out, arg, true); continue; }
      // value option in --key value form
      const value = argv[i + 1];
      if (value === undefined || value.startsWith('--')) die(`Option "${arg}" requires a value.`);
      assign(out, arg, value);
      i++;
      continue;
    }

    rest.push(arg);
  }

  if (rest.length > 1) die(`Expected at most one target directory, received ${rest.length}: ${rest.join(', ')}`);
  if (rest.length === 1) {
    if (out.target !== null) die('Target directory given twice: as a positional and with --target.');
    out.target = rest[0];
  }
  if (out.format === null) out.format = 'all';
  if (!VALID_FORMATS.includes(out.format)) {
    die(`Invalid --format "${out.format}". Expected one of: ${VALID_FORMATS.join(', ')}`);
  }
  return out;
}

function assign(out, key, value) {
  switch (key) {
    case '--format': out.format = value; break;
    case '--target': out.target = value; break;
    case '--force': out.force = true; break;
    case '--help':
    case '-h': out.help = true; break;
    default: die(`Unhandled option "${key}".`);
  }
}

function die(message) {
  console.error(`✗ ${message}`);
  console.error('\nUsage: node scripts/init-brand.mjs [targetDir] [--format css|tailwind|json|all] [--force]');
  process.exit(1);
}

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  console.log(`
Kimi brand token injector

Usage:
  node scripts/init-brand.mjs [targetDir] [--format css|tailwind|json|all] [--force]

Options:
  --format <css|tailwind|json|all>  What to emit. Default: all
  --force                          Overwrite existing files
  --target <dir>                   Same as the positional target directory
  -h, --help                       Show this help

Examples:
  node scripts/init-brand.mjs ./my-site --format css
  node scripts/init-brand.mjs --format css            (writes to the current directory)
`);
  process.exit(0);
}

const targetDir = path.resolve(process.cwd(), args.target || '.');
const format = args.format;
const force = args.force;

if (fs.existsSync(targetDir) && !fs.statSync(targetDir).isDirectory()) {
  console.error(`✗ Target path exists but is not a directory: ${targetDir}`);
  process.exit(1);
}
fs.mkdirSync(targetDir, { recursive: true });

const tokens = JSON.parse(fs.readFileSync(TOKENS_PATH, 'utf8'));
const written = [];
const skipped = [];

function writeFile(relPath, content) {
  const abs = path.join(targetDir, relPath);
  if (fs.existsSync(abs) && !force) {
    skipped.push(relPath);
    return;
  }
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content, 'utf8');
  written.push(relPath);
}

// ---------- 1. CSS ----------
if (format === 'css' || format === 'all') {
  writeFile('kimi-brand-theme.css', fs.readFileSync(THEME_PATH, 'utf8'));
  writeFile('kimi-components.css', fs.readFileSync(COMPONENTS_PATH, 'utf8'));
}

// ---------- 2. Tailwind ----------
if (format === 'tailwind' || format === 'all') {
  const c = tokens.color;
  const spacing = Object.fromEntries(tokens.space.scale.map((n) => [String(n), String(n) + 'px']));
  const tw = `/** Tailwind config — Kimi brand palette. Generated by init-brand.mjs. */
module.exports = {
  theme: {
    extend: {
      colors: {
        kimi: {
          blue: '${c.brand.blue.value}',
          'deep-blue': '${c.brand.deepBlue.value}',
          azure: '${c.brand.azure.value}',
          sky: '${c.brand.sky.value}',
          'electric-cyan': '${c.brand.electricCyan.value}',
          lavender: '${c.accent.lavender.value}',
          blush: '${c.accent.blush.value}',
          mint: '${c.accent.mint.value}',
          citron: '${c.accent.citron.value}',
          ink: '${c.neutral.ink.value}',
          slate: '${c.neutral.slate.value}',
          graphite: '${c.neutral.graphite.value}',
          silver: '${c.neutral.silver.value}',
          mist: '${c.neutral.mist.value}',
          white: '${c.neutral.white.value}',
          'ink-border': '${c.derived.inkBorder.value}',
          'ink-raised': '${c.derived.inkRaised.value}'
        }
      },
      fontFamily: {
        sans: ['Inter', 'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'SF Mono', 'Cascadia Code', 'Consolas', 'monospace'],
        serif: ['Sentient', 'Noto Serif SC', 'Source Han Serif SC', 'Lora', 'Georgia', 'serif']
      },
      spacing: ${JSON.stringify(spacing, null, 8).replace(/\n/g, '\n      ')},
      borderRadius: {
        control: '${tokens.radius.control}px',
        card: '${tokens.radius.card}px',
        container: '${tokens.radius.container}px'
      }
    }
  }
};
`;
  writeFile('tailwind.kimi-brand.js', tw);
}

// ---------- 3. JSON ----------
if (format === 'json' || format === 'all') {
  writeFile('kimi-brand-tokens.json', JSON.stringify(tokens, null, 2) + '\n');
}

// ---------- report ----------
console.log('\nKimi brand tokens → ' + targetDir + '\n');
if (written.length) {
  written.forEach((f) => console.log('  ✓ created  ' + f));
}
if (skipped.length) {
  skipped.forEach((f) => console.log('  – skipped  ' + f + '  (exists; use --force to overwrite)'));
}
if (!written.length && !skipped.length) {
  console.log('  nothing to do');
}

console.log(`
Next steps
  1. Load the fonts: Inter (body) + Geist Mono (code/metrics), both SIL OFL. Sentient (serif) is free for personal AND commercial use under the ITF Free Font License — self-hosting is allowed, but the font files may not be resold or redistributed. Licence: ${tokens.typography.families.serif.licenseUrl}
  2. Brand colours are used as published — never substitute a different blue. Body links use deep blue #002F5B (13.48:1 on white); brand blue #007CFF is 3.94:1, so keep it for fills, emphasis and large text (24px, or 18.66px at weight 700). The default button pairs ink on brand blue (4.75:1).
  3. On tinted light surfaces (--kimi-surface-sub / mist, zebra rows, panels) use --kimi-text-secondary-strong, not --kimi-text-secondary: slate drops from 4.95:1 on white to 3.85:1 on mist.
  4. Explicit theme switching: set data-theme="dark" or data-theme="light" on <html>. The explicit block is outside the media query, so it works regardless of the OS setting.
  5. Charts: neutral gray base, electric blue for the one metric that matters. Never distort the data. Light and dark chart palettes must be switched as a set.
  6. Logo: this skill ships no logo file. Download the official asset zip, do not modify, recolor, stretch or add effects, and get written permission (hi@moonshot.ai) before any commercial use.

Official logo assets: ${tokens.logo.officialAssetZip}
Full spec: ${tokens.source.brandGuidelinesZh}
`);
