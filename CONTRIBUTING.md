# Contributing to RTL Vibe UI

ممنون که می‌خواهی کمک کنی. این پروژه برای **دقت** و **قابل‌اتکا بودن**
طراحی شده — لطفاً قبل از ارسال PR، این راهنما را بخوان.

## انواع مشارکت

| نوع | مسیر | قالب PR |
|---|---|---|
| افزودن قاعده RTL جدید | `references/` | `new-feature` |
| اصلاح باگ یا قاعده اشتباه | هر فایل | `bug-fix` |
| بهبود تایپوگرافی/رنگ | `references/02-typography.md` یا `03-color-and-tokens.md` | `visual-update` |
| به‌روزرسانی توکن‌ها | `assets/tailwind-tokens.css` | `other` |

هر PR باید **یک هدف اصلی** داشته باشد. PRهای ترکیبی
(مثلاً «افزودن قاعده + بازطراحی پالت») رد می‌شوند.

## راه‌اندازی

```bash
git clone https://github.com/alinanakar/rtl-vibe-ui.git
cd rtl-vibe-ui
# اعتبارسنجی ساختار (نیازمند Python 3.12+)
pip install skills-ref
skills-ref validate ./skills/rtl-vibe-ui