'use strict';

/**
 * INCONNU Obfuscator — Full Test Suite
 * Made by inconnu boy | GitHub: INCONNU-BOY
 */

const fs = require('fs');
const path = require('path');
const { obfuscateJS }   = require('./src/js-obfuscator');
const { obfuscateHTML } = require('./src/html-obfuscator');

const C = {
  reset: '\x1b[0m', green: '\x1b[32m', red: '\x1b[31m',
  cyan: '\x1b[36m', yellow: '\x1b[33m', bold: '\x1b[1m', gray: '\x1b[90m',
};

let passed = 0, failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`${C.green}  ✓${C.reset} ${name}`);
    passed++;
  } catch(e) {
    console.log(`${C.red}  ✗${C.reset} ${name}`);
    console.log(`    ${C.red}${e.message}${C.reset}`);
    failed++;
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'Assertion failed');
}

console.log(`\n${C.cyan}${C.bold}INCONNU Obfuscator — Test Suite${C.reset}\n`);


console.log(`${C.bold}[ JavaScript Engine ]${C.reset}`);

test('JS output is non-empty', () => {
  const out = obfuscateJS('var x = 1;');
  assert(out.length > 0, 'Output is empty');
});

test('JS output is syntactically valid', () => {
  const src = `
    var name = 'Alice'; var age = 25;
    function greet(n) { return 'Hello ' + n; }
    var result = greet(name);
  `;
  const out = obfuscateJS(src);
  new Function(out); 
});

test('JS original variable names are hidden', () => {
  const src = `var secretPassword = 'hidden123'; function loginUser() { return secretPassword; }`;
  const out = obfuscateJS(src, { renameVars: true });
  assert(!out.includes('secretPassword'), 'Variable name "secretPassword" still visible');
  assert(!out.includes('loginUser'), 'Function name "loginUser" still visible');
});

test('JS string literals are encoded', () => {
  const src = `var api = 'my-secret-api-key'; var user = 'administrator';`;
  const out = obfuscateJS(src, { obfuscateStrings: true });
  assert(!out.includes('my-secret-api-key'), 'String "my-secret-api-key" still in output');
  assert(!out.includes('administrator'), 'String "administrator" still in output');
});

test('JS numbers are obfuscated', () => {
  const src = `var x = 42; var y = 100;`;
  const out = obfuscateJS(src, { obfuscateNumbers: true, obfuscateStrings: false, renameVars: false });
  assert(!/ 42[^0-9]/.test(out) && !/ 100[^0-9]/.test(out), 'Plain numbers still visible');
});

test('JS output wrapped in IIFE', () => {
  const out = obfuscateJS('var x = 1;');
  assert(out.startsWith(';(function('), 'Output not wrapped in IIFE');
});

test('JS dead code injected', () => {
  const out = obfuscateJS('var x = 1;', { deadCode: true });
  assert(out.includes('if(false)'), 'Dead code not found');
});

test('JS large file handles correctly', () => {
  let src = '';
  for (let i = 0; i < 50; i++) {
    src += `var variable${i} = 'string_${i}'; function func${i}() { return variable${i}; }\n`;
  }
  const out = obfuscateJS(src);
  assert(out.length > 100, 'Output too short for large file');
  new Function(out); // syntax check
});

test('JS with no strings handles gracefully', () => {
  const src = `var x = 1 + 2; var y = x * 3;`;
  const out = obfuscateJS(src);
  assert(out.length > 0, 'Empty output for string-less code');
});

test('JS property access encoded to unicode', () => {
  const src = `console.log('test');`;
  const out = obfuscateJS(src, { obfuscateProperties: true, obfuscateStrings: false });
 
  assert(out.includes('[\'\\u'), 'Property not encoded to unicode');
});


console.log(`\n${C.bold}[ HTML Engine ]${C.reset}`);

test('HTML output is non-empty', () => {
  const out = obfuscateHTML('<html><body><p>Hello</p></body></html>');
  assert(out.length > 0);
});

test('HTML preserves DOCTYPE', () => {
  const src = '<!DOCTYPE html><html><head></head><body></body></html>';
  const out = obfuscateHTML(src);
  assert(out.includes('<!DOCTYPE html>'), 'DOCTYPE missing from output');
});

