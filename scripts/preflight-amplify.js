#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const lock = path.join(root, 'pnpm-lock.yaml');
const pkg = path.join(root, 'package.json');

function die(msg) { console.error(`❌ ${msg}`); process.exit(1); }

if (!fs.existsSync(lock)) die('pnpm-lock.yaml not found at repo root. Commit it or disable --frozen-lockfile.');
if (!fs.existsSync(pkg)) die('package.json missing at repo root.');

const pkgJson = JSON.parse(fs.readFileSync(pkg, 'utf8'));
if (!pkgJson.engines || !pkgJson.engines.node) {
  die('package.json engines.node not set. Add "node": ">=22 <23".');
}

console.log('✅ Preflight OK: lockfile present and engines set.');
