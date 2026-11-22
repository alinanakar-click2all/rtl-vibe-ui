# Typography — Persian & Arabic UI typography

> RTL Vibe UI · Reference 02 · 1.0.1 repair draft
> Scope: text hierarchy, Arabic-script shaping, multilingual font stacks, variable fonts, numerals, microcopy, font performance, and typography QA.

Use this reference when implementing Persian (`fa`), Arabic (`ar`), or multilingual interfaces. Read `01-foundations.md` for document direction, `lang`, bidi isolation, and logical layout. Typography is a **functional system**, not a decorative font choice. Treat the existing brand and `demo.html` visual direction as a starting point, not an unchangeable set of pixel values.

## 1. Non-negotiable rules

1. Set a correct `lang` and `dir` on the document or relevant subtree; do **not** use CSS `direction` alone as a substitute for semantic direction metadata.
2. Use a font verified to support the actual Persian/Arabic glyph repertoire, shaping, diacritics, and selected weights. Test genuine Arabic words, not only Persian placeholder strings.
3. Maintain proper Arabic joining. Do not add global positive `letter-spacing` to joined Arabic-script text or simulate letter spacing by inserting characters.
4. Never turn paragraphs into images to solve font problems. Text must remain selectable, searchable, scalable, and accessible.
5. Text hierarchy, line length, contrast, focus, zoom, and text-spacing overrides must remain usable in both RTL and LTR.
6. Use font and language features only when they exist in the chosen font. In particular, do not globally force `font-feature-settings: "ss01"` without verifying its effect.
7. Do not overwrite a product's branding merely to apply the example fonts or colors in this guide.

## 2. Font selection and language-aware stacks

Choose fonts in this order: legal usage and redistribution rights; shaping and script coverage; readable forms at the intended sizes; variable/static weights; numerical glyphs; file size and subset availability; distinctive brand expression.

- **Persian UI:** Vazirmatn is one possible reference face, as used by `demo.html`; other properly licensed, tested families may be more appropriate to the brand.
- **Arabic UI:** test an Arabic-oriented font with real Arabic content and optional diacritics. Avoid assuming a Persian-optimized typeface renders every Arabic language convention ideally.
- **Latin and code:** ensure Latin content, punctuation, and abbreviations remain legible. Use a true monospace face for identifiers/code, not for Persian body prose.
- **Fallback:** list fonts that actually ship with the product or are reliably available. A font family name in CSS does **not** download its font file.

Example stack, assuming the named fonts are loaded or installed:

```css
:root {
  --font-ui-fa: "Vazirmatn", "Noto Sans Arabic", system-ui, sans-serif;
  --font-ui-ar: "Noto Sans Arabic", "Vazirmatn", system-ui, sans-serif;
  --font-code: ui-monospace, "Cascadia Code", Consolas, monospace;
}

html:lang(fa) { font-family: var(--font-ui-fa); }
html:lang(ar) { font-family: var(--font-ui-ar); }

:lang(fa) { font-synthesis: none; }
:lang(ar) { font-synthesis: none; }

code, kbd, samp, pre { font-family: var(--font-code); }
```

`font-synthesis: none` is a design choice: it prevents fake weights/styles, but can leave a requested weight unavailable. Supply the actual font files and weights before adopting it. For multilingual fragments, apply language tags to the fragment rather than guessing language from direction alone:

```html
<html lang="fa" dir="rtl">
  <body>
    <p>وضعیت سفارش: <bdi>Order-8421</bdi></p>
    <p>ترجمه عربی: <span lang="ar" dir="rtl">مرحبًا بكم في لوحة التحكم</span></p>
    <p>Label: <span lang="en" dir="ltr">Account settings</span></p>
  </body>
</html>
```

For mixed content supplied by users, prefer `<bdi>` or `dir="auto"`; do not concatenate directional control characters into stored data unless a specific protocol requires them.

## 3. Font loading and variable-font discipline

Self-hosting may improve control over privacy, availability, caching, and performance. Confirm the **actual font filename, license, glyph range, and supported weight axis** first. The path below is illustrative; do not paste it into production unless the file exists.

```css
/* Example: replace with a real, licensed WOFF2 file and verified weight range. */
@font-face {
  font-family: "Vazirmatn";
  src: url("/fonts/Vazirmatn-variable.woff2") format("woff2");
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
}
```

