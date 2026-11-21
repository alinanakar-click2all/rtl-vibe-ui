# Accessibility — دسترس‌پذیری RTL بر پایه WCAG 2.2

> RTL Vibe UI · Reference 06 · Working draft for the 1.0.1 repair branch
>
> Scope: language and bidi semantics, keyboard/focus, dialogs, drawers, tabs, forms, contrast, responsive accessibility, and verifiable acceptance criteria.

این مرجع مکمل `01-foundations.md`، `02-typography.md`، `03-color-and-tokens.md`، `04-components.md` و `05-motion.md` است. هدف، ساخت رابط فارسی/عربی **قابل استفاده و قابل آزمون** است، نه فقط جابه‌جایی بصری عناصر. از ظاهر ممتاز و هویت بصری موجود (مانند `demo.html`) محافظت کن؛ دسترس‌پذیری نباید به معنی حذف بی‌دلیل کیفیت طراحی باشد.

**قاعده صداقت:** هیچ اسکیل، کتابخانه، اسکریپت یا آزمون خودکار به‌تنهایی انطباق کامل با WCAG 2.2 AA را «تضمین» نمی‌کند. ادعای انطباق فقط پس از ارزیابی دامنه واقعی محصول، آزمون‌های دستی و خودکار، و ثبت نتایج قابل‌دفاع است.

## 1. Baseline و تفاوت الزام با توصیه

هدف طراحی پیش‌فرض **WCAG 2.2 Level AA** است، مگر اینکه پروژه هدف دیگری تعیین کند. سطوح زیر را با هم اشتباه نگیر:

| موضوع | معیار | سطح | الزام/نکته |
|---|---|---|---|
| ترتیب معنادار | 1.3.2 | A | ترتیب خواندن و فهم محتوا حفظ شود؛ لازم نیست ترتیب DOM دقیقاً کپی تصویر باشد، اما معنا تغییر نکند. |
| فوکوس منطقی | 2.4.3 | A | ترتیب پیمایش برای کاربر قابل فهم و عملی باشد. |
| زبان صفحه | 3.1.1 | A | زبان اصلی صفحه با `lang` صحیح مشخص شود. |
| زبان بخش‌ها | 3.1.2 | AA | زبان بخش‌های متفاوت در موارد لازم تعیین شود؛ استثناهای استاندارد را در نظر بگیر. |
| فوکوس قابل مشاهده | 2.4.7 | AA | نشانگر فوکوس کیبورد قابل مشاهده باشد. |
| فوکوس پوشانده نشود | 2.4.11 | AA | فوکوس نباید **کاملاً** زیر محتوای ساخته‌شده توسط نویسنده پنهان شود. |
| ظاهر فوکوس پیشرفته | 2.4.13 | AAA | معیارهای اندازه/کنتراست اضافه؛ آن را اشتباهاً AA اعلام نکن. |
| متن معمولی | 1.4.3 | AA | حداقل کنتراست 4.5:1 با استثناهای تعریف‌شده. |
| متن بزرگ | 1.4.3 | AA | حداقل 3:1 طبق تعریف Large-scale text. |
| اجزای غیرمتنی ضروری | 1.4.11 | AA | حداقل 3:1 برای نشانه‌ها، مرزها یا حالت‌های ضروری، با استثناها. |
| اندازه هدف اشاره‌گر | 2.5.8 | AA | 24×24 CSS px یا یکی از استثناهای رسمی، از جمله فاصله کافی. |
| اندازه هدف پیشرفته | 2.5.5 | AAA | 44×44 CSS px، با استثناهای رسمی. |
| محتوای Hover/Focus | 1.4.13 | AA | در موارد مشمول، قابل بستن، نگه‌داشتن و مشاهده باشد. |
| تغییر اندازه متن | 1.4.4 | AA | در بزرگ‌نمایی متن 200%، محتوا/عملکرد از دست نرود. |
| Reflow | 1.4.10 | AA | در عرض معادل 320 CSS px برای محتوای عمودی رایج، اسکرول دوطرفه غیرضروری نشود؛ استثناهای محتوای ذاتاً دوبعدی معتبرند. |
| احراز هویت قابل‌دسترس | 3.3.8 | AA | الزام شناختیِ بدون سازوکار جایگزین/کمک مناسب ایجاد نکن. |

