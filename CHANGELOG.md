# Changelog

همه تغییرات قابل‌توجه این پروژه در این فایل مستند می‌شود.

قالب بر پایه [Keep a Changelog](https://keepachangelog.com/en/2.0.0/)
و این پروژه از [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
پیروی می‌کند. شش نوع تغییر: Added، Changed، Deprecated، Removed،
Fixed، Security.

## [Unreleased]

## [1.0.1-draft] - 2026-11-22

### Added
- فایل `references/03-color-and-tokens.md` با فلسفه پالت بومی ایرانی-اسلامی
- اسکریپت `scripts/audit-rtl.mjs` برای بررسی خودکار ویژگی‌های فیزیکی
- آزمون‌های خودکار Node.js و Playwright برای دموی رسمی.
- نمودار تحلیلی فروش با داده‌های نمونه و انتخاب بازه زمانی.
- قابلیت پیمایش افقی دسترس‌پذیر برای جدول سفارش‌ها در موبایل.
- آزمون کامپایل Tailwind CSS v4 در CI با ۱۰ بررسی منتخب.

### Changed
- بازسازی فایل اصلی `SKILL.md` و تعریف گردش‌کار ساخت و بررسی RTL.
- اصلاح آدرس مخزن در Metadata.
- بهبود قواعد زبان، جهت، تایپوگرافی، کامپوننت‌ها و دسترس‌پذیری.
- شفاف‌سازی وضعیت اسکریپت Audit و محدودیت‌های تست.
- شفاف‌سازی نشان WCAG به‌عنوان هدف ارزیابی، نه گواهی انطباق.
- frontmatter `SKILL.md` به مشخصات Agent Skills (شش فیلد، `metadata.version`)
- `assets/tailwind-tokens.css` به `@theme inline` و `@custom-variant dark`
- `references/05-motion.md` با بخش «معنای علامت `--flow-dir`»
- `SKILL.md` اصل نه با قاعده علامت `--flow-dir` و دام Drawer

### Fixed
- جهت `var(--flow-dir)` در `demo.html` که باعث نمایش Drawer در حالت بسته می‌شد
- شکست نامناسب شناسه، مبلغ و وضعیت سفارش‌ها در نمایشگرهای کوچک.

## [1.0.0] - 2026-11-18

### Added
- `SKILL.md` با workflow و ده اصل بنیادی
- `references/01-foundations.md` — `dir`/`lang`، Logical Properties، Bidi
- `references/02-typography.md` — Vazirmatn، `ss01`، اعداد، متن مختلط
- `references/04-components.md` — ناوبری، فرم، Modal، Drawer، چت
- `references/05-motion.md` — `var(--flow-dir)`، Swipe، reduced motion
- `references/06-accessibility.md` — WCAG 2.2 AA، ترتیب فوکوس، اهداف لمسی
- `references/07-checklist.md` — چک‌لیست PR و CI
- `assets/tailwind-tokens.css` — توکن‌های معنایی Tailwind v4
- نمونه دموی `demo.html` با حالت تاریک و جابه‌جایی RTL/LTR

[Unreleased]: https://github.com/alinanakar-click2all/rtl-vibe-ui/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/alinanakar-click2all/rtl-vibe-ui/releases/tag/v1.0.0