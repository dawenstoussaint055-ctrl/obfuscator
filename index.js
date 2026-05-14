'use strict';
const express = require('express');
const path = require('path');
const { obfuscateJS } = require('./src/js-obfuscator');
const { obfuscateHTML } = require('./src/html-obfuscator');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'inconnu')));

// API: obfuscate
app.post('/api/obfuscate', (req, res) => {
  const { code, mode, options } = req.body;
  if (!code || !mode) return res.status(400).json({ error: 'Missing code or mode' });

  try {
    let result;
    if (mode === 'js') {
      result = obfuscateJS(code, options || {});
    } else if (mode === 'html' || mode === 'htm') {
      result = obfuscateHTML(code, options || {});
    } else {
      return res.status(400).json({ error: 'Unsupported mode. Use js or html.' });
    }
    res.json({ result, originalSize: code.length, obfuscatedSize: result.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', version: '1.0.0' }));


app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'inconnu', 'inconnu.html'));
});

app.listen(PORT, () => {
  console.log(`INCONNU Obfuscator running on port ${PORT}`);
});

module.exports = app;