- Use `font-display: swap`, `fallback`, or `optional` based on the measured rendering tradeoff, not a blanket rule. `swap` can display fallback text sooner but can cause shifts if metrics differ.
- Preload **only** a genuinely critical same-origin font asset when measurement supports it; a wrong preload can waste bandwidth.
- If the face supports an optical-size (`opsz`) axis, `font-optical-sizing: auto` may improve rendering; do not assume every variable font has that axis.
- Prefer semantic `font-weight`, `font-stretch`, and `font-optical-sizing` over low-level `font-variation-settings` unless a documented axis requires direct control.
- Font metric overrides (`size-adjust`, `ascent-override`, `descent-override`, `line-gap-override`) require measurement; never paste guessed values into the design system.
- When subsetting, ensure Persian and Arabic letters, extended glyphs, numerals, combining marks, punctuation, and all needed language-specific forms survive.

## 4. A semantic, fluid type system

Use semantic tokens rather than assigning unrelated sizes to every element. Values below are **starting points**, not a universal prescription. Tune them against the chosen font's metrics and `demo.html` design language.

```css
:root {
  --type-xs: 0.8125rem;          /* secondary labels */
  --type-sm: 0.875rem;            /* compact, but not core body text */
  --type-md: 1rem;                /* primary reading text */
  --type-lg: 1.125rem;
  --type-title: clamp(1.5rem, 1.2rem + 1vi, 2rem);
  --type-display: clamp(2rem, 1.45rem + 2vi, 3rem);

  --leading-body: 1.75;
  --leading-ui: 1.5;
  --leading-heading: 1.3;
  --measure-prose: 68ch;
}

body { font-size: var(--type-md); line-height: var(--leading-body); }
h1, h2, h3 { line-height: var(--leading-heading); }
.page-title { font-size: var(--type-title); font-weight: 800; }
.hero-title { font-size: var(--type-display); font-weight: 800; }
.body-copy { max-inline-size: var(--measure-prose); }
.meta, .helper-text { font-size: var(--type-sm); line-height: var(--leading-ui); }
```

**Important:** `ch` measures the advance width of the `0` glyph, not Persian character count. Validate the actual rendered line length and wrapping rather than treating `68ch` as a universal readability target.

### Practical hierarchy for premium RTL dashboards

| UI role | Preferred behavior | Avoid |
| --- | --- | --- |
| Page title | Clearly dominant, sufficient spacing, wraps cleanly | Huge titles that crowd controls |
| Card heading | Consistent weight and spacing across cards | Different arbitrary sizes for adjacent cards |
| Main body | Comfortable default size and line height | 12–13px for essential paragraphs |
| Metric | Distinct numeric rhythm and aligned units | Giant digits without context/labels |
| Table header | Concise, legible, visually differentiated | 10–11px as the only cue |
| Helper/error | Readable, associated with its field | Conveying status by color alone |
| Badge | Short and intentionally compact | Dense, clipped labels |

The current demo contains 11–13px labels and 13px table/content styles. Preserve its refined density, but test whether important information should be promoted to 14–16px, particularly on mobile, at 200% zoom, and with user text-spacing overrides.

## 5. Arabic-script shaping, spacing, and punctuation

Arabic-script letters join contextually. Their typography is not equivalent to Latin character boxes.

- Default to `letter-spacing: normal` for Persian/Arabic runs. Do not use spaced-out Arabic words as a decorative substitute for true typographic hierarchy.
- Do not insert tatweel (`ـ`, U+0640) to justify headings or pad controls.
- Avoid blanket `text-align: justify`; browsers, fonts, and languages differ in their handling of Arabic justification and kashida. Test any editorial justification with real copy.
- Use real punctuation and locale conventions in text content. A paragraph may legitimately mix `،`, `؛`, `؟`, ASCII punctuation, and Latin product identifiers.
- Do not strip diacritics (`َ ِ ُ ّ`) from Arabic text where they convey meaning; do not mistake diacritics for layout noise.
- Do not apply global `text-transform: uppercase` or exaggerated tracking to Arabic-script headings.
- Use Unicode normalization and spelling policies **only** when required by the content system. Persian `ی`/`ک` and Arabic `ي`/`ك` should not be blindly rewritten in every locale or proper name.

### Persian half-space (ZWNJ)

