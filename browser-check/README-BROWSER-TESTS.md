# RTL Vibe UI — Browser interaction smoke test (local preview)

These tests use **real Google Chrome**, via Playwright Test, and read `../demo-upgraded-preview.html` only. They never edit `demo.html`, the preview, source JS, or source CSS.

## Windows Git Bash setup

1. Keep the original `demo.html` and generated `demo-upgraded-preview.html` in the repository root. If needed, regenerate the preview first with `node scripts/build-demo-preview.mjs` from the repository root.
2. Extract `browser-check/` into the root of `D:\Ai\rtl-vibe-ui`.
3. Open Git Bash at `D:\Ai\rtl-vibe-ui`:

   ```bash
   cd browser-check
   npm install
   npm test
   ```

`npm install` requires internet access and installs only local dev dependencies. The tests use your already-installed Google Chrome (`channel: 'chrome'`), so a separate `playwright install` download is not necessary. Do not run as Administrator.

## Reading output

- Expected number of cases: **7**. A failing case is a diagnostic, not a reason to alter original `demo.html` immediately.
- On success or failure, screenshots are saved in `browser-check/artifacts/`; test failures also retain screenshots/traces in `browser-check/test-results/`.
- To inspect the HTML report: `npm run test:report`.
- Send the console test output and the problematic screenshots for review.
- Tests are deliberately conservative: key focus and layout flows are tested, but this is not a complete WCAG or Screen Reader audit.
- Because the original Tabs section only has two tabs, the arrow-key test does not establish that directionality is correct for groups with more than two tabs.

## Git safety

`browser-check/.gitignore` excludes `node_modules`, results, and screenshots. The generated `demo-upgraded-preview.html` is still untracked and should not be committed. Do not use `git add .` at this stage. Keep the browser-check directory uncommitted until test results are reviewed.

## Troubleshooting

- `Executable doesn't exist` or Chrome missing: install Chrome or edit the Playwright channel setting to a supported installed browser.
- File not found: regenerate `demo-upgraded-preview.html` in the repository root, then re-run.
- `npm install` network error: no repository file needs to be changed; retry when npm registry access works.
- If there are failures, share the exact error and screenshot; don't immediately fix with CSS overrides.
