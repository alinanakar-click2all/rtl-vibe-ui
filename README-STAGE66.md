# Stage 66 — Promote approved mobile orders-table improvement

This patch promotes the verified Stage 63/65 responsive orders-table enhancement into the **official `demo.html`**, without editing the original native table rows, unrelated components, or JavaScript. All original colors, typography and dashboard analytics remain unchanged.

## Current status — promotion completed

The mobile orders-table enhancement is already included in the official
`demo.html`. Its promotion was committed as `813587e` and subsequently
validated by GitHub Actions.

Current regression coverage: **16 mobile-table Node.js tests**,
**42 demo-related Node.js tests in total**, and **18 Playwright tests**.
The older commit references and counts in the historical instructions
below describe the original one-time migration stage.

**For the current checkout, run only the official verification command:**

```bash
node scripts/promote-mobile-table.mjs --check
```

Do not rerun the trial builder or `--apply` on the already-promoted
official demo. The historical migration procedure below is retained
for reference, not for execution on the current branch.

## Preconditions

- Current branch: `fix/skill-entrypoint-v1.0.1`, latest pushed commit `4c6b616`.
- The reviewed candidate exists: `browser-check/artifacts/demo-mobile-table-candidate.html`.
- Stage 65 Playwright trial passed **4/4**, and the candidate `--check` passed.
- Do **not** commit the ignored candidate, screenshots, or trial-only browser files.

## Install

Extract the ZIP into `D:\Ai\rtl-vibe-ui` (keep directories). The ZIP **does not contain `demo.html`**. It adds the promotion script, its tests, one official browser suite, source trial files, documentation, and updates the GitHub workflow, `.gitignore` and browser testing instructions.

## 1. Verify before promotion

From the repository root in Git Bash:

```bash
node --test tests/build-mobile-table-trial.test.mjs tests/promote-mobile-table.test.mjs
node scripts/build-mobile-table-trial.mjs --check
```

Expected: **14 passing Node tests** and a valid current trial candidate. If the candidate is stale, do not apply: re-prepare and rerun trial tests before continuing.

## 2. Promote only the approved candidate

```bash
node scripts/promote-mobile-table.mjs --apply
node scripts/promote-mobile-table.mjs --check
```

The script compares the candidate against the *current* `demo.html` byte-for-byte, removes the trial-only nested `<base>`, and inserts the same stylesheet plus an accessible scroll hint/region into the official file. A stale candidate, malformed heading, second promotion or unexpected source shape is rejected without changing `demo.html`.

**After promotion:** the old trial builder will deliberately refuse already-promoted HTML. Do not rerun its `--prepare` or `--check` on the official demo. Its **unit tests** still run using standalone regression fixtures.

## 3. Run all official tests

```bash
node scripts/promote-demo.mjs --check
node scripts/promote-visual.mjs --check
node scripts/promote-mobile-table.mjs --check
node --test tests/demo-preview-build.test.mjs tests/promote-demo.test.mjs tests/build-visual-preview.test.mjs tests/promote-visual.test.mjs tests/build-mobile-table-trial.test.mjs tests/promote-mobile-table.test.mjs
npm --prefix browser-check test
```

Expected: **40 Node tests** (26 old + 7 trial + 7 promotion) and **18 Playwright tests** (14 old + 4 official orders-table tests). Playwright uses Chrome locally and Chromium on GitHub Actions. Test desktop/mobile RTL/LTR and Light/Dark after promotion.

## 4. Inspect changes before committing

```bash
git diff --check
git diff --stat
git status --short --untracked-files=all
```

**Do not commit/push yet.** Review the output first. The old trial-only `playwright.table.config.mjs`, `mobile-table.table-trial.mjs`, Stage 57/63/65 notes, and `playwright.visual.config.mjs` / `visual.manual.mjs` should stay untracked and outside the intended commit. `.gitignore` now excludes `browser-check/playwright-report-table-trial/`.

To undo the official HTML change **before committing**:

```bash
git restore -- demo.html
```

## CI

GitHub Actions validates the official demo's responsive orders-table assets, runs the Stage 63 migration regression unit tests and Stage 66 promotion tests, and executes **18 Playwright tests** directly against `demo.html`.
