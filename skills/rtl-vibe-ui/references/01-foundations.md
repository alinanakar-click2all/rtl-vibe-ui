# Foundations — Language, Direction, Bidi, and RTL-native Layout

> RTL Vibe UI · Reference 01 · Working draft for the 1.0.1 repair branch
> Scope: semantic HTML, language/direction metadata, bidi isolation, logical CSS, responsive layout, and foundational validation.
> Read this guide when creating or reviewing a Persian, Arabic, or mixed-direction interface. Follow `../SKILL.md` for the overall workflow. For typography, tokens, interaction, accessibility, and acceptance checks, consult the corresponding references.

## 0. Core contract

**RTL is a property of language and document flow, not a post-processing mirror effect.** Preserve semantic DOM order, keyboard order, an existing product's brand identity, and the design's information hierarchy.

- **MUST:** Set correct document/region language and base direction; isolate mixed-direction fragments; maintain meaningful source order; avoid layout hacks that break LTR or keyboard use.
- **SHOULD:** Prefer CSS logical properties for flow-relative spacing, borders, size, placement, and text alignment; build adaptable layouts using Grid/Flexbox and container queries when appropriate.
- **MAY:** Apply the project's optional Persian-inspired visual theme. RTL correctness must never depend on choosing those colors, shadows, or fonts.
- **VERIFY:** Test actual Persian and Arabic strings, long mixed-direction values, responsive states, keyboard traversal, and the same component in RTL and LTR when supported.

**Do not assume:** `lang` and `dir` do the same thing; `dir="rtl"` fixes every embedded English string; every `left`/`right` declaration is incorrect; a design is accessible because it uses semantic HTML; or passing a static linter proves visual correctness.

## 1. Declare language and direction at the correct boundary

Use `lang` to identify language for speech, hyphenation, and language-sensitive behavior. Use `dir` to establish the base text direction and bidi context. They are distinct attributes; neither substitutes for the other.

### 1.1 Persian document

```html
<!doctype html>
<html lang="fa" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>داشبورد مدیریت</title>
  </head>
  <body>
    <main id="main-content">
      <h1>گزارش عملکرد</h1>
    </main>
  </body>
</html>
```

For Arabic use an appropriate language tag, e.g. `<html lang="ar" dir="rtl">` or a more specific BCP 47 tag when needed. Do not mislabel an Arabic page as Persian merely because both scripts are right-to-left.

### 1.2 Local language/direction changes

```html
<article lang="fa" dir="rtl">
  <p>نسخه جدید منتشر شد: <span lang="en" dir="ltr">Release 2.4.0</span></p>
  <section lang="en" dir="ltr" aria-label="English documentation">
    <h2>API documentation</h2>
    <p>Use the endpoint below to read the current status.</p>
  </section>
</article>
```

Set language on the smallest relevant language span or region. Set direction on the region whose *base direction* differs; do not put `dir="rtl"` on every child when inheritance is appropriate.

**Direction switching:** When a product truly supports both UI directions, set the document root `lang` and `dir` from the active locale before rendering or hydrating the main UI whenever the framework allows it. Avoid a visible LTR→RTL flash. In SSR applications, render the same initial locale/direction on server and client. Update directional layout state, icons, and motion deliberately; do not blindly reverse arrays or DOM order.

## 2. BiDi: mixed Persian, Arabic, Latin, numbers, and punctuation

The Unicode Bidirectional Algorithm determines visual order of text. Simple `text-align: right` does not establish a correct bidi context.

### 2.1 A known opposite-direction fragment

```html
<p dir="rtl" lang="fa">
  مستندات در <a href="https://example.com/docs" lang="en" dir="ltr">example.com/docs</a> قرار دارند.
</p>
```

Do not treat the visual placement of punctuation as reliable without checking a rendered browser output.

### 2.2 Unknown user-generated names and labels

Use `<bdi>` to isolate a short value with unknown direction, especially when punctuation or a numeric count follows it:

```html
<ul dir="rtl" lang="fa">
  <li>کاربر <bdi>Alex-2026</bdi> ثبت‌نام کرد.</li>
  <li>کاربر <bdi>ليلى</bdi> ثبت‌نام کرد.</li>
</ul>
```

Use `dir="auto"` on a full user-entered message or unknown-direction text region. Browser direction detection generally follows the first strong directional character; numerals and symbols alone may not supply one.

