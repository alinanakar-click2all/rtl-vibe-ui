# Motion — RTL-aware interaction, continuity, and reduced motion

> RTL Vibe UI · Reference 05 · Working draft for the 1.0.1 repair branch
>
> Scope: motion semantics, duration and easing tokens, RTL/LTR transitions, component states, performance, reduced motion, and validation.

Motion is an **interaction tool**, not an ornament. An effective transition explains where content came from, what changed, and what the user can do next. Design for the actual document direction; never assume that a physical CSS transform flips when `dir` changes.

This is a *reference specification*, not an instruction to add animations to every component. Preserve the existing visual identity and existing component APIs, including the restrained interactions and polished dashboard character of `demo.html`. Do not claim that implementing these patterns alone proves WCAG conformance.

## 1. Decide whether motion is needed

Before adding an animation, answer:

1. **Purpose:** Does it confirm an action, show hierarchy, maintain spatial continuity, or communicate a state change?
2. **Ownership:** What triggered it—user interaction, navigation, loading, or decoration?
3. **Direction:** Is movement physical (always upward), logical (toward inline-start), or semantic (next/previous item)?
4. **Accessibility:** Is there a non-moving alternative that preserves state and feedback?
5. **Performance:** Can the effect be achieved without repeated layout or repaint-heavy work?

Prefer an immediate state change to an animation with no clear purpose. Avoid repetitive entrance effects for every card, persistent bouncing, animated gradients behind text, and automatic carousel motion by default.

### Motion intent, not visual flourish

| Intent | Preferred technique | Avoid |
| --- | --- | --- |
| Hover / press feedback | Subtle background, border, opacity, or 1–2 px translation | Large bounce or layout movement |
| Opening a popover | Short opacity and small scale/translation | Long fly-in from screen edge |
| Opening a modal | Backdrop fade and subtle dialog appearance | Zoom from zero or large travel |
| Opening a drawer | Direction-aware slide from its own edge | Always using negative `translateX()` |
| Saving a form | Immediate disabled/loading state, then explicit result | Replacing success/error with animation only |
| Switching tabs | Immediate selection and panel update; optional subtle emphasis | Motion delaying focus or content availability |
| Changing a chart | Gentle, optional data transition | Motion obscuring exact values or altering reading order |

## 2. Design tokens: small, consistent motion vocabulary

These values are **suggested design defaults**, not web standards. Tune for the product, device performance, and user research; reuse established project tokens instead of creating duplicate sources of truth.

```css
:root {
  --motion-duration-instant: 80ms;
  --motion-duration-fast: 140ms;
  --motion-duration-standard: 220ms;
  --motion-duration-emphasized: 320ms;

  --motion-ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --motion-ease-enter: cubic-bezier(0, 0, 0, 1);
  --motion-ease-exit: cubic-bezier(0.3, 0, 1, 1);

  --motion-distance-subtle: 6px;
  --motion-distance-panel: 18px;
}
```

| Context | Suggested duration | Reason |
| --- | --- | --- |
| Press and hover feedback | 80–150 ms | Fast acknowledgment |
| Small popover / tooltip | 120–200 ms | Low travel distance |
| Modal / toast | 160–260 ms | Perceivable without delay |
| Sidebar / drawer | 200–320 ms | Larger visual surface |
| Deliberate view transition | 200–400 ms | Only when spatial continuity adds clarity |

Duration should generally track *travel distance and complexity*, not screen size alone. Avoid long exit sequences that block the next interaction. No interaction should depend on a transition completing before the underlying state is updated.

### Token ownership

- Use `--motion-*` for universal interaction behavior; brand colors and shadows remain in the color/token reference (`03-color-and-tokens.md`).
- Support a named product-level motion theme, but keep a single default vocabulary.
- Reduced-motion preferences override presentation; they do not cancel business logic.
- Never encode a fixed visual direction into a token named `start` or `end` without defining it relative to `dir`.

## 3. RTL and LTR: physical transforms do not mirror

`translateX(20px)` moves toward the physical right in both writing directions. CSS logical properties such as `inset-inline-start` *do* respond to direction. Never infer that one implies the other.

The following names describe **logical** inline movement for horizontal writing modes. Positive X is physically right; `inline-start` is right for RTL and left for LTR.

```css
/* The sign is mapped explicitly; no broad transform mirroring. */
.motion-surface {
  --motion-enter-offset: -18px;
}

.motion-surface:dir(rtl) {
  --motion-enter-offset: 18px;
}

.motion-surface[data-enter-from="start"] {
  animation: enter-from-inline-start var(--motion-duration-standard)
    var(--motion-ease-enter) both;
}

@keyframes enter-from-inline-start {
  from {
    opacity: 0;
    transform: translateX(var(--motion-enter-offset));
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
```