**ترجیح طراحی (نه ادعای الزام AA):** برای دکمه‌ها و آیکون‌ها معمولاً هدف لمسی نزدیک 44×44 px، ناحیه Focus واضح با حاشیه 2–3px، و فاصله‌گذاری سخاوتمندانه را انتخاب کن؛ این اعداد را به‌جای متن رسمی معیارها ننویس.

## 2. Language، Direction و متن ترکیبی

`lang` زبان را مشخص می‌کند؛ `dir` جهت پایه متن را. هیچ‌کدام جای دیگری را نمی‌گیرد. در هر سند **فقط یک عنصر `<html>`** وجود دارد:

```html
<!doctype html>
<html lang="fa" dir="rtl">
  <head><meta charset="utf-8"><title>داشبورد سفارش‌ها</title></head>
  <body>
    <main>
      <h1>سفارش‌های امروز</h1>
      <p>شماره سفارش: <bdi>INV-2026-104</bdi></p>
      <p>وب‌سایت: <span lang="en" dir="ltr">example.com</span></p>
      <p>نظر کاربر: <span dir="auto">User-generated text</span></p>
    </main>
  </body>
</html>
```

برای صفحه عربی، مقدار `lang="ar"` را روی همان ریشه بگذار. برای رشته‌های کوتاه با جهت ناشناخته از `<bdi>` استفاده کن؛ برای بلوک متن کاربر که جهت آن ناشناخته است `dir="auto"` مناسب است. آدرس ایمیل، URL، کد، شناسه سفارش و اعداد را بر اساس *معنای داده* بررسی کن، نه صرفاً زبان رابط.

```html
<label for="email">ایمیل</label>
<input id="email" type="email" inputmode="email" dir="ltr" autocomplete="email">

<label for="comment">دیدگاه</label>
<textarea id="comment" dir="auto"></textarea>
```

- از تغییر ترتیب DOM برای شبیه‌سازی RTL، `tabindex` مثبت و معکوس‌سازی کورکورانه با CSS اجتناب کن.
- برای کلمات خارجی، نام برند، عبارت فنی و اعداد، تلفظ صفحه‌خوان را با کاربر و فناوری کمکی واقعی بسنج.
- `aria-label` را با زبان فعلی رابط هماهنگ نگه‌دار؛ متن قابل مشاهده و Accessible Name باید سازگار باشند.
- در تعویض زبان/جهت، خوانایی و ترتیب فوکوس را دوباره بررسی کن.

## 3. Semantics و ناوبری با کیبورد

از عناصر بومی HTML شروع کن: `<header>`, `<nav>`, `<main>`, `<section>`, `<button>`, `<a>`, `<form>`, `<label>`, `<table>`. ARIA را فقط وقتی اضافه کن که HTML بومی کافی نیست.

```html
<a class="skip-link" href="#main-content">رفتن به محتوای اصلی</a>
<header>…</header>
<nav aria-label="ناوبری اصلی">…</nav>
<main id="main-content" tabindex="-1">…</main>
```

```css
.skip-link {
  position: fixed;
  inset-block-start: .75rem;
  inset-inline-start: .75rem;
  transform: translateY(-180%);
  z-index: 9999;
}
.skip-link:focus-visible { transform: none; }
:where(button, a, input, select, textarea, [tabindex="0"]):focus-visible {
  outline: 3px solid var(--focus-ring, #2563eb);
  outline-offset: 3px;
}
```

- هر کنترل عملیاتی باید با Tab قابل‌دستیابی و با Enter/Space (طبق semantics نوع کنترل) قابل استفاده باشد.
- لینک برای **ناوبری** و دکمه برای **عمل** است. `div` کلیک‌پذیر جایگزین مناسبی نیست.
- ترتیب Tab باید با جریان فهم صفحه سازگار باشد؛ راست‌به‌چپ بودن مجوز تغییر بی‌دلیل ترتیب DOM نیست.
- در Header چسبان، Bottom Bar، Tooltip، Toast و Drawer بررسی کن که Focus زیر پوشش عناصر دیگر قرار نگیرد.
- فوکوس را با استایل `outline: none` بدون جایگزین قابل‌مشاهده حذف نکن.

## 4. Dialog و Modal — ترجیح Native `<dialog>`

Native modal dialog با `showModal()`، پس‌زمینه را inert می‌کند و مدیریت modal/focus مرورگر را در اختیار می‌گذارد. با این حال، نام قابل‌دسترس، مقداردهی فوکوس اولیه متناسب با محتوا، بازگشت فوکوس و رفتار بستن را **تست** کن.

