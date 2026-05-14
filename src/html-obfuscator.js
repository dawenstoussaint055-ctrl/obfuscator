'use strict';

/**
 * INCONNU Obfuscator - HTML Engine
 * Made by inconnu boy | GitHub: INCONNU-BOY
 */

const { obfuscateJS, getAntiDebugCode, getAntiCopyCode } = require('./js-obfuscator');

// ─── HTML Entity Encoding ─────────────────────────────────────────────────────

function encodeHtmlEntities(str) {
  return str.split('').map(c => {
    const code = c.charCodeAt(0);
    if (code > 127 || c === '<' || c === '>' || c === '&' || c === '"' || c === '\'') {
      return `&#${code};`;
    }
    return c;
  }).join('');
}

function toHexEntities(str) {
  return str.split('').map(c => `&#x${c.charCodeAt(0).toString(16)};`).join('');
}

// ─── Attribute Obfuscation ────────────────────────────────────────────────────

function obfuscateAttributes(html) {
  // Shuffle attribute order (basic)
  return html.replace(/<([a-zA-Z][a-zA-Z0-9]*)\s([^>]+)>/g, (match, tag, attrs) => {
    const attrList = [];
    const attrRe = /([a-zA-Z\-:]+)(?:=(?:"[^"]*"|'[^']*'|[^\s>]*))?/g;
    let m;
    while ((m = attrRe.exec(attrs)) !== null) {
      attrList.push(m[0]);
    }
    // Shuffle
    for (let i = attrList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [attrList[i], attrList[j]] = [attrList[j], attrList[i]];
    }
    return `<${tag} ${attrList.join(' ')}>`;
  });
}

// ─── Insert Fake/Junk HTML Comments ──────────────────────────────────────────

function insertJunkComments(html) {
  const junk = [
    '<!-- cache:0x' + Math.random().toString(16).slice(2, 10) + ' -->',
    '<!-- compiled:v' + Math.floor(Math.random() * 9999) + ' -->',
    '<!-- build:' + Date.now() + ' -->',
    '<!-- __INCONNU_PROTECTED__ -->',
    '<!-- 0x' + Math.random().toString(16).slice(2, 14) + ' -->',
  ];
  // Insert between tags
  return html.replace(/(>)(\s*)(<)/g, (match, close, space, open) => {
    if (Math.random() > 0.6) {
      const j = junk[Math.floor(Math.random() * junk.length)];
      return `${close}${space}${j}${open}`;
    }
    return match;
  });
}

// ─── Inline Style Obfuscation ─────────────────────────────────────────────────

function obfuscateInlineStyles(html) {
  // Convert style="..." to a slightly encoded version
  return html.replace(/style="([^"]*)"/g, (match, styles) => {
    // Nothing dangerous, just add redundant vendor prefixes
    const extra = `;-webkit-transform:translateZ(0);-moz-transform:translateZ(0)`;
    return `style="${styles}${extra}"`;
  });
}

// ─── Text Content Encoding ────────────────────────────────────────────────────

function encodeTextNodes(html) {
  // Encode visible text content using HTML entities (selective)
  return html.replace(/>([^<]{3,})</g, (match, text) => {
    if (text.trim().length === 0) return match;
    // Encode using decimal entities
    const encoded = text.split('').map(c => {
      if (c === ' ' || c === '\n' || c === '\t') return c;
      return `&#${c.charCodeAt(0)};`;
    }).join('');
    return `>${encoded}<`;
  });
}

// ─── CSS Obfuscation ─────────────────────────────────────────────────────────

function obfuscateCSS(css) {
  // Remove comments
  let result = css.replace(/\/\*[\s\S]*?\*\//g, '');
  // Minify
  result = result.replace(/\s+/g, ' ').trim();
  // Encode string values
  result = result.replace(/(content:\s*["'])([^"']+)(["'])/g, (match, open, val, close) => {
    const encoded = val.split('').map(c => `\\${c.charCodeAt(0).toString(16)} `).join('');
    return `${open}${encoded}${close}`;
  });
  return result;
}

// ─── Script Tag Extraction & Obfuscation ────────────────────────────────────

function processScriptTags(html, jsOpts) {
  return html.replace(/<script([^>]*)>([\s\S]*?)<\/script>/gi, (match, attrs, code) => {
    if (!code.trim()) return match;
    // Skip external scripts (src attribute)
    if (/src=/i.test(attrs)) return match;
    try {
      const obfuscated = obfuscateJS(code, jsOpts);
      return `<script${attrs}>${obfuscated}</script>`;
    } catch (e) {
      return match; // Leave as-is if error
    }
  });
}

// ─── Style Tag Extraction & Obfuscation ─────────────────────────────────────

function processStyleTags(html) {
  return html.replace(/<style([^>]*)>([\s\S]*?)<\/style>/gi, (match, attrs, css) => {
    if (!css.trim()) return match;
    const obfuscatedCss = obfuscateCSS(css);
    return `<style${attrs}>${obfuscatedCss}</style>`;
  });
}

// ─── Protection Layer: document.write Wrapper ────────────────────────────────

function wrapBodyInDocWrite(html) {

  const bodyMatch = html.match(/<body([^>]*)>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) return html;

  const bodyAttrs = bodyMatch[1];
  const bodyContent = bodyMatch[2];

  const encoded = encodeBase64(bodyContent);
  const script = `
<script>
(function(){
  var _d=atob('${encoded}');
  document.open();document.write(_d);document.close();
})();
</script>`;

  return html.replace(/<body[^>]*>[\s\S]*?<\/body>/i,
    `<body${bodyAttrs}>${script}</body>`);
}

function encodeBase64(str) {
  return Buffer.from(str).toString('base64');
}

// ─── Main HTML Obfuscation Pipeline ─────────────────────────────────────────

/**
 * @param {string} html - Raw HTML source
 * @param {object} opts - Options
 * @returns {string} - Obfuscated HTML
 */
function obfuscateHTML(html, opts = {}) {
  const options = {
    obfuscateScripts: true,
    obfuscateStyles: true,
    encodeTextNodes: false,     
    insertJunkComments: true,
    obfuscateAttributes: false, 
    antiDebug: false,
    antiCopy: false,
    wrapBody: false,            
    ...opts,
  };

  let result = html;


  if (options.obfuscateScripts) {
    result = processScriptTags(result, {
      renameVars: true,
      obfuscateStrings: true,
      obfuscateNumbers: true,
      deadCode: true,
    });
  }

  
  if (options.obfuscateStyles) {
    result = processStyleTags(result);
  }


  if (options.encodeTextNodes) {
    result = encodeTextNodes(result);
  }

  
  if (options.insertJunkComments) {
    result = insertJunkComments(result);
  }

  if (options.obfuscateAttributes) {
    result = obfuscateAttributes(result);
  }


  const protectionScripts = [];

  if (options.antiDebug) {
    protectionScripts.push(`<script>${getAntiDebugCode()}</script>`);
  }

  if (options.antiCopy) {
    protectionScripts.push(`<script>${getAntiCopyCode()}</script>`);
  }

  if (protectionScripts.length > 0) {
    result = result.replace('</head>', protectionScripts.join('\n') + '\n</head>');
  }


  if (options.wrapBody) {
    result = wrapBodyInDocWrite(result);
  }

  const sig = `<!-- ${Buffer.from('INCONNU OBFUSCATOR | INCONNU-BOY').toString('base64')} -->`;
  result = result.replace('<html', sig + '\n<html');

  return result;
}

module.exports = { obfuscateHTML, obfuscateCSS };