Use `:dir()` when available to detect the **computed** direction, including inherited direction and nested `dir` changes. If the browser support policy requires a fallback, use carefully scoped `[dir="rtl"]` selectors and test nested-direction components. Do not apply `scaleX(-1)` to whole containers: it mirrors text, logos, charts, and input content.

### Decide whether to mirror each element

- **Directional navigation icons:** mirror only when their meaning is previous/next or inline-start/inline-end *and* the product uses direction-relative navigation.
- **Global physical gestures:** preserve physical meaning when it is intrinsic (e.g., drag right means move to the right on a canvas).
- **Brand marks, clocks, media playback controls, numeric charts:** do not blindly mirror.
- **Progress and timelines:** determine whether they follow language reading order or a domain-specific chronology. Test the actual labeling and direction.

## 4. Direction-aware drawer motion

The existing `demo.html` uses a direction sign for its drawer. Keep that behavior when editing the demo. For a reusable component, scope the calculation to the component and test both directions.

```css
.drawer {
  --drawer-outside: -100%;
  position: fixed;
  inset-block: 0;
  inset-inline-start: 0;
  inline-size: min(340px, 90vw);

  transform: translateX(var(--drawer-outside));
  visibility: hidden;
  pointer-events: none;
  transition:
    transform var(--motion-duration-emphasized) var(--motion-ease-standard),
    visibility 0s linear var(--motion-duration-emphasized);
}

.drawer:dir(rtl) {
  --drawer-outside: 100%;
}

.drawer[data-state="open"] {
  transform: translateX(0);
  visibility: visible;
  pointer-events: auto;
  transition:
    transform var(--motion-duration-emphasized) var(--motion-ease-standard),
    visibility 0s;
}
```

**Important:** This snippet covers *visual motion only*. Component behavior in `04-components.md` must also manage the open state, Escape, focus, backdrop, accessible name, and whether the closed region is removed from tab order (e.g., `inert` while closed). An off-screen element is **not** automatically inaccessible or unfocusable. Do not animate the drawer with `display: none` unless using a properly supported discrete-transition strategy with fallback.

For interactive demonstrations, verify that the drawer:

1. Opens from its **inline-start** edge in both `dir="rtl"` and `dir="ltr"`.
2. Closes to the same edge, including when the document direction is switched while open.
3. Does not expose hidden links to keyboard focus.
4. Does not leave a backdrop blocking pointer events after close.
5. Opens and closes instantly—and remains fully usable—under reduced motion.

## 5. Modal, popover, toast, and button contracts

### Modal: preserve context, not spectacle

The demo already uses a soft backdrop fade and a slight scale-in. That is a suitable aesthetic to preserve; ensure the *open state* is correct independently of animation. Use native `<dialog>` where appropriate, or implement equivalent modal semantics and focus handling.

```css
.modal-panel[data-state="open"] {
  animation: modal-appear var(--motion-duration-standard)
    var(--motion-ease-enter) both;
}

@keyframes modal-appear {
  from { opacity: 0; transform: translateY(6px) scale(0.985); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.modal-backdrop[data-state="open"] {
  animation: backdrop-appear var(--motion-duration-fast) linear both;
}

@keyframes backdrop-appear {
  from { opacity: 0; }
  to   { opacity: 1; }
}
```

Do not force the user's focus to wait for a fade. The visual transition must not prevent keyboard navigation or screen-reader announcements. For unmounting/closing, either allow a controlled exit animation with an explicit completion path or remove the element immediately—never leave an invisible interactive overlay behind.

### Popover / tooltip

Prefer a short fade plus approximately 4–6 px displacement along the opening axis, **not** a screen-length slide. Set a clear z-index/layer policy. Tooltips must remain accessible through focus, not hover only.

### Toast / notification

The demo uses an inline-edge toast slide. The direction should derive from the toast's **own computed direction**. A toast must provide readable status text without requiring animation; time-sensitive dismissals should have sufficient time and comply with the product accessibility requirements.

```css
.toast[data-state="entering"] {
  --toast-shift: -12px;
  animation: toast-appear var(--motion-duration-standard)
    var(--motion-ease-enter) both;
}

.toast[data-state="entering"]:dir(rtl) {
  --toast-shift: 12px;
}

@keyframes toast-appear {
  from { opacity: 0; transform: translateX(var(--toast-shift)); }
  to   { opacity: 1; transform: translateX(0); }
}
```

For dynamically created toast elements, preserve the `dir` context of the content (or set `dir="auto"` on user-supplied text) and use the correct live-region semantics; see `04-components.md` and `06-accessibility.md`.

### Buttons, cards, and navigation