```html
<blockquote dir="auto">A user-written message / متن نوشته‌شده توسط کاربر</blockquote>
<textarea id="message" name="message" dir="auto" lang="fa"></textarea>
```

`dir="auto"` is not a language detector. Choose `lang` from known content metadata where possible; do not infer it from text direction alone. Never inject untrusted user text with `innerHTML`; use escaped text or safe DOM text nodes. Bidi isolation does **not** sanitize HTML.

### 2.3 Technical tokens, code, and stable LTR segments

```html
<p dir="rtl">
  شناسه درخواست: <bdi>REQ-2026-00751</bdi>
</p>
<pre dir="ltr"><code>GET /api/v1/orders?limit=20</code></pre>
<p dir="rtl">
  ایمیل پشتیبانی:
  <a href="mailto:support@example.com" dir="ltr">support@example.com</a>
</p>
```

- Use a deliberately LTR segment for code, terminal output, URLs, email addresses, and technical identifiers whose sequence must remain readable.
- Preserve exact identifier content during copying, searching, and export; never reorder characters manually.
- Avoid globally forcing `unicode-bidi: bidi-override`, embedding control characters, or `direction: ltr` on the whole page to fix a local issue.
- If a line includes several fragments of opposite direction, isolate each smallest meaningful fragment rather than wrapping unrelated surrounding text.

## 3. CSS logical properties are the default for flow-relative layout

The inline axis usually follows the writing direction. In horizontal Persian/Arabic text, `inline-start` is normally the right edge; in horizontal English text it is normally the left edge. Logical properties also account for writing modes, not just RTL/LTR.

| Flow intent | Prefer | Avoid for flow intent |
| --- | --- | --- |
| Space before / after content | `margin-inline-start` / `margin-inline-end` | `margin-left` / `margin-right` |
| Inner start / end padding | `padding-inline-start` / `padding-inline-end` | `padding-left` / `padding-right` |
| Offset from start / end | `inset-inline-start` / `inset-inline-end` | `left` / `right` |
| Border on start / end | `border-inline-start` / `border-inline-end` | `border-left` / `border-right` |
| Start-side corner | `border-start-start-radius` | hard-coded `border-top-left-radius` |
| Width / height relative to axes | `inline-size` / `block-size` | not intrinsically wrong: `width` / `height` |
| Flow-aware alignment | `text-align: start` / `end` | `text-align: left` / `right` |

**Important exception:** Physical properties are valid for genuinely physical requirements (e.g., a map control anchored to the geographic east side of a viewport), canvas coordinates, certain media layouts, and third-party integration contracts. `width`, `height`, `top`, `bottom`, and `inset: 0` are not automatically RTL bugs. Audit intent, not just syntax.

```css
.notification {
  position: relative;
  padding-block: 0.875rem;
  padding-inline: 1rem 2.75rem;
  border-inline-start: 0.25rem solid var(--accent, #2aa8a0);
  border-radius: 0.875rem;
}
.notification__icon {
  position: absolute;
  inset-inline-end: 1rem;
  inset-block-start: 50%;
  transform: translateY(-50%);
}
```

Use `gap` for inter-item spacing where appropriate; this often removes the need for start/end margins entirely. Do not add both physical and logical declarations for the same edge without an intentional, documented fallback strategy.

## 4. DOM, layout flow, and navigation order

- Keep the DOM in the content's logical reading/interaction sequence. Visual RTL does not require reversed arrays or `flex-direction: row-reverse` as a general technique.
- `display: flex` and Grid layout respect container direction in their placement rules, but **explicit placement**, `order`, `grid-area`, transforms, absolute positioning, icons, and gestures still need targeted checks.
- Do not change tab/focus order merely to match a screenshot. Avoid positive `tabindex` values and CSS `order` for semantically meaningful reordering.
- Place landmarks (`header`, `nav`, `main`, `aside`, `footer`) according to their real purpose, not just their visual side.
- Keep destructive or critical actions discoverable and consistently ordered; when a component is intentionally mirrored, validate touch/keyboard and muscle-memory expectations.

### 4.1 A direction-aware dashboard skeleton

The following *illustrates layout foundations*, not a complete application. It borrows the existing `demo.html` visual language (soft surfaces, deep-blue primary, turquoise accent, calm spacing) **without modifying that demo or requiring those colors in other brands**.

