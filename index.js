'use strict';

/**
 * 
 *  INCONNU OBFUSCATOR v1.0.0           
 * Made by inconnu boy | INCONNU-BOY     
 * GitHub: https://github.com/INCONNU-BOY  
 * 
 */

const fs   = require('fs');
const path = require('path');
const { obfuscateJS }   = require('./src/js-obfuscator');
const { obfuscateHTML } = require('./src/html-obfuscator');

// ─── ANSI Colors (no external dep) ──────────────────────────────────────────
const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  red:    '\x1b[31m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  magenta:'\x1b[35m',
  white:  '\x1b[97m',
  gray:   '\x1b[90m',
  bgBlack:'\x1b[40m',
};

// ─── Banner ──────────────────────────────────────────────────────────────────
function printBanner() {
  console.log(`
${C.cyan}${C.bold}
██╗███╗   ██╗ ██████╗ ██████╗ ███╗   ██╗███╗   ██╗██╗   ██╗
██║████╗  ██║██╔════╝██╔═══██╗████╗  ██║████╗  ██║██║   ██║
██║██╔██╗ ██║██║     ██║   ██║██╔██╗ ██║██╔██╗ ██║██║   ██║
██║██║╚██╗██║██║     ██║   ██║██║╚██╗██║██║╚██╗██║██║   ██║
██║██║ ╚████║╚██████╗╚██████╔╝██║ ╚████║██║ ╚████║╚██████╔╝
╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═══╝ ╚═════╝ 
${C.reset}${C.white}             O B F U S C A T O R  v1.0.0${C.reset}
${C.gray}         Made by inconnu boy  |  GitHub: INCONNU-BOY${C.reset}
${C.gray}  ─────────────────────────────────────────────────────${C.reset}
`);
}

// ─── Help ─────────────────────────────────────────────────────────────────────
function printHelp() {
  console.log(`${C.bold}${C.white}USAGE:${C.reset}
  ${C.cyan}node index.js${C.reset} ${C.yellow}<input>${C.reset} ${C.yellow}[output]${C.reset} ${C.gray}[options]${C.reset}

${C.bold}${C.white}EXAMPLES:${C.reset}
  ${C.gray}# Obfuscate a JS file${C.reset}
  node index.js script.js
  node index.js script.js output/script.obf.js

  ${C.gray}# Obfuscate an HTML file${C.reset}
  node index.js index.html
  node index.js index.html output/index.obf.html

  ${C.gray}# Obfuscate an entire folder${C.reset}
  node index.js ./my-project/ ./obfuscated/

  ${C.gray}# With extra protection flags${C.reset}
  node index.js index.html --anti-debug --anti-copy --wrap-body

${C.bold}${C.white}OPTIONS:${C.reset}
  ${C.yellow}--anti-debug${C.reset}      Inject anti-DevTools debugger traps
  ${C.yellow}--anti-copy${C.reset}       Disable right-click, Ctrl+U/S/A/C, F12
  ${C.yellow}--wrap-body${C.reset}       Wrap HTML body in Base64 document.write (HTML only)
  ${C.yellow}--no-strings${C.reset}      Skip string array obfuscation
  ${C.yellow}--no-numbers${C.reset}      Skip number obfuscation
  ${C.yellow}--no-rename${C.reset}       Skip variable renaming
  ${C.yellow}--no-dead-code${C.reset}    Skip dead code injection
  ${C.yellow}--help, -h${C.reset}        Show this help message

${C.bold}${C.white}SUPPORTED TYPES:${C.reset}
  ${C.green}.js${C.reset}   JavaScript files
  ${C.green}.html${C.reset} HTML files (includes inline <script> and <style>)
  ${C.green}.htm${C.reset}  HTML files
`);
}

// ─── Parse Args ───────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = {
    input: null,
    output: null,
    antiDebug: false,
    antiCopy: false,
    wrapBody: false,
    obfuscateStrings: true,
    obfuscateNumbers: true,
    renameVars: true,
    deadCode: true,
    help: false,
  };

  const flags = [];
  const positional = [];

  for (const a of args) {
    if (a.startsWith('--') || a.startsWith('-')) flags.push(a);
    else positional.push(a);
  }

  if (flags.includes('--help') || flags.includes('-h')) { opts.help = true; return opts; }
  if (flags.includes('--anti-debug'))  opts.antiDebug = true;
  if (flags.includes('--anti-copy'))   opts.antiCopy = true;
  if (flags.includes('--wrap-body'))   opts.wrapBody = true;
  if (flags.includes('--no-strings'))  opts.obfuscateStrings = false;
  if (flags.includes('--no-numbers'))  opts.obfuscateNumbers = false;
  if (flags.includes('--no-rename'))   opts.renameVars = false;
  if (flags.includes('--no-dead-code'))opts.deadCode = false;

  opts.input  = positional[0] || null;
  opts.output = positional[1] || null;
  return opts;
}

