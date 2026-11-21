# Color & Design Tokens — RTL Vibe UI

> Reference 03 · Draft for the 1.0.1 repair branch
> Scope: brand-aware color architecture, Persian-inspired optional palettes, semantic surfaces, Tailwind CSS v4, light/dark themes, contrast, and release checks.

## 1. Purpose and non-negotiables

A premium RTL interface needs a coherent visual hierarchy, reliable states, and excellent legibility—not merely an attractive primary color. Direction (`dir="rtl"`) determines layout and text behavior; **it must not determine the brand palette**. Keep the current `demo.html` appearance as the visual baseline when improving this repository, unless a task explicitly requests a redesign.

**Rules for an agent producing UI:**

1. Inspect the existing brand guidelines, CSS variables, screenshots, and component library **before** introducing tokens.
2. Preserve intentional product identity. Offer the Iranian-inspired palette as a **theme option**, never as a universal requirement for Persian/Arabic interfaces.
3. Prefer semantic roles (`surface`, `on-surface`, `primary`, `on-primary`, `danger`) over hard-coded colors inside components.
4. Define separate *on-colors* and state colors for each theme; do not assume one hex value works in light and dark modes.
5. Never encode status in color alone. Pair it with text, meaningful iconography, or another non-color indicator.
6. Do not claim WCAG conformance until the actual foreground/background combinations and component states have been tested.
7. Apply progressive enhancements only when they do not compromise predictable baseline rendering.

### Token layers

| Layer | Example | Responsibility |
|---|---|---|
| Primitive | `--pv-lajvard-600`, `--pv-firouzeh-500` | Stable brand palette values; never consumed directly by a component |
| Semantic | `--ui-primary`, `--ui-on-primary`, `--ui-surface` | Functional meaning and active theme |
| Component | `--button-bg`, `--card-bg`, `--field-border` | Optional local alias that resolves to semantic tokens |

Components should reference the semantic layer or a local component alias. A brand may switch primitives without rewriting the component tree.

## 2. Visual DNA: the existing demo

The repository's `demo.html` uses a sophisticated dark-navy/lajvard, firouzeh accent, layered surfaces, compact cards, and restrained elevations. Its current tokens include `--primary`, `--accent`, `--surface`, `--surface-2`, `--surface-3`, `--on-surface`, `--border`, `--danger`, `--success`, and `--warn`.

Preserve that hierarchy. Improvements should usually be **incremental**: clearer text contrast, calmer density, balanced light/dark elevations, stronger interactive feedback, and a reliable semantic token map.

**Do not replace the demo file with the sample below.** This reference provides a target architecture. Changes to `demo.html` and `assets/tailwind-tokens.css` belong in later, separately reviewed patches.

### Optional Persian-inspired theme

| Primitive family | Baseline inspiration | Suitable role, subject to contrast tests |
|---|---|---|
| Lajvard / لاجوردی | `#1C39BB` | Brand primary, navigation accents |
| Firouzeh / فیروزه‌ای | `#2AA8A0` | Accent, focus supporting color, illustrations |
| Anar / اناری | `#C62828` | Danger family or editorial highlight |
| Pisteh / پسته‌ای | `#8BB174` | Positive family, chart palette |
| Zaferan / زعفرانی | `#DAA520` | Warm accent or decorative detail |
| Kahgel / کاهگل | Warm neutral family | Optional backgrounds, subtle surfaces |

These names identify a **creative design direction**, not an immutable historical or psychological taxonomy. Cultural claims need independent sources if presented as factual history. Keep status semantics separate: a brand's anari red does not automatically satisfy the contrast requirements for the `danger` role.

### Composition guidance

- Use a restrained neutral canvas, then one clear primary and one sparing accent. Let spacing, typography, and hierarchy carry most of the visual quality.
- For dashboards, establish an explicit elevation sequence: canvas → surface → raised surface → overlay. Avoid relying on shadow alone to distinguish them.
- Keep `border` for subtle decorative separation and `border-strong` for control boundaries that must remain detectable. Their thresholds depend on adjacent backgrounds and actual state rendering.
- Use gradients and translucent overlays as decoration, not as the sole mechanism for text legibility or state communication.
- Large data regions should be calm. Small accent regions can be vivid, but every data visualization needs accessible labels and color-independent differentiation.
- Dark mode needs independently tuned borders, surfaces, shadows, and foreground colors; a simple invert filter is never a substitute for design.

