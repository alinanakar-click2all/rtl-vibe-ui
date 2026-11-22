# Stage 53 — Promote the verified RTL demo to `demo.html`

This is a **controlled one-time promotion** of the already tested preview behavior. The script reuses `scripts/build-demo-preview.mjs` as its exact transformation engine and replaces its inline enhancement payloads with external asset references. The original base palette, layout, content, and unrelated inline handlers are retained.

**Preconditions:** Run from `D:\Ai\rtl-vibe-ui` on branch `fix/skill-entrypoint-v1.0.1`, after extracting this patch ZIP into the repository root. Do not edit the original demo manually before running the promotion.

### 1. Test the migration code

```bash
node --test tests/demo-preview-build.test.mjs tests/promote-demo.test.mjs
```

### 2. Prepare without modifying `demo.html`

```bash
node scripts/promote-demo.mjs --prepare
```

This creates ignored `demo-official-candidate.html`. The original `demo.html` is unchanged.

### 3. Test the candidate in your installed Chrome

```bash
DEMO_HTML=candidate npm --prefix browser-check test
```

Compare the candidate with `demo-upgraded-preview.html` in Chrome at desktop 1440px and mobile 400px/320px. Both should look the same. The external CSS/JS check is an additional safeguard against broken file references.

### 4. Promote only after the candidate passes

```bash
node scripts/promote-demo.mjs --apply
node scripts/promote-demo.mjs --check
npm --prefix browser-check test
```

The script **refuses** to apply when the candidate is stale or the original does not match the known legacy markers. Repeating `--apply` against an already promoted demo is also refused.

### 5. Inspect Git changes (do not commit yet)

```bash
git diff --check
git diff --stat
git status --short
```

Expected tracked modifications: `demo.html`, `.github/workflows/validate-skill.yml`, `browser-check/tests/demo.spec.mjs`, `browser-check/README-BROWSER-TESTS.md`, `README-PREVIEW.md`, and `.gitignore`. New source files: `scripts/promote-demo.mjs`, `tests/promote-demo.test.mjs`, `README-DEMO-PROMOTION.md`.

The generated candidate and old preview are ignored. **Do not use `git add .` yet.**

### Recovery

Before staging/committing, if you need to restore the Git-tracked old demo:

```bash
git restore -- demo.html
```

Then run `node scripts/promote-demo.mjs --prepare` again. Git retains the original version even after a future commit; no extra tracked backup file is needed.

### CI

CI first runs migration regression tests and verifies that the tracked official `demo.html` links to its enhancement assets. It then runs Playwright against **that tracked file**, not a generated preview. The old preview builder remains only for legacy fixture tests and must not run on the promoted demo in CI.