```html
<div class="app-shell" lang="fa" dir="rtl">
  <a class="skip-link" href="#dashboard-main">رفتن به محتوای اصلی</a>
  <aside class="app-sidebar" aria-label="ناوبری کناری">
    <nav aria-label="منوی اصلی">
      <a aria-current="page" href="#overview">نمای کلی</a>
      <a href="#orders">سفارش‌ها</a>
    </nav>
  </aside>
  <main class="app-main" id="dashboard-main">
    <header class="page-header">
      <div>
        <p class="page-eyebrow">داشبورد / امروز</p>
        <h1>نمای کلی فروش</h1>
      </div>
      <button type="button">دریافت گزارش</button>
    </header>
    <section class="card-grid" aria-label="شاخص‌های کلیدی">
      <article class="metric-card">
        <h2>سفارش‌های امروز</h2>
        <p><data value="128">۱۲۸</data></p>
      </article>
      <article class="metric-card">
        <h2>نرخ تبدیل</h2>
        <p><data value="4.2">۴٫۲٪</data></p>
      </article>
    </section>
  </main>
</div>
```

```css
:root {
  color-scheme: light;
  --foundation-page: #f6f8fc;
  --foundation-card: #fff;
  --foundation-text: #0f172a;
  --foundation-border: #e2e8f0;
  --foundation-accent: #2aa8a0;
  --foundation-radius: 0.875rem;
}
*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; }
.app-shell {
  display: grid;
  grid-template-columns: minmax(14rem, 17rem) minmax(0, 1fr);
  min-block-size: 100vh;
  background: var(--foundation-page);
  color: var(--foundation-text);
}
.app-sidebar {
  min-inline-size: 0;
  padding: 1.25rem;
  border-inline-end: 1px solid var(--foundation-border);
  background: var(--foundation-card);
}
.app-sidebar nav { display: grid; gap: 0.5rem; }
.app-sidebar a { padding: 0.75rem; border-radius: 0.625rem; }
.app-main { min-inline-size: 0; padding: clamp(1rem, 2.5vw, 2rem); }
.page-header { display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; justify-content: space-between; }
.page-eyebrow { margin: 0; opacity: 0.7; }
.page-header h1 { margin-block: 0.25rem 0; }
.card-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; margin-block-start: 1.5rem; }
.metric-card {
  min-inline-size: 0;
  padding: clamp(1rem, 2vw, 1.5rem);
  border: 1px solid var(--foundation-border);
  border-radius: var(--foundation-radius);
  background: var(--foundation-card);
  box-shadow: 0 0.4rem 1.25rem rgb(15 23 42 / 5%);
}
.metric-card h2 { margin: 0; font-size: 1rem; font-weight: 600; }
.metric-card p { margin-block: 0.75rem 0; font-size: clamp(1.5rem, 3vw, 2rem); font-weight: 750; font-variant-numeric: tabular-nums; }
.skip-link { position: absolute; inset-block-start: -5rem; inset-inline-start: 1rem; z-index: 10; }
.skip-link:focus { inset-block-start: 1rem; background: white; padding: 0.75rem; }
:where(a, button, input, select, textarea):focus-visible { outline: 2px solid #1c39bb; outline-offset: 3px; }
@media (max-width: 52rem) {
  .app-shell { grid-template-columns: minmax(0, 1fr); }
  .app-sidebar { border-inline-end: 0; border-block-end: 1px solid var(--foundation-border); }
  .card-grid { grid-template-columns: minmax(0, 1fr); }
}
```

**Integration notes:** The demo already defines semantic tokens and Light/Dark themes. In an actual integration, **reuse its existing variables** instead of copying these scoped illustration values; verify light/dark contrast before adoption. This snippet intentionally does not implement a mobile drawer, chart, menu behavior, or any persistence.

## 5. Responsive RTL: viewport and component context

### 5.1 Viewport responsiveness

- Use Grid/Flexbox with `minmax(0, 1fr)` and `min-inline-size: 0` for shrinkable children.
- Use `clamp()` deliberately for typography and spacing, but test 200% zoom, narrow content, and long translated labels.
- Favor wrapping and intentional stacking over squeezing actions until labels become unreadable.
- Never rely on a single desktop screenshot as evidence of mobile usability.

### 5.2 Container queries for reusable cards

A card's layout often depends on the **space given to its parent**, not the entire browser viewport. Establish an explicit query container around the component:

