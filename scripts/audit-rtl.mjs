#!/usr/bin/env node
/**
 * RTL Vibe UI — conservative, dependency-free RTL source auditor.
 *
 * Usage:
 *   node scripts/audit-rtl.mjs [files-or-directories...] [--check] [--strict] [--json]
 *   node scripts/audit-rtl.mjs [files-or-directories...] --fix
 *
 * Exit status: 0 = accepted; 1 = findings failing the selected policy;
 *              2 = invalid arguments or I/O failure.
 *
 * Scope and safety:
 * - .css/.scss: declaration-aware static diagnostics (not a full CSS/SCSS parser).
 * - .html/.htm/.jsx/.tsx/.vue/.svelte/.astro: heuristic analysis of static
 *   markup attributes and <style> blocks. Dynamic templates need manual review.
 * - Physical coordinates are WARNINGS, not universally invalid CSS.
 * - --fix ONLY inserts dir="rtl" on a real HTML root already declaring
 *   lang="fa" or lang="ar" (including language subtags). All other findings
 *   are diagnostic; never rewrite CSS or Tailwind automatically using regexes.
 * - No guessing language, no reordering content, no changes to unscanned files.
 */
import { lstat, readdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';

const FILE_TYPES = new Set(['.css', '.scss', '.html', '.htm', '.jsx', '.tsx', '.vue', '.svelte', '.astro']);
const STYLE_TYPES = new Set(['.css', '.scss']);
const HTML_TYPES = new Set(['.html', '.htm']);
const IGNORED = new Set(['.git', 'node_modules', 'dist', 'build', '.next', '.nuxt', '.output',
  '.cache', '.turbo', 'coverage', 'vendor', 'out', 'playwright-report', 'test-results']);
const MAX_BYTES = 5 * 1024 * 1024;
const RTL_LOCALE = /^(?:fa|ar)(?:[-_][a-z0-9]+)*$/i;
const SIDE_CSS = new Map([
  ['margin-left', 'margin-inline-start'],
  ['margin-right', 'margin-inline-end'],
  ['padding-left', 'padding-inline-start'],
  ['padding-right', 'padding-inline-end'],
  ['border-left', 'border-inline-start'],
  ['border-right', 'border-inline-end'],
  ['border-left-color', 'border-inline-start-color'],
  ['border-right-color', 'border-inline-end-color'],
  ['border-left-style', 'border-inline-start-style'],
  ['border-right-style', 'border-inline-end-style'],
  ['border-left-width', 'border-inline-start-width'],
  ['border-right-width', 'border-inline-end-width'],
  ['border-top-left-radius', 'border-start-start-radius'],
  ['border-top-right-radius', 'border-start-end-radius'],
  ['border-bottom-left-radius', 'border-end-start-radius'],
  ['border-bottom-right-radius', 'border-end-end-radius'],
  ['left', 'inset-inline-start'],
  ['right', 'inset-inline-end'],
]);
const SIDE_VALUES = {
  'text-align': { left: 'start', right: 'end' },
  float: { left: 'inline-start', right: 'inline-end' },
  clear: { left: 'inline-start', right: 'inline-end' },
};
const TAILWIND = [
  [/^(-?)ml-(.+)$/, (_, neg, x) => `${neg}ms-${x}`],
  [/^(-?)mr-(.+)$/, (_, neg, x) => `${neg}me-${x}`],
  [/^(-?)pl-(.+)$/, (_, neg, x) => `${neg}ps-${x}`],
  [/^(-?)pr-(.+)$/, (_, neg, x) => `${neg}pe-${x}`],
  [/^(-?)left-(.+)$/, (_, neg, x) => `${neg}start-${x}`],
  [/^(-?)right-(.+)$/, (_, neg, x) => `${neg}end-${x}`],
  [/^text-left$/, () => 'text-start'],
  [/^text-right$/, () => 'text-end'],
  [/^border-l(?:-(.+))?$/, (_, x) => `border-s${x ? `-${x}` : ''}`],
  [/^border-r(?:-(.+))?$/, (_, x) => `border-e${x ? `-${x}` : ''}`],
  [/^rounded-l(?:-(.+))?$/, (_, x) => `rounded-s${x ? `-${x}` : ''}`],
  [/^rounded-r(?:-(.+))?$/, (_, x) => `rounded-e${x ? `-${x}` : ''}`],
  [/^rounded-tl(?:-(.+))?$/, (_, x) => `rounded-ss${x ? `-${x}` : ''}`],
  [/^rounded-tr(?:-(.+))?$/, (_, x) => `rounded-se${x ? `-${x}` : ''}`],
  [/^rounded-bl(?:-(.+))?$/, (_, x) => `rounded-es${x ? `-${x}` : ''}`],
  [/^rounded-br(?:-(.+))?$/, (_, x) => `rounded-ee${x ? `-${x}` : ''}`],
];

function usage() {
  return `RTL Vibe UI auditor\n\nUsage:\n  node scripts/audit-rtl.mjs [paths...] [--check] [--strict] [--json]\n  node scripts/audit-rtl.mjs [paths...] --fix [--strict] [--json]\n\nOptions:\n  --check    Read-only audit (default); exit 1 if errors exist\n  --strict   Exit 1 on warnings as well as errors\n  --fix      Apply ONLY safe root HTML direction insertion, then re-audit\n  --json     Emit machine-readable JSON instead of human output\n  --help     Show help\n\nOnly static source is analyzed; dynamic JSX/CSS-in-JS needs separate lint rules.\n`;
}

function parseOptions(args) {
  const flags = new Set();
  const roots = [];
  for (const arg of args) {
    if (arg.startsWith('--')) {
      if (!['--check', '--strict', '--fix', '--json', '--help'].includes(arg)) {
        throw new Error(`Unknown option: ${arg}`);
      }
      flags.add(arg);
    } else {
      roots.push(arg);
    }
  }
  if (flags.has('--fix') && flags.has('--check')) {
    throw new Error('--fix and --check cannot be combined');
  }
  return { roots: roots.length ? roots : ['.'], fix: flags.has('--fix'),
    strict: flags.has('--strict'), json: flags.has('--json'), help: flags.has('--help') };
}

async function collectFiles(roots) {
  const files = new Set();
  async function visit(path, explicit = false) {
    const stat = await lstat(path); // do not follow symlinks
    if (stat.isSymbolicLink()) {
      if (explicit) throw new Error(`Symbolic links are unsupported: ${path}`);
      return;
    }
    if (stat.isFile()) {
      if (FILE_TYPES.has(extname(path).toLowerCase())) files.add(resolve(path));
      else if (explicit) throw new Error(`Unsupported file extension: ${path}`);
      return;
    }
    if (!stat.isDirectory()) throw new Error(`Not a file or directory: ${path}`);
    const entries = (await readdir(path, { withFileTypes: true }))
      .sort((a, b) => a.name.localeCompare(b.name, 'en'));
    for (const entry of entries) {
      if (IGNORED.has(entry.name)) continue;
      if (entry.isDirectory() || entry.isFile()) await visit(join(path, entry.name));
    }
  }
  for (const root of roots) await visit(resolve(root), true);
  return [...files].sort((a, b) => a.localeCompare(b, 'en'));
}

function location(source, offset) {
  const before = source.slice(0, Math.max(0, offset));
  const last = before.lastIndexOf('\n');
  return { line: before.split('\n').length, column: before.length - last };
}

function addFinding(items, file, source, offset, rule, severity, message, fixable = false) {
  items.push({ file: relative(process.cwd(), file).replace(/\\/g, '/'),
    ...location(source, offset), rule, severity, message, fixable });
}

function stripLeadingComments(text) {
  let i = 0;
  for (;;) {
    while (/\s/.test(text[i] ?? '')) i++;
    if (text.slice(i, i + 2) !== '/*') break;
    const end = text.indexOf('*/', i + 2);
    if (end < 0) return { text: '', skipped: text.length };
    i = end + 2;
  }
  return { text: text.slice(i), skipped: i };
}

function parseDeclaration(segment, offset) {
  const { text, skipped } = stripLeadingComments(segment);
  const match = /^([a-zA-Z-]+)\s*:\s*([\s\S]*?)\s*$/.exec(text);
  if (!match) return null;
  return { prop: match[1].toLowerCase(), value: match[2].trim(), offset: offset + skipped };
}

/** Extract declarations per block without mistaking ; or : inside quoted/function values.
 * Not a replacement for an AST parser (notably for deeply nested SCSS). */
function cssBlocks(css, baseOffset = 0) {
  const blocks = [];
  const stack = [];
  let start = 0, quote = '', comment = false, paren = 0, bracket = 0;
  function take(end) {
    if (!stack.length) return;
    const declaration = parseDeclaration(css.slice(start, end), start + baseOffset);
    if (declaration) stack[stack.length - 1].declarations.push(declaration);
  }
  for (let i = 0; i < css.length; i++) {
    const c = css[i], next = css[i + 1];
    if (comment) { if (c === '*' && next === '/') { comment = false; i++; } continue; }
    if (quote) {
      if (c === '\\') { i++; continue; }
      if (c === quote) quote = '';
      continue;
    }
    if (c === '/' && next === '*') { comment = true; i++; continue; }
    if (c === '"' || c === "'") { quote = c; continue; }
    if (c === '(') { paren++; continue; }
    if (c === ')') { paren = Math.max(0, paren - 1); continue; }
    if (c === '[') { bracket++; continue; }
    if (c === ']') { bracket = Math.max(0, bracket - 1); continue; }
    if (paren || bracket) continue;
    if (c === '{') {
      const header = css.slice(start, i).trim();
      stack.push({ header, ancestors: stack.map((s) => s.header), declarations: [] });
      start = i + 1;
    } else if (c === ';') {
      take(i);
      start = i + 1;
    } else if (c === '}') {
      take(i);
      if (stack.length) blocks.push(stack.pop());
      start = i + 1;
    }
  }
  return blocks;
}

function explicitDirectionSelector(block) {
  return [...block.ancestors, block.header].some((selector) =>
    /:dir\(\s*(?:ltr|rtl)\s*\)|\[\s*dir\s*(?:[~|^$*]?=)\s*['"]?(?:rtl|ltr)/i.test(selector));
}

function auditCSS(source, file, items, baseOffset = 0, original = source) {
  for (const block of cssBlocks(source, baseOffset)) {
    // The source's coordinates are absolute even for <style> blocks.
    if (explicitDirectionSelector(block)) continue;
    const byName = new Map(block.declarations.map((d) => [d.prop, d.value]));
    for (const decl of block.declarations) {
      const { prop, value, offset } = decl;
      if (SIDE_CSS.has(prop)) {
        if (['left', 'right'].includes(prop) && byName.has('left') && byName.has('right') &&
          byName.get('left') === byName.get('right')) continue;
        addFinding(items, file, original, offset, 'css-physical-property', 'warning',
          `${prop} may encode direction; consider ${SIDE_CSS.get(prop)} if it means start/end`);
      }
      const byValue = SIDE_VALUES[prop];
      if (byValue && byValue[value.toLowerCase()]) {
        addFinding(items, file, original, offset, 'css-physical-value', 'warning',
          `${prop}: ${value} may need ${byValue[value.toLowerCase()]} for direction-aware UI`);
      }
    }
  }
}

function attr(tag, name) {
  const re = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i');
  const m = re.exec(tag);
  return m ? (m[1] ?? m[2]) : null;
}

function classesFromTag(tag) {
  const m = /(?:^|\s)(?:class|className)\s*=\s*(?:"([^"]*)"|'([^']*)'|\{\s*"([^"]*)"\s*\}|\{\s*'([^']*)'\s*\})/.exec(tag);
  if (!m) return null;
  return { content: m.slice(1).find((x) => x !== undefined) ?? '',
    position: m.index + m[0].indexOf(m.slice(1).find((x) => x !== undefined) ?? '') };
}

function recommendation(classToken) {
  // Ignore RTL-specific variants, bracketed arbitrary selectors and arbitrary values.
  if (/[\[\]{}]/.test(classToken)) return null;
  const parts = classToken.split(':');
  const base = parts.pop();
  if (parts.some((part) => /^(rtl|ltr)$/.test(part))) return null;
  for (const [pattern, fix] of TAILWIND) {
    const match = base.match(pattern);
    if (match) return [...parts, fix(...match)].join(':');
  }
  return null;
}

function auditMarkup(source, file, items, allowFix) {
  let updated = source;
  // Ignore HTML comments, which can contain example tags.
  const masked = source.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '));
  const htmlRe = /<html\b[^>]*>/i;
  const root = htmlRe.exec(masked);
  if (root && HTML_TYPES.has(extname(file).toLowerCase())) {
    const tag = source.slice(root.index, root.index + root[0].length);
    const lang = attr(tag, 'lang');
    const dir = attr(tag, 'dir');
    if (lang && RTL_LOCALE.test(lang) && !dir) {
      addFinding(items, file, source, root.index, 'html-missing-dir', 'error',
        `HTML root lang="${lang}" should declare dir="rtl"`, true);
      if (allowFix) {
        const insertAt = root.index + root[0].lastIndexOf('>');
        updated = source.slice(0, insertAt) + ' dir="rtl"' + source.slice(insertAt);
      }
    }
    if (dir === 'rtl' && !lang) {
      addFinding(items, file, source, root.index, 'html-missing-lang', 'warning',
        'RTL HTML root has no language; choose the correct lang manually');
    }
  }
  // Analyze static markup only. Mask script/style bodies in HTML documents and
  // block comments in JSX/TSX to avoid matching illustrative strings or code.
  let markup = masked;
  if (HTML_TYPES.has(extname(file).toLowerCase())) {
    markup = markup.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,
      (m) => m.replace(/[^\n]/g, ' '));
  } else {
    markup = markup.replace(/\/\*[\s\S]*?\*\//g,
      (m) => m.replace(/[^\n]/g, ' '));
  }
  const rtlContext = /<html\b[^>]*\bdir\s*=\s*['"]rtl['"]|\bdir\s*=\s*['"]rtl['"]|<html\b[^>]*\blang\s*=\s*['"](?:fa|ar)(?:[-_][a-z0-9]+)*['"]/i.test(markup);
  const tagRe = /<[A-Za-z][^>]*>/g;
  let tag;
  while ((tag = tagRe.exec(markup)) !== null) {
    const raw = source.slice(tag.index, tag.index + tag[0].length);
    const classes = classesFromTag(raw);
    if (classes) {
      const words = /\S+/g;
      let match;
      while ((match = words.exec(classes.content)) !== null) {
        const suggested = recommendation(match[0]);
        if (!suggested) continue;
        addFinding(items, file, source, tag.index + classes.position + match.index,
          'tailwind-physical-class', 'warning',
          `${match[0]} might be direction-sensitive; consider ${suggested}`);
      }
    }
    if (/^<input\b/i.test(raw)) {
      const type = attr(raw, 'type')?.toLowerCase();
      if (rtlContext && ['email', 'url', 'tel'].includes(type) && !attr(raw, 'dir')) {
        addFinding(items, file, source, tag.index, 'input-direction-review', 'warning',
          `Review text direction for input type="${type}"; LTR is often appropriate`);
      }
    }
  }
  const styleRe = /<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi;
  let style;
  while ((style = styleRe.exec(source)) !== null) {
    const offset = style.index + style[0].indexOf(style[1]);
    auditCSS(style[1], file, items, offset, source);
  }
  return updated;
}

function auditFile(source, file, allowFix = false) {
  const items = [];
  const ext = extname(file).toLowerCase();
  let output = source;
  if (STYLE_TYPES.has(ext)) auditCSS(source, file, items);
  else output = auditMarkup(source, file, items, allowFix);
  return { items, output };
}

async function run(options) {
  const files = await collectFiles(options.roots);
  if (files.length === 0) throw new Error('No supported source files found');
  const items = [];
  let changes = 0;
  for (const file of files) {
    const stat = await lstat(file);
    if (stat.size > MAX_BYTES) {
      addFinding(items, file, '', 0, 'file-too-large', 'error',
        `File exceeds ${MAX_BYTES} bytes; audit not performed`);
      continue;
    }
    const original = await readFile(file, 'utf8');
    const result = auditFile(original, file, options.fix);
    if (options.fix && result.output !== original) {
      await writeFile(file, result.output, 'utf8');
      changes++;
      // Re-evaluate updated file: exit status must reflect remaining violations.
      items.push(...auditFile(result.output, file).items);
    } else {
      items.push(...result.items);
    }
  }
  items.sort((a, b) => a.file.localeCompare(b.file, 'en') || a.line - b.line ||
    a.column - b.column || a.rule.localeCompare(b.rule, 'en'));
  return { scanned: files.length, changedFiles: changes, findings: items,
    errors: items.filter((f) => f.severity === 'error').length,
    warnings: items.filter((f) => f.severity === 'warning').length };
}

async function main() {
  let options;
  try { options = parseOptions(process.argv.slice(2)); }
  catch (error) { console.error(`${error.message}\n\n${usage()}`); process.exitCode = 2; return; }
  if (options.help) { process.stdout.write(usage()); return; }
  try {
    const result = await run(options);
    if (options.json) console.log(JSON.stringify(result, null, 2));
    else {
      for (const f of result.findings) {
        console.log(`${f.file}:${f.line}:${f.column} ${f.severity.toUpperCase()} ${f.rule}: ${f.message}`);
      }
      console.log(`${result.scanned} files scanned; ${result.errors} errors, ${result.warnings} warnings; ` +
        `${result.changedFiles} files changed.`);
    }
    if (result.errors || (options.strict && result.warnings)) process.exitCode = 1;
  } catch (error) {
    if (options.json) console.log(JSON.stringify({ error: error.message }, null, 2));
    else console.error(`Audit failed: ${error.message}`);
    process.exitCode = 2;
  }
}

main();