For Persian compounds that require a half-space, use U+200C Zero Width Non-Joiner, not a regular space or tatweel. For example: `می‌روم`, `برنامه‌ریزی`, `رابط‌کاربری` (follow the project's editorial style for specific words). Do not inject ZWNJ automatically without language-aware review.

```html
<p lang="fa">گزارش‌ها به‌روزرسانی شدند.</p>
<p lang="ar">تَمَّ تحديثُ التقارير.</p>
```

## 6. Text wrapping, truncation, and responsive behavior

Start with natural wrapping. Use truncation only if full text is still discoverable and task completion remains possible. Avoid breaking Persian words character-by-character.

```css
.page-title, .card-title { overflow-wrap: break-word; }
.page-title { text-wrap: balance; }
.prose { text-wrap: pretty; }

.data-id, .long-url {
  direction: ltr;
  unicode-bidi: isolate;
  overflow-wrap: anywhere;
}

.one-line-label {
  min-inline-size: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

`text-wrap: balance` / `pretty` are progressive enhancements: verify target-browser behavior and gracefully fall back to normal wrapping. Do not add `.one-line-label` to critical instructions, validation messages, or navigation items when truncation hides meaning. `word-break: break-all` is generally a poor default for Arabic-script prose.

At 320 CSS px width and at 200% zoom, headings, dialog text, field labels, and table data should be usable without clipping or overlapping. For long text, test with a realistic customer name, translated menu item, URL, and diacritized Arabic sentence.

## 7. Numerals, dates, money, and tabular data

**Localization and layout are separate.** `dir="rtl"` does not automatically choose digits, calendar, currency, or date format. Ask which locale and numbering system the product requires.

Use `Intl` for **display formatting**, not manual digit replacement:

```js
const fa = new Intl.NumberFormat("fa-IR", {
  numberingSystem: "arabext",
  maximumFractionDigits: 1,
});
const ar = new Intl.NumberFormat("ar-EG", {
  numberingSystem: "arab",
  maximumFractionDigits: 1,
});

console.log(fa.format(1234567.8));
console.log(ar.format(1234567.8));

const jalali = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  dateStyle: "medium",
  timeZone: "Asia/Tehran",
});
console.log(jalali.format(new Date("2026-11-22T00:00:00Z")));
```

`Intl.DateTimeFormat` formats a date in the requested calendar where supported; it does **not** provide a date picker or convert an ISO timestamp's meaning into local business time without an explicit time zone. Test regional behavior and decide whether users need Gregorian, Persian, or Hijri calendar output.

For analytics columns, provide tabular digits **if the chosen font supports the feature**:

```css
.metric, .money, .data-table .numeric {
  font-variant-numeric: tabular-nums;
}

.data-table .numeric { text-align: end; }
```

- `tabular-nums` changes number glyph advances; it does not change Persian/Arabic digit selection.
- Test negative signs, decimal separators, percent placement, currency names, and bidirectional punctuation in actual rows.
- Preserve machine-readable raw numeric values for sorting, calculations, and APIs. Do not parse already-localized display strings with `parseFloat`.
- For phone numbers, URLs, API keys, bank identifiers, and code, use an explicit LTR input/display context as appropriate, while keeping labels and surrounding page RTL.
- In forms, `inputmode="numeric"` hints the keyboard but does not validate or normalize the submitted data. Validation and storage remain separate responsibilities.

```html
<label for="account">شناسه حساب</label>
<input id="account" name="account" type="text" dir="ltr" inputmode="numeric" autocomplete="off">
<p>شناسه: <bdi>AB-20983/1</bdi></p>
```

## 8. Microcopy, content layout, and visual polish

A premium interface is often made by consistent text decisions rather than dramatic effects.

1. Use precise headings and action labels. Prefer a short verb + object to vague labels such as “اینجا کلیک کنید”.
2. Keep verbs and terminology consistent across menus, tables, dialogs, notifications, and validation messages.
3. Respect brand tone without degrading clarity. Human-readable microcopy is more valuable than decorative filler.
4. Align labels and their values consistently at inline start/end; use CSS logical properties instead of hardcoded left/right margins.
5. Use contrast, weight, whitespace, and surface hierarchy before using gradients or ornamental typography.
6. Verify that translated Arabic labels can be longer or shorter than Persian labels; components must adapt rather than clip.
7. Use meaningful inline emphasis, not an entire paragraph in bold. Reserve extra-bold weights for significant hierarchy or metrics.
8. Ensure error/success content has semantic wording and accessible associations, not only red/green styling.

### Example: dashboard metric with accessible context

```html
<section class="metric-card" aria-labelledby="sales-heading" lang="fa" dir="rtl">
  <h2 id="sales-heading">فروش این ماه</h2>
  <p class="metric-number">
    <data value="12345678">۱۲٬۳۴۵٬۶۷۸</data>
    <span class="metric-unit">تومان</span>
  </p>
  <p class="metric-note">۱۲ درصد بیشتر از ماه گذشته</p>
