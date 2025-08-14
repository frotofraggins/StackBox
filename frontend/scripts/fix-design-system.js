#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Design system fixes
const fixes = [
  // Fix inline button styles
  {
    pattern: /className="[^"]*px-\d+\s+py-\d+[^"]*rounded-[^"]*"[^>]*style=\{\{\s*background:\s*'var\(--primary\)'\s*\}\}/g,
    replacement: 'className="btn btn-primary"'
  },
  {
    pattern: /className="[^"]*px-\d+\s+py-\d+[^"]*rounded-[^"]*"[^>]*style=\{\{\s*background:\s*'var\(--secondary\)'\s*\}\}/g,
    replacement: 'className="btn btn-secondary"'
  },
  // Fix color references
  {
    pattern: /text-blue-600/g,
    replacement: 'text-secondary'
  },
  {
    pattern: /text-blue-500/g,
    replacement: 'text-secondary'
  },
  {
    pattern: /bg-blue-600/g,
    replacement: 'bg-secondary'
  },
  {
    pattern: /bg-blue-500/g,
    replacement: 'bg-secondary'
  },
  {
    pattern: /border-blue-600/g,
    replacement: 'border-secondary'
  },
  {
    pattern: /border-blue-500/g,
    replacement: 'border-secondary'
  },
  {
    pattern: /text-gray-700/g,
    replacement: 'text-muted'
  },
  {
    pattern: /text-gray-600/g,
    replacement: 'text-muted'
  },
  {
    pattern: /bg-gray-100/g,
    replacement: 'bg-surface-2'
  },
  {
    pattern: /bg-gray-50/g,
    replacement: 'bg-surface-2'
  }
];

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  fixes.forEach(({ pattern, replacement }) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      changed = true;
    }
  });

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed: ${filePath.replace(process.cwd(), '.')}`);
  }

  return changed;
}

function scanAndFix(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  let totalFixed = 0;

  files.forEach(file => {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      totalFixed += scanAndFix(fullPath);
    } else if (file.name.endsWith('.tsx') || file.name.endsWith('.ts')) {
      if (fixFile(fullPath)) {
        totalFixed++;
      }
    }
  });

  return totalFixed;
}

// Main execution
const pagesDir = path.join(__dirname, '../src/pages');
const componentsDir = path.join(__dirname, '../src/components');

console.log('🔧 Fixing StackPro Design System Violations\n');

const pagesFixes = scanAndFix(pagesDir);
const componentsFixes = scanAndFix(componentsDir);
const totalFixes = pagesFixes + componentsFixes;

console.log(`\n🎉 Fixed ${totalFixes} files with design system violations!`);

if (totalFixes > 0) {
  console.log('\n📝 Run the compliance check again to see remaining issues:');
  console.log('   npm run design:check');
}
