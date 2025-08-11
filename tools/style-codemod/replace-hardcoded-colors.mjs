#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Color mapping rules
const COLOR_REPLACEMENTS = {
  // Text color replacements
  'text-black': 'text-foreground',
  'text-white': 'text-white', // Keep on dark backgrounds, manual review needed
  'text-gray-900': 'text-foreground',
  'text-gray-800': 'text-foreground', 
  'text-gray-700': 'text-foreground',
  'text-gray-600': 'text-muted',
  'text-gray-500': 'text-muted',
  'text-gray-400': 'text-muted',
  'text-slate-900': 'text-foreground',
  'text-slate-800': 'text-foreground',
  'text-slate-700': 'text-foreground',
  'text-slate-600': 'text-muted',
  'text-slate-500': 'text-muted',

  // Background color replacements
  'bg-white': 'bg-background',
  'bg-gray-50': 'bg-gray-50', // Keep light section backgrounds
  'bg-gray-100': 'bg-[color:var(--border)]',
  'bg-gray-200': 'bg-[color:var(--border)]',
  'bg-gray-900': 'bg-gray-900', // Keep footer dark
  'bg-slate-50': 'bg-gray-50',
  'bg-slate-100': 'bg-[color:var(--border)]',

  // Border color replacements
  'border-gray-200': 'border-border',
  'border-gray-300': 'border-border',
  'border-slate-200': 'border-border',
  'border-slate-300': 'border-border',

  // Specific brand hex colors
  '#1F2A44': 'var(--primary)',
  '#2563EB': 'var(--secondary)', 
  '#10B981': 'var(--accent)',
  '#FFFFFF': 'var(--bg)',
  '#0F172A': 'var(--fg)',
  '#475569': 'var(--muted)',
  '#E2E8F0': 'var(--border)',
};

// Special cases that need manual review
const MANUAL_REVIEW_PATTERNS = [
  'text-white', // Context dependent
  'bg-black',   // Context dependent
  'style={{',   // Inline styles need manual review
];

let summary = {
  filesProcessed: 0,
  replacementsMade: 0,
  manualReviewNeeded: [],
  errors: []
};

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let fileReplacements = 0;

    // Apply color replacements
    for (const [search, replace] of Object.entries(COLOR_REPLACEMENTS)) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const matches = content.match(regex);
      if (matches) {
        content = content.replace(regex, replace);
        fileReplacements += matches.length;
        summary.replacementsMade += matches.length;
      }
    }

    // Check for manual review patterns
    for (const pattern of MANUAL_REVIEW_PATTERNS) {
      if (content.includes(pattern)) {
        summary.manualReviewNeeded.push({
          file: filePath,
          pattern: pattern,
          line: findLineNumber(originalContent, pattern)
        });
      }
    }

    // Write back if changes were made
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ ${path.relative(process.cwd(), filePath)}: ${fileReplacements} replacements`);
    }

    summary.filesProcessed++;
    
  } catch (error) {
    summary.errors.push({
      file: filePath,
      error: error.message
    });
  }
}

function findLineNumber(content, search) {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(search)) {
      return i + 1;
    }
  }
  return -1;
}

function walkDirectory(dir, extensions = ['.tsx', '.ts', '.jsx', '.js', '.css']) {
  const files = [];
  
  function walk(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules and .next
        if (!['node_modules', '.next', '.git'].includes(item)) {
          walk(fullPath);
        }
      } else if (extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return files;
}

// Main execution
function main() {
  console.log('🎨 StackPro Color Codemod - Replacing hardcoded colors with tokens...\n');
  
  const frontendSrc = path.join(process.cwd(), 'frontend/src');
  
  if (!fs.existsSync(frontendSrc)) {
    console.error('❌ frontend/src directory not found');
    process.exit(1);
  }

  const files = walkDirectory(frontendSrc);
  
  console.log(`Found ${files.length} files to process...\n`);
  
  files.forEach(processFile);
  
  // Print summary
  console.log('\n📊 CODEMOD SUMMARY:');
  console.log('===================');
  console.log(`Files processed: ${summary.filesProcessed}`);
  console.log(`Total replacements: ${summary.replacementsMade}`);
  
  if (summary.manualReviewNeeded.length > 0) {
    console.log(`\n⚠️  Manual review needed (${summary.manualReviewNeeded.length} items):`);
    summary.manualReviewNeeded.forEach(item => {
      console.log(`   ${path.relative(process.cwd(), item.file)}:${item.line} - ${item.pattern}`);
    });
  }
  
  if (summary.errors.length > 0) {
    console.log(`\n❌ Errors (${summary.errors.length}):`);
    summary.errors.forEach(error => {
      console.log(`   ${path.relative(process.cwd(), error.file)}: ${error.error}`);
    });
  }
  
  console.log('\n✅ Codemod complete!');
  
  if (summary.replacementsMade > 0) {
    console.log('\n📝 Next steps:');
    console.log('1. Review changes with git diff');
    console.log('2. Fix any manual review items');
    console.log('3. Test the application locally');
    console.log('4. Run visual regression tests');
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main, COLOR_REPLACEMENTS, summary };
