# Checklist — RTL Vibe UI release and review quality gates

> RTL Vibe UI · Reference 07 · Working draft for the 1.0.1 repair branch
>
> Scope: PR review, CI validation, RTL/LTR verification, premium visual quality, accessibility, performance, and evidence-based release decisions.

This is the operational acceptance checklist for the skill entrypoint and references `01-foundations.md` through `06-accessibility.md`. It is written for both developers and AI agents. **Check a box only when the named verification was actually performed**; an unexecuted test is not a pass. Mark inapplicable items `N/A` with a reason.

The checklist consolidates these references: `01-foundations.md` (language/bidi/layout), `02-typography.md` (text/data), `03-color-and-tokens.md` (themes), `04-components.md` (interaction contracts), `05-motion.md` (transitions), and `06-accessibility.md` (WCAG/keyboard).

The repository's existing `demo.html` is the visual reference for its own brand: retain its considered hierarchy, layered surfaces, Persian-inspired accents, and polished dashboard composition. Those choices are **optional for other products**. RTL correctness is independent of a particular color palette or visual style.

## 1. How to use this checklist

Choose the review scope before using any gate:

| Scope | Required evidence | Example |
|---|---|---|
| Documentation / skill-only patch | Skill structure, links, code examples, existing CI results | Updating `references/02-typography.md` |
| CSS / token patch | Above plus computed styles, both themes and relevant viewports | Updating semantic surfaces |
| Interactive component patch | Above plus keyboard, focus, state, RTL/LTR, accessibility review | Repairing a drawer or tab component |
| Release candidate | All applicable checks, integration tests, known limitations, supported browser matrix | Tagging version 1.0.1 |

Use three result states: **PASS**, **FAIL**, and **NOT RUN / N/A**. Never hide `NOT RUN` inside `PASS`; **N/A** requires a reason.

An automated check can show the absence of *some* failures, not the absence of all usability or accessibility problems. Keep the audit script advisory until its detection and exit-code behavior have been repaired and tested.

## 2. Copy-ready Pull Request checklist

Paste this section into an applicable PR or adapt it for `.github/pull_request_template.md`. Do not overwrite an existing project-specific template without review.

```markdown
## RTL Vibe UI — PR quality checklist

### Scope and evidence
- [ ] Scope, framework/version, supported locales, affected files and risk level are listed.
- [ ] Changes preserve existing component APIs, content and visual identity unless explicitly requested.
- [ ] Before/after screenshots or recordings are attached for visual/interactive changes.
- [ ] Tests actually run are listed with commands, environment and results; unrun tests are explicitly marked.

### Language and bidirectional text
- [ ] The applicable page/root has correct `lang` and base `dir` (for example `fa` + `rtl`).
- [ ] Embedded Latin, user-generated and unknown-direction strings are isolated where appropriate (`bdi`, `dir="auto"`, or scoped `dir="ltr"`).
- [ ] Email, URL, phone, currency, dates, codes and identifiers use a documented locale/direction policy.
- [ ] Persian/Arabic sample strings, mixed punctuation, ZWNJ, long words and diacritics have been reviewed.

### Direction-aware layout
- [ ] Semantic start/end relationships use logical CSS or verified framework equivalents.
- [ ] Physical coordinates are intentional where retained (maps, graphics, fixed geometry, etc.).
- [ ] Logical border-radius classes and directional transforms were checked against the framework version.
- [ ] DOM reading order and keyboard order remain meaningful; CSS `order` and `row-reverse` do not disguise a broken sequence.
- [ ] Horizontal overflow is controlled; data tables may scroll within an accessible named region where needed.

### Visual design and design tokens
- [ ] Typography hierarchy, spacing rhythm, surface elevation and alignment match the product's design language.
- [ ] Semantic tokens are used instead of unexplained hard-coded colors in components.
- [ ] Light and dark themes, as applicable, retain contrast and visible state distinctions.
- [ ] Empty, loading, error, success, disabled, hover, pressed and focus states are designed as applicable.
- [ ] No accidental visual regression occurred in the existing demo or core UI screens.

### Components and interaction
- [ ] Navigation, breadcrumbs, drawers, dialogs, forms, tabs, menus and tables have correct semantics and behavior where applicable.
- [ ] Modal interactions include focus handling, Escape behavior, background isolation and focus return.
- [ ] Tabs expose accessible names and selection states, with documented keyboard behavior.
- [ ] Feedback remains understandable without relying solely on color, motion or an icon.
- [ ] Gestures have an accessible non-gesture alternative where required.

### Accessibility
- [ ] Keyboard-only navigation, visible focus and logical order have been manually reviewed.
- [ ] Form labels, descriptions, errors and live updates are programmatically associated where needed.
- [ ] Text and important non-text contrast were measured against the applicable WCAG 2.2 AA criteria.
- [ ] Pointer targets satisfy 2.5.8 (24 × 24 CSS px or documented exceptions); larger targets are a preferred design choice.
- [ ] 200% text resize and 320 CSS px reflow were evaluated with applicable exceptions.
- [ ] `prefers-reduced-motion` and high-contrast/forced-colors behavior were checked if relevant.
- [ ] Screen-reader checks were completed for newly introduced complex widgets, or are documented as NOT RUN.

### Motion and performance
- [ ] Directional transitions were checked in RTL and LTR; CSS transforms do not assume automatic mirroring.
- [ ] Motion communicates state rather than delaying interaction; reduced-motion behavior retains essential feedback.
- [ ] Font loading, image sizing and transitions do not introduce avoidable layout shift.
- [ ] Relevant performance evidence or the reason tests could not run is recorded.

### Release safety
- [ ] The diff includes only intended files; `git diff --check` has no whitespace errors.
- [ ] Build, lint, unit, integration and visual tests are run *where configured*; results are recorded.
- [ ] Public claims (WCAG compliance, browser support, performance, tested status) match collected evidence.
- [ ] Open defects, exceptions, and follow-up work are documented before merge.
```

