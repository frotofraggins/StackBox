#!/usr/bin/env node

/**
 * StackPro File Usage Analysis
 * Identifies unused, outdated, or duplicate files based on timestamps and references
 */

const fs = require('fs');
const path = require('path');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

class FileUsageAnalyzer {
  constructor() {
    this.projectRoot = process.cwd();
    this.allFiles = [];
    this.fileStats = new Map();
    this.importGraph = new Map();
    this.unusedFiles = [];
    this.outdatedFiles = [];
    this.duplicateFiles = [];
  }

  async analyzeProject() {
    log('🔍 StackPro File Usage Analysis', 'bold');
    log(`📂 Project Root: ${this.projectRoot}`, 'blue');
    log(`⏰ Analysis Date: ${new Date().toISOString()}`, 'blue');
    
    try {
      await this.scanAllFiles();
      await this.analyzeFileStats();
      await this.buildImportGraph();
      await this.identifyUnusedFiles();
      await this.identifyOutdatedFiles();
      await this.identifyDuplicateFiles();
      await this.generateReport();
      
      log('\n✅ File Usage Analysis Completed!', 'green');
      
    } catch (error) {
      log(`\n❌ Analysis failed: ${error.message}`, 'red');
      throw error;
    }
  }

  async scanAllFiles() {
    log('\n📁 Scanning All Files', 'bold');
    
    const excludeDirs = [
      'node_modules',
      '.git',
      '.next',
      'dist',
      'build',
      '.env'
    ];

    const excludeFiles = [
      '.DS_Store',
      'Thumbs.db',
      '*.log',
      '*.tmp'
    ];

    this.allFiles = this.scanDirectory(this.projectRoot, excludeDirs, excludeFiles);
    
    log(`📊 Found ${this.allFiles.length} files`, 'cyan');
    
    return this.allFiles;
  }

