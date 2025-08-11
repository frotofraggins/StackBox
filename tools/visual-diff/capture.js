#!/usr/bin/env node
/**
 * Visual Diff Capture Tool
 * Takes screenshots of specified pages and viewports
 */
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const config = require('./pages.json');

async function capture(mode = 'before') {
  console.log(`📸 Capturing ${mode} screenshots...`);
  
  const outputDir = path.join(__dirname, '..', '..', 'artifacts', 'visual-diffs', mode);
  
  // Ensure output directory exists
  fs.mkdirSync(outputDir, { recursive: true });
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  try {
    const page = await browser.newPage();
    
    for (const pagePath of config.paths) {
      for (const [width, height] of config.viewports) {
        const url = `${config.baseUrl}${pagePath}`;
        const filename = `${pagePath === '/' ? 'home' : pagePath.slice(1).replace(/\//g, '-')}-${width}x${height}.png`;
        const filepath = path.join(outputDir, filename);
        
        console.log(`  📷 ${url} @ ${width}x${height}`);
        
        await page.setViewport({ width, height });
        
        try {
          await page.goto(url, { waitUntil: 'networkidle0', timeout: 10000 });
          await page.screenshot({ path: filepath, fullPage: true });
          console.log(`    ✅ Saved: ${filename}`);
        } catch (error) {
          console.error(`    ❌ Failed: ${filename} - ${error.message}`);
          // Continue with other screenshots
        }
      }
    }
  } finally {
    await browser.close();
  }
  
  console.log(`✅ Screenshot capture complete: ${mode}`);
}

// Run if called directly
if (require.main === module) {
  const mode = process.argv[2] || 'before';
  capture(mode).catch(console.error);
}

module.exports = { capture };
