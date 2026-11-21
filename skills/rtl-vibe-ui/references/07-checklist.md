
**`skills/rtl-vibe-ui/references/07-checklist.md`**
```markdown
# Checklist — چک‌لیست قابل کپی برای PR و CI

این فایل، جمع‌بندی عملیاتی شش فایل مرجع قبلی است. دو بخش دارد: **چک‌لیست PR** و **چک‌لیست CI**.

---

## بخش الف — چک‌لیست PR (قابل کپی در `.github/pull_request_template.md`)

```markdown
## RTL UI Checklist

### جهت و ساختار
- [ ] `<html lang="fa|ar" dir="rtl">` روی همه صفحات RTL
- [ ] هیچ `ml-*`/`mr-*`/`pl-*`/`pr-*`/`left-*`/`right-*`/`text-left`/`text-right` فیزیکی در کد نیست
- [ ] در Tailwind v4 از `ms-*`/`me-*`/`ps-*`/`pe-*`/`inset-s-*`/`inset-e-*` استفاده شده
- [ ] محتوای انگلیسی داخل صفحه فارسی `dir="ltr"` دارد

### تایپوگرافی
- [ ] فونت فارسی (Vazirmatn) اول در `font-family`
- [ ] `font-feature-settings: "ss01"` روی `body`
- [ ] `letter-spacing: 0` (یا حذف شده) روی همه متن RTL
- [ ] `line-height` بدنه ≥ ۱.۶۵
- [ ] فیلدهای ایمیل/URL/تلفن/کد `dir="ltr"` دارند

### کامپوننت‌ها
- [ ] سایدبار از راست شروع می‌شود (Grid یا `border-inline-end`)
- [ ] مودال `role="dialog"` و `aria-modal="true"` دارد
- [ ] Drawer با `inset-inline-start`/`end` و `translateX` صحیح پیاده شده
- [ ] Toast در سمت end ظاهر می‌شود
- [ ] شورون آکاردئون در RTL آینه شده
- [ ] حباب‌های چت: کاربر در end، طرف مقابل در start

### حرکت (Motion)
- [ ] هیچ `translateX()` ثابت بدون `var(--flow-dir)` یا keyframe جهت‌دار نیست
- [ ] انیمیشن‌های ورود و خروج از یک سمت (start) هستند
- [ ] Swipe در RTL آینه شده (بعدی = کشیدن به راست)
- [ ] `@media (prefers-reduced-motion: no-preference)` دور انیمیشن‌هاست

### دسترس‌پذیری (WCAG 2.2 AA)
- [ ] هیچ `tabindex` مثبت وجود ندارد
- [ ] ترتیب DOM با ترتیب منطقی RTL هم‌خوان است
- [ ] حلقه فوکوس ≥ ۲px با کنتراست ≥ ۳:۱ و `outline-offset` ≥ ۲px
- [ ] اهداف لمسی ≥ ۴۴×۴۴px با فاصله ≥ ۸px
- [ ] خطاها با `aria-describedby` و `role="alert"` مرتبط شده‌اند
- [ ] در ۲۰۰٪ zoom و ۳۲۰px عرض، اسکرول افقی وجود ندارد