```html
<button type="button" id="open-order-dialog">افزودن سفارش</button>

<dialog id="order-dialog" aria-labelledby="order-dialog-title">
  <h2 id="order-dialog-title" tabindex="-1">افزودن سفارش</h2>
  <p>اطلاعات سفارش جدید را وارد کنید.</p>
  <form method="dialog">
    <button value="cancel">انصراف</button>
    <button value="confirm">تأیید</button>
  </form>
</dialog>
```

```js
const dialog = document.querySelector('#order-dialog');
const trigger = document.querySelector('#open-order-dialog');
const heading = document.querySelector('#order-dialog-title');
let returnFocusTo = null;

trigger.addEventListener('click', () => {
  returnFocusTo = document.activeElement;
  dialog.showModal();
  heading.focus(); // Intentional initial focus for structured content.
});

dialog.addEventListener('close', () => {
  if (returnFocusTo?.isConnected) returnFocusTo.focus();
});
```

**Acceptance criteria:**

- نام پنجره از عنوان فارسی/عربی قابل شناسایی باشد (`aria-labelledby`).
- فوکوس اولیه درون Modal قرار گیرد و `Tab`/`Shift+Tab` به محتوای پشت آن نرسند.
- `Escape` در حالت مجاز به بستن کار کند؛ لغو یک عملیات حساس را صریح طراحی کن.
- پس از بسته شدن، فوکوس به trigger (یا مقصد منطقی بعدی اگر trigger حذف شده) بازگردد.
- روی موبایل، Zoom و حالت RTL/LTR پنجره از viewport خارج نشود.
- برای محتوای بسیار طولانی، جای‌گذاری فوکوس و خواندن عنوان با Screen Reader بررسی شود.

در دمو فعلی، Modal به‌صورت عنصر معمولی با `hidden` باز و بسته می‌شود و فوکوس به اولین کنترل می‌رود، اما محصورسازی فوکوس و inert شدن پس‌زمینه از آن کد اثبات نمی‌شود. این مرجع **نقشه اصلاح** است؛ خود `demo.html` در این مرحله تغییر نمی‌کند.

## 5. Drawer / Side sheet

یک Drawer با رفتار modal می‌تواند از `<dialog>` و `showModal()` استفاده کند. برای Drawer غیرmodal، نباید بی‌دلیل فوکوس را محصور کنی؛ نوع تعامل را صریح تعریف کن.

- هنگامی که Drawer واقعاً بسته است، محتوا نباید در توالی Tab یا accessibility tree فعال باقی بماند. جابه‌جایی صرفاً با `transform` کافی نیست.
- حالت باز/بسته و Trigger باید دارای نام قابل‌دسترس باشند؛ کنترل Close را همیشه در دسترس قرار بده.
- اگر از Overlay استفاده می‌کنی، Escape، کلیک پس‌زمینه، مدیریت scroll و بازگرداندن فوکوس را تعریف و تست کن.
- حرکت ورود/خروج باید با جهت منطقی **start/end** هماهنگ باشد؛ `translateX()` خودکار در RTL معکوس نمی‌شود.
- هنگام درخواست `prefers-reduced-motion: reduce` نمایش Drawer نباید متکی به انیمیشن باشد.

```css
.side-sheet {
  inline-size: min(28rem, 100%);
  max-block-size: 100dvh;
  margin: 0;
  margin-inline-start: 0;
  inset-inline-start: 0;
  inset-inline-end: auto;
}
.side-sheet::backdrop { background: rgb(0 0 0 / .50); }
```

این مثال **فقط پوسته layout** است؛ استفاده از `dialog.showModal()`، وضعیت‌ها و تست تعاملی بخش جداگانه پیاده‌سازی هستند. اگر کامپوننت با Animation نمایش داده می‌شود، قبل از حذف آن از دسترس‌پذیری منتظر پایان واقعی Transition باش، اما در بازه خروج فوکوس را به محتوای پنهان نفرست.

## 6. Tabs — Keyboard، Roving Tabindex و RTL

مطابق الگوی WAI-ARIA، تنها Tab فعال در توالی Tab صفحه باشد؛ با کلیدهای جهت‌دار بین Tabها جابه‌جا شو. برای Tabهای افقی که با `direction: rtl` از راست به چپ چیده شده‌اند، حرکت بصری «راست» عموماً به عنصر قبلی در آرایه DOM می‌رود. این سیاست را **بر اساس جهت بصری واقعی** تست کن؛ نه یک نگاشت جهانی غیرقابل تغییر.

