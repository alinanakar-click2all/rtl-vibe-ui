# RTL Vibe UI — official demo browser tests

These tests exercise the **official** `../demo.html` (rather than a generated preview). They use Google Chrome when run locally and Playwright-managed Chromium in GitHub Actions.

## Setup (Windows Git Bash)

```bash
cd /d/Ai/rtl-vibe-ui
cd browser-check
npm ci
npm test
```

The official `demo.html` must have been promoted first (see `../README-DEMO-PROMOTION.md`). If you want to validate the candidate **before** changing the tracked file, run from the repository root:

```bash
node scripts/promote-demo.mjs --prepare
DEMO_HTML=candidate npm --prefix browser-check test
```

Then compare `demo-official-candidate.html` visually with your previous `demo-upgraded-preview.html`. After approval:

```bash
node scripts/promote-demo.mjs --apply
node scripts/promote-demo.mjs --check
npm --prefix browser-check test
```

## Coverage and evidence

The suite checks external CSS and JS loading, direction/theme controls, keyboard focus management of Modal and Drawer, Tabs, responsive mobile navigation and horizontal overflow at 400px/320px, and the phone-field hint association. Tests are smoke coverage, **not** a full WCAG or screen-reader audit.

Screenshots: `browser-check/artifacts/`; failed-test traces and screenshots: `browser-check/test-results/`; HTML report: `cd browser-check && npm run test:report`.

Avoid committing generated output, `node_modules/`, screenshots, or reports. Their locations are excluded by `.gitignore`.

## Stage 60: official sales-overview analytics

After promoting the approved visualization via `node scripts/promote-visual.mjs --apply`, the normal `npm test` discovers **14 tests**: the original eight interaction tests and six tests in `tests/visual.spec.mjs`. The latter verify the sample SVG, seven-/thirty-day updates, keyboard activation, RTL/LTR and themes, and 1440px/400px/320px root overflow.

The former trial-only `tests/visual.manual.mjs` and `playwright.visual.config.mjs` can be removed after successful official tests. They must not be committed as part of the official suite. See `../README-STAGE60.md`.

## Stage 66: responsive orders table in the official demo

The official `npm test` suite now discovers **18 Playwright tests**: the original 14 plus four tests in `tests/mobile-table.spec.mjs`. These assert a native, scrollable orders table at 320px and 400px without root overflow or broken IDs, a preserved desktop layout and working direction/theme toggles. The local-only `mobile-table.table-trial.mjs` and `playwright.table.config.mjs` are not required for CI.

After the one-time promotion, run `node scripts/promote-mobile-table.mjs --check`. The old trial builder deliberately refuses an already-promoted official demo. See `../README-STAGE66.md`.

## Tailwind CSS v4 token compilation

The browser-check development dependencies include pinned versions of
Tailwind CSS and its CLI.

After installing dependencies with `npm ci` inside `browser-check`,
run the smoke test from the repository root:

```bash
node browser-check/check-tailwind-v4.mjs
```

The test compiles the official `skills/rtl-vibe-ui/assets/tailwind-tokens.css`
source into ignored `browser-check/artifacts/` output and verifies
10 selected generated classes and design-token markers.

GitHub Actions runs this check before Playwright browser installation.
The check does not certify WCAG contrast, complete visual quality,
or compatibility with every host framework.
