# RTL Vibe UI — demo preview (legacy migration reference)

The old `scripts/build-demo-preview.mjs` creates a comparison preview **only from the original, unenhanced** `demo.html`. It is intentionally fail-closed and is retained, with its unit tests, as a regression fixture for the one-time promotion. **Do not run it against the promoted official `demo.html`**; it will refuse the already-enhanced markup.

## Official demo workflow

`demo.html` is now the intended public demo. It loads shared production demo assets from:

- `assets/demo-enhancements.css`
- `assets/demo-enhancements.js`

To promote an unmodified original checkout, see [README-DEMO-PROMOTION.md](README-DEMO-PROMOTION.md). After promotion:

```bash
node scripts/promote-demo.mjs --check
npm --prefix browser-check test
```

To test before promotion, use `node scripts/promote-demo.mjs --prepare` and `DEMO_HTML=candidate npm --prefix browser-check test` in Git Bash.

The existing `tests/demo-preview-build.test.mjs` still tests the old preview transformation on synthetic fixtures; no second, divergent production interface is maintained. Do not track the generated preview or candidate HTML files.

Demo actions are illustrative only and do not perform backend operations.
