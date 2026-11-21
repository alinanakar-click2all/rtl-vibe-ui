#!/usr/bin/env node
/**
 * audit-rtl.mjs — بررسی خودکار RTL برای فایل‌های CSS، HTML، JSX، TSX.
 *
 * بدون وابستگی خارجی. فقط از ماژول‌های داخلی Node.js استفاده می‌کند.
 *
 * نحوه استفاده:
 *   node scripts/audit-rtl.mjs [مسیرها...] [--fix] [--check]
 *
 * کد خروج:
 *   0 — خطایی یافت نشد (ممکن است هشدار وجود داشته باشد)
 *   1 — خطا یافت شد
 *
 * قواعد بررسی:
 *   css-physical-property    ویژگی فیزیکی CSS (margin-left, left, ...)
 *   css-physical-value       مقدار فیزیکی (text-align: left, float: right)
 *   css-asymmetric-shorthand شورت‌هند نامتقارن (padding: 0 8px 0 0)
 *   css-direction-hardcoded  direction: ltr ثابت
 *   css-letter-spacing       letter-spacing غیرصفر روی متن فارسی/عربی
 *   tailwind-physical-class  کلاس فیزیکی Tailwind (ml-4, pr-2, left-0, ...)
 *   html-missing-dir         <html> بدون dir
 *   html-missing-lang        dir="rtl" بدون lang
 *   icon-not-mirrored        آیکون جهت‌دار بدون آینه‌سازی RTL
 *   input-ltr-missing        input از نوع email/tel/url بدون dir="ltr"
 */

import { readFileSync, writeFileSync } from "node:fs";
import { extname, relative, resolve } from "node:path";
import { glob } from "node:fs/promises";

// ---------------------------------------------------------------- تنظیمات

const EXTENSIONS = new Set([".css", ".scss", ".html", ".jsx", ".tsx"]);

// نگاشت ویژگی فیزیکی به منطقی
const PHYSICAL_PROPS = {
  "margin-left": "margin-inline-start",
  "margin-right": "margin-inline-end",
  "margin-top": "margin-block-start",
  "margin-bottom": "margin-block-end",
  left: "inset-inline-start",
  right: "inset-inline-end",
  top: "inset-block-start",
  bottom: "inset-block-end",
  "padding-left": "padding-inline-start",
  "padding-right": "padding-inline-end",
  "padding-top": "padding-block-start",
  "padding-bottom": "padding-block-end",
  "border-left": "border-inline-start",
  "border-right": "border-inline-end",
  "border-top": "border-block-start",
  "border-bottom": "border-block-end",
  "border-left-color": "border-inline-start-color",
  "border-right-color": "border-inline-end-color",
  "border-left-width": "border-inline-start-width",
  "border-right-width": "border-inline-end-width",
  "border-top-left-radius": "border-start-start-radius",
  "border-top-right-radius": "border-start-end-radius",
  "border-bottom-left-radius": "border-end-start-radius",
  "border-bottom-right-radius": "border-end-end-radius",
  width: "inline-size",
  height: "block-size",
  "min-width": "min-inline-size",
  "max-width": "max-inline-size",
  "min-height": "min-block-size",
  "max-height": "max-block-size",
};

// نگاشت مقدار فیزیکی به منطقی (فقط برای ویژگی‌های جهت‌دار)
const PHYSICAL_VALUES = {
  "text-align": { left: "start", right: "end" },
  float: { left: "inline-start", right: "inline-end" },
  clear: { left: "inline-start", right: "inline-end" },
};

// نگاشت کلاس فیزیکی Tailwind به منطقی
const TAILWIND_PHYSICAL = [
  { re: /\bml-(\S+)/g, to: "ms-$1" },
  { re: /\bmr-(\S+)/g, to: "me-$1" },
  { re: /\bpl-(\S+)/g, to: "ps-$1" },
  { re: /\bpr-(\S+)/g, to: "pe-$1" },
  { re: /\bleft-(\S+)/g, to: "start-$1" },
  { re: /\bright-(\S+)/g, to: "end-$1" },
  { re: /\btext-left\b/g, to: "text-start" },
  { re: /\btext-right\b/g, to: "text-end" },
  { re: /\bborder-l-(\S+)/g, to: "border-s-$1" },
  { re: /\bborder-r-(\S+)/g, to: "border-e-$1" },
  { re: /\brounded-l-(\S+)/g, to: "rounded-s-$1" },
  { re: /\brounded-r-(\S+)/g, to: "rounded-e-$1" },
  { re: /\brounded-tl-(\S+)/g, to: "rounded-ts-$1" },
  { re: /\brounded-tr-(\S+)/g, to: "rounded-te-$1" },
  { re: /\brounded-bl-(\S+)/g, to: "rounded-bs-$1" },
  { re: /\brounded-br-(\S+)/g, to: "rounded-be-$1" },
];

// نام آیکون‌های جهت‌دار که باید در RTL آینه شوند
const DIRECTIONAL_ICONS = /\b(Chevron(Left|Right)|Arrow(Left|Right)|FaArrow(Left|Right)|MdKeyboardArrow(Left|Right)|BsChevron(Left|Right))\b/;