```html
<div class="card-host" dir="rtl">
  <article class="summary-card">
    <div class="summary-card__content">
      <h2>روند سفارش‌ها</h2>
      <p>مقایسه هفت‌روزه</p>
    </div>
    <a href="#details">مشاهده جزئیات</a>
  </article>
</div>
```

```css
.card-host { container: summary / inline-size; min-inline-size: 0; }
.summary-card { display: grid; gap: 1rem; padding: 1rem; }
.summary-card__content { min-inline-size: 0; }
@container summary (min-width: 36rem) {
  .summary-card { grid-template-columns: minmax(0, 1fr) auto; align-items: center; }
}
```

The `@container` rule styles descendants of the qualifying ancestor, not the query container itself. Check your browserslist/support policy before adding newer CSS syntax; provide a functional stacked layout without container queries when possible.

### 5.3 Overflow and text expansion

```css
.card-title { min-inline-size: 0; overflow-wrap: break-word; }
.technical-value { overflow-wrap: anywhere; }
.table-scroll { max-inline-size: 100%; overflow-x: auto; }
```

Use `overflow-wrap: anywhere` selectively for technical strings; do not indiscriminately break connected Persian/Arabic text. Preserve a readable accessible table structure even when horizontal scrolling is needed.

## 6. Forms and data have their own direction contracts

```html
<form lang="fa" dir="rtl">
  <div class="field">
    <label for="full-name">نام و نام خانوادگی</label>
    <input id="full-name" name="fullName" autocomplete="name" dir="auto" required />
  </div>
  <div class="field">
    <label for="account-email">ایمیل</label>
    <input id="account-email" name="email" type="email" autocomplete="email" dir="ltr" required />
  </div>
  <div class="field">
    <label for="tracking">کد رهگیری</label>
    <input id="tracking" name="tracking" dir="ltr" inputmode="text" />
  </div>
  <button type="submit">ثبت اطلاعات</button>
</form>
```

- Direction and alignment are not identical. Decide whether email, telephone, URL, IBAN, and tracking fields must remain LTR by their data contract. International E.164 telephone numbers are one example; locale-specific phone formats may differ.
- Do not mix display-formatted digits with canonical stored identifiers. Never localize an API key, postal code, or account ID by blindly substituting digits.
- Use explicit `aria-invalid` and associated errors only when an actual error state exists; see `06-accessibility.md` for the full interaction contract.
- When displaying numbers or dates, use a locale policy (`Intl.NumberFormat`, `Intl.DateTimeFormat`) and an explicit calendar choice where necessary. Persian language does **not** automatically imply that every date must be Jalali.

```js
const countLabel = new Intl.NumberFormat("fa-IR").format(1280);
const explicitPersianCalendar = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  year: "numeric", month: "long", day: "numeric"
});
// Use the first value for display only; persist canonical numeric values.
// Format dates only when the product has explicitly selected this calendar.
```

## 7. Tailwind CSS v4: use directional utilities intentionally

The examples below are valid *illustrations* for projects already configured with suitable Tailwind utilities; this reference does not install Tailwind or guarantee that a particular class is enabled by a project's configuration.

| Need | Example |
| --- | --- |
| Margin at inline start/end | `ms-3` / `me-3` |
| Padding at inline start/end | `ps-4` / `pe-4` |
| Logical start/end positioning | `start-0` / `end-0` |
| Text alignment relative to flow | `text-start` / `text-end` |
| Logical inline border | `border-s-2` / `border-e-2` |
| Corner at block-start + inline-start | `rounded-ss-lg` |
| Corner at block-start + inline-end | `rounded-se-lg` |

```html
<div dir="rtl" class="flex min-w-0 items-center gap-3 rounded-xl border border-s-4 ps-4 pe-5">
  <span class="min-w-0 flex-1 text-start">سفارش جدید ثبت شد</span>
  <button class="shrink-0">جزئیات</button>
</div>
```

Do not conflate `rounded-tl-*` with `rounded-ts-*`: use the actual Tailwind logical-corner utilities after checking the version's documentation. Keep intentional physical dimensions and icon geometry unchanged unless review establishes they are wrong.

## 8. Motion, icons, and physical exceptions

CSS transforms like `translateX()` are not automatically direction-aware. If a drawer should enter from the inline-start edge, parameterize its movement or use selectors based on the container's direction. Test open **and** closed states in both directions; ensure hidden content is not left keyboard-focusable.