**When this PR changes only documentation:** mark browser interaction, screenshots, and runtime performance `N/A — docs only` instead of checking them as passed. Code snippets still need syntax and applicability checks.

## 3. CI: what can be checked automatically

A CI gate must execute available tests and fail correctly when they fail. Do not treat a command's absence, failure to install dependencies, or a skipped test as success.

| Gate | Suggested implementation | Can CI prove it alone? |
|---|---|---|
| Skill metadata and file presence | Skill validator; filesystem and YAML checks | Structure only |
| Markdown links / fences | Markdown linter + local-link check | Mostly; remote links may be flaky |
| HTML and component code | Project build, ESLint/TypeScript, HTML validation | Syntax and selected rules |
| CSS and design tokens | Stylelint, PostCSS/Tailwind build, token tests | Syntax and selected semantic checks |
| Accessibility smoke tests | axe-core / Playwright | Selected rules, **not full conformance** |
| Keyboard and modal behavior | Browser interaction tests | Specified interaction paths |
| RTL/LTR screenshots | Playwright snapshot tests | Selected viewports/states |
| Contrast values | Tested semantic token pair script | Defined pairs, not every rendered pixel |
| Performance | Lighthouse CI / lab profile | Lab conditions only |
| Audit script | Advisory diagnostics until repaired | **Not currently a blocking gate** |

### 3.1 Minimal reliable local preflight

Run from the repository root. The commands below validate Git state only; they do **not** replace project tests:

```bash
git branch --show-current
git status --short
git diff --check
git diff --stat
```

After staging files, use `git diff --cached --check` and `git diff --cached --stat` to check the staged patch. `git diff --check` does not verify Markdown semantics, functional correctness, or accessibility.

### 3.2 Do not enable a broken audit as a release gate

The repository-level `scripts/audit-rtl.mjs` is **advisory** in this repair branch. In particular, verify that `--check` returns nonzero on detected errors, that the supported Node.js version matches used APIs, that false-positive/false-negative fixtures exist, and that `--fix` cannot silently corrupt source files before elevating it to a CI gate.

A future acceptance fixture set should cover:

- CSS rules with only `left`, only `right`, both, and deliberate physical positioning.
- Logical corner mappings in supported Tailwind versions.
- Mixed `dir="rtl"` and `dir="ltr"` subtrees.
- CSS in JS, conditional classes, arbitrary Tailwind values, and unrelated strings.
- Clean input, error input, skipped files, and unreadable files.
- `--fix` dry-run/diff, idempotency, and exit codes before/after repair.

Do **not** run auto-fix on a user's repository without a reviewable backup/diff and explicit authorization.

### 3.3 CI completion criteria

- Required jobs have been triggered for the **current** commit SHA.
- Each required job is green; no required job was silently skipped.
- Dependencies and runtime versions are pinned or constrained deliberately.
- Tool warnings are reviewed for relevance; warnings are not automatically failures.
- The CI run URL and SHA are recorded in the PR.
- CI claims are scoped to checks that actually ran.

## 4. Manual RTL/LTR and responsive test matrix

Use representative *real content* as well as intentionally difficult test strings. Evaluate both directions when the component claims bidirectional support.