// الگوهایی که نشان می‌دهند RTL قبلاً مدیریت شده — نباید گزارش شوند
const RTL_SKIP = /rtl:|ltr:|\[dir="rtl"\]|:dir\(rtl\)|\.rtl\b/;

// بازه حروف فارسی/عربی
const RTL_SCRIPT = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;

// ------------------------------------------------------------------ انواع

/** @typedef {{ file:string, line:number, column:number, rule:string, message:string, severity:'error'|'warn', fixable:boolean }} Finding */

// ------------------------------------------------------------------ کمکی‌ها

function posAt(text, index) {
  const before = text.slice(0, index);
  const line = before.split("\n").length;
  const lastNl = before.lastIndexOf("\n");
  const column = index - lastNl;
  return { line, column };
}

function pushFinding(findings, file, text, index, rule, message, severity = "error", fixable = false) {
  const { line, column } = posAt(text, index);
  findings.push({ file, line, column, rule, message, severity, fixable });
}

// ------------------------------------------------------------- قواعد CSS

function auditCSS(text, file, findings, fix) {
  const declRe = /([a-zA-Z-]+)\s*:\s*([^;}{]+)(?:;|(?=}))/g;
  let m;
  while ((m = declRe.exec(text)) !== null) {
    const prop = m[1].toLowerCase().trim();
    const value = m[2].trim();
    const idx = m.index;

    const around = text.slice(Math.max(0, idx - 80), idx + m[0].length + 80);
    if (RTL_SKIP.test(around)) continue;

    // ۱) ویژگی فیزیکی
    if (PHYSICAL_PROPS[prop]) {
      const logical = PHYSICAL_PROPS[prop];
      const isSymmetric =
        (prop === "left" || prop === "right") &&
        /\b(left|right)\s*:\s*0\b/.test(text) &&
        /\b(left|right)\s*:\s*0\b/.test(text);
      if (!isSymmetric) {
        pushFinding(
          findings, file, text, idx,
          "css-physical-property",
          `"${prop}" در RTL آینه نمی‌شود: از "${logical}" استفاده کن`,
          "error",
          true,
        );
        if (fix) {
          text = text.slice(0, idx) +
            text.slice(idx).replace(new RegExp(`^${prop.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}`), logical);
        }
      }
    }

    // ۲) مقدار فیزیکی
    if (PHYSICAL_VALUES[prop]) {
      const map = PHYSICAL_VALUES[prop];
      if (map[value]) {
        const logicalVal = map[value];
        pushFinding(
          findings, file, text, idx,
          "css-physical-value",
          `"${prop}: ${value}" در RTL آینه نمی‌شود: از "${logicalVal}" استفاده کن`,
          "error",
          true,
        );
        if (fix) {
          const valIdx = idx + m[0].indexOf(value);
          text = text.slice(0, valIdx) + logicalVal + text.slice(valIdx + value.length);
        }
      }
    }

    // ۳) شورت‌هند نامتقارن
    if (/^(padding|margin|border-radius)$/.test(prop)) {
      const parts = value.split(/\s+/);
      if (parts.length === 4 && (parts[0] !== parts[1] || parts[1] !== parts[3])) {
        pushFinding(
          findings, file, text, idx,
          "css-asymmetric-shorthand",
          `"${prop}: ${value}" سمت‌ها را نامتقارن تنظیم می‌کند؛ از longhandهای -block/-inline استفاده کن`,
          "warn",
          false,
        );
      }
    }

    // ۴) direction: ltr ثابت
    if (prop === "direction" && value === "ltr") {
      pushFinding(
        findings, file, text, idx,
        "css-direction-hardcoded",
        `"direction: ltr" ثابت است؛ آن را پویا کن یا حذف کن`,
        "warn",
        false,
      );
    }

    // ۵) letter-spacing روی متن RTL
    if (prop === "letter-spacing" && value !== "0" && value !== "normal") {
      const nearby = text.slice(Math.max(0, idx - 400), idx + 400);
      if (RTL_SCRIPT.test(nearby)) {
        pushFinding(
          findings, file, text, idx,
          "css-letter-spacing",
          `letter-spacing روی متن فارسی/عربی اتصال حروف را می‌شکند؛ آن را 0 یا normal کن`,
          "error",
          true,
        );
        if (fix) {
          const valIdx = idx + m[0].indexOf(value);
          text = text.slice(0, valIdx) + "0" + text.slice(valIdx + value.length);
        }
      }
    }
  }

  return text;
}

// ----------------------------------------------------- قواعد HTML/JSX

