---
name: rtl-vibe-ui
description: >-
  Design, implement, review, and repair production-oriented right-to-left (RTL)
  interfaces for Persian (fa), Arabic (ar), and mixed RTL/LTR applications.
  Use for RTL layouts, bilingual UI, typography, forms, navigation, Tailwind CSS,
  component libraries, accessibility, design tokens, and RTL code review.
  Apply direction-aware patterns without overwriting an existing brand identity.
license: MIT
compatibility: >-
  Framework-agnostic HTML/CSS guidance; use Tailwind utility examples only in
  projects with the corresponding Tailwind version. The optional repository-level
  audit script needs Node.js 22.2+; its CI check provides limited static diagnostics.
metadata:
  author: "علی نعناکار"
  version: "1.0.1-draft"
  repository: "https://github.com/alinanakar-click2all/rtl-vibe-ui"
---

# RTL Vibe UI — RTL-first interface engineering

Build interfaces that are structurally correct for Persian and Arabic, rather
than visually reversing an LTR layout at the end. Respect the user's framework,
brand, requirements, and target languages. This skill provides an engineering
workflow; it does **not** by itself certify WCAG conformance or production readiness.

## 1. Activation and scope

Use this skill when the task includes one or more of:

- Persian, Arabic, Farsi, or another RTL-language interface.
- A bilingual or mixed-direction application, including English/code/URLs inside RTL text.
- Direction-aware UI components, forms, navigation, charts, or motion.
- A design system that must support RTL in addition to LTR.
- Reviewing or fixing RTL-related CSS, HTML, JSX/TSX, or Tailwind classes.

Do **not** force an unrelated LTR product into RTL. Preserve existing visual
identity, component APIs, business logic, framework conventions, and unrelated
CSS. An Iranian-inspired visual theme is an **optional** design direction, not
an RTL requirement.

## 2. Required workflow

### Step 1 — Inspect before changing

1. Identify the framework, styling system, version, existing design tokens, and
   whether the user wants implementation, review, or a proposal.
2. Determine the direction of each relevant surface: RTL, LTR, or mixed.
3. Identify required locales (`fa`, `ar`, English, etc.), input formats,
   navigation patterns, and accessibility constraints.
4. Read the relevant source code before editing. Reuse established components
   and tokens unless a change is justified.
5. If the user supplied a brand or design system, preserve it.

If project access or testing tools are unavailable, state that limitation;
never claim to have inspected, compiled, or tested files that were not accessed.

### Step 2 — Establish document language and direction

For a Persian page, prefer:

```html
<html lang="fa" dir="rtl">
```

For an Arabic page:

```html
<html lang="ar" dir="rtl">
```

Set both attributes on the actual document root when applicable. The values
are separate: `lang` identifies the language, while `dir` controls base text
direction. Do not add multiple `<html>` elements to one document.

For locally opposite-direction content, isolate the smallest appropriate span:

```html
<p>برای ورود، <span lang="en" dir="ltr">example.com</span> را باز کنید.</p>
<p>نام کاربر: <bdi>Alex123</bdi></p>
<p><span dir="auto">متن واردشده توسط کاربر</span></p>
```

Use `dir="auto"` for user-generated text when its direction is unknown; use
`<bdi>` to isolate short unknown-direction values within surrounding text.
Avoid `unicode-bidi: bidi-override` as a general layout fix. Do not insert
invisible direction marks unless a documented edge case requires them.

### Step 3 — Implement direction-aware layout

Prefer CSS logical properties for **direction-sensitive relationships**:

| Intent | CSS | Tailwind example |
| --- | --- | --- |
| Space before an item | `margin-inline-start` | `ms-4` |
| Space after an item | `margin-inline-end` | `me-4` |
| Start-side padding | `padding-inline-start` | `ps-4` |
| End-side padding | `padding-inline-end` | `pe-4` |
| Start-side positioning | `inset-inline-start` | `start-0` |
| End-side positioning | `inset-inline-end` | `end-0` |
| Start-aligned text | `text-align: start` | `text-start` |
| End-aligned text | `text-align: end` | `text-end` |
| Start-side border | `border-inline-start` | `border-s` |

For corners, use the correct logical corner semantics, such as
`border-start-start-radius` / `rounded-ss-*` and
`border-start-end-radius` / `rounded-se-*` where supported. Do not guess
logical utility names: verify them against the installed Tailwind version.

Physical properties are **not categorically forbidden**. Keep `width`,
`height`, fixed pixel geometry, and intentionally physical coordinates when
appropriate (e.g., maps, canvases, screen-positioned charts). Replace a
physical left/right choice only when it expresses a semantic start/end
relationship; retain intentional physical positioning with a clear reason.

Avoid solving layout by globally applying `transform: scaleX(-1)` or by
reversing DOM order solely for visual appearance. Preserve meaningful DOM and
keyboard navigation order.

### Step 4 — Typography, numbers, and data

- Use a font with tested Persian/Arabic glyph coverage and an appropriate
  license. Favor an existing project's typography tokens.
- Test shaping, diacritics, line wrapping, numeral styles, and truncation with
  actual Persian and Arabic strings; do not rely only on placeholder Latin text.
- Avoid aggressive letter spacing on connected Arabic-script text. Do not
  force font-specific OpenType features globally without validating the font.
- Format numbers, currencies, dates, and plural-sensitive labels using the
  application's locale policy (`Intl` where appropriate). Do not blindly
  convert digits or assume a Gregorian/Jalali calendar without requirements.
