import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTrial, checkTrial } from '../scripts/build-mobile-table-trial.mjs';

const input = (eol = '\n', heading = 'آخرین سفارشها') => [
  '<!DOCTYPE html>', '<html lang="fa" dir="rtl">', '<head>',
  '<link href="assets/demo-enhancements.css">', '<link href="assets/demo-visual-preview.css">',
  '</head>', '<body>', '<section class="grid-2">', '<article class="card">',
  `<h2>${heading}</h2>`, '<div class="table-wrap">',
  '<table><thead><tr><th>شماره سفارش</th></tr></thead><tbody><tr><td>#AR-10254</td></tr></tbody></table>',
  '</div>', '</article>', '</section>',
  '<script src="assets/demo-enhancements.js"></script>',
  '<script src="assets/demo-visual-preview.js"></script>',
  '</body>', '</html>',
].join(eol);

test('trial adds stylesheet, base and scrollable region without changing native table structure', () => {
  const source = input();
  const out = buildTrial(source);
  assert.match(out, /<base href="\.\.\/\.\.\/">/);
  assert.match(out, /aria-describedby="orders-scroll-hint" tabindex="0"/);
  assert.match(out, /<table><thead><tr>/);
  assert.equal((out.match(/<table>/g) || []).length, 1);
  assert.equal((out.match(/demo-mobile-table-trial\.css/g) || []).length, 1);
  assert.equal(source.includes('orders-scroll-hint'), false);
  assert.doesNotThrow(() => checkTrial(source, out));
});
test('candidate validation rejects a stale or modified candidate', () => {
  assert.throws(() => checkTrial(input(), buildTrial(input()) + ' '), /Candidate is missing/);
});
test('builder rejects repeated anchors, missing order title and repeated enhancement', () => {
  assert.throws(() => buildTrial(input().replace('<h2>آخرین سفارشها</h2>', '')), /Orders table heading/);
  assert.throws(() => buildTrial(input().replace('<div class="table-wrap">', '<div class="table-wrap"><div class="table-wrap">')), /expected exactly one anchor/);
  assert.throws(() => buildTrial(buildTrial(input())), /already present/);
});
test('builder preserves CRLF style for inserted markup', () => {
  const out = buildTrial(input('\r\n'));
  assert.ok(out.includes('<base href="../../">\r\n<link'));
  assert.equal(out.replace(/\r\n/g, '').includes('\n'), false);
});
test('builder refuses non-HTML input or missing visual assets', () => {
  assert.throws(() => buildTrial('hello'), /Expected complete HTML/);
  assert.throws(() => buildTrial(input().replace('assets/demo-visual-preview.js', 'missing.js')), /Missing official/);
});

// The actual demo.html on branch fix/skill-entrypoint-v1.0.1 has a ZWNJ.
// Earlier synthetic tests were missing this distinction; the CLI failed
// even while every unit test passed. This regression test covers both.
test('accepts current production heading with Persian ZWNJ and realistic indentation', () => {
  const source = input('\n', 'آخرین سفارش\u200cها')
    .replace('<h2>آخرین سفارش\u200cها</h2>', '            <h2>آخرین سفارش\u200cها</h2>')
    .replace('<div class="table-wrap">', '          <div class="table-wrap">');
  const candidate = buildTrial(source);
  assert.ok(candidate.includes('<h2>آخرین سفارش\u200cها</h2>'));
  assert.ok(candidate.includes('aria-label="جدول آخرین سفارش‌ها"'));
  assert.doesNotThrow(() => checkTrial(source, candidate));
});

test('fails closed for missing, duplicated, or misplaced orders heading', () => {
  assert.throws(() => buildTrial(input().replace('آخرین سفارشها', 'سفارش‌های اخیر')), /Orders table heading/);
  assert.throws(() => buildTrial(input().replace('</article>', '<h2>آخرین سفارش\u200cها</h2></article>')), /expected exactly one matching heading/);
  assert.throws(() => buildTrial(input().replace('<h2>آخرین سفارشها</h2>', '').replace('<div class="table-wrap">', '<div class="table-wrap"><h2>آخرین سفارش\u200cها</h2>')), /expected order/);
});
