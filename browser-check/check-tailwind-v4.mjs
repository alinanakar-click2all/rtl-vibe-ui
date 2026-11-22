import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  readFileSync,
  writeFileSync
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const browserRoot = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(browserRoot, '..');

const sourcePath = join(
  repoRoot,
  'skills/rtl-vibe-ui/assets/tailwind-tokens.css'
);

const cliPath = join(
  browserRoot,
  'node_modules/@tailwindcss/cli/dist/index.mjs'
);

const outputDir = join(
  browserRoot,
  'artifacts/tailwind-v4-ci'
);

const inputPath = join(outputDir, 'input.css');
const outputPath = join(outputDir, 'output.css');

mkdirSync(outputDir, { recursive: true });

const source = readFileSync(sourcePath, 'utf8');

const fixture = [
  source,
  '',
  '@source inline("bg-canvas bg-primary text-on-primary rounded-ui-card shadow-ui-raised rtl-text ltr-field dark:bg-surface");',
  ''
].join('\n');

writeFileSync(inputPath, fixture, 'utf8');

console.log('Compiling official Tailwind token source...');

execFileSync(process.execPath, [
  cliPath,
  '-i', inputPath,
  '-o', outputPath
], {
  cwd: browserRoot,
  stdio: 'inherit'
});

const css = readFileSync(outputPath, 'utf8');

const required = [
  '.bg-canvas',
  '.bg-primary',
  '.text-on-primary',
  '.rounded-ui-card',
  '.shadow-ui-raised',
  '.rtl-text',
  '.ltr-field',
  '.dark\\:bg-surface',
  '--ui-canvas',
  '--ui-focus'
];

let failed = 0;

for (const marker of required) {
  const passed = css.includes(marker);

  console.log(`${passed ? 'PASS' : 'FAIL'} ${marker}`);

  if (!passed) failed++;
}

console.log(
  `Tailwind smoke test: ${required.length - failed}/${required.length} passed`
);

if (failed > 0) {
  process.exitCode = 1;
}