## 3. Framework-neutral implementation

This standalone CSS example uses sRGB values as a dependable baseline. Add OKLCH or `color-mix()` enhancements after the role pairs work at the required contrast. The values here are **design candidates**, not certified universal contrast pairs: verify them with the actual UI and state backgrounds.

```css
/* Brand primitives: optional Persian-inspired direction. */
:root {
  --pv-lajvard-600: #1c39bb;
  --pv-lajvard-400: #7d91ff;
  --pv-firouzeh-500: #2aa8a0;
  --pv-anar-600: #c62828;
  --pv-pisteh-500: #8bb174;
  --pv-zaferan-500: #daa520;

  color-scheme: light;

  /* Semantic palette: UI components consume these roles. */
  --ui-canvas: #f6f8fc;
  --ui-surface: #ffffff;
  --ui-surface-raised: #f0f4fa;
  --ui-text: #18253c;
  --ui-text-muted: #485b75;
  --ui-border: #c5d0df;
  --ui-border-strong: #6e819c;

  --ui-primary: var(--pv-lajvard-600);
  --ui-on-primary: #ffffff;
  --ui-accent: #086b66;
  --ui-on-accent: #ffffff;
  --ui-danger: #aa2020;
  --ui-on-danger: #ffffff;
  --ui-success: #326526;
  --ui-warning: #855100;
  --ui-focus: #1c39bb;

  --ui-primary-subtle: #e9edff;
  --ui-danger-subtle: #ffebeb;
  --ui-success-subtle: #edf6ea;
  --ui-warning-subtle: #fff3df;

  --ui-radius-control: 0.625rem;
  --ui-radius-card: 0.875rem;
  --ui-radius-dialog: 1.125rem;
  --ui-shadow-raised: 0 0.375rem 1.5rem rgb(15 23 42 / 0.08);
}

:root[data-theme="dark"] {
  color-scheme: dark;

  --ui-canvas: #0b1220;
  --ui-surface: #111a2e;
  --ui-surface-raised: #17233d;
  --ui-text: #e6edf7;
  --ui-text-muted: #b4c1d6;
  --ui-border: #52627c;
  --ui-border-strong: #8293af;

  --ui-primary: #aab8ff;
  --ui-on-primary: #111a2e;
  --ui-accent: #72d9d0;
  --ui-on-accent: #0b2324;
  --ui-danger: #ff9999;
  --ui-on-danger: #3f0b0b;
  --ui-success: #b2e6a4;
  --ui-warning: #ffd48e;
  --ui-focus: #bad4ff;

  --ui-primary-subtle: #24325a;
  --ui-danger-subtle: #46242e;
  --ui-success-subtle: #223e33;
  --ui-warning-subtle: #473923;

  --ui-shadow-raised: 0 0.625rem 1.875rem rgb(0 0 0 / 0.35);
}

/* Sample components: no palette primitives inside components. */
.ui-card {
  color: var(--ui-text);
  background: var(--ui-surface);
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius-card);
  box-shadow: var(--ui-shadow-raised);
}

.ui-button-primary {
  color: var(--ui-on-primary);
  background: var(--ui-primary);
  border: 1px solid transparent;
  border-radius: var(--ui-radius-control);
}

:where(button, a, input, select, textarea):focus-visible {
  outline: 2px solid var(--ui-focus);
  outline-offset: 3px;
}
```

**Important:** The example intentionally relies on explicit `data-theme` selection rather than mixing theme strategies. Use the startup script below to select the OS preference on first load, then apply manual choices. If a product uses CSS-only system preference, put the **complete** dark semantic mapping inside `@media (prefers-color-scheme: dark)` under `:root:not([data-theme])`. Never switch only `color-scheme` while leaving application colors in light mode.

### Theme initialization (when the product needs a manual toggle)

```js
// Run before first paint when possible; storage may be unavailable.
const root = document.documentElement;
let savedTheme = null;
try {
  savedTheme = localStorage.getItem('theme');
} catch {
  /* Private or restricted storage: use system preference. */
}
if (savedTheme === 'light' || savedTheme === 'dark') {
  root.dataset.theme = savedTheme;
} else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
  root.dataset.theme = 'dark';
} else {
  root.dataset.theme = 'light';
}
```

