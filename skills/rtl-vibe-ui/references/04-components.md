# Components — RTL-native, premium, accessible UI patterns

> RTL Vibe UI · Reference 04 · Working draft for the 1.0.1 repair branch
> Scope: application shell, navigation, buttons, cards, data tables, forms, tabs, dialogs, drawers, popovers, disclosures, feedback, and component QA.

Read `../SKILL.md` for the overall agent workflow, `01-foundations.md` for direction and layout, `02-typography.md` for Persian/Arabic text, `03-color-and-tokens.md` for color roles, `05-motion.md` for interaction motion, and `06-accessibility.md` for deeper accessibility testing. The examples here are **patterns**, not an automatically installed component library. Adapt to the host framework and its rendering/state model.

## 1. Component contract

For each component an agent builds or repairs, describe and verify:

1. **Purpose and anatomy:** what task it serves; trigger, content, actions, labels, supporting text, and status.
2. **Semantics:** prefer native HTML. Only add ARIA when the chosen interaction pattern requires it; never use an ARIA role as a substitute for behavior.
3. **Direction:** meaningful source order, RTL/LTR placement, bidi isolation of mixed text, and intentional icon/motion direction.
4. **States:** default, hover (when available), focus-visible, active/selected, disabled, loading, empty, error, and success, as relevant.
5. **Responsive behavior:** small container and long strings first; touch and mouse; zoom and text spacing; avoid clipped actions.
6. **Keyboard and assistive technology:** focus order, Escape/arrow keys where the pattern requires them, labels, relationships, and status announcements.
7. **Design consistency:** semantic tokens, component density, precise alignment, restrained elevation, distinct action hierarchy.
8. **Evidence:** say which checks actually ran; do not claim WCAG compliance or cross-browser compatibility based only on code inspection.

**MUST:** preserve the current product's brand and component API unless explicitly asked to redesign. Do not use fixed right/left offsets as RTL patches. Prefer logical CSS properties and appropriate `lang`/`dir` attributes. Do not reverse DOM order to make a screenshot look correct. Avoid inventing a one-off component when a working native or existing library primitive already solves the problem.

### Visual DNA of this repository

`demo.html` is the baseline: Persian Vazirmatn typography; layered surfaces; dark navy/lajvard primary with firouzeh accents; subtle borders, compact dashboard cards, rounded corners, and limited shadows. Keep these characteristics when evolving the demo. The palette is **optional for other brands**. Improvements should prioritize legibility, purposeful hierarchy, responsive density, correct states, and polished feedback—not arbitrary gradients or excessive glass effects.

| Pattern | Use for | Principal review risk |
|---|---|---|
| Application shell / Sidebar | Persistent navigation | Visual order diverges from focus order; off-screen mobile items stay tabbable |
| Header / Search / Breadcrumb | Context and discovery | Unlabeled controls, broken hierarchy |
| Button / Icon button | Actions | Inaccessible name, insufficient focus, unclear loading |
| Metric card / Status | At-a-glance information | Meaning conveyed only with color or trend icon |
| Table | Tabular comparisons | Unreadable overflow, disconnected headings, mixed-direction IDs |
| Form | Data entry | Placeholder used as label, errors not associated |
| Tabs | Multiple views in one region | Mouse-only behavior, incorrect arrow keys or focus management |
| Dialog / Drawer | Blocking task or mobile navigation | Escaping/invisible focus, inaccessible close, broken return focus |
| Popover / Disclosure | Lightweight non-modal content | Over-engineered ARIA, confusing dismissal behavior |
| Toast / Alert | Feedback | Unannounced or intrusive status changes |

## 2. Application shell and responsive navigation

The DOM should follow meaningful reading order. In an RTL dashboard, the sidebar can appear on the **inline start** (normally right), with primary content next. Grid layout follows the element's direction without manually swapping its DOM children. This is a baseline example—not a replacement for the demo's implementation.

