#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, '.vuepress', 'dist');

function assertExists(p) {
  if (!fs.existsSync(p)) {
    console.error(`[SMOKE] Missing: ${p}`);
    process.exit(1);
  }
}

try {
  assertExists(dist);
  assertExists(path.join(dist, 'index.html'));
  assertExists(path.join(dist, 'assets'));
  assertExists(path.join(dist, 'assets', 'js'));
  const files = fs.readdirSync(path.join(dist, 'assets', 'js'));
  if (!files || files.length === 0) {
    console.error('[SMOKE] No JS assets found');
    process.exit(1);
  }
  console.log('[SMOKE] OK: dist contains index.html and JS assets');
  process.exit(0);
} catch (e) {
  console.error('[SMOKE] Error:', e.message);
  process.exit(1);
}
