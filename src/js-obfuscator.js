'use strict';
/**
 * INCONNU Obfuscator - JavaScript Engine
 * Made by inconnu boy | GitHub: INCONNU-BOY
 */
const crypto = require('crypto');

function randomId(len) {
  return '_0x' + crypto.randomBytes(len||8).toString('hex').slice(0, len||8);
}
function randomHex(str) {
  return str.split('').map(c => '\\x' + c.charCodeAt(0).toString(16).padStart(2,'0')).join('');
}
function toUnicode(str) {
  return str.split('').map(c => '\\u' + c.charCodeAt(0).toString(16).padStart(4,'0')).join('');
}
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function generateJunk() {
  const p = ['_0x','__','_$','$_'][randomInt(0,3)];
  return p + crypto.randomBytes(4).toString('hex');
}

// ── Smart Comment Stripper ────────────────────────────────────────
// Does NOT strip // inside strings (e.g. URLs like https://)
function stripComments(code) {
  let result = '';
  let i = 0;
  while (i < code.length) {
  
    if (code[i] === '"' || code[i] === "'" || code[i] === '`') {
      const q = code[i];
      result += code[i++];
      while (i < code.length) {
        if (code[i] === '\\') { result += code[i++]; result += code[i++]; continue; }
        result += code[i];
        if (code[i++] === q) break;
      }
    }
  
    else if (code[i] === '/' && code[i+1] === '/') {
      while (i < code.length && code[i] !== '\n') i++;
    }
    
    else if (code[i] === '/' && code[i+1] === '*') {
      i += 2;
      while (i < code.length && !(code[i] === '*' && code[i+1] === '/')) i++;
      i += 2;
    }
    else {
      result += code[i++];
    }
  }
  return result;
}

// ── Tokeniser ─────────────────────────────────────────────────────
// Splits source into {t:'code'|'str', v:string, key:bool} segments.
function tokenise(src) {
  const toks = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === '"' || ch === "'") {
      const q = ch;
      let j = i + 1;
      while (j < src.length) {
        if (src[j] === '\\') { j += 2; continue; }
        if (src[j] === q)    { j++; break; }
        j++;
      }
      const val = src.slice(i, j);
      
      let k = j;
      while (k < src.length && (src[k] === ' ' || src[k] === '\t')) k++;
      const isKey = src[k] === ':' && src[k+1] !== ':';
      toks.push({ t: 'str', v: val, key: isKey });
      i = j;
    } else {
      let j = i + 1;
      while (j < src.length && src[j] !== '"' && src[j] !== "'") j++;
      if (j > i) toks.push({ t: 'code', v: src.slice(i, j) });
      i = j;
    }
  }
  return toks;
}

// ── Dead Code ──────────────────────────────────────────────────────
function deadCode() {
  const out = [];
  for (let i = 0; i < randomInt(3,5); i++) {
    const a=generateJunk(), b=generateJunk(), c=generateJunk();
    out.push(
      `var ${a}=function(){return ${randomInt(1000,9999)};};` +
      `var ${b}=${a}()*${randomInt(1,9)};` +
      `if(false){console['log'](${b});}` +
      `var ${c}=typeof ${b}!=='undefined'?${b}:null;`
    );
  }
  return out.join('\n');
}

// ── Rename Variables ───────────────────────────────────────────────
const RESERVED = new Set([
  'var','let','const','function','return','if','else','for','while','do',
  'switch','case','break','continue','new','delete','typeof','instanceof',
  'in','of','try','catch','finally','throw','class','extends','import',
  'export','default','this','super','null','undefined','true','false',
  'NaN','Infinity','console','window','document','Math','JSON','Object',
  'Array','String','Number','Boolean','RegExp','Error','Promise','async',
  'await','yield','arguments','prototype','constructor','length','push',
  'pop','shift','unshift','splice','slice','join','map','filter','reduce',
  'forEach','indexOf','includes','toString','parseInt','parseFloat',
  'isNaN','isFinite','setTimeout','setInterval','clearTimeout',
  'clearInterval','require','module','exports','process','Buffer',
]);

function renameVariables(src) {
  const toks = tokenise(src);
  const map  = {};
  const DECL = /\b(?:var|let|const)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
  const FUNC  = /\bfunction\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g;
  for (const tok of toks) {
    if (tok.t !== 'code') continue;
    let m;
    DECL.lastIndex = 0;
    while ((m = DECL.exec(tok.v)) !== null) {
      const n = m[1];
      if (!RESERVED.has(n) && !map[n]) map[n] = randomId(5);
    }
    FUNC.lastIndex = 0;
    while ((m = FUNC.exec(tok.v)) !== null) {
      const n = m[1];
      if (!RESERVED.has(n) && !map[n]) map[n] = randomId(5);
    }
  }
  if (!Object.keys(map).length) return src;
  return toks.map(tok => {
    if (tok.t !== 'code') return tok.v;
    let out = tok.v;
    for (const [from, to] of Object.entries(map)) {
      out = out.replace(new RegExp('\\b' + from.replace(/[$]/g,'\\$') + '\\b', 'g'), to);
    }
    return out;
  }).join('');
}