```css
.action-button {
  transition:
    background-color var(--motion-duration-fast) var(--motion-ease-standard),
    border-color var(--motion-duration-fast) var(--motion-ease-standard),
    transform var(--motion-duration-instant) var(--motion-ease-standard);
}

@media (hover: hover) and (pointer: fine) {
  .action-button:hover { transform: translateY(-1px); }
}

.action-button:active { transform: translateY(0); }
.action-button:focus-visible { outline-offset: 3px; }
```

Only apply hover transforms to devices that meaningfully support hover. Keep focus indicators visible even if transitions are turned off. Avoid animating width/height for active navigation indicators when background, opacity, or a transform can convey the state more efficiently.

## 6. Accessibility: reduced motion is a separate experience

The media query `prefers-reduced-motion` signals a platform preference for reduced or replaced motion. **Do not** interpret it as permission to hide content or remove interaction feedback.

```css
/* Place after component animation rules. Preserve visible final states. */
@media (prefers-reduced-motion: reduce) {
  .drawer,
  .action-button {
    transition: none;
  }

  .modal-panel,
  .modal-backdrop,
  .toast {
    animation: none;
  }

  html { scroll-behavior: auto; }
}
```

This targeted override is usually clearer than a universal `* { animation-duration: 0.01ms !important; }` rule. If the existing demo uses a global safety rule, do **not** remove it blindly: evaluate every component, then migrate toward component-scoped reduced-motion states. Ensure that `forwards`/`both` fill modes or JavaScript `animationend` listeners never become the only way content reaches its correct final state.

### Standards: distinguish levels

- **WCAG 2.2 SC 2.2.2 — Pause, Stop, Hide (Level A):** applies under specific conditions to automatically starting moving, blinking, scrolling, or updating content; see the full criterion and exceptions.
- **WCAG 2.2 SC 2.3.3 — Animation from Interactions (Level AAA):** requires a way to disable non-essential motion animation triggered by interaction. Reducing motion is strongly recommended even when aiming for AA.
- **WCAG 2.2 SC 2.3.1 — Three Flashes or Below Threshold (Level A):** avoid potentially harmful flashing effects.

Do not call reduced-motion support alone "WCAG AA compliant". Review all applicable criteria and test the actual interface.

## 7. Optional modern View Transitions, always progressive

View Transitions can improve continuity for substantial view changes. They are **optional**; they are not a substitute for router state, focus management, or accessible navigation. Use feature detection and a reduced-motion fallback.

```js
function updateView(accessibleUpdate) {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (reduceMotion || typeof document.startViewTransition !== "function") {
    accessibleUpdate();
    return;
  }

  document.startViewTransition(() => {
    accessibleUpdate();
  });
}
```

`accessibleUpdate` must update application state/DOM correctly even without the API. After a route change, manage document title, focus placement, history, and announcements in the router or application layer. Avoid exposing transition-only screenshots to assistive technologies as if they were interactive content.

```css
/* Optional, subtle default when a View Transition is actually used. */
@media (prefers-reduced-motion: no-preference) {
  ::view-transition-old(root),
  ::view-transition-new(root) {
    animation-duration: var(--motion-duration-standard);
  }
}

@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(root),
  ::view-transition-new(root) {
    animation: none;
  }
}
```

Where supported, you may use `view-transition-name` for an individual shared element; do not assign the same active name to multiple unrelated elements. Browser support and framework integration should be checked against project targets before enabling cross-document transitions. The plain state update is the required fallback.

## 8. Gesture, carousel, and swipe interaction

Gesture direction is **not universally equivalent** to reading direction.

- Define whether "next" is the next item in logical reading order or an item physically to the right/left.
- Pointer drag deltas (`clientX`) are in physical screen coordinates. Map the delta to the product's *documented* semantic model when appropriate; do not invert it unconditionally.
- Ensure keyboard and on-screen button equivalents exist; gesture-only access is not acceptable for core functionality.
- Use pointer capture only while a genuine drag is active; avoid hijacking vertical scrolling on touch devices.
- Respect `touch-action` and minimum gesture thresholds to prevent accidental navigation.
- If the user prefers reduced motion, allow instant paging without momentum/inertia effects.

For a carousel that follows inline progression in horizontal text, a useful sign mapping is:

```js
function inlineDirectionSign(element) {
  const direction = getComputedStyle(element).direction;
  return direction === "rtl" ? -1 : 1;
}

// Usage example: logical forward delta from a physical pointer delta.
// Only use this mapping when the component defines "forward" as inline-end.
function logicalPointerDelta(element, physicalDeltaX) {
  return physicalDeltaX * inlineDirectionSign(element);
}
```