test('HTML inline <script> is obfuscated', () => {
  const src = `<html><head></head><body><script>var secret = 'my-password-123';</script></body></html>`;
  const out = obfuscateHTML(src);
  assert(!out.includes('my-password-123'), 'JS string still visible in HTML output');
});

test('HTML <style> tags are preserved', () => {
  const src = `<html><head><style>body { color: red; }</style></head><body></body></html>`;
  const out = obfuscateHTML(src);
  assert(out.includes('<style>'), 'Style tag missing from output');
});

test('HTML external scripts are NOT modified', () => {
  const src = `<html><body><script src="https://cdn.example.com/lib.js"></script></body></html>`;
  const out = obfuscateHTML(src);
  assert(out.includes('src="https://cdn.example.com/lib.js"'), 'External script src was modified');
});

test('HTML INCONNU signature injected', () => {
  const src = `<html><head></head><body></body></html>`;
  const out = obfuscateHTML(src);
  // Signature is base64 encoded INCONNU OBFUSCATOR comment
  assert(out.includes('SU5DT05OVSBPQkZVU0NBVE9SIHwgSU5DT05OVS1CT1k='), 'INCONNU signature missing');
});

test('HTML junk comments injected', () => {
  const src = `<html><head><title>Test</title></head><body><p>Hello</p></body></html>`;
  const out = obfuscateHTML(src, { insertJunkComments: true });
  assert(out.includes('<!--'), 'No junk comments found');
});

test('HTML with anti-copy injects script', () => {
  const src = `<html><head></head><body></body></html>`;
  const out = obfuscateHTML(src, { antiCopy: true });
  assert(out.includes('contextmenu'), 'Anti-copy code not injected');
});

test('HTML with anti-debug injects debugger trap', () => {
  const src = `<html><head></head><body></body></html>`;
  const out = obfuscateHTML(src, { antiDebug: true });
  assert(out.includes('setInterval'), 'Anti-debug code not injected');
});

// ─── CLI Tests ────────────────────────────────────────────────────────────────
console.log(`\n${C.bold}[ File I/O ]${C.reset}`);

test('Obfuscate test.js and write output', () => {
  const src = fs.readFileSync('./test-files/test.js', 'utf-8');
  const out = obfuscateJS(src);
  fs.mkdirSync('./output', { recursive: true });
  fs.writeFileSync('./output/test.obf.js', out, 'utf-8');
  assert(fs.existsSync('./output/test.obf.js'), 'Output file not created');
  assert(fs.statSync('./output/test.obf.js').size > 0, 'Output file is empty');
});

test('Obfuscate test.html and write output', () => {
  const src = fs.readFileSync('./test-files/test.html', 'utf-8');
  const out = obfuscateHTML(src);
  fs.writeFileSync('./output/test.obf.html', out, 'utf-8');
  assert(fs.existsSync('./output/test.obf.html'), 'Output file not created');
  assert(fs.statSync('./output/test.obf.html').size > 0, 'Output file is empty');
});

test('Output JS is larger than input (obfuscation adds overhead)', () => {
  const src = fs.readFileSync('./test-files/test.js', 'utf-8');
  const out = obfuscateJS(src);
  assert(out.length > src.length, 'Output should be larger than input');
});

test('Output JS is valid Node.js (no syntax errors)', () => {
  const out = fs.readFileSync('./output/test.obf.js', 'utf-8');
  new Function(out); // will throw if invalid
});

// ─── Summary ──────────────────────────────────────────────────────────────────
const total = passed + failed;
console.log(`\n${C.bold}────────────────────────────────${C.reset}`);
console.log(`${C.bold}Results: ${C.green}${passed} passed${C.reset}, ${failed > 0 ? C.red : C.gray}${failed} failed${C.reset} / ${total} total`);

if (failed === 0) {
  console.log(`\n${C.green}${C.bold}✓ All tests passed! Project is ready.${C.reset}\n`);
  process.exit(0);
} else {
  console.log(`\n${C.red}${C.bold}✗ Some tests failed. Check output above.${C.reset}\n`);
  process.exit(1);
}