// ── String Obfuscation ─────────────────────────────────────────────
function obfuscateStrings(src) {
  const toks = tokenise(src);
  const strs = [];
  for (const tok of toks) {
    if (tok.t !== 'str' || tok.key) continue;
    const inner = tok.v.slice(1, -1);
    if (inner.length > 0 && !strs.includes(inner)) strs.push(inner);
  }
  if (!strs.length) return src;

  const shuffled = shuffleArray([...strs]);
  const idx = {};
  strs.forEach(s => { idx[s] = shuffled.indexOf(s); });

  const ARR = randomId(6);
  const DEC = randomId(6);
  const rot = shuffled.length > 1 ? randomInt(1, shuffled.length - 1) : 0;
  const rotated = rot > 0 ? [...shuffled.slice(rot), ...shuffled.slice(0, rot)] : [...shuffled];
  const lit = rotated.map(s => "'" + randomHex(s) + "'").join(',');

  const bootstrap =
    `var ${ARR}=[${lit}];` +
    (rot > 0 ? `(function(){for(var _r=0;_r<${shuffled.length-rot};_r++){${ARR}.push(${ARR}.shift());}})();` : '') +
    `function ${DEC}(_i){return ${ARR}[_i];}`;

  const replaced = toks.map(tok => {
    if (tok.t !== 'str' || tok.key) return tok.v;
    const inner = tok.v.slice(1, -1);
    if (!strs.includes(inner)) return tok.v;
    return `${DEC}(${idx[inner]})`;
  }).join('');

  return bootstrap + '\n' + replaced;
}

// ── Number Obfuscation ─────────────────────────────────────────────
function obfuscateNumbers(src) {
  const toks = tokenise(src);
  return toks.map(tok => {
    if (tok.t !== 'code') return tok.v;
    return tok.v.replace(/\b(\d+)\b/g, (m, num) => {
      const n = parseInt(num);
      if (isNaN(n) || n > 100000) return m;
      const off = randomInt(1,300);
      return `(${n+off}-${off})`;
    });
  }).join('');
}

// ── Property Encoding ──────────────────────────────────────────────
const SKIP_PROPS = new Set(['prototype','constructor','length','name','arguments']);
function obfuscateProperties(src) {
  const toks = tokenise(src);
  return toks.map(tok => {
    if (tok.t !== 'code') return tok.v;
    return tok.v.replace(/(\w)\.([$a-zA-Z_][a-zA-Z0-9_$]*)/g, (m, obj, prop) => {
      if (SKIP_PROPS.has(prop)) return m;
      return `${obj}['${toUnicode(prop)}']`;
    });
  }).join('');
}

// ── Protection Helpers ─────────────────────────────────────────────
function getAntiDebugCode() {
  const fn = randomId(5);
  return `(function(){var ${fn}=function(){var _t=new Date();debugger;` +
    `if(new Date()-_t>100){document.body.innerHTML='';}};` +
    `setInterval(${fn},800);` +
    `try{(function(){}).constructor('debugger')();}catch(e){}})();`;
}
function getAntiCopyCode() {
  return `document.addEventListener('contextmenu',function(e){e.preventDefault();});` +
    `document.addEventListener('keydown',function(e){` +
    `if(e.ctrlKey&&(e.key==='u'||e.key==='s'||e.key==='a'||e.key==='c')){e.preventDefault();}` +
    `if(e.keyCode===123){e.preventDefault();}});`;
}

// ── Main Pipeline ──────────────────────────────────────────────────
function obfuscateJS(code, opts) {
  opts = opts || {};
  const o = {
    renameVars: opts.renameVars          !== false,
    strings:    opts.obfuscateStrings    !== false,
    numbers:    opts.obfuscateNumbers    !== false,
    props:      opts.obfuscateProperties !== false,
    dead:       opts.deadCode            !== false,
    antiDebug:  !!opts.antiDebug,
    antiCopy:   !!opts.antiCopy,
  };

  
  let r = stripComments(code);
  
  r = tokenise(r).map(tok => tok.t === 'code' ? tok.v.replace(/\s+/g,' ') : tok.v).join('').trim();

  if (o.renameVars) r = renameVariables(r);
  if (o.strings)    r = obfuscateStrings(r);
  if (o.numbers)    r = obfuscateNumbers(r);
  if (o.props)      r = obfuscateProperties(r);
  if (o.dead)       r = deadCode() + '\n' + r;
  if (o.antiDebug)  r = getAntiDebugCode() + '\n' + r;
  if (o.antiCopy)   r = getAntiCopyCode() + '\n' + r;

  const w1 = randomId(4), w2 = randomId(4);
  return `;(function(${w1},${w2}){${r}})(this,function(){return [];});`;
}

module.exports = { obfuscateJS, getAntiDebugCode, getAntiCopyCode };