```html
<div class="tabs" role="tablist" aria-label="بخش‌های داشبورد">
  <button id="tab-overview" role="tab" aria-selected="true"
          aria-controls="panel-overview" tabindex="0">نمای کلی</button>
  <button id="tab-orders" role="tab" aria-selected="false"
          aria-controls="panel-orders" tabindex="-1">سفارش‌ها</button>
</div>
<div id="panel-overview" role="tabpanel" aria-labelledby="tab-overview" tabindex="0">
  آمار کلی
</div>
<div id="panel-orders" role="tabpanel" aria-labelledby="tab-orders" tabindex="0" hidden>
  فهرست سفارش‌ها
</div>
```

```js
for (const list of document.querySelectorAll('[role="tablist"]')) {
  const tabs = [...list.querySelectorAll('[role="tab"]')];
  const direction = () => getComputedStyle(list).direction;

  function activate(index, focus = true) {
    tabs.forEach((tab, i) => {
      const selected = i === index;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      const panel = document.getElementById(tab.getAttribute('aria-controls'));
      if (panel) panel.hidden = !selected;
    });
    if (focus) tabs[index].focus();
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(index, false));
    tab.addEventListener('keydown', (event) => {
      const rtl = direction() === 'rtl';
      const next = rtl ? 'ArrowLeft' : 'ArrowRight';
      const prev = rtl ? 'ArrowRight' : 'ArrowLeft';
      let target;
      if (event.key === next) target = (index + 1) % tabs.length;
      else if (event.key === prev) target = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') target = 0;
      else if (event.key === 'End') target = tabs.length - 1;
      else return;
      event.preventDefault();
      activate(target);
    });
  });
}
```

این نمونه «فعال‌سازی خودکار» را برای پنل‌های محلی و سریع پیاده می‌کند. اگر تغییر Tab باعث بارگذاری کند یا پرهزینه شود، از حالت Manual Activation استفاده کن و `Enter`/`Space` را برای فعال‌سازی اضافه کن. برای Tabهای عمودی، `ArrowUp`/`ArrowDown` را مطابق Orientation اضافه کن؛ نسخه بالا عمداً فقط افقی است.

## 7. Forms، Validation و Error Recovery

نام قابل‌دسترس، راهنمای کوتاه، خطای مرتبط و حفظ داده واردشده الزامی هستند. Placeholder جای Label را نمی‌گیرد. فقط رنگ قرمز برای بیان خطا کافی نیست.

```html
<form id="checkout-form" novalidate>
  <div class="field">
    <label for="customer-email">ایمیل مشتری</label>
    <p id="email-help">مثال: name@example.com</p>
    <input id="customer-email" name="email" type="email" dir="ltr"
           autocomplete="email" aria-describedby="email-help email-error" required>
    <p id="email-error" hidden>آدرس ایمیل را به‌درستی وارد کنید.</p>
  </div>
  <button type="submit">ثبت سفارش</button>
</form>
```

```js
const form = document.querySelector('#checkout-form');
const email = document.querySelector('#customer-email');
const error = document.querySelector('#email-error');

form.addEventListener('submit', (event) => {
  event.preventDefault(); // Example: integrate your real submit handler here.
  const valid = email.checkValidity();
  email.setAttribute('aria-invalid', String(!valid));
  error.hidden = valid;
  if (!valid) {
    email.focus();
    return;
  }
  // Real submission belongs to application logic; do not claim success here.
});
```

- برای خطاهای چندفیلدی، Error Summary و لینک به فیلدهای مشکل‌دار اضافه کن.
- خطا و توضیحات باید حتی پس از تغییر وضعیت DOM، از طریق Accessible Description قابل دریافت باشند.
- پیام تأیید بعد از ارسال واقعی را اعلام کن؛ درخواست ناموفق نباید Toast موفقیت نشان دهد.
- قالب‌های تاریخ، تقویم و اعداد را مطابق Locale Policy برنامه انتخاب کن؛ `fa-IR` همیشه به معنی نیاز قطعی به تاریخ جلالی در تمام پروژه‌ها نیست.
- فیلدهای OTP، رمز عبور و CAPTCHA باید با الزامات Accessible Authentication ارزیابی شوند.

## 8. Live regions، Toast، Tooltip و وضعیت‌های پویا

```html
<div id="status-messages" role="status" aria-live="polite" aria-atomic="true"></div>
```