| Case | RTL (`fa` / `ar`) | LTR (`en`) | Evidence |
|---|---|---|---|
| Dashboard shell / sidebar | Start/end edges, hierarchy | Mirrored layout if supported | Screenshots + DOM/keyboard check |
| Mobile navigation / drawer | Open, close, focus, backdrop | Equivalent behavior | Keyboard/video |
| Dialog and popover | Focus, Escape, anchor alignment | Same | Browser interactions |
| Tabs / pagination | Arrows, focus, active panel | Same | Keyboard assertions |
| Forms and validation | Labels, messages, mixed inputs | Same | Manual + automation |
| Table and chart | Number direction, overflow, labels | Same | Responsive screenshots |
| Toast and alerts | Placement, announcements | Same | Visual + assistive-technology review |
| Motion and gestures | Start/end geometry | Matching semantics | Reduced-motion comparison |

Recommended viewport coverage **as a testing starting point**, not a claim of universal device support:

| Width | Intent |
|---|---|
| 320 CSS px | Reflow stress test, subject to WCAG exceptions |
| 375–390 CSS px | Common narrow mobile layouts |
| 768 CSS px | Tablet / intermediate layout |
| 1024 CSS px | Compact desktop |
| 1440 CSS px | Wide dashboard layout |

Additionally check the applicable 200% text resize behavior, effective 400% zoom/reflow, landscape orientation, large user fonts, and browser zoom where relevant. WCAG 1.4.10 does **not** prohibit all horizontal scrolling in intrinsically two-dimensional content such as complex data tables; assess exceptions rather than concealing data.

## 5. Visual acceptance: premium without unnecessary decoration

### 5.1 Preserve visual DNA

- [ ] If modifying the existing `demo.html`, retain its overall aesthetic unless a deliberate redesign is approved.
- [ ] Keep the dashboard's clear information hierarchy; never trade readability for decorative effects.
- [ ] Use consistent semantic surfaces, borders, radii, shadows and accent colors across components.
- [ ] Preserve distinctive Persian-inspired brand accents where they belong; do not force them into unrelated products.
- [ ] Typography scale supports scanning: page title, section heading, metric, label, body, helper/error text.
- [ ] Icons share size and stroke rhythm; directional icons mirror only when their *meaning* requires it.
- [ ] Cards and empty states have intentional density rather than unexplained blank space.
- [ ] Animation creates continuity and feedback; do not add movement simply to make the interface look active.

### 5.2 Required state coverage when a component changes

| State | Inspect |
|---|---|
| Default | Alignment, readability, contrast |
| Hover | Appropriate pointer feedback, not the only cue |
| Focus-visible | Clear keyboard focus against surrounding surface |
| Active/selected | Semantic state and visible differentiation |
| Loading | Progress communicated, layout remains stable |
| Empty | Helpful next action, no misleading placeholder data |
| Error | Clear cause/recovery, not just red decoration |
| Disabled | Semantics and appearance agree |
| Dark mode | Text, borders, icons, feedback and focus remain legible |
| Reduced motion | Content and state remain usable without animated travel |

For review, capture matching before/after states at the **same** viewport, scale, theme, locale and data. A screenshot diff reveals visual changes; it does not establish whether those changes are good or accessible.

## 6. Accessibility acceptance: exact standards, not invented rules

**Default target:** WCAG 2.2 Level AA where specified by the product. Design preferences are distinct from normative success criteria.

| Test | Standard or status | Verification |
|---|---|---|
| Main page language | 3.1.1 (A) | Inspect `lang` |
| Language of foreign passages | 3.1.2 (AA), with exceptions | Inspect mixed-language content |
| Meaningful reading sequence | 1.3.2 (A) | Read DOM order and assistive output |
| Focus order | 2.4.3 (A) | Keyboard traversal |
| Visible focus | 2.4.7 (AA) | Inspect focus-visible |
| Focus not fully obscured | 2.4.11 (AA) | Sticky headers, drawers, overlays |
| Normal text contrast | 1.4.3 (AA) | At least 4.5:1 unless exempt |
| Large text contrast | 1.4.3 (AA) | At least 3:1 for qualifying large text |
| Non-text contrast | 1.4.11 (AA) | At least 3:1 where applicable |
| Target size minimum | 2.5.8 (AA) | 24 × 24 CSS px or official exception |
| Target size enhanced | 2.5.5 (AAA) | 44 × 44 CSS px or official exception |
| Reflow | 1.4.10 (AA) | 320 CSS px equivalent with valid exceptions |
| Text resize | 1.4.4 (AA) | At least 200% without loss of content/function |
| Focus appearance enhanced | 2.4.13 (AAA) | Do not label this an AA requirement |