```html
<div class="app-shell">
  <aside class="app-sidebar" aria-label="ناوبری اصلی">
    <a class="brand" href="/" aria-label="خانه آرمان">آرمان</a>
    <nav aria-label="بخش‌های مدیریت">
      <a href="/dashboard" aria-current="page">داشبورد</a>
      <a href="/orders">سفارش‌ها</a>
      <a href="/customers">مشتریان</a>
    </nav>
  </aside>
  <main id="main-content" class="app-main">
    <h1>داشبورد</h1>
    <p>نمای کلی وضعیت سفارش‌ها</p>
  </main>
</div>
```

```css
.app-shell {
  display: grid;
  grid-template-columns: minmax(14rem, 16.5rem) minmax(0, 1fr);
  min-block-size: 100dvh;
  background: var(--surface);
  color: var(--on-surface);
}
.app-sidebar {
  min-inline-size: 0;
  border-inline-end: 1px solid var(--border);
  background: var(--surface-2);
  padding: 1.25rem;
}
.app-sidebar nav { display: grid; gap: .25rem; }
.app-sidebar nav a {
  display: block;
  padding-block: .7rem;
  padding-inline: .9rem;
  border-radius: var(--radius-sm, .625rem);
  color: var(--on-surface);
}
.app-sidebar nav a[aria-current="page"] {
  background: var(--primary-soft);
  color: var(--primary);
  font-weight: 700;
}
.app-main { min-inline-size: 0; padding: clamp(1rem, 2.5vw, 2rem); }
@media (max-width: 56rem) {
  .app-shell { display: block; }
  .app-sidebar { display: none; } /* Provide an operable mobile nav, see drawer. */
}
```

**Important:** `display: none` above is appropriate only if a separate **working mobile navigation mechanism** is provided. Do not hide the only navigation. Avoid maintaining two independently divergent link lists; share navigation data and keep `aria-current` synchronized. For app layouts with persistent headers, account for sticky offsets and safe-area insets. Prefer `minmax(0, 1fr)`/`min-inline-size: 0` to prevent large tables or long IDs from stretching the shell.

### Navigation acceptance

- Mark the current destination with `aria-current="page"`; do not use `aria-selected` on regular links.
- A button that expands a navigation section exposes `aria-expanded` and `aria-controls`, and controls the actual section.
- In RTL, the first *visual* nav entry should correspond to the intended first DOM entry; do not use `row-reverse` to camouflage incorrect order.
- Sidebar hide/show should not leave invisible interactive descendants in the tab sequence.
- Test narrow widths, 200% zoom, Persian labels, Arabic labels, English names, and long unbroken strings.

## 3. Header, breadcrumb, search, and actions

Use a page-level `h1`; avoid repeating the whole title in every card. Keep a clear primary action and suppress unnecessary action competition. Breadcrumbs reflect navigation ancestry—not decorative separators that screen readers must announce. Search inputs need a persistent label; search result changes must be perceivable.

```html
<header class="page-header">
  <nav aria-label="مسیر صفحه">
    <ol class="breadcrumbs">
      <li><a href="/">خانه</a></li>
      <li><a href="/orders">سفارش‌ها</a></li>
      <li aria-current="page">جزئیات سفارش</li>
    </ol>
  </nav>
  <div class="page-title-row">
    <div>
      <h1>جزئیات سفارش</h1>
      <p>وضعیت پردازش و ارسال</p>
    </div>
    <button type="button" class="btn btn-primary">ثبت تغییرات</button>
  </div>
</header>
```

```css
.breadcrumbs, .page-title-row { display: flex; flex-wrap: wrap; gap: .75rem; }
.breadcrumbs { list-style: none; margin: 0; padding: 0; }
.breadcrumbs li + li::before { content: "/"; padding-inline-end: .75rem; opacity: .5; }
.page-title-row { justify-content: space-between; align-items: end; }
.page-title-row h1 { margin: 0; font-size: clamp(1.35rem, 1.1rem + 1vw, 1.8rem); }
```

