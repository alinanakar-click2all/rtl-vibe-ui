# Stage 60 — promote approved analytics to official RTL Vibe UI demo

This is a narrow, reviewable change: two **already-tested** visual assets are linked to `demo.html`. Existing demo styles, navigation, modal, drawer, tabs and components are unchanged. The chart uses only **illustrative** data.

## Preconditions

You have already extracted Stage 57, generated `demo-visual-candidate.html`, and passed the visual suite. Your local branch is `fix/skill-entrypoint-v1.0.1`. Your official `demo.html` has no uncommitted modifications. **Keep your original files until the checks below pass.**

## Install

Extract this Stage 60 ZIP in the **root** `D:\Ai\rtl-vibe-ui`, preserving folders. It adds `scripts/promote-visual.mjs`, `tests/promote-visual.test.mjs`, `browser-check/tests/visual.spec.mjs`, `README-STAGE60.md` and updates `.github/workflows/validate-skill.yml`. It does **not** contain or overwrite `demo.html` or Stage 57 CSS and JS.

## Validate before promotion

```bash
node --test tests/build-visual-preview.test.mjs tests/promote-visual.test.mjs
node scripts/build-visual-preview.mjs --check
```

## Apply

```bash
node scripts/promote-visual.mjs --apply
node scripts/promote-visual.mjs --check
```

`--apply` only runs if `demo-visual-candidate.html` matches an exact transformation of the **current** `demo.html`. Re-running `--apply` refuses to rewrite the official demo. `--check` verifies that the promoted HTML contains the shared baseline and visual assets exactly once, in the expected order. The existing tracked Git history is the rollback point.

## Test official demo

```bash
node --test tests/demo-preview-build.test.mjs tests/promote-demo.test.mjs tests/build-visual-preview.test.mjs tests/promote-visual.test.mjs
npm --prefix browser-check test
```

Expected: **26 unit tests** (10 + 6 + 4 + 6) and **14 Playwright tests** (8 existing + 6 new official analytics tests). The former `visual.manual.mjs` trial suite is no longer needed once the new official visual tests pass. The previous `playwright.visual.config.mjs` trial-only config is no longer needed either. Leave them **unstaged** and delete them only after validation. Generated `demo-visual-candidate.html`, `node_modules`, browser artifacts are ignored.

## Git check (do not commit yet)

```bash
git diff --check
git status --short --untracked-files=all
```

Expected modified: `demo.html`, `.github/workflows/validate-skill.yml`, `.gitignore` (from Stage 57). New source files: both Stage 57 assets, the Stage 57 builder/test, the Stage 60 promoter/test, official visual Playwright spec and the README files. Do not use `git add .` until the temporary trial files have been reviewed.

## Recovery

Before committing, the original tracked demo can be restored with `git restore -- demo.html`. **Only do so intentionally:** it discards the visual promotion. You can regenerate the candidate and reapply the promotion after the source is restored.

## Visual QA observation

In the supplied 400px screenshots, the existing order table has cramped cells (wrapping order IDs and statuses). It is not caused by the analytics integration and is a separate next-phase mobile presentation improvement. This promotion deliberately does not alter that table.
