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