Use a real `<form role="search">` with a `<label>` when implementing search. Debounced results require a cancellation/stale-request strategy and an appropriately restrained status message. Do not automatically shift focus on each result update.

## 4. Buttons, icon buttons, and interaction states

- Action: `<button type="button">` or `<button type="submit">`; navigation: `<a href="…">`.
- Icon-only buttons **must** have an accessible name (visible label, `aria-label`, or `aria-labelledby`). Decorative SVGs use `aria-hidden="true"` and `focusable="false"` where applicable.
- Disabled actions must provide an explanation when needed. Avoid `pointer-events: none` as the only disabled mechanism. Use the native `disabled` attribute for form buttons where appropriate.
- A loading submit action retains context (e.g. visible `در حال ذخیره…`), prevents duplicate submissions, and announces completion/failure separately. Avoid blindly setting `aria-busy` on the entire page.
- Primary/secondary/danger variants must be distinguishable in all themes and contrast states. A visually subtle tertiary action must remain discoverable.

```html
<button type="button" aria-label="باز کردن تنظیمات" title="تنظیمات">
  <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="20" height="20">
    <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2" />
  </svg>
</button>
```

```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .5rem;
  min-block-size: 2.75rem;
  padding-inline: 1rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm, .625rem);
  font: inherit;
  font-weight: 650;
  background: var(--surface-2);
  color: var(--on-surface);
  transition: background-color .16s ease, border-color .16s ease, transform .16s ease;
}
.btn-primary { background: var(--primary); color: var(--on-primary); border-color: var(--primary); }
.btn:focus-visible { outline: 3px solid var(--primary); outline-offset: 3px; }
.btn:disabled { opacity: .6; cursor: not-allowed; }
@media (prefers-reduced-motion: reduce) { .btn { transition: none; } }
```

Treat 44 CSS px as a comfortable touch-target design goal, not as an assertion that WCAG 2.2 AA always requires 44×44. Check actual spacing and the applicable WCAG success criterion; components in dense tables may need a different compliant solution.

## 5. Cards, metrics, badges, and dashboards

A premium dashboard needs *information hierarchy*, not decorative noise. Prioritize readable metric, unit, period, comparison, and optional action. Do not display a favorable green arrow when the numerical change is actually negative or when lower-is-better depends on metric meaning.

```html
<section class="stats-grid" aria-label="شاخص‌های کلیدی">
  <article class="metric-card">
    <h2>فروش این ماه</h2>
    <p class="metric-value"><data value="125000000">۱۲۵٬۰۰۰٬۰۰۰</data> تومان</p>
    <p class="metric-detail">۱۲٪ رشد نسبت به ماه گذشته</p>
  </article>
  <article class="metric-card">
    <h2>سفارش‌های فعال</h2>
    <p class="metric-value"><data value="82">۸۲</data></p>
    <p class="metric-detail">در انتظار تکمیل یا ارسال</p>
  </article>
</section>
```

```css
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr)); gap: 1rem; }
.metric-card {
  min-inline-size: 0;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-md, .875rem);
  box-shadow: var(--shadow-sm, 0 1px 2px rgb(0 0 0 / .06));
  padding: clamp(1rem, 2vw, 1.4rem);
}
.metric-card h2 { margin: 0; color: var(--on-surface-muted); font-size: .9rem; }
.metric-value { margin-block: .65rem .25rem; font-weight: 800; font-size: clamp(1.4rem, 1.1rem + 1.5vw, 2rem); }
.metric-detail { margin: 0; color: var(--on-surface-muted); }
```

Use `data` or text for a metric; do not assume a status badge is interactive. Status should be readable without color. Cards with navigation should have an obvious link, not a blanket click handler on a non-semantic `div`. A skeleton should not replace error/empty states indefinitely. Prefer real content density and stable heights over ornamental charts without information value.

