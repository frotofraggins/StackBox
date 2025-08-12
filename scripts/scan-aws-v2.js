const fs = require('fs');
const path = require('path');

// File extensions to scan
const extensions = ['.js', '.ts', '.tsx', '.jsx'];

// Patterns to search for
const patterns = [
  /from\s+['"]aws-sdk['"]/g,
  /require\s*\(\s*['"]aws-sdk['"]\s*\)/g
];

function shouldScanFile(filePath) {
  return extensions.some(ext => filePath.endsWith(ext));
}

function scanDirectory(dir, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // Skip node_modules, archived files, and other common directories
      if (!['node_modules', '.git', 'dist', 'build', '.next', 'archive-old', 'archives'].includes(entry.name)) {
        scanDirectory(fullPath, results);
      }
    } else if (entry.isFile() && shouldScanFile(entry.name)) {
      scanFile(fullPath, results);
    }
  }
  
  return results;
}

function scanFile(filePath, results) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      patterns.forEach(pattern => {
        if (pattern.test(line)) {
          results.push({
            file: filePath,
            line: index + 1,
            content: line.trim()
          });
        }
      });
    });
  } catch (error) {
    console.warn(`Warning: Could not read file ${filePath}: ${error.message}`);
  }
}

function main() {
  console.log('🔍 Scanning for AWS SDK v2 imports...');
  
  const results = scanDirectory(process.cwd());
  
  if (results.length === 0) {
    console.log('✅ No AWS SDK v2 imports found');
    process.exit(0);
  } else {
    console.log('❌ AWS SDK v2 imports found:');
    results.forEach(result => {
      console.log(`${result.file}:${result.line}: ${result.content}`);
    });
    console.log('\nPlease update these imports to use @aws-sdk/* v3 clients instead.');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { scanDirectory, scanFile };
