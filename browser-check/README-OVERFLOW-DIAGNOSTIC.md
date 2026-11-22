# RTL Vibe UI – 320px Overflow Diagnostic

Unzip into your project root `D:\Ai\rtl-vibe-ui`, adding `browser-check/diagnose-overflow.mjs`.

In Git Bash, from the **project root**:

```bash
node browser-check/diagnose-overflow.mjs
```

This script uses your existing `browser-check/node_modules` installation. It opens the generated preview in locally installed Chrome at 320px, measures overflow before and after the mobile menu closes, reports overflowing DOM elements, then temporarily tests CSS hypotheses *inside the browser only*. It does not write any project files.

**Do not commit, push, or add `overflow-x:hidden` to mask the issue.** Share the terminal output so the responsible component can be fixed and the original Playwright regression test rerun.
