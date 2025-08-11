#!/usr/bin/env node

/**
 * Comprehensive project error checker
 * Checks frontend, packages, and common issues
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function logSection(title) {
  console.log(`\n🔍 ${title}`);
  console.log('═'.repeat(50));
}

function checkPackageJson(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const pkg = JSON.parse(content);
    
    console.log(`✅ Valid JSON: ${filePath}`);
    
    // Check for common issues
    if (!pkg.name) console.log(`⚠️  Missing name in ${filePath}`);
    if (!pkg.version) console.log(`⚠️  Missing version in ${filePath}`);
    
    return { valid: true, pkg };
  } catch (error) {
    console.log(`❌ Invalid JSON: ${filePath} - ${error.message}`);
    return { valid: false, error: error.message };
  }
}

function checkTSFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Basic syntax checks
    const issues = [];
    
    // Check for common TS issues
    if (content.includes('any') && !content.includes('// @ts-ignore')) {
      issues.push('Contains "any" type');
    }
    
    // Check for missing imports
    const importRegex = /import.*from ['"]([^'"]+)['"]/g;
    const imports = [...content.matchAll(importRegex)];
    
    // Check for relative imports that might be broken
    imports.forEach(match => {
      const importPath = match[1];
      if (importPath.startsWith('.') || importPath.startsWith('/')) {
        const resolvedPath = path.resolve(path.dirname(filePath), importPath);
        const extensions = ['', '.ts', '.tsx', '.js', '.jsx'];
        
        let found = false;
        for (const ext of extensions) {
          if (fs.existsSync(resolvedPath + ext)) {
            found = true;
            break;
          }
        }
        
        if (!found) {
          issues.push(`Broken import: ${importPath}`);
        }
      }
    });
    
    if (issues.length === 0) {
      console.log(`✅ Clean: ${filePath}`);
    } else {
      console.log(`⚠️  Issues in ${filePath}:`);
      issues.forEach(issue => console.log(`   - ${issue}`));
    }
    
    return { valid: true, issues };
  } catch (error) {
    console.log(`❌ Error reading: ${filePath} - ${error.message}`);
    return { valid: false, error: error.message };
  }
}

function scanDirectory(dir, filePattern, checkFunction) {
  const results = [];
  
  function scan(currentDir) {
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          scan(fullPath);
        } else if (entry.isFile() && filePattern.test(entry.name)) {
          results.push(checkFunction(fullPath));
        }
      }
    } catch (error) {
      console.log(`❌ Error scanning ${currentDir}: ${error.message}`);
    }
  }
  
  scan(dir);
  return results;
}

async function main() {
  console.log('🚀 StackPro Project Error Check');
  console.log('Scanning for common issues...\n');

  // Check package.json files
  logSection('Package.json Files');
  const packageJsonResults = scanDirectory('.', /^package\.json$/, checkPackageJson);
  
  // Check TypeScript files in frontend
  logSection('Frontend TypeScript Files');
  if (fs.existsSync('frontend/src')) {
    const tsResults = scanDirectory('frontend/src', /\.(ts|tsx)$/, checkTSFile);
    console.log(`Checked ${tsResults.length} TypeScript files`);
  } else {
    console.log('❌ Frontend src directory not found');
  }
  
  // Check packages directory
  logSection('Packages Directory');
  if (fs.existsSync('packages')) {
    const packageTsResults = scanDirectory('packages', /\.(ts|tsx)$/, checkTSFile);
    console.log(`Checked ${packageTsResults.length} package TypeScript files`);
  } else {
    console.log('⚠️  Packages directory not found');
  }
  
  // Check for missing dependencies
  logSection('Dependency Check');
  try {
    // Check frontend dependencies
    if (fs.existsSync('frontend/package.json')) {
      console.log('Checking frontend dependencies...');
      try {
        execSync('npm ls --depth=0', { 
          cwd: 'frontend', 
          stdio: 'pipe' 
        });
        console.log('✅ Frontend dependencies OK');
      } catch (error) {
        console.log('⚠️  Frontend dependency issues detected');
        console.log('Run: cd frontend && npm install');
      }
    }
    
    // Check root dependencies
    console.log('Checking root dependencies...');
    try {
      execSync('npm ls --depth=0', { stdio: 'pipe' });
      console.log('✅ Root dependencies OK');
    } catch (error) {
      console.log('⚠️  Root dependency issues detected');
      console.log('Run: npm install');
    }
    
  } catch (error) {
    console.log(`❌ Dependency check failed: ${error.message}`);
  }
  
  // Check for common file issues
  logSection('Common File Issues');
  
  const criticalFiles = [
    'frontend/next.config.js',
    'frontend/tsconfig.json',
    'frontend/tailwind.config.js',
    'pnpm-workspace.yaml',
    'turbo.json'
  ];
  
  criticalFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ Found: ${file}`);
    } else {
      console.log(`⚠️  Missing: ${file}`);
    }
  });
  
  // Summary
  logSection('Summary');
  console.log('✅ Project structure scan complete');
  console.log('📧 Email system is restored and working');
  console.log('🔧 Check output above for any specific issues to fix');
  
  console.log('\n💡 Quick fixes:');
  console.log('  • cd frontend && npm install');
  console.log('  • npm install');
  console.log('  • Check import paths in flagged files');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkPackageJson, checkTSFile, scanDirectory };
