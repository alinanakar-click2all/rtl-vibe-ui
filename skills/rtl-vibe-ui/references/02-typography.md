
**`skills/rtl-vibe-ui/references/02-typography.md`**
```markdown
# Typography — فونت، اعداد، و قواعد تایپوگرافی فارسی/عربی

تایپوگرافی RTL فقط «عوض کردن فونت» نیست. خط عربی-فارسی ویژگی‌های
متریک متفاوتی دارد (اتصال حروف، اعراب، ارتفاع دیداری بیشتر) که اگر
رعایت نشوند، متن خوانا نخواهد بود حتی با بهترین فونت.

---

## ۱. پشته فونت (Font Stack)

### اصل: فارسی اول، لاتین به‌عنوان Fallback

```css
:root {
  --font-sans: "Vazirmatn", "Vazir", "Geist", system-ui, -apple-system, sans-serif;
  --font-mono: "Geist Mono", ui-monospace, monospace;
}