Theme changes need a real button with an accessible name and an announced state. Do not use a decorative icon without a label.

## 4. Tailwind CSS v4 integration

In Tailwind v4, `@theme` exposes design tokens as utility classes. Use `@theme inline` when mapping to semantic CSS variables so the generated utilities consume the intended semantic values. Confirm the installed Tailwind version before using these directives.

```css
/* app.css — only in a Tailwind CSS v4 project */
@import "tailwindcss";

/* Include the semantic :root and [data-theme] definitions
   from your own theme stylesheet before using these mappings. */
@theme inline {
  --color-canvas: var(--ui-canvas);
  --color-surface: var(--ui-surface);
  --color-surface-raised: var(--ui-surface-raised);
  --color-on-surface: var(--ui-text);
  --color-on-surface-muted: var(--ui-text-muted);
  --color-ui-border: var(--ui-border);
  --color-ui-border-strong: var(--ui-border-strong);
  --color-primary: var(--ui-primary);
  --color-on-primary: var(--ui-on-primary);
  --color-accent: var(--ui-accent);
  --color-danger: var(--ui-danger);
  --color-success: var(--ui-success);
  --color-warning: var(--ui-warning);
  --color-focus: var(--ui-focus);
  --radius-ui-card: var(--ui-radius-card);
}
```

```html
<!-- Generated utilities should resolve to active semantic role values. -->
<article class="rounded-ui-card border border-ui-border bg-surface p-6 text-on-surface">
  <h2 class="text-xl font-bold">گزارش عملکرد</h2>
  <p class="mt-2 text-on-surface-muted">نمایی از شاخص‌های کلیدی</p>
  <button type="button" class="mt-4 rounded-lg bg-primary px-4 py-2 text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
    مشاهده گزارش
  </button>
</article>
```

**Watch for:** a namespace collision between the demo's existing `--primary` tokens and Tailwind's `--color-primary` variables; migration should use an explicit mapping rather than rewriting every component at once. `@theme` alone does not establish adequate contrast, and no build result is implied by the snippets above.

## 5. Advanced color: progressive enhancement, not a requirement

OKLCH is useful for designing perceptually controlled hue and lightness ramps. It is not an accessibility test, and an OKLCH value is not guaranteed to be within every display gamut. Verify the final computed color and contrast for the actual output background.

```css
.brand-highlight {
  /* Robust sRGB fallback. */
  background: #1c39bb;
  background: oklch(0.40 0.19 270);
}

.ui-glow {
  /* Fallback remains readable even without color-mix(). */
  background: var(--ui-primary-subtle);
}
@supports (background: color-mix(in oklab, red, white)) {
  .ui-glow {
    background: color-mix(in oklab, var(--ui-primary) 12%, var(--ui-surface));
  }
}
```

For modern browsers `light-dark()` can choose values using `color-scheme`, but a `data-theme` implementation is often easier to reason about when offering a manual toggle. Do not mix theme strategies without a clear precedence rule.

### Transparency and gradients

- On a translucent surface, measure contrast against the **composited** background, including images, gradients, and overlays.
- Keep critical controls distinct under reduced transparency, dark mode, and high-contrast modes.
- Chart series need stable meaning, accessible text labels, and shapes/line styles in addition to colors.
- Avoid using gradients as the only indication of selection, progress, validation, or error.

## 6. Accessibility and high-contrast behavior

Use WCAG 2.2 success criteria as acceptance targets, not as marketing labels:

| Target | Common minimum | Scope |
|---|---:|---|
| SC 1.4.3 Contrast (Minimum), AA | 4.5:1 | Normal text (with criterion exceptions) |
| SC 1.4.3, large-scale text | 3:1 | Large-scale text as defined by WCAG |
| SC 1.4.11 Non-text Contrast, AA | 3:1 | Relevant UI component boundaries/states and essential graphical elements |

Test *every* pair that appears in the UI: body text, muted text, primary button labels, error labels, disabled state where relevant, links, input boundaries, focus indicators, table rows, alert banners, chart legends, and overlays. Disabled/inactive controls may be exempt from some criteria but should still be understandable in context.

