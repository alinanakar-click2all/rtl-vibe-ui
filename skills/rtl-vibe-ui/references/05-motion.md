
**`skills/rtl-vibe-ui/references/05-motion.md`**
```markdown
# Motion — جهت انیمیشن، Swipe، و Reduced Motion

حرکت در RTL فقط «آینه کردن انیمیشن» نیست. `transform: translateX()` و ویژگی‌های فیزیکی مانند `left`/`right` **خودکار آینه نمی‌شوند** و منبع اصلی باگ‌های حرکتی RTL هستند. این فایل قواعد جهت‌دهی حرکت، تعاملات کشیدنی، و احترام به ترجیحات کاربر را تعریف می‌کند.

---

## ۱. اصل بنیادی: `translateX()` آینه نمی‌شود

Flexbox و Grid و `text-align` در RTL خودکار آینه می‌شوند، اما `translateX()` این‌طور نیست. مقدار مثبت **همیشه** به راست حرکت می‌کند، حتی در RTL. این یعنی Drawer، Carousel، و هر انیمیشن slide-in که با `translateX()` ساخته شود، در RTL از سمت اشتباه وارد می‌شود.

### راه‌حل ۱: دو keyframe جداگانه (توصیه‌شده)
این راه‌حل صریح، قابل‌خواندن، و بدون وابستگی به ترفندهای CSS است:
```css
/* LTR */
@keyframes slide-in-start-ltr {
  from { transform: translateX(-100%); }
  to   { transform: translateX(0); }
}
/* RTL */
@keyframes slide-in-start-rtl {
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
}
[dir="ltr"] .slide-in-start { animation-name: slide-in-start-ltr; }
[dir="rtl"] .slide-in-start { animation-name: slide-in-start-rtl; }