  scanDirectory(dir, excludeDirs, excludeFiles) {
    const files = [];
    
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(this.projectRoot, fullPath);
        
        if (entry.isDirectory()) {
          if (!excludeDirs.includes(entry.name)) {
            files.push(...this.scanDirectory(fullPath, excludeDirs, excludeFiles));
          }
        } else if (entry.isFile()) {
          const shouldExclude = excludeFiles.some(pattern => {
            if (pattern.includes('*')) {
              const regex = new RegExp(pattern.replace('*', '.*'));
              return regex.test(entry.name);
            }
            return entry.name === pattern;
          });
          
          if (!shouldExclude) {
            files.push({
              name: entry.name,
              path: fullPath,
              relativePath: relativePath,
              extension: path.extname(entry.name),
              directory: path.dirname(relativePath)
            });
          }
        }
      }
    } catch (error) {
      log(`⚠️ Cannot read directory: ${dir}`, 'yellow');
    }
    
    return files;
  }

  async analyzeFileStats() {
    log('\n📊 Analyzing File Statistics', 'bold');
    
    for (const file of this.allFiles) {
      try {
        const stats = fs.statSync(file.path);
        const content = this.isTextFile(file.extension) ? fs.readFileSync(file.path, 'utf8') : null;
        
        const fileInfo = {
          ...file,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          accessed: stats.atime,
          lines: content ? content.split('\n').length : 0,
          content: content,
          isCode: this.isCodeFile(file.extension),
          isConfig: this.isConfigFile(file.name),
          isDoc: this.isDocFile(file.extension),
          daysSinceModified: Math.floor((Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24))
        };
        
        this.fileStats.set(file.relativePath, fileInfo);
        
      } catch (error) {
        log(`⚠️ Cannot analyze file: ${file.relativePath}`, 'yellow');
      }
    }
    
    log(`✅ Analyzed ${this.fileStats.size} files`, 'green');
  }

  async buildImportGraph() {
    log('\n🕸️ Building Import Graph', 'bold');
    
    let totalImports = 0;
    
    for (const [filePath, fileInfo] of this.fileStats.entries()) {
      if (!fileInfo.isCode || !fileInfo.content) continue;
      
      const imports = this.extractImports(fileInfo.content, fileInfo.extension);
      
      if (imports.length > 0) {
        this.importGraph.set(filePath, {
          file: fileInfo,
          imports: imports,
          importedBy: []
        });
        totalImports += imports.length;
      }
    }
    
    // Build reverse references (what files import this file)
    for (const [filePath, graphNode] of this.importGraph.entries()) {
      for (const importPath of graphNode.imports) {
        const resolvedPath = this.resolveImportPath(importPath, filePath);
        if (resolvedPath && this.importGraph.has(resolvedPath)) {
          this.importGraph.get(resolvedPath).importedBy.push(filePath);
        }
      }
    }
    
    log(`✅ Built import graph with ${totalImports} imports`, 'green');
  }

  extractImports(content, extension) {
    const imports = [];
    
    // JavaScript/TypeScript imports
    if (['.js', '.jsx', '.ts', '.tsx'].includes(extension)) {
      // ES6 imports
      const es6Regex = /^import\s+.*?from\s+['"](.+?)['"];?$/gm;
      let match;
      while ((match = es6Regex.exec(content)) !== null) {
        imports.push(match[1]);
      }
      
      // CommonJS requires
      const cjsRegex = /require\(['"](.+?)['"]\)/g;
      while ((match = cjsRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }
      
      // Dynamic imports
      const dynamicRegex = /import\(['"](.+?)['"]\)/g;
      while ((match = dynamicRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }
    }
    
    return imports;
  }

  resolveImportPath(importPath, fromFile) {
    // Skip node_modules and external packages
    if (!importPath.startsWith('.')) {
      return null;
    }
    
    const fromDir = path.dirname(fromFile);
    let resolvedPath = path.resolve(fromDir, importPath);
    resolvedPath = path.relative(this.projectRoot, resolvedPath);
    
    // Try different extensions
    const possiblePaths = [
      resolvedPath,
      resolvedPath + '.js',
      resolvedPath + '.jsx',
      resolvedPath + '.ts',
      resolvedPath + '.tsx',
      path.join(resolvedPath, 'index.js'),
      path.join(resolvedPath, 'index.jsx'),
      path.join(resolvedPath, 'index.ts'),
      path.join(resolvedPath, 'index.tsx')
    ];
    
    for (const possiblePath of possiblePaths) {
      if (this.fileStats.has(possiblePath)) {
        return possiblePath;
      }
    }
    
    return null;
  }

  async identifyUnusedFiles() {
    log('\n🗑️ Identifying Unused Files', 'bold');
    
    for (const [filePath, fileInfo] of this.fileStats.entries()) {
      // Skip entry points and important files
      if (this.isEntryPoint(filePath) || this.isImportantFile(filePath)) {
        continue;
      }
      
      const graphNode = this.importGraph.get(filePath);
      const isImported = graphNode && graphNode.importedBy.length > 0;
      const hasRecentActivity = fileInfo.daysSinceModified < 30;
      
      if (!isImported && fileInfo.isCode) {
        this.unusedFiles.push({
          ...fileInfo,
          reason: 'Not imported by any file',
          confidence: hasRecentActivity ? 'low' : 'high'
        });
      }
    }
    
    log(`⚠️ Found ${this.unusedFiles.length} potentially unused files`, 'yellow');
  }

  async identifyOutdatedFiles() {
    log('\n📅 Identifying Outdated Files', 'bold');
    
    const thresholds = {
      veryOld: 180, // 6 months
      old: 90,      // 3 months
      stale: 30     // 1 month
    };
    
    for (const [filePath, fileInfo] of this.fileStats.entries()) {
      if (fileInfo.daysSinceModified >= thresholds.veryOld) {
        this.outdatedFiles.push({
          ...fileInfo,
          ageCategory: 'very-old',
          reason: `Not modified in ${fileInfo.daysSinceModified} days`
        });
      } else if (fileInfo.daysSinceModified >= thresholds.old) {
        this.outdatedFiles.push({
          ...fileInfo,
          ageCategory: 'old',
          reason: `Not modified in ${fileInfo.daysSinceModified} days`
        });
      } else if (fileInfo.daysSinceModified >= thresholds.stale) {
        this.outdatedFiles.push({
          ...fileInfo,
          ageCategory: 'stale',
          reason: `Not modified in ${fileInfo.daysSinceModified} days`
        });
      }
    }
    
    log(`📅 Found ${this.outdatedFiles.length} outdated files`, 'cyan');
  }

  async identifyDuplicateFiles() {
    log('\n👥 Identifying Duplicate Files', 'bold');
    
    const contentMap = new Map();
    
    for (const [filePath, fileInfo] of this.fileStats.entries()) {
      if (!fileInfo.content || fileInfo.size < 100) continue; // Skip very small files
      
      // Create a normalized content hash
      const normalizedContent = fileInfo.content
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
      
      const contentHash = this.simpleHash(normalizedContent);
      
      if (!contentMap.has(contentHash)) {
        contentMap.set(contentHash, []);
      }
      
      contentMap.get(contentHash).push(fileInfo);
    }
    
    // Find actual duplicates
    for (const [hash, files] of contentMap.entries()) {
      if (files.length > 1) {
        this.duplicateFiles.push({
          contentHash: hash,
          files: files.map(f => ({
            path: f.relativePath,
            size: f.size,
            modified: f.modified,
            daysSinceModified: f.daysSinceModified
          })),
          count: files.length
        });
      }
    }
    
    log(`👥 Found ${this.duplicateFiles.length} groups of duplicate files`, 'magenta');
  }

  async generateReport() {
    log('\n📄 Generating Analysis Report', 'bold');
    
    const report = {
      analysis: {
        timestamp: new Date().toISOString(),
        projectRoot: this.projectRoot,
        totalFiles: this.allFiles.length
      },
      
      summary: {
        totalFiles: this.fileStats.size,
        codeFiles: Array.from(this.fileStats.values()).filter(f => f.isCode).length,
        configFiles: Array.from(this.fileStats.values()).filter(f => f.isConfig).length,
        docFiles: Array.from(this.fileStats.values()).filter(f => f.isDoc).length,
        unusedFiles: this.unusedFiles.length,
        outdatedFiles: this.outdatedFiles.length,
        duplicateGroups: this.duplicateFiles.length
      },
      
      unusedFiles: this.unusedFiles.sort((a, b) => b.daysSinceModified - a.daysSinceModified),
      
      outdatedFiles: this.outdatedFiles.sort((a, b) => b.daysSinceModified - a.daysSinceModified),
      
      duplicateFiles: this.duplicateFiles.sort((a, b) => b.count - a.count),
      
      filesByAge: this.categorizeFilesByAge(),
      
      largestFiles: Array.from(this.fileStats.values())
        .sort((a, b) => b.size - a.size)
        .slice(0, 20)
        .map(f => ({
          path: f.relativePath,
          size: f.size,
          sizeHuman: this.formatBytes(f.size),
          lines: f.lines,
          daysSinceModified: f.daysSinceModified
        })),
      
      recommendations: this.generateRecommendations()
    };
    
    // Save report
    const reportPath = path.join(this.projectRoot, 'logs', `file-usage-analysis-${Date.now()}.json`);
    
    const logsDir = path.join(this.projectRoot, 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    log(`📄 Analysis report saved: ${reportPath}`, 'blue');
    
    this.displaySummary(report);
    
    return report;
  }

  categorizeFilesByAge() {
    const categories = {
      recent: [], // 0-7 days
      current: [], // 8-30 days
      stale: [],   // 31-90 days
      old: [],     // 91-180 days
      veryOld: []  // 180+ days
    };
    
    for (const fileInfo of this.fileStats.values()) {
      const days = fileInfo.daysSinceModified;
      
      if (days <= 7) categories.recent.push(fileInfo);
      else if (days <= 30) categories.current.push(fileInfo);
      else if (days <= 90) categories.stale.push(fileInfo);
      else if (days <= 180) categories.old.push(fileInfo);
      else categories.veryOld.push(fileInfo);
    }
    
    return {
      recent: categories.recent.length,
      current: categories.current.length,
      stale: categories.stale.length,
      old: categories.old.length,
      veryOld: categories.veryOld.length
    };
  }

  generateRecommendations() {
    const recommendations = [];
    
    // Unused files recommendations
    const highConfidenceUnused = this.unusedFiles.filter(f => f.confidence === 'high');
    if (highConfidenceUnused.length > 0) {
      recommendations.push({
        type: 'cleanup',
        priority: 'high',
        title: `Remove ${highConfidenceUnused.length} unused files`,
        description: 'These files are not imported anywhere and haven\'t been modified recently',
        action: 'Consider deleting these files',
        files: highConfidenceUnused.slice(0, 10).map(f => f.relativePath)
      });
    }
    
    // Outdated files recommendations
    const veryOldFiles = this.outdatedFiles.filter(f => f.ageCategory === 'very-old');
    if (veryOldFiles.length > 0) {
      recommendations.push({
        type: 'review',
        priority: 'medium',
        title: `Review ${veryOldFiles.length} very old files`,
        description: 'These files haven\'t been modified in 6+ months',
        action: 'Review if these are still needed',
        files: veryOldFiles.slice(0, 10).map(f => f.relativePath)
      });
    }
    
    // Duplicate files recommendations
    if (this.duplicateFiles.length > 0) {
      recommendations.push({
        type: 'deduplication',
        priority: 'medium',
        title: `Deduplicate ${this.duplicateFiles.length} file groups`,
        description: 'Multiple files with identical or very similar content',
        action: 'Consolidate duplicate files',
        files: this.duplicateFiles.slice(0, 5).map(group => group.files.map(f => f.path))
      });
    }
    
    return recommendations;
  }

  displaySummary(report) {
    log('\n📊 ANALYSIS SUMMARY', 'bold');
    log('=' * 50, 'cyan');
    
    log(`\n📁 File Statistics:`, 'bold');
    log(`  Total Files: ${report.summary.totalFiles}`, 'cyan');
    log(`  Code Files: ${report.summary.codeFiles}`, 'green');
    log(`  Config Files: ${report.summary.configFiles}`, 'blue');
    log(`  Documentation: ${report.summary.docFiles}`, 'yellow');
    
    log(`\n⚠️ Issues Found:`, 'bold');
    log(`  Unused Files: ${report.summary.unusedFiles}`, 'red');
    log(`  Outdated Files: ${report.summary.outdatedFiles}`, 'yellow');
    log(`  Duplicate Groups: ${report.summary.duplicateGroups}`, 'magenta');
    
    log(`\n📅 Files by Age:`, 'bold');
    log(`  Recent (0-7 days): ${report.filesByAge.recent}`, 'green');
    log(`  Current (8-30 days): ${report.filesByAge.current}`, 'cyan');
    log(`  Stale (31-90 days): ${report.filesByAge.stale}`, 'yellow');
    log(`  Old (91-180 days): ${report.filesByAge.old}`, 'yellow');
    log(`  Very Old (180+ days): ${report.filesByAge.veryOld}`, 'red');
    
    if (report.unusedFiles.length > 0) {
      log(`\n🗑️ Top Unused Files:`, 'bold');
      report.unusedFiles.slice(0, 10).forEach(file => {
        log(`  ${file.relativePath} (${file.daysSinceModified} days old)`, 'red');
      });
    }
    
    if (report.outdatedFiles.length > 0) {
      log(`\n📅 Top Outdated Files:`, 'bold');
      report.outdatedFiles.slice(0, 10).forEach(file => {
        log(`  ${file.relativePath} (${file.daysSinceModified} days old)`, 'yellow');
      });
    }
    
    if (report.recommendations.length > 0) {
      log(`\n💡 Recommendations:`, 'bold');
      report.recommendations.forEach(rec => {
        log(`  ${rec.priority.toUpperCase()}: ${rec.title}`, rec.priority === 'high' ? 'red' : 'yellow');
        log(`    ${rec.description}`, 'cyan');
      });
    }
  }

  // Helper methods
  isTextFile(extension) {
    const textExtensions = ['.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.txt', '.yml', '.yaml', '.css', '.html', '.xml'];
    return textExtensions.includes(extension);
  }

  isCodeFile(extension) {
    const codeExtensions = ['.js', '.jsx', '.ts', '.tsx', '.css'];
    return codeExtensions.includes(extension);
  }

  isConfigFile(filename) {
    const configFiles = ['package.json', '.env', '.env.template', '.gitignore', 'docker-compose.yml', 'next.config.js', 'tailwind.config.js'];
    return configFiles.includes(filename) || filename.endsWith('.config.js') || filename.endsWith('.config.json');
  }

  isDocFile(extension) {
    const docExtensions = ['.md', '.txt', '.pdf'];
    return docExtensions.includes(extension);
  }

  isEntryPoint(filePath) {
    const entryPoints = [
      'src/api/server.js',
      'frontend/src/pages/_app.tsx',
      'frontend/src/pages/index.tsx',
      'package.json',
      'frontend/package.json'
    ];
    return entryPoints.includes(filePath);
  }

  isImportantFile(filePath) {
    const importantPatterns = [
      /^package\.json$/,
      /^\.env/,
      /^README/i,
      /^LICENSE/i,
      /^\.git/,
      /next\.config\.js$/,
      /tailwind\.config\.js$/
    ];
    
    return importantPatterns.some(pattern => pattern.test(filePath));
  }

  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log('📖 StackPro File Usage Analyzer');
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/analyze-file-usage.js        # Analyze file usage');
    console.log('  node scripts/analyze-file-usage.js --help # Show this help');
    console.log('');
    console.log('Analyzes:');
    console.log('  • File modification timestamps');
    console.log('  • Import/require relationships');
    console.log('  • Unused files detection');
    console.log('  • Outdated files identification');
    console.log('  • Duplicate file detection');
    console.log('  • Cleanup recommendations');
    return;
  }
  
  const analyzer = new FileUsageAnalyzer();
  await analyzer.analyzeProject();
}

// Execute if run directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ File analysis failed:', error.message);
    process.exit(1);
  });
}

module.exports = { FileUsageAnalyzer };