## 6. Data tables and mixed-direction values

Use `<table>` for genuine tabular data, not for page layout. A table needs a name (visible `caption` or equivalent), column headings, stable reading order, and a small-screen strategy. Avoid transforming arbitrary wide tables into mobile cards unless all heading-to-value relationships remain explicit.

```html
<div class="table-scroller" tabindex="0" role="region" aria-label="جدول سفارش‌ها، قابل پیمایش افقی">
  <table class="orders-table">
    <caption>آخرین سفارش‌ها</caption>
    <thead>
      <tr><th scope="col">شماره</th><th scope="col">مشتری</th><th scope="col">مبلغ</th><th scope="col">وضعیت</th></tr>
    </thead>
    <tbody>
      <tr>
        <th scope="row"><bdi dir="ltr">#AR-10254</bdi></th>
        <td>علی محمدی</td>
        <td><data value="1250000">۱٬۲۵۰٬۰۰۰ تومان</data></td>
        <td><span class="status">ارسال‌شده</span></td>
      </tr>
    </tbody>
  </table>
</div>
```

```css
.table-scroller { max-inline-size: 100%; overflow-x: auto; }
.table-scroller:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
.orders-table { inline-size: 100%; min-inline-size: 36rem; border-collapse: collapse; }
.orders-table th, .orders-table td {
  text-align: start;
  padding-block: .8rem;
  padding-inline: 1rem;
  border-block-end: 1px solid var(--border);
}
.orders-table th { font-weight: 700; }
.orders-table bdi { direction: ltr; unicode-bidi: isolate; }
```

A focusable overflow region is useful when keyboard scrolling would otherwise be inaccessible; do not add redundant tab stops when the region is not scrollable or when native controls already provide a path. Test screen readers with the actual implementation. `dir="ltr"` on a machine-readable identifier preserves its order; formatted currency text can follow the surrounding locale. Numbers for sorting and export come from underlying data, not from the presentation string. Charts, pagination, filters, and sort headers must remain available outside color alone.

## 7. Forms and validation

Use `<label for>` plus native input types. A placeholder is a hint, **not** a label. Associate error/help text with `aria-describedby` and update `aria-invalid` when validation fails. Do not announce a field as invalid before a meaningful validation event. International phone formats are not universally fixed to 11 digits.

```html
<form id="order-form">
  <div class="field">
    <label for="customer-email">ایمیل مشتری</label>
    <input id="customer-email" name="email" type="email" dir="ltr"
           autocomplete="email" required aria-describedby="email-help email-error" />
    <p id="email-help">برای دریافت رسید سفارش</p>
    <p id="email-error" hidden>آدرس ایمیل را بررسی کنید.</p>
  </div>
  <div class="field">
    <label for="customer-phone">شماره تماس</label>
    <input id="customer-phone" name="phone" type="tel" dir="ltr"
           autocomplete="tel" inputmode="tel" />
  </div>
  <button type="submit" class="btn btn-primary">ثبت سفارش</button>
</form>
```

```js
const form = document.querySelector('#order-form');
if (form) {
  const email = form.querySelector('#customer-email');
  const error = form.querySelector('#email-error');
  const showEmailError = (invalid) => {
    if (invalid) email.setAttribute('aria-invalid', 'true');
    else email.removeAttribute('aria-invalid');
    error.hidden = !invalid;
  };
  email.addEventListener('invalid', () => showEmailError(true));
  email.addEventListener('input', () => {
    if (email.validity.valid) showEmailError(false);
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    showEmailError(false);
    // The application's validated API submission belongs here.
  });
}
```

This is a client-side validation demonstration, **not** a complete submission or server-validation workflow. Native constraint validation fires `invalid` on the control; invalid forms do not reach a normal `submit` handler. Never trust client validation alone. If the form is submitted by application JavaScript, separately handle network pending/success/failure, error mapping, and focus to the first invalid field. Use a neutral input alignment and intentional direction based on field content; never reverse an email address, phone number, IBAN, or URL to match RTL decoration.