The mapping converts a physical delta into one signed convention; the rest of the gesture system must use the same convention. In RTL, inline-end is physically left. Test the mapping against labels, order, and active index. Do not assume that all chart gestures or calendars follow this convention.

## 9. Performance and stability

- Prefer `transform` and `opacity` for moving/fading layers when practical. This does not guarantee compositor-only execution on every device; profile with browser tools.
- Avoid animating `top`, `left`, `width`, `height`, `margin`, large `filter`/`blur`, or huge `box-shadow` regions on high-frequency interactions unless measured.
- Reserve layout space for images, charts, skeletons, and asynchronous content; animation cannot compensate for unexpected layout shifts.
- Do not apply `will-change: transform` to every card. Use sparingly, and remove it if profiling shows no benefit.
- Never use dozens of concurrent staggered entrances on an information-dense dashboard.
- Keep performance targets tied to real-user metrics such as INP, LCP, and CLS. Do not claim numbers without measurement.
- An animation must never lock the app waiting for `transitionend`; reduced-motion or interrupted transitions may prevent that event from arriving as expected.

### State and timing are separate concerns

For every component, define a state machine independent of animation (`closed`, `opening`, `open`, `closing` only if needed). UI state and focus behavior remain correct even when duration is zero, when a user clicks twice quickly, or when a direction/theme change occurs mid-transition. Cancel obsolete animation work if the framework requires it.

## 10. QA matrix and acceptance criteria

Test the same interactive components in all combinations relevant to the project:

| Scenario | Required observation |
| --- | --- |
| Persian RTL, desktop | Drawer edge, toast edge, text/focus remain correct |
| Arabic RTL, desktop | Same motion semantics; Arabic text does not clip |
| English LTR, desktop | Entry/exit mirrors only when semantically required |
| Nested opposite-direction widget | Local computed direction is respected |
| Mobile narrow viewport | No off-screen controls or gesture conflicts |
| Reduced motion enabled | No non-essential slide/scale; state remains legible and usable |
| Keyboard only | Focus is visible; Escape and return-focus work where applicable |
| Rapid toggling | No stuck overlays or stale transitions |
| Light/Dark switch | No distracting flashes, inconsistent colors, or missing contrast |
| Low-end device / throttling | Animations do not block input or cause excessive long tasks |

### Automated smoke test example (Playwright)

Adapt selectors and configuration to the actual project; this is an *example*, not an already-executed test. A functional drawer test also needs to assert focus, backdrop, and inert behavior.

```js
import { test, expect } from "@playwright/test";

test("drawer follows direction and reduced-motion preference", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setContent(`
    <html lang="fa" dir="rtl"><body>
      <button id="open">باز کردن</button>
      <aside class="drawer" data-state="closed" inert>پنل</aside>
    </body></html>
  `);

  await page.addStyleTag({ content: `
    .drawer { --drawer-outside: -100%; transform: translateX(var(--drawer-outside));
      transition: transform 320ms ease; }
    .drawer:dir(rtl) { --drawer-outside: 100%; }
    .drawer[data-state="open"] { transform: translateX(0); }
    @media (prefers-reduced-motion: reduce) { .drawer { transition: none; } }
  ` });

  await page.locator(".drawer").evaluate(el => {
    el.dataset.state = "open";
    el.inert = false;
  });

  await expect(page.locator(".drawer")).toHaveAttribute("data-state", "open");
  const transitionDuration = await page.locator(".drawer").evaluate(
    el => getComputedStyle(el).transitionDuration
  );
  expect(transitionDuration).toBe("0s");
});
```

**Release gate:** Every animated component must work with animation disabled; directional motion must match semantics in both RTL and LTR; no focus loss or hidden interactive overlay may remain; measured performance and accessibility checks must be recorded separately from static source validation.

## 11. Agent delivery checklist

Before reporting that a motion task is complete:

1. State which user action or content change motion communicates.
2. List motion tokens reused or added; justify exceptions.
3. State whether direction is physical, logical, or semantic, with RTL/LTR evidence.
4. Confirm reduced-motion behavior and usable final states.
5. Confirm keyboard/focus behavior independently of animation.
6. Note which tests were **actually run**, and separate them from recommended tests.
7. Document any untested browser or framework combinations.
8. Preserve the existing visual identity and avoid unrequested visual redesign.

## References

- [MDN — `prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion)
- [MDN — CSS `translateX()`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/transform-function/translateX)
- [MDN — CSS logical properties and values](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Logical_properties_and_values)
- [MDN — View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API/Using)
- [W3C — WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [W3C — Understanding Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions)
- [W3C — Understanding Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide)

For structural and interaction behavior, see `01-foundations.md` and `04-components.md`; for color and surface tokens, see `03-color-and-tokens.md`; for accessibility policy, see `06-accessibility.md`.