- Preserve the natural direction of technical identifiers, email addresses,
  and URLs. For phone fields and numeric data, choose explicit direction after
  checking the expected input/output format rather than applying a universal rule.

### Step 5 — Components and motion

- Navigation, breadcrumbs, drawers, dialogs, menus, tabs, forms, tables, charts,
  pagination, and carousels need behavior checks, not just alignment checks.
- `translateX()` and many CSS transforms do not automatically reverse in RTL.
  Parameterize or explicitly test directional transitions in both directions.
- Mirror **directional navigation** icons when their meaning changes; do not
  mirror brand marks, play icons, or non-directional symbols automatically.
- Implement drawers and dialogs with correct initial focus, focus containment,
  Escape handling, appropriate modal/background behavior, and focus restoration.
- Tabs must expose correct semantics and keyboard interactions; do not rely
  only on changing `aria-selected`.
- Honor `prefers-reduced-motion` without removing essential state feedback.

### Step 6 — Semantic tokens and theming

Prefer a `primitive → semantic → component` token architecture. Components
should consume semantic tokens rather than brand-specific hex values. Verify
foreground/background pairs in both light and dark modes, including hover,
selected, disabled, danger, and focus states.

Do not impose a culturally inspired color scheme on a product with a defined
brand. A Persian-inspired palette may be offered as an opt-in theme; it is not
required for RTL correctness.

### Step 7 — Accessibility and validation

Treat WCAG 2.2 AA as a **verification target**, not an automatic certification.
Use native semantic controls whenever possible. Review:

- `lang`/`dir`, semantic reading order, labels, and meaningful focus order.
- Keyboard-only navigation and visible focus indicators.
- Dialogs, drawers, tabs, comboboxes, and menus in open/closed/error states.
- Error identification and programmatic association (`aria-describedby`,
  `aria-invalid`, and live announcements where appropriate).
- Text contrast (generally at least 4.5:1 for normal text and 3:1 for large
  text under WCAG AA) and relevant non-text contrast requirements.
- Target size under the applicable WCAG criteria; do not mislabel the 44×44
  enhanced target-size criterion (AAA) as a universal WCAG AA requirement.
- Responsive overflow, 200% zoom, text resizing, and reduced motion.
- Mixed Arabic/Persian/English content at mobile and desktop sizes.

Automated tools can detect some issues, but cannot establish full accessibility
conformance. Report what was checked and what still requires manual testing.

## 3. Reference map — read on demand

Detailed guides belong in the following paths relative to this `SKILL.md`:

| Task | Reference |
| --- | --- |
| HTML direction, language, bidi, logical layout | `references/01-foundations.md` |
| Persian/Arabic typography and numerals | `references/02-typography.md` |
| Color systems and semantic tokens | `references/03-color-and-tokens.md` |
| Navigation and UI component patterns | `references/04-components.md` |
| Directional transitions and reduced motion | `references/05-motion.md` |
| Semantics and keyboard accessibility | `references/06-accessibility.md` |
| Review and PR acceptance checklist | `references/07-checklist.md` |

**Repository status (2026-11-22):** The seven references above are
available as structured Markdown engineering guides. The earlier
warning about truncated files and copied Markdown wrappers no longer
describes their current file structure. Their examples still require
integration and behavioral validation in each target framework.

The `assets/tailwind-tokens.css` file is now plain CSS source intended
for a Tailwind CSS v4 build pipeline. The previous Markdown wrapper
issue has been resolved. A local Tailwind CSS v4.3.5 CLI smoke build
succeeded, and nine selected CSS class/token markers were verified.
This does not establish full host-framework integration, visual quality,
contrast compliance, or universal production compatibility.
The palette is optional and must respect the existing product brand.

The optional repository-level auditor is `../../scripts/audit-rtl.mjs`
(relative to this skill directory). It now has automated Node.js tests,
and repository CI runs `--check` against the skill assets. It remains
a heuristic static-analysis tool, not a complete RTL validator:
`--check` fails on errors, while warnings only become failures with
`--strict`. The script may be unavailable in standalone skill installs.
Review its findings manually, do not automatically run `--fix` on user
files, and validate real UI behavior in the target application.

## 4. Small reference implementation

```html
<main lang="fa" dir="rtl" class="page">
  <form aria-labelledby="signin-heading">
    <h1 id="signin-heading">ورود به حساب</h1>
    <label for="email">ایمیل</label>
    <input id="email" name="email" type="email" autocomplete="email"
           dir="ltr" required />
    <button type="submit">ادامه</button>
  </form>
</main>
```

```css
.page {
  padding-inline: 1rem;
  max-inline-size: 72rem;
  margin-inline: auto;
}
.page form {
  display: grid;
  gap: 0.75rem;
}
.page input {
  min-inline-size: 0;
  text-align: start;
}
.page :focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 3px;
}
```

This is a minimal direction-aware example, not a complete accessible form.
Error handling, visual design, contrast, and validation must still be added
according to the application requirements.

## 5. Output contract

For any implementation or review, respond with:

1. **Scope:** target locales, RTL/LTR behavior, framework, and assumptions.
2. **Changes:** exact files/components changed and why; preserve unaffected
   project behavior.
3. **Verification:** tests or manual checks **actually performed**, including
   their results. Never present an unexecuted check as passed.
4. **Open risks:** remaining RTL, accessibility, browser, or localization risks.
5. **Follow-up:** the smallest concrete next action, when applicable.

Do not claim "WCAG compliant", "production-ready", "tested", or "CI passed"
without evidence matching that claim. When only static inspection is possible,
label findings as static-analysis observations.