function auditHTMLLike(text, file, findings, fix) {
  // ۱) <html> بدون dir
  const htmlTag = /<html\b([^>]*)>/i.exec(text);
  if (htmlTag) {
    const attrs = htmlTag[1];
    if (!/\bdir\s*=/.test(attrs)) {
      pushFinding(
        findings, file, text, htmlTag.index,
        "html-missing-dir",
        `<html> بدون dir="rtl" است`,
        "error",
        true,
      );
      if (fix) {
        text = text.replace(/<html\b([^>]*)>/i, `<html$1 dir="rtl">`);
      }
    } else if (/\bdir\s*=\s*["']rtl["']/.test(attrs) && !/\blang\s*=/.test(attrs)) {
      pushFinding(
        findings, file, text, htmlTag.index,
        "html-missing-lang",
        `dir="rtl" بدون lang؛ lang="fa" یا lang="ar" اضافه کن`,
        "warn",
        true,
      );
      if (fix) {
        text = text.replace(/(<html\b[^>]*dir\s*=\s*["']rtl["'][^>]*)>/i, `$1 lang="fa">`);
      }
    }
  }

  // ۲) کلاس‌های فیزیکی Tailwind
  for (const { re, to } of TAILWIND_PHYSICAL) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      const around = text.slice(Math.max(0, m.index - 80), m.index + m[0].length + 80);
      if (RTL_SKIP.test(around)) continue;

      const cls = m[0];
      const symmetricPartner = cls.startsWith("ml-")
        ? cls.replace("ml-", "mr-")
        : cls.startsWith("mr-")
          ? cls.replace("mr-", "ml-")
          : cls.startsWith("pl-")
            ? cls.replace("pl-", "pr-")
            : cls.startsWith("pr-")
              ? cls.replace("pr-", "pl-")
              : null;
      if (symmetricPartner && text.includes(symmetricPartner)) continue;

      pushFinding(
        findings, file, text, m.index,
        "tailwind-physical-class",
        `"${cls}" در RTL آینه نمی‌شود: از "${cls.replace(re, to)}" استفاده کن`,
        "error",
        true,
      );
      if (fix) {
        const replaced = cls.replace(re, to);
        text = text.slice(0, m.index) + replaced + text.slice(m.index + cls.length);
      }
    }
  }

  // ۳) آیکون‌های جهت‌دار بدون آینه‌سازی
  let iconM;
  const iconRe = new RegExp(DIRECTIONAL_ICONS.source, "g");
  while ((iconM = iconRe.exec(text)) !== null) {
    const around = text.slice(Math.max(0, iconM.index - 200), iconM.index + 200);
    if (/rtl:.*scale-x|scale-x-.*rtl:|rtl:-scale-x/.test(around)) continue;
    pushFinding(
      findings, file, text, iconM.index,
      "icon-not-mirrored",
      `<${iconM[0]}> جهت‌دار است؛ rtl:-scale-x-100 یا آینه‌سازی CSS اضافه کن`,
      "warn",
      false,
    );
  }

  // ۴) inputهای LTR بدون dir="ltr"
  const inputRe = /<input\b[^>]*\btype\s*=\s*["'](email|tel|url|number)["'][^>]*>/gi;
  let inputM;
  while ((inputM = inputRe.exec(text)) !== null) {
    if (/\bdir\s*=/.test(inputM[0])) continue;
    pushFinding(
      findings, file, text, inputM.index,
      "input-ltr-missing",
      `<input type="${RegExp.$1}"> باید dir="ltr" داشته باشد تا مقدار و کرسر نپرد`,
      "warn",
      true,
    );
    if (fix) {
      text = text.replace(inputM[0], inputM[0].replace("<input", '<input dir="ltr"'));
    }
  }

  return text;
}

// --------------------------------------------------------------- پیمایش

async function* walk(dir) {
  const entries = await glob(`${dir.replace(/\\/g, "/")}/**/*`, { withFileTypes: true });
  for await (const entry of entries) {
    if (entry.isFile() && EXTENSIONS.has(extname(entry.name))) {
      yield resolve(entry.parentPath ?? dir, entry.name);
    }
  }
}

// ------------------------------------------------------------------- main

async function main() {
  const args = process.argv.slice(2);
  const fix = args.includes("--fix");
  const checkOnly = args.includes("--check");
  const paths = args.filter((a) => !a.startsWith("--"));

  const roots = paths.length > 0 ? paths : ["."];
  const findings = [];
  let fileCount = 0;

  for (const root of roots) {
    for await (const file of walk(root)) {
      fileCount++;
      const original = readFileSync(file, "utf8");
      let text = original;

      const ext = extname(file);
      if (ext === ".css" || ext === ".scss") {
        text = auditCSS(text, file, findings, fix);
      } else {
        text = auditHTMLLike(text, file, findings, fix);
      }

      if (fix && text !== original) {
        writeFileSync(file, text, "utf8");
      }
    }
  }

  // ---- خروجی ----
  for (const f of findings) {
    const rel = relative(process.cwd(), f.file);
    const tag = f.severity === "error" ? "error" : "warn ";
    console.log(`${rel}:${f.line}:${f.column}  ${tag}  ${f.message}  [${f.rule}]`);
  }

  const errors = findings.filter((f) => f.severity === "error").length;
  const warns = findings.filter((f) => f.severity === "warn").length;

  console.log(
    `\n${fileCount} فایل بررسی شد. ${errors} خطا، ${warns} هشدار.`,
  );

  if (fix) {
    const fixed = findings.filter((f) => f.fixable).length;
    console.log(`--fix روی ${fixed} مورد قابل‌اصلاح اعمال شد.`);
  }

  if (errors > 0 && !checkOnly) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});