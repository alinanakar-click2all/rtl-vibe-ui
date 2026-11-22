# RTL Vibe UI — Demo Preview Upgrade (draft)

This is a **non-destructive preview**, not a release-ready replacement. The original `demo.html` stays unchanged. The builder reads that file and creates `demo-upgraded-preview.html` for side-by-side comparison. No third-party dependencies are required.

## Install into the repository root

Extract the ZIP into `D:\Ai\rtl-vibe-ui` so these new files appear:

- `scripts/build-demo-preview.mjs`
- `assets/demo-enhancements.css`
- `assets/demo-enhancements.js`
- `tests/demo-preview-build.test.mjs`

## Run

```bash
node --test tests/demo-preview-build.test.mjs
node scripts/build-demo-preview.mjs
```

Open both `demo.html` and `demo-upgraded-preview.html` in your browser and compare mobile/desktop, RTL/LTR, Light/Dark. On mobile, use the menu button in the top bar. Try Tab / Shift+Tab / Escape in Modal and Drawer; try arrow keys in Tabs. Also test reduced motion.

**Important:** Do not commit generated `demo-upgraded-preview.html`; it is a local comparison artifact. When results are approved, merge tested enhancements into `demo.html` on the existing PR. The preview builder explicitly refuses to modify a source whose structure no longer matches expected markers.

## Scope

- Adds an accessible mobile navigation drawer, preserving desktop sidebar.
- Prevents keyboard focus from reaching an inactive Drawer.
- Adds modal/drawer focus containment, Escape and focus return.
- Adds direction-aware roving tabindex for Tabs.
- Improves accessibility of Accordion and phone hint.
- Refines dark theme status text contrast, mobile spacing, focus indicators, and reduced motion.

No backend functionality is implied: buttons and demo flows remain demonstrative.