## 8. Tabs: manual activation, proper keyboard behavior

Tabs are a composite widget—not just buttons with `aria-selected`. The following reference pattern uses manual activation: Left/Right move focus, Home/End jump, Enter/Space activate, and the current panel has `role="tabpanel"`. In RTL, the arrow directions follow the **visual position** of the tabs; `Home` and `End` follow DOM order. Keep one tabbable tab at a time.

```html
<div class="tabs-widget" dir="rtl">
  <div role="tablist" aria-label="گزارش‌های داشبورد">
    <button type="button" id="tab-summary" role="tab" aria-selected="true"
            aria-controls="panel-summary" tabindex="0">خلاصه</button>
    <button type="button" id="tab-orders" role="tab" aria-selected="false"
            aria-controls="panel-orders" tabindex="-1">سفارش‌ها</button>
  </div>
  <section id="panel-summary" role="tabpanel" aria-labelledby="tab-summary" tabindex="0">
    <h2>گزارش کلی</h2>
  </section>
  <section id="panel-orders" role="tabpanel" aria-labelledby="tab-orders" tabindex="0" hidden>
    <h2>وضعیت سفارش‌ها</h2>
  </section>
</div>
```

```js
for (const list of document.querySelectorAll('[role="tablist"]')) {
  const tabs = [...list.querySelectorAll('[role="tab"]')];
  const panelFor = (tab) => document.getElementById(tab.getAttribute('aria-controls'));
  function focusTab(tab) {
    tabs.forEach((item) => { item.tabIndex = item === tab ? 0 : -1; });
    tab.focus();
  }
  function selectTab(tab) {
    tabs.forEach((item) => {
      const active = item === tab;
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
      const panel = panelFor(item);
      if (panel) panel.hidden = !active;
    });
    focusTab(tab);
  }
  tabs.forEach((tab) => tab.addEventListener('click', () => selectTab(tab)));
  list.addEventListener('keydown', (event) => {
    const index = tabs.indexOf(event.target);
    if (index < 0) return;
    const rtl = getComputedStyle(list).direction === 'rtl';
    let targetIndex;
    if (event.key === 'Home') targetIndex = 0;
    else if (event.key === 'End') targetIndex = tabs.length - 1;
    else if (event.key === 'ArrowRight') targetIndex = index + (rtl ? -1 : 1);
    else if (event.key === 'ArrowLeft') targetIndex = index + (rtl ? 1 : -1);
    else return; // Enter and Space activate the native button click.
    event.preventDefault();
    focusTab(tabs[(targetIndex + tabs.length) % tabs.length]);
  });
}
```

For **automatic activation** instead, only select on focus when panels load instantly; otherwise keyboard navigation becomes slow. Do not impose tab keyboard semantics on ordinary navigation links. Verify the direction of arrow navigation with a real RTL rendering; do not assume the platform's DOM order is visually identical to a `row-reverse` layout.

## 9. Modal dialogs: use native `<dialog>` when feasible

A blocking modal must prevent interaction with background content, contain focus, offer a perceivable way to close, support Escape where appropriate, and return focus logically. Prefer `showModal()` over setting `open` directly. Do not treat a non-modal Popover as a modal.

```html
<button type="button" id="open-confirm">حذف سفارش</button>
<dialog id="confirm-dialog" aria-labelledby="confirm-title">
  <h2 id="confirm-title">حذف سفارش؟</h2>
  <p>این عملیات قابل بازگشت نیست.</p>
  <form method="dialog">
    <button value="cancel" autofocus>انصراف</button>
    <button value="confirm">حذف</button>
  </form>
</dialog>
```