- Mirror a chevron or arrow **only** when it represents a direction-sensitive action (back/forward/next/previous). Test semantics when switching locales.
- Do not automatically mirror logos, wordmarks, playback controls, illustrations, maps, charts, or meaningful physical-direction icons.
- Honor `prefers-reduced-motion`; preserve state feedback using opacity, color, or non-animated alternatives where appropriate.
- For overlays and focus management, use the component and accessibility reference guides rather than treating a transform as complete implementation.

## 9. Visual quality is separate from RTL correctness

**Preserve the identity of the existing `demo.html`:** layered surfaces, restrained deep-blue/turquoise accents, readable Persian typography, meaningful whitespace, semantic tokens, and balanced corner radii. Upgrade the experience without replacing it with an unrelated template.

Quality criteria for future implementations:

1. Clear hierarchy: one primary action per section, scannable labels, deliberate heading and number scales.
2. Cohesive spacing: use a tokenized spacing system; avoid random per-component magic numbers.
3. Premium restraint: gradients, shadows, blur, and motion must communicate hierarchy or interaction; no gratuitous decoration.
4. Robust states: loading, empty, error, success, disabled, hover, keyboard focus, and dark-mode surfaces must all be considered.
5. Adaptive composition: cards and typography reflow cleanly in RTL and LTR without clipping or misleading visual order.
6. Brand independence: use the demo palette as an *example theme*, not a universal requirement of Persian or Arabic UI.

New CSS techniques (container queries, modern color spaces, color mixing, view transitions) are **progressive enhancements**: adopt them only when they solve a real problem and meet the product's browser and accessibility requirements. Detailed tokens and motion choices belong in references 03 and 05.

## 10. Manual validation matrix (not a claim of execution)

Run these checks against an actual rendered page and record evidence. Merely reading this guide does not mean the checks have passed.

| Scenario | What to check | Failure example |
| --- | --- | --- |
| Persian RTL on mobile | Document direction; readable headlines; stacked actions; no clipped card | CTA disappears off-screen |
| Arabic RTL on desktop | Correct locale, shaping, navigation alignment, and spacing | Persian-only font causes poor Arabic rendering |
| English LTR variant | All flow-relative spacing and sidebar placement | Start border stays on the right |
| Mixed sentence | Name/URL/ID + punctuation before and after | Closing punctuation jumps position |
| Long dynamic content | Truncation/wrap, copy/paste, table scroll | Identifier becomes unreadable |
| Keyboard only | Tab order matches meaning and visible focus | Hidden drawer links receive focus |
| Dialog/drawer | Focus stays managed; Escape/return focus | Background remains actionable |
| 200% zoom / narrow viewport | Reflow and no two-dimensional page scrolling for normal text | Cards overflow viewport |
| Light/Dark | Foreground/background and focus contrast | Muted or danger text unreadable |
| Reduced motion | Essential feedback remains legible | State change communicated only by movement |

**Acceptance evidence:** For each changed component, report files changed, viewport/locale tested, commands actually run, keyboard/visual checks actually performed, failures found, and outstanding risks. Do not claim WCAG 2.2 AA conformance or production readiness without corresponding verification.

## 11. Handoff to other references

- `02-typography.md` — Persian/Arabic font selection, shaping, numeral style, typography scales.
- `03-color-and-tokens.md` — primitive → semantic → component tokens, light/dark colors, contrast.
- `04-components.md` — navigation, tabs, dialogs, tables, drawers, and interaction patterns.
- `05-motion.md` — direction-aware transitions, transforms, reduced motion.
- `06-accessibility.md` — semantics, form errors, focus management, WCAG verification.
- `07-checklist.md` — review and pull-request acceptance checklist.

Until each remaining reference has been repaired and validated, treat its incomplete examples as advisory rather than verified drop-in code.

## 12. Normative and technical sources

- W3C Internationalization — Structural markup and right-to-left text: https://www.w3.org/International/questions/qa-html-dir
- W3C Internationalization — Inline bidi markup: https://www.w3.org/International/articles/inline-bidi-markup/
- HTML Living Standard — `dir` and `bdi`: https://html.spec.whatwg.org/multipage/dom.html#the-dir-attribute
- MDN — `dir`: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/dir
- MDN — `bdi`: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/bdi
- MDN — CSS logical properties: https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Logical_properties_and_values
- MDN — CSS container queries: https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_queries
- Tailwind CSS — Border radius utilities: https://tailwindcss.com/docs/border-radius

_This document is an engineering reference, not a certification report. All snippets require integration and runtime validation in the target application._
