#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Design system violations to check for
const violations = [
  {
    pattern: /bg-blue-\d+|text-blue-\d+|border-blue-\d+/g,
    message: 'Use design tokens: bg-primary, bg-secondary instead of bg-blue-*'
  },
  {
    pattern: /bg-gray-\d+|text-gray-\d+|border-gray-\d+/g,
    message: 'Use design tokens: bg-surface, text-muted instead of gray-*'
  },
  {
    pattern: /#[0-9A-Fa-f]{3,6}/g,
    message: 'Use CSS custom properties instead of hex colors'
  },
  {
    pattern: /style=\{\{[^}]*background[^}]*\}\}/g,
    message: 'Use Tailwind classes instead of inline styles'
  },
  {
    pattern: /px-\d+\s+py-\d+.*rounded-\d+/g,
    message: 'Use btn class instead of manual button styling'
  }
];

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];

  violations.forEach(({ pattern, message }) => {
    const matches = content.match(pattern);
    if (matches) {
      issues.push({
        file: filePath,
        message,
        matches: matches.slice(0, 3) // Show first 3 matches
      });
    }
  });

  return issues;
}

function scanDirectory(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  let allIssues = [];

  files.forEach(file => {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      allIssues = allIssues.concat(scanDirectory(fullPath));
    } else if (file.name.endsWith('.tsx') || file.name.endsWith('.ts')) {
      const issues = checkFile(fullPath);
      allIssues = allIssues.concat(issues);
    }
  });

  return allIssues;
}

// Main execution
const pagesDir = path.join(__dirname, '../src/pages');
const componentsDir = path.join(__dirname, '../src/components');

console.log('🎨 StackPro Design System Compliance Check\n');

const pageIssues = scanDirectory(pagesDir);
const componentIssues = scanDirectory(componentsDir);
const allIssues = [...pageIssues, ...componentIssues];

if (allIssues.length === 0) {
  console.log('✅ All files comply with the design system!');
} else {
  console.log(`❌ Found ${allIssues.length} design system violations:\n`);
  
  allIssues.forEach((issue, index) => {
    console.log(`${index + 1}. ${issue.file.replace(process.cwd(), '.')}`);
    console.log(`   ${issue.message}`);
    if (issue.matches.length > 0) {
      console.log(`   Examples: ${issue.matches.join(', ')}`);
    }
    console.log('');
  });
}

process.exit(allIssues.length > 0 ? 1 : 0);