**Preferred product design, not a universal AA mandate:** generous 44 × 44 touch targets, comfortably visible focus indicators, sufficient row heights, and clear spacing. These preferences can improve usability while not substituting for the normative criteria.

Automation is insufficient for modal focus management, real reading order, screen-reader announcements, visual contrast under all states, or whether a UI is understandable. Include manual testing and document untested combinations.

## 7. Performance and technical stability

Performance checks must use a repeatable environment and distinguish field measurements from lab simulations.

- [ ] Fonts use deliberate preload / subset / `font-display` strategies appropriate for the product.
- [ ] Image dimensions or aspect ratios reserve layout space.
- [ ] Interaction feedback does not depend on lengthy decorative animation.
- [ ] Transforms/opacity are preferred for simple animations where appropriate, without hiding content from assistive technologies.
- [ ] Large tables and charts remain usable under constrained width and device capability.
- [ ] No avoidable JavaScript runtime errors or blocked critical interactions occur.
- [ ] Performance measurements include device/browser/network assumptions.

Useful **field performance targets** from Core Web Vitals are LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1, typically evaluated at the 75th percentile. These are targets, **not results claimed for this project**. A single Lighthouse run is a lab measurement and cannot prove those field thresholds.

## 8. AI-agent acceptance contract

An agent using RTL Vibe UI should finish a change with the following concise report:

```markdown
### Scope
- Target: [screen/component], framework: [...], locales: [...]
- Design constraints: [existing brand/demo preserved, if applicable]

### Changes
- `path/to/file`: [what changed and why]

### Verification
| Check | Result | Evidence |
|---|---|---|
| Build | PASS / FAIL / NOT RUN | command, output or reason |
| RTL/LTR layout | PASS / FAIL / NOT RUN | viewport, locale and screenshot |
| Keyboard / focus | PASS / FAIL / NOT RUN | tested path |
| Accessibility | PASS / FAIL / NOT RUN | automated + manual scope |
| Visual regression | PASS / FAIL / NOT RUN | comparable screenshots |

### Remaining risks
- [known defect or untested scenario]

### Next action
- [smallest concrete follow-up]
```

Agents must **not** turn a review checklist into a false test report. If no browser, runtime, or source code was available, report static review only. If a sample is intentionally illustrative rather than drop-in runnable, label it.

## 9. Release decision and blockers

Do **not** mark the full skill `production-ready` solely because its Markdown passes CI or because its demo looks polished.

**Block release when:**

1. The skill entrypoint or required references are truncated, malformed, or link to missing files.
2. Install instructions point to a nonexistent repository or incompatible runtime.
3. A mandatory CI gate fails or returns false success.
4. An advertised copy-paste asset cannot parse or compile in its declared environment.
5. A critical component is inoperable by keyboard or has a demonstrated blocking accessibility regression.
6. Directional layout breaks a supported target locale in a core user journey.
7. The release notes omit known critical limitations or falsely claim tests ran.

**Allow a documented exception only when:** the limitation is not release-blocking for the stated scope, the owner approves the risk, a reproducible issue and mitigation are recorded, and public claims remain accurate.

For this 1.0.1 draft branch, keep `scripts/audit-rtl.mjs`, `assets/tailwind-tokens.css`, and unverified real-browser behavior explicitly in the open-risk list until repaired/tested. A green metadata-validation job alone does not clear them.

## 10. Maintenance and evidence log

Update this checklist whenever `SKILL.md`, the component contract, or the target standards change. Link each release decision to its PR, commit SHA, CI run and manual-test evidence. Prefer a short, accurate report to a comprehensive checklist filled with unsupported ticks.

| Evidence item | Required detail |
|---|---|
| Source revision | Exact commit SHA and branch |
| Test environment | Browser, OS, Node/tool versions, framework version |
| Tested scope | Pages/components, languages, viewport/theme combinations |
| Automated results | Commands, pass/fail counts, CI URL |
| Manual results | Keyboard paths, assistive technology, recorded defects |
| Visual results | Same-state before/after screenshots |
| Remaining risks | Severity, owner, mitigation, follow-up issue |

## 11. Authoritative references

- [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [WAI: Understanding Target Size (Minimum) — 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- [WAI: Understanding Reflow — 1.4.10](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)
- [WAI-ARIA Authoring Practices: Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)
- [web.dev: Web Vitals](https://web.dev/articles/vitals)
- Other project references: `01-foundations.md` through `06-accessibility.md` in this directory.
