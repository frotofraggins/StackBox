#!/usr/bin/env node
/**
 * Visual Diff Index Generator
 * Creates HTML comparison report for before/after screenshots
 */
const fs = require('fs');
const path = require('path');

const config = require('./pages.json');

function generateIndex() {
  console.log('📝 Generating visual diff index...');
  
  const artifactsDir = path.join(__dirname, '..', '..', 'artifacts', 'visual-diffs');
  const beforeDir = path.join(artifactsDir, 'before');
  const afterDir = path.join(artifactsDir, 'after');
  const indexPath = path.join(artifactsDir, 'index.html');
  
  // Check if directories exist
  if (!fs.existsSync(beforeDir) || !fs.existsSync(afterDir)) {
    console.error('❌ Before/after directories not found. Run capture script first.');
    process.exit(1);
  }
  
  let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>StackPro Visual Diffs</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 { color: #1F2A44; text-align: center; margin-bottom: 40px; }
        .page-section { background: white; border-radius: 8px; padding: 20px; margin-bottom: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .page-title { color: #2563EB; border-bottom: 2px solid #2563EB; padding-bottom: 10px; margin-bottom: 20px; }
        .viewport-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
        .viewport-section h4 { margin: 0 0 10px 0; color: #475569; }
        .image-container { position: relative; border: 1px solid #E5E7EB; border-radius: 4px; overflow: hidden; }
        .image-container img { width: 100%; height: auto; display: block; }
        .image-label { position: absolute; top: 8px; left: 8px; background: rgba(0,0,0,0.8); color: white; padding: 4px 8px; font-size: 12px; border-radius: 4px; }
        .missing { background: #FEF2F2; border: 1px solid #FECACA; color: #DC2626; padding: 20px; text-align: center; border-radius: 4px; }
        .timestamp { text-align: center; color: #6B7280; font-size: 14px; margin-top: 40px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 StackPro Visual Diffs</h1>
`;
  
  for (const pagePath of config.paths) {
    const pageName = pagePath === '/' ? 'Home' : pagePath.slice(1).replace(/\//g, ' / ').replace(/\b\w/g, l => l.toUpperCase());
    
    html += `
        <div class="page-section">
            <h2 class="page-title">${pageName} (${pagePath})</h2>
`;
    
    for (const [width, height] of config.viewports) {
      const filename = `${pagePath === '/' ? 'home' : pagePath.slice(1).replace(/\//g, '-')}-${width}x${height}.png`;
      const beforePath = path.join(beforeDir, filename);
      const afterPath = path.join(afterDir, filename);
      
      const beforeExists = fs.existsSync(beforePath);
      const afterExists = fs.existsSync(afterPath);
      
      html += `
            <div class="viewport-grid">
                <div class="viewport-section">
                    <h4>Before (${width}×${height})</h4>
                    <div class="image-container">
`;
      
      if (beforeExists) {
        html += `                        <img src="before/${filename}" alt="Before ${pageName} ${width}x${height}">
                        <div class="image-label">BEFORE</div>`;
      } else {
        html += `                        <div class="missing">Screenshot not available</div>`;
      }
      
      html += `
                    </div>
                </div>
                <div class="viewport-section">
                    <h4>After (${width}×${height})</h4>
                    <div class="image-container">
`;
      
      if (afterExists) {
        html += `                        <img src="after/${filename}" alt="After ${pageName} ${width}x${height}">
                        <div class="image-label">AFTER</div>`;
      } else {
        html += `                        <div class="missing">Screenshot not available</div>`;
      }
      
      html += `
                    </div>
                </div>
            </div>
`;
    }
    
    html += `        </div>`;
  }
  
  html += `
        <div class="timestamp">
            Generated: ${new Date().toLocaleString()}
        </div>
    </div>
</body>
</html>
`;
  
  fs.writeFileSync(indexPath, html);
  console.log(`✅ Visual diff index generated: ${indexPath}`);
}

// Run if called directly
if (require.main === module) {
  generateIndex();
}

module.exports = { generateIndex };
