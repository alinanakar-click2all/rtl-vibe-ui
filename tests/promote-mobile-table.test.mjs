import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, copyFileSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { buildTrial } from '../scripts/build-mobile-table-trial.mjs';
import { safeMobileTablePromotion, validateMobileTableOfficial } from '../scripts/promote-mobile-table.mjs';

const source = (eol='\n', heading='آخرین سفارش\u200cها') => [
  '<!DOCTYPE html>', '<html lang="fa" dir="rtl">', '<head>',
  '<link rel="stylesheet" href="assets/demo-enhancements.css" />',
  '<link rel="stylesheet" href="assets/demo-visual-preview.css" />',
  '</head>', '<body>',
  '<section class="grid-2"><article class="card">',
  `            <h2>${heading}</h2>`, '<div class="table-wrap">',
  '<table><thead><tr><th>شماره سفارش</th></tr></thead><tbody><tr><td>#AR-10254</td></tr></tbody></table>',
  '</div></article></section>',
  '<script src="assets/demo-enhancements.js"></script>',
  '<script src="assets/demo-visual-preview.js"></script>',
  '</body>', '</html>',
].join(eol);

function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'rtl-table-promote-'));
  for (const part of ['scripts','assets','browser-check/artifacts']) mkdirSync(join(dir,part),{recursive:true});
  for (const file of ['build-mobile-table-trial.mjs','promote-mobile-table.mjs']) {
    copyFileSync(fileURLToPath(new URL(`../scripts/${file}`, import.meta.url)),join(dir,'scripts',file));
  }
  copyFileSync(fileURLToPath(new URL('../assets/demo-mobile-table-trial.css',import.meta.url)),join(dir,'assets/demo-mobile-table-trial.css'));
  writeFileSync(join(dir,'demo.html'),source());
  return dir;
}
function cli(dir, command) {return spawnSync(process.execPath,[join(dir,'scripts/promote-mobile-table.mjs'),command],{encoding:'utf8'});}

test('exact approved candidate promotes without touching original table or scripts', () => {
  const html=source(), prepared=buildTrial(html);
  const promoted=safeMobileTablePromotion(html,prepared);
  assert.equal(validateMobileTableOfficial(promoted),true);
  assert.ok(promoted.includes('<table><thead><tr><th>شماره سفارش</th>'));
  assert.equal((promoted.match(/<table>/g)||[]).length,1);
  assert.ok(!promoted.includes('<base href="../../">'));
  assert.ok(promoted.includes('آخرین سفارش\u200cها'));
  assert.ok(promoted.includes('aria-describedby="orders-scroll-hint" tabindex="0"'));
});

test('stale candidate, malformed source and a second promotion fail closed', () => {
  const html=source(), candidate=buildTrial(html);
  assert.throws(()=>safeMobileTablePromotion(html,candidate+'\n'),/stale or modified/);
  assert.throws(()=>safeMobileTablePromotion(html.replace('آخرین سفارش\u200cها','غیرمنتظره'),candidate),/heading/);
  const promoted=safeMobileTablePromotion(html,candidate);
  assert.throws(()=>safeMobileTablePromotion(promoted,candidate),/already present/);
});

test('validator rejects missing, duplicated or incorrectly placed mobile stylesheet', () => {
  const html=safeMobileTablePromotion(source(),buildTrial(source()));
  assert.throws(()=>validateMobileTableOfficial(source()),/stylesheet/);
  assert.throws(()=>validateMobileTableOfficial(html.replace('</head>','<link rel="stylesheet" href="assets/demo-mobile-table-trial.css"></head>')),/stylesheet/);
  assert.throws(()=>validateMobileTableOfficial(html.replace('<link rel="stylesheet" href="assets/demo-mobile-table-trial.css">','')),/stylesheet/);
});

test('validator rejects missing accessible hint, region, and nested trial base', () => {
  const html=safeMobileTablePromotion(source(),buildTrial(source()));
  assert.throws(()=>validateMobileTableOfficial(html.replace('id="orders-scroll-hint"','id="wrong"')),/hint/);
  assert.throws(()=>validateMobileTableOfficial(html.replace('role="region"','role="invalid"')),/hint/);
  assert.throws(()=>validateMobileTableOfficial(html.replace('</head>','<base href="../../"></head>')),/Nested preview base/);
});

test('CRLF source stays CRLF and only intended markers are added', () => {
  const html=source('\r\n'), out=safeMobileTablePromotion(html,buildTrial(html));
  assert.ok(out.includes('<head>\r\n<!-- Stage 66:'));
  assert.ok(!out.replaceAll('\r\n','').includes('\n'));
  assert.equal((out.match(/assets\/demo-visual-preview\.js/g)||[]).length,1);
});

test('CLI prepare outside test, apply, check and refuse second apply', () => {
  const dir=fixture();
  try {
    const original=readFileSync(join(dir,'demo.html'),'utf8');
    writeFileSync(join(dir,'browser-check/artifacts/demo-mobile-table-candidate.html'),buildTrial(original));
    assert.equal(cli(dir,'--check').status,1);
    assert.equal(readFileSync(join(dir,'demo.html'),'utf8'),original);
    const applied=cli(dir,'--apply');
    assert.equal(applied.status,0,applied.stderr);
    assert.equal(cli(dir,'--check').status,0);
    assert.equal(validateMobileTableOfficial(readFileSync(join(dir,'demo.html'),'utf8')),true);
    assert.notEqual(cli(dir,'--apply').status,0);
  }finally{rmSync(dir,{recursive:true,force:true});}
});

test('CLI stale candidate does not modify the official HTML', () => {
  const dir=fixture();
  try {
    const html=readFileSync(join(dir,'demo.html'),'utf8');
    writeFileSync(join(dir,'browser-check/artifacts/demo-mobile-table-candidate.html'),buildTrial(html)+' ');
    assert.notEqual(cli(dir,'--apply').status,0);
    assert.equal(readFileSync(join(dir,'demo.html'),'utf8'),html);
  }finally{rmSync(dir,{recursive:true,force:true});}
});

test('production inline comment may mention the JS asset; actual script tag is counted once', () => {
  const html = source().replace(
    '<script src="assets/demo-enhancements.js"></script>',
    '<script>/* Modal/Drawer/Tabs handled by assets/demo-enhancements.js. */</script>\n<script src="assets/demo-enhancements.js"></script>'
  );
  const promoted = safeMobileTablePromotion(html, buildTrial(html));
  assert.equal(validateMobileTableOfficial(promoted), true);
});

test('actual missing or duplicate asset tags still fail closed', () => {
  const html = source();
  const promoted = safeMobileTablePromotion(html, buildTrial(html));
  const jsTag = '<script src="assets/demo-enhancements.js"></script>';
  const cssTag = '<link rel="stylesheet" href="assets/demo-visual-preview.css" />';
  assert.throws(() => validateMobileTableOfficial(promoted.replace(jsTag, '')), /assets\/demo-enhancements\.js/);
  assert.throws(() => validateMobileTableOfficial(promoted.replace(jsTag, `${jsTag}\n${jsTag}`)), /assets\/demo-enhancements\.js/);
  assert.throws(() => validateMobileTableOfficial(promoted.replace(cssTag, '')), /assets\/demo-visual-preview\.css/);
  assert.throws(() => validateMobileTableOfficial(promoted.replace(cssTag, `${cssTag}\n${cssTag}`)), /assets\/demo-visual-preview\.css/);
});
