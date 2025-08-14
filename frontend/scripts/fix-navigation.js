#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Pages that should use Navigation component
const pagesToFix = [
  'src/pages/contact.tsx',
  'src/pages/about.tsx', 
  'src/pages/features.tsx',
  'src/pages/login.tsx',
  'src/pages/signup.tsx'
];

console.log('🔧 Ensuring all pages use Navigation component...\n');

pagesToFix.forEach(pagePath => {
  if (fs.existsSync(pagePath)) {
    let content = fs.readFileSync(pagePath, 'utf8');
    
    // Check if already has Navigation import
    if (!content.includes("import Navigation from '../components/layout/Navigation'")) {
      console.log(`✅ ${pagePath} - Adding Navigation import`);
      
      // Add Navigation import after other imports
      content = content.replace(
        /import.*from.*\n(?=\n|export)/,
        match => match + "import Navigation from '../components/layout/Navigation'\n"
      );
      
      // Add Navigation component after Head
      content = content.replace(
        /(<\/Head>\s*\n)/,
        '$1\n      <Navigation currentPage="' + pagePath.replace('src/pages', '').replace('.tsx', '') + '" />\n'
      );
      
      fs.writeFileSync(pagePath, content);
    } else {
      console.log(`⏭️  ${pagePath} - Already has Navigation`);
    }
  } else {
    console.log(`❌ ${pagePath} - File not found`);
  }
});

console.log('\n✅ Navigation consistency check complete!');