```js
const status = document.querySelector('#status-messages');
function announceResult(message) {
  status.textContent = '';
  requestAnimationFrame(() => { status.textContent = message; });
}
```

- از `role="alert"` برای خطاهای واقعاً فوری و `role="status"` برای بازخورد عادی استفاده کن؛ هر تغییر جزئی را بلند اعلام نکن.
- Toast خودکار نباید فوکوس را برباید. اگر Toast شامل دکمه یا پیام مهم است، زمان محوشدن و امکان دسترسی دوباره را ارزیابی کن.
- Tooltip حاوی اطلاعات مورد نیاز باید با Focus و Hover در دسترس باشد؛ محتوای تعاملی در Tooltip ساده قرار نده.
- وضعیت Loading باید با متن، آیکون یا `aria-busy` مناسب به کاربر منتقل شود؛ فقط Spinner چرخان کافی نیست.
- تغییر جدول، مرتب‌سازی یا فیلتر باید نتیجه قابل‌درک و حالت فعال واضح داشته باشد.

## 9. Contrast، Color، Focus و Premium Visual Quality

پالت ایرانی‌الهام‌بخش یا تم برند را نگه دار، اما *هر زوج رنگ واقعی* در Light/Dark/High Contrast باید تست شود؛ صرف تعریف یک Token به معنای کنتراست مناسب نیست.

```css
:root {
  color-scheme: light;
  --focus-ring: #1d4ed8; /* Verify against every adjacent surface. */
}
[data-theme="dark"] { color-scheme: dark; --focus-ring: #93c5fd; }
@media (forced-colors: active) {
  :where(button, a, input, select, textarea):focus-visible {
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
  }
}
```

- متن عادی: نسبت 4.5:1؛ متن بزرگ: 3:1؛ اجزای غیرمتنی ضروری: 3:1 (با استثناهای استاندارد).
- رنگ تنها نشانه وضعیت نیست: متن، آیکون، Pattern یا توضیح مکمل استفاده کن.
- Hover و Focus دو حالت مستقل‌اند؛ روی موبایل Hover تنها راه دسترسی به اطلاعات نباشد.
- `forced-colors` و وضوح فونت را روی Windows High Contrast بررسی کن؛ سایه‌ها یا رنگ‌های سفارشی ممکن است حذف شوند.
- نمودارها باید Label، واحد، توضیح و در صورت نیاز جدول داده جایگزین داشته باشند.
- در متون فارسی و عربی، وزن، فاصله سطر، شکست خطوط، اعراب و بزرگ‌نمایی 200% را واقعی بررسی کن.

## 10. Responsive، Zoom، Motion و Input Modality

- عرض‌های مرجع: 320 / 375 / 768 / 1280 CSS px همراه با 200% و 400% Zoom. برای 400%، عرض مؤثر viewport را نیز در نظر بگیر.
- در Reflow، جدول‌های داده‌ای ممکن است نیازمند اسکرول افقی با Label و دسترسی کیبورد باشند؛ اسکرول افقی کل صفحه برای محتوای معمولی را نپذیر.
- در Browser Zoom یا بزرگ شدن متن، قطع شدن Label، خطا، کنترل و Focus نشان‌دهنده مشکل واقعی است.
- Hover، Pointer، Keyboard و Touch را جداگانه بررسی کن؛ مکانیزم جایگزین برای Drag-and-drop فراهم کن (WCAG 2.2 - 2.5.7 AA).
- Motion می‌تواند به فهم تغییر حالت کمک کند؛ برای کاربر دارای `prefers-reduced-motion: reduce` انتقال غیرضروری را کاهش بده. رجوع به `05-motion.md`.
- انتخاب Reduced Motion نباید اطلاعات لازم یا دسترسی به عملیات را حذف کند.

## 11. Audit مخصوص `demo.html` موجود

این‌ها **موارد بررسی/توسعه بعدی** هستند، نه تغییراتی که این فایل مستندات روی دمو اعمال کرده است:

| جزء در دمو | وضعیت شناسایی‌شده در کد | معیار پذیرش در اصلاح بعدی |
|---|---|---|
| Modal | باز/بسته شدن با `hidden` و فوکوس اولیه، بدون تضمین Focus Containment | Native `<dialog>` یا معادل تست‌شده؛ فوکوس محصور و پس‌زمینه inert |
| Drawer | باز/بسته با Class و `transform` | در حالت بسته عناصر قابل Tab نباشند؛ Escape و Focus Return درست |
| Tabs | Click و تغییر `aria-selected` وجود دارد | Arrow navigation، Roving Tabindex و ترتیب قابل پیش‌بینی در RTL/LTR |
| Forms | ورودی و Labelهای مختلف وجود دارند | خطاها با `aria-invalid` و `aria-describedby` مرتبط شوند |
| Toast | ناحیه `aria-live="polite"` دارد | پیام‌های مهم با زمان‌بندی و خوانش Screen Reader بررسی شوند |
| Theme | Light/Dark قابل تغییر است | کنتراست تمام زوج‌رنگ‌ها در هر دو Theme سنجیده شود |