// ─── Output Path Helper ───────────────────────────────────────────────────────
function resolveOutput(inputFile, outputArg) {
  const ext  = path.extname(inputFile);
  const base = path.basename(inputFile, ext);
  const dir  = outputArg ? outputArg : path.dirname(inputFile);
  return path.join(dir, base + '.obf' + ext);
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function progressBar(current, total, label) {
  const pct   = Math.round((current / total) * 100);
  const filled = Math.round((current / total) * 30);
  const bar   = '█'.repeat(filled) + '░'.repeat(30 - filled);
  process.stdout.write(`\r${C.cyan}[${bar}]${C.reset} ${C.yellow}${pct}%${C.reset} ${C.gray}${label}${C.reset}   `);
  if (current === total) process.stdout.write('\n');
}

// ─── Obfusca───────────────────────────
function obfuscateFile(inputPath, outputPath, opts) {
  const ext  = path.extname(inputPath).toLowerCase();
  const src  = fs.readFileSync(inputPath, 'utf-8');
  let result = '';

  if (ext === '.js') {
    result = obfuscateJS(src, {
      renameVars:        opts.renameVars,
      obfuscateStrings:  opts.obfuscateStrings,
      obfuscateNumbers:  opts.obfuscateNumbers,
      obfuscateProperties: true,
      deadCode:          opts.deadCode,
      antiDebug:         opts.antiDebug,
      antiCopy:          opts.antiCopy,
    });
  } else if (ext === '.html' || ext === '.htm') {
    result = obfuscateHTML(src, {
      obfuscateScripts:  true,
      obfuscateStyles:   true,
      insertJunkComments:true,
      antiDebug:         opts.antiDebug,
      antiCopy:          opts.antiCopy,
      wrapBody:          opts.wrapBody,
    });
  } else {
    throw new Error(`Unsupported file type: ${ext}`);
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, result, 'utf-8');

  const origSize  = Buffer.byteLength(src, 'utf8');
  const finalSize = Buffer.byteLength(result, 'utf8');
  return { origSize, finalSize };
}

// ─── Obfuscate Folder ─────────────────────────────────────────────────────────
function obfuscateFolder(inputDir, outputDir, opts) {
  const allFiles = [];

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        walk(full);
      } else {
        const ext = path.extname(e.name).toLowerCase();
        if (['.js', '.html', '.htm'].includes(ext)) {
          allFiles.push(full);
        }
      }
    }
  }
  walk(inputDir);

  if (allFiles.length === 0) {
    console.log(`${C.yellow}⚠  No .js or .html files found in ${inputDir}${C.reset}`);
    return;
  }

  console.log(`\n${C.white}${C.bold}Found ${allFiles.length} file(s) to obfuscate...${C.reset}\n`);

  let ok = 0, fail = 0;
  for (let i = 0; i < allFiles.length; i++) {
    const file    = allFiles[i];
    const rel     = path.relative(inputDir, file);
    const outFile = path.join(outputDir, rel);
    progressBar(i + 1, allFiles.length, rel);
    try {
      const { origSize, finalSize } = obfuscateFile(file, outFile, opts);
      ok++;
      const ratio = ((finalSize / origSize) * 100).toFixed(0);
      console.log(`  ${C.green}✓${C.reset} ${rel} ${C.gray}(${formatBytes(origSize)} → ${formatBytes(finalSize)}, ${ratio}%)${C.reset}`);
    } catch (e) {
      fail++;
      console.log(`  ${C.red}✗${C.reset} ${rel} ${C.gray}(${e.message})${C.reset}`);
    }
  }

  console.log(`\n${C.green}${C.bold}Done!${C.reset} ${C.green}${ok} succeeded${C.reset}, ${fail > 0 ? C.red : C.gray}${fail} failed${C.reset}`);
  console.log(`${C.gray}Output → ${path.resolve(outputDir)}${C.reset}\n`);
}

function formatBytes(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}

// ─── Entry Point ──────────────────────────────────────────────────────────────
function main() {
  printBanner();
  const opts = parseArgs(process.argv);

  if (opts.help || !opts.input) {
    printHelp();
    process.exit(0);
  }

  const inputPath = path.resolve(opts.input);

  if (!fs.existsSync(inputPath)) {
    console.error(`${C.red}✗ Input not found: ${inputPath}${C.reset}`);
    process.exit(1);
  }

  const stat = fs.statSync(inputPath);

  if (stat.isDirectory()) {
    const outputDir = opts.output ? path.resolve(opts.output) : inputPath + '_obfuscated';
    obfuscateFolder(inputPath, outputDir, opts);
  } else {
    const outputPath = opts.output
      ? path.resolve(opts.output)
      : resolveOutput(inputPath, null);

    console.log(`\n${C.white}Obfuscating: ${C.cyan}${path.basename(inputPath)}${C.reset}`);

    try {
      const { origSize, finalSize } = obfuscateFile(inputPath, outputPath, opts);
      const ratio = ((finalSize / origSize) * 100).toFixed(0);
      console.log(`${C.green}✓ Done!${C.reset}`);
      console.log(`  Input:  ${C.gray}${path.resolve(inputPath)}${C.reset} ${C.yellow}(${formatBytes(origSize)})${C.reset}`);
      console.log(`  Output: ${C.gray}${outputPath}${C.reset} ${C.yellow}(${formatBytes(finalSize)}, ${ratio}%)${C.reset}\n`);
    } catch (e) {
      console.error(`${C.red}✗ Error: ${e.message}${C.reset}`);
      process.exit(1);
    }
  }
}

main();