```js
const openConfirm = document.querySelector('#open-confirm');
const confirmDialog = document.querySelector('#confirm-dialog');
if (openConfirm && confirmDialog) {
  openConfirm.addEventListener('click', () => confirmDialog.showModal());
  confirmDialog.addEventListener('close', () => {
    openConfirm.focus();
    if (confirmDialog.returnValue === 'confirm') {
      // Invoke the application's separately implemented delete action.
    }
  });
}
```

The dialog example intentionally does not perform deletion. For a dangerous action, verify the target, request confirmation, handle API failure, and announce the final result. Do not autofocus a destructive button. Native dialog behavior still needs application-specific testing: initial focus, scrolling, multiple dialogs, browser support, long content, and logical return focus after the trigger is removed.

## 10. Mobile drawer: a modal panel at inline-start

For mobile navigation, a drawer is usually a **modal task** with a backdrop and a close action. `<dialog>` is useful because `showModal()` provides browser-managed modality. Align it to inline-start; do not hide a focusable off-canvas subtree with a transform alone.

```html
<button type="button" id="open-mobile-nav">باز کردن فهرست</button>
<dialog id="mobile-nav" class="nav-drawer" aria-label="فهرست اصلی">
  <form method="dialog"><button type="submit" aria-label="بستن فهرست">بستن</button></form>
  <nav aria-label="ناوبری موبایل">
    <a href="/dashboard">داشبورد</a>
    <a href="/orders">سفارش‌ها</a>
  </nav>
</dialog>
```

```css
.nav-drawer {
  position: fixed;
  inset-block: 0;
  inset-inline-start: 0;
  inset-inline-end: auto;
  margin: 0;
  inline-size: min(22rem, 90vw);
  max-inline-size: none;
  block-size: 100dvh;
  max-block-size: none;
  overflow-y: auto;
  background: var(--surface-2);
  color: var(--on-surface);
  border: 0;
  border-inline-end: 1px solid var(--border);
  padding: 1.25rem;
}
.nav-drawer::backdrop { background: rgb(0 0 0 / .52); }
```

```js
const openMobileNav = document.querySelector('#open-mobile-nav');
const mobileNav = document.querySelector('#mobile-nav');
if (openMobileNav && mobileNav) {
  openMobileNav.addEventListener('click', () => mobileNav.showModal());
  mobileNav.addEventListener('close', () => openMobileNav.focus());
}
```

If a framework keeps the sidebar mounted at desktop and mobile simultaneously, ensure there are no duplicate focusable controls or repeated IDs in the accessibility tree. For route changes, close the drawer before navigation if client-side routing keeps the component mounted. Verify `dir="ltr"` places the drawer at the left inline-start without changing its DOM order.

## 11. Popover, menus, and disclosures

Use the native **Popover API** for non-modal auxiliary content (e.g. a short filter panel), with a feature-support strategy for target browsers. Use `<dialog>` for true modality. A complex application menu needs a separate keyboard pattern; `popover` alone does not implement `role="menu"` semantics.

```html
<button type="button" popovertarget="filters-popover">فیلترها</button>
<section id="filters-popover" popover aria-labelledby="filters-heading">
  <h2 id="filters-heading">فیلترهای نمایش</h2>
  <form>
    <label for="filter-status">وضعیت سفارش</label>
    <select id="filter-status" name="status">
      <option value="all">همه</option>
      <option value="sent">ارسال‌شده</option>
    </select>
  </form>
</section>
```

For simple expandable FAQ content, prefer `<details><summary>` rather than a custom accordion controller. Native semantics cover basic toggle and keyboard interaction; style the marker and open state without removing the affordance.

```html
<details class="faq-item">
  <summary>چگونه سفارش را پیگیری کنم؟</summary>
  <p>از بخش «سفارش‌ها» شماره سفارش را وارد کنید.</p>
</details>
```

If product requirements call for only one open item, animation, or advanced focus behavior, implement and test that contract explicitly rather than assuming the native primitive handles everything. For anchor positioning, adopt feature detection or CSS fallbacks; never make content unusable when an enhancement is unavailable.