**قانون:** قبل از گزارش «Fixed»، باید کد `demo.html` واقعاً تغییر کند، تست اجرا شود و نتیجه گزارش گردد. این مستند فقط الگوی هدف است.

## 12. Verification matrix و Definition of Done

| سطح | آزمون | Pass criteria |
|---|---|---|
| Static | HTML semantics، روابط `for/id`، تکرار ID، نام کنترل‌ها | بدون مشکل شناخته‌شده در دامنه بررسی |
| Automated | axe-core یا معادل آن روی صفحات کلیدی | عدم وجود یافته مهمِ توضیح‌داده‌نشده؛ خروجی و نسخه ثبت شود |
| Keyboard | Tab / Shift+Tab / Enter / Space / Escape / Arrows | بدون Keyboard Trap؛ Focus درست و قابل مشاهده |
| Screen reader | NVDA/Windows و حداقل یک ترکیب دیگر متناسب با مخاطب | نام، نقش، وضعیت و متن فارسی/عربی قابل فهم |
| RTL/LTR | تغییر جهت و متن‌های ترکیبی | ترتیب بصری/تعاملی منطقی، شناسه‌ها و URLها خوانا |
| Themes | Light / Dark / Forced Colors | کنتراست و Focus بررسی‌شده |
| Responsive | Mobile / Desktop / 200% Text / 400% Zoom | بدون حذف عملکرد یا پوشش کامل کنترل‌ها |
| Modal / Drawer | Open/Close و Focus Return | محصورسازی مناسب در حالت modal، عدم فوکوس محتوای پنهان |
| Motion | Reduced Motion | عملکرد مستقل از انیمیشن، بدون حرکت غیرضروری |
| Forms | Required / Invalid / Success / Failure | خطای قابل درک و پیام موفقیت فقط پس از نتیجه واقعی |

نمونه زیر **Test Skeleton** است و برای اجرا به تنظیم Playwright و `@axe-core/playwright` در پروژه نیاز دارد؛ تا نصب وابستگی‌ها و اجرای مرورگر تکمیل نشده، تست را انجام‌شده گزارش نکن.

```js
// tests/accessibility.spec.mjs — illustrative, requires Playwright setup.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('dashboard: automated accessibility smoke', async ({ page }) => {
  await page.goto('/demo.html');
  const scan = await new AxeBuilder({ page }).analyze();
  expect(scan.violations).toEqual([]);
});

test('dashboard: page exposes Persian language and RTL direction', async ({ page }) => {
  await page.goto('/demo.html');
  await expect(page.locator('html')).toHaveAttribute('lang', 'fa');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
});
```

این Test Skeleton فقط شروع کار است: «صفر بودن Violations» در ابزار خودکار به معنی انطباق کامل با WCAG نیست. تست‌های دستی و تعامل نیز الزامی‌اند.

### Report template

در پایان هر اصلاح UI، گزارش کوتاه و قابل بررسی ارائه کن:

1. **Scope:** مسیر فایل‌ها و کامپوننت‌های بررسی‌شده.
2. **Changes:** موارد اصلاح‌شده، با دلیل و اثر قابل مشاهده.
3. **Evidence:** دستور/نسخه ابزار، صفحه هدف، نتیجه Pass/Fail واقعی.
4. **Manual checks:** دستگاه، مرورگر، Screen Reader و تعامل کیبوردی تست‌شده.
5. **Unverified:** هر چیزی که اجرا نشده یا با محدودیت محیط بررسی شده است.
6. **Release blockers:** مشکلات باقی‌مانده با شدت و مالک اصلاح.

## References

- W3C WCAG 2.2: https://www.w3.org/TR/WCAG22/
- WAI APG Dialog (Modal): https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
- WAI APG Tabs: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
- W3C WAI Forms Tutorials: https://www.w3.org/WAI/tutorials/forms/
- MDN `<dialog>`: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog
- MDN `dir`: https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/dir