</section>
```

```css
.metric-card { min-inline-size: 0; }
.metric-number {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.5rem;
  font-size: clamp(1.5rem, 1.2rem + 1vi, 2rem);
  line-height: 1.3;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}
.metric-unit { font-size: 0.55em; font-weight: 500; }
.metric-note { font-size: var(--type-sm, 0.875rem); }
```

The displayed numeric string above is illustrative. In an application, format numeric data from a single source of truth and make the currency unit and underlying value consistent with product requirements. Do not equate “تومان” and “ریال” implicitly.

## 9. Accessibility requirements for typography

- Use actual headings (`h1`–`h6`), lists, labels, and native form elements; visual size alone does not establish document semantics.
- Ensure text and meaningful state indicators meet the applicable WCAG contrast requirements in both light and dark themes. A body-text target of at least 4.5:1 and large-text target of at least 3:1 are common WCAG AA starting points; check the actual criterion and exceptions.
- Support browser zoom to 200% and applicable reflow/text-spacing requirements without loss of information or functionality.
- Test WCAG 1.4.12 text-spacing overrides: users may increase line height, paragraph spacing, letter spacing, and word spacing. The design should not lose content even if the author's default Arabic-script letter spacing is `normal`.
- Never disable user font or zoom preferences to protect a composition.
- Avoid low-opacity essential text and extremely thin font weights on small screens.
- Test real reading order and language switching with assistive technology; a correct visual RTL layout alone does not guarantee accurate pronunciation or semantics.

## 10. Test matrix and release gate

| Scenario | Expected result |
| --- | --- |
| Persian `fa`, RTL, mobile/desktop | Connected letters, natural wrapping, stable hierarchy |
| Arabic `ar`, RTL, with diacritics | All marks visible; language-appropriate font shaping |
| LTR English page containing Persian names | Fragment has correct language/direction and isolation |
| Persian dashboard with Latin identifiers | IDs/URLs visually intact; no punctuation reversal |
| Light and dark themes | Text tokens readable with verified foreground/background pairs |
| 200% zoom and 320px viewport | No lost controls or clipped essential text |
| User text-spacing overrides | Text not hidden or overlapping important controls |
| Font download blocked | Fallback usable, legible, no catastrophic layout shift |
| Numbers/dates/currency | Locale and calendar chosen explicitly; values remain accurate |
| RTL ↔ LTR switching | Text structure and hierarchy remain coherent |

### Agent acceptance checklist

- [ ] The correct `lang` and `dir` are present, including mixed-language fragments.
- [ ] Font loading, font license, actual weights, and glyph coverage are verified.
- [ ] Arabic shaping, ZWNJ, diacritics, punctuation, and numerals have been tested with representative strings.
- [ ] Typography uses semantic tokens, not one-off values scattered through every component.
- [ ] Critical content remains readable on narrow screens and under zoom and text-spacing overrides.
- [ ] Metrics are formatted with a locale-aware approach; identifiers remain stable and isolated.
- [ ] Any font feature/variation axis is supported by the selected font.
- [ ] Text contrast, reading order, and accessibility have been tested or explicitly reported as unverified.
- [ ] The UI improves or preserves the current brand and demo character rather than replacing it with generic styles.

Do not declare these checks passed without running the relevant checks. If the runtime or font assets are unavailable, report the unverified items.

## Further reading (authoritative sources)

- W3C Internationalization — HTML bidi: https://www.w3.org/International/questions/qa-html-dir.html
- W3C Internationalization — Arabic justification: https://www.w3.org/International/articles/typography/justification
- MDN — font optical sizing: https://developer.mozilla.org/en-US/docs/Web/CSS/font-optical-sizing
- MDN — font-face / font-display: https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display
- MDN — numeric variants: https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant-numeric
- MDN — text-wrap: https://developer.mozilla.org/en-US/docs/Web/CSS/text-wrap
- W3C WCAG 2.2 — https://www.w3.org/TR/WCAG22/