## 12. Notifications, toasts, status, and empty states

Use status announcements thoughtfully. A success message should not unexpectedly take focus, while a blocking destructive-error dialog may need focus. Avoid repeatedly announcing changing counters on every keystroke.

```html
<div id="save-status" role="status" aria-live="polite" aria-atomic="true"></div>
```

```js
const status = document.querySelector('#save-status');
function announceSaved() {
  if (status) status.textContent = 'تغییرات با موفقیت ذخیره شد.';
}
```

For failures that require immediate attention, decide deliberately whether `role="alert"`, an inline field error, or a dialog is most appropriate. Never use an assertive live region for routine progress. An empty state must explain what is missing and, where useful, offer one clear next action. Loading placeholders must not cause severe cumulative layout shift; ensure they are not announced as dozens of empty controls.

## 13. Direction-aware icons, charts, and micro-interactions

- Mirror **directional navigation cues** only when meaning follows reading direction (e.g. next/previous arrow). Never automatically mirror logos, maps, media-play icons, clocks, or data trends.
- Transitions should follow the user's navigation model: a drawer enters from inline-start; a page transition should not imply the wrong direction in RTL.
- Separate geometric animation from DOM order, labels, and state; transforms never repair semantic order.
- Charts need labeled axes, an accessible summary or data alternative, and clear legends. RTL does **not** mean automatically reversing a time series or changing the mathematical meaning of axes.
- Test `prefers-reduced-motion: reduce`; keep essential state change apparent without animation.
- Responsive surfaces should respect user zoom, content wrapping, and narrow **containers**, not just narrow viewports. Use `container-type: inline-size` where a component's own width determines its layout; provide a resilient one-column baseline.

## 14. Component QA and acceptance matrix

Test representative components with **actual** Persian and Arabic content, not only Latin placeholders. Report failures with a screenshot/selector and reproduction steps when tools are available.

| Check | Example evidence | Pass criterion |
|---|---|---|
| Direction | `fa` RTL, `ar` RTL, English LTR | Correct logical position; intentional mixed bidi content |
| Keyboard | Tab, Shift+Tab, Enter, Space, Escape, arrows | Logical sequence and required component-key support |
| Focus | Visible outline, modal entry/exit, mobile drawer | No hidden/tabbable offscreen controls or lost focus |
| Adaptive layout | 320 CSS px, phone landscape, desktop, 200% zoom | No clipped actions, unreadable text, or unexpected overflow |
| Content | Long names, numbers, emails, IDs, empty/error/loading | Correct wrapping, isolation, state labels, no layout collapse |
| Theme | Light/dark/forced-colors if supported | Foreground, state, and focus remain perceivable |
| Status | Loading, validation, success, failure | User knows what happened without color alone |
| Motion | Reduced motion | No forced excessive movement; state remains intelligible |
| Runtime | Actual browser and framework | No console errors, hydration mismatch, or broken interactions |

### Definition of done for a component patch

1. Preserve or document intentional changes to component API and visual identity.
2. Use the project's semantic tokens and consistent spacing; do not inject arbitrary hex values into each component.
3. Verify labels, semantics, keyboard behaviors, and focus for each interactive state.
4. Verify at least one realistic RTL content example and one opposite-direction value. Verify LTR mode when the project supports it.
5. Report tests **actually run**, tests not run, and remaining trade-offs. Static examples in this reference are **not** a browser or screen-reader conformance certificate.

### References and interoperability

- W3C WAI-ARIA Authoring Practices: [Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/), [Modal dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/), [Keyboard interface](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/).
- MDN: [`<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog), [Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API), [CSS logical properties](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_logical_properties_and_values).
- The current repository demo is a **visual reference**, not the authoritative implementation of every accessibility pattern in this document. Upgrade its components later in separate, reviewable patches after relevant tests are in place.