```css
@media (forced-colors: active) {
  .ui-card {
    border-color: CanvasText;
    box-shadow: none;
  }

  .ui-button-primary {
    color: ButtonText;
    background: ButtonFace;
    border: 1px solid ButtonText;
  }

  :where(button, a, input, select, textarea):focus-visible {
    outline: 2px solid Highlight;
    outline-offset: 3px;
  }
}
```

Prefer system colors over broadly setting `forced-color-adjust: none`. In Windows High Contrast, allow the browser to substitute colors where possible.

### Contrast algorithm for sRGB hex pairs (diagnostic helper)

This helper can test **opaque six-digit sRGB pairs**. It is not a replacement for browser testing and does not support alpha compositing, gradients, images, color profiles, or OKLCH values. Never use it to declare a full WCAG audit passed.

```js
function luminance(hex) {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) throw new Error('Expected #RRGGBB');
  const rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const linear = rgb.map((v) =>
    v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  );
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}
function contrast(foreground, background) {
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
// Evaluate each role pair in both light and dark themes.
console.log(contrast('#ffffff', '#1c39bb').toFixed(2));
```

### Never rely on visual color intuition

Status uses text and meaning, not just hue:

```html
<p role="status" class="status-message status-message--success">
  <span aria-hidden="true">✓</span> سفارش با موفقیت ثبت شد.
</p>
<p role="alert" class="status-message status-message--danger">
  <span aria-hidden="true">!</span> ثبت سفارش ناموفق بود؛ دوباره تلاش کنید.
</p>
```

## 7. Component-level recipes

| Component | Token guidance | State checks |
|---|---|---|
| Primary button | `primary` + `on-primary` | default, hover, active, focus, disabled |
| Secondary button | `surface-raised` + `text` + `border` | focused outline, border visibility |
| Card | `surface` + `text` + `border` | separation without relying solely on shadow |
| Form field | `surface-raised` + `text` + `border-strong` | focus, invalid, read-only, placeholder |
| Toast / banner | semantic text + tint background | no color-only status, adequate contrast |
| Table | surface / alternate subtle surface | scanability, selected rows, hover/focus |
| Chart | series palette + legend labels | no color-only encodings; dark palette |
| Modal overlay | modal surface + backdrop | readable composite contrast, keyboard focus |

Create component aliases only when the component needs distinct treatment. Avoid generating dozens of aliases for aesthetic complexity alone.

## 8. Quality gate for this reference

Before shipping a color-token change, verify:

- [ ] The existing product identity is preserved unless the user requested a new theme.
- [ ] Primitive, semantic, and component layers are not mixed inadvertently.
- [ ] Every visible foreground/background pair is tested in light **and** dark modes.
- [ ] Primary, accent, success, warning, and danger have theme-appropriate foreground values.
- [ ] Borders and focus indicators remain distinguishable, including in high-contrast mode.
- [ ] Dynamic status and data visualization are understandable without color.
- [ ] Transparent surfaces and gradients are checked against computed backgrounds.
- [ ] Manual theme selection takes precedence over system preference.
- [ ] No flash of unintended theme is introduced during app startup.
- [ ] Tailwind v4 tokens are compiled in the actual project, not inferred from code samples.
- [ ] Mobile, desktop, RTL, and LTR screenshots are reviewed after token changes.
- [ ] New token APIs and changes to the demo are documented separately.

## 9. Source standards and implementation references

- [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/) — contrast, non-text contrast, and other acceptance criteria.
- [Tailwind CSS — Theme variables](https://tailwindcss.com/docs/theme/) — `@theme` and `@theme inline` syntax.
- [Tailwind CSS — Colors](https://tailwindcss.com/docs/colors/) — utility generation and semantic colors.
- [MDN — `color-scheme`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/color-scheme) — browser-rendered surfaces and native controls.
- [MDN — `light-dark()`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/light-dark) — alternate theme strategy.
- [MDN — Forced colors](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/forced-colors) — Windows High Contrast adaptations.

**Implementation note:** This is reference documentation. It does not change `demo.html`, the current token asset, or the audit script. Those files require dedicated code patches, compilation, and visual tests in later stages.
