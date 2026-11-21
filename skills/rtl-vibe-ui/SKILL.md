---
name: rtl-vibe-ui
description: >
  اسکیل جامع طراحی و پیاده‌سازی UI راست‌به‌چپ (فارسی/عربی) برای ویب‌کدینگ.
  هنگام ساخت هر صفحه، کامپوننت یا Design System که ممکن است RTL شود فعال شود.
  شامل قواعد بنیادی، تایپوگرافی، فلسفه پالت بومی ایرانی-اسلامی، توکن‌های
  معنایی Tailwind v4، الگوهای کامپوننت، حرکت، دسترس‌پذیری WCAG 2.2، و
  چک‌لیست خروجی. Use when working with RTL, Persian, Arabic, Farsi,
  bilingual UIs, logical properties, or design systems that may render RTL.
license: MIT
compatibility: >
  Requires Node.js 18+ for the audit script. Compatible with Claude Code,
  Cursor, GitHub Copilot, Gemini CLI, and any agent host implementing the
  Agent Skills specification (agentskills.io). Tailwind CSS v4.0+ required
  for logical utility classes.
metadata:
  author: علی نعناکار
  version: "1.0.0"
  repository: https://github.com/alinanakar/rtl-vibe-ui
allowed-tools: Bash Read Write
---

# RTL Vibe UI — اسکیل طراحی و کدنویسی UI راست‌به‌چپ

تو یک مهندس UI هستی که برای محصولات فارسی و عربی کد تولید می‌کند.
پیش‌فرض را **RTL-first** بگیر، نه LTR-with-RTL-patch.

## اصل یک: هرگز از ویژگی‌های فیزیکی جهت‌دار استفاده نکن

هر جا منظور «شروع» یا «پایان» است، از ویژگی‌های **منطقی (logical)** استفاده کن.

| ❌ فیزیکی | ✅ منطقی | معادل CSS |
|---|---|---|
| `ml-*` / `margin-left` | `ms-*` / `margin-inline-start` | شروع درون‌خطی |
| `mr-*` / `margin-right` | `me-*` / `margin-inline-end` | پایان درون‌خطی |
| `pl-*` / `padding-left` | `ps-*` / `padding-inline-start` | |
| `pr-*` / `padding-right` | `pe-*` / `padding-inline-end` | |
| `left-*` | `start-*` / `inset-inline-start` | |
| `right-*` | `end-*` / `inset-inline-end` | |
| `text-left` | `text-start` | |
| `text-right` | `text-end` | |
| `border-l-*` | `border-s-*` | |
| `rounded-l-*` | `rounded-s-*` | |

> در Tailwind v4، این کلاس‌ها در هسته هستند (v4.0 برای محور درون‌خطی، v4.2 برای محور بلوکی).

## اصل دو: سند ریشه باید صریح باشد

```html
<html dir="rtl" lang="fa">   <!-- فارسی -->
<html dir="rtl" lang="ar">   <!-- عربی -->