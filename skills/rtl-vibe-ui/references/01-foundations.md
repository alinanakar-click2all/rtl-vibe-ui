
**`skills/rtl-vibe-ui/references/01-foundations.md`**
```markdown
# Foundations — dir/lang، Logical Properties، و Bidi

این فایل مرجع قواعد بنیادی RTL است. قبل از ساخت هر کامپوننت، این لایه باید
درست باشد؛ در غیر این صورت هر کامپوننتی که روی آن ساخته شود، در RTL خواهد
شکست.

---

## ۱. اعلان جهت و زبان سند

### قانون طلایی

هر صفحه RTL باید **هم `dir` و هم `lang`** داشته باشد. `dir` بدون `lang`
ناقص است و `lang` بدون `dir` ممکن است به‌درستی رندر نشود.

```html
<html dir="rtl" lang="fa">   <!-- فارسی -->
<html dir="rtl" lang="ar">   <!-- عربی -->