#!/usr/bin/env node

/**
 * StackPro Code Architecture Analysis
 * Programmatic analysis of code relationships, dependencies, and architectural patterns
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

class CodeArchitectureAnalyzer {
  constructor() {
    this.projectRoot = process.cwd();
    this.fileMap = new Map();
    this.dependencyGraph = new Map();
    this.entryPoints = new Set();
    this.reachableFiles = new Set();
    this.exportedSymbols = new Map();
    this.importedSymbols = new Map();
    this.deadCodeCandidates = new Set();
    this.architecturalPatterns = new Map();
  }

  async analyzeArchitecture() {
    log('🏗️ StackPro Code Architecture Analysis', 'bold');
    log(`📂 Project Root: ${this.projectRoot}`, 'blue');
    
    try {
      await this.scanCodeFiles();
      await this.identifyEntryPoints();
      await this.buildDependencyGraph();
      await this.analyzeExportsImports();
      await this.findReachableCode();
      await this.identifyArchitecturalPatterns();
      await this.findDeadCode();
      await this.analyzeProjectStructure();
      await this.generateArchitectureReport();
      
      log('\n✅ Architecture Analysis Completed!', 'green');
      
    } catch (error) {
      log(`\n❌ Analysis failed: ${error.message}`, 'red');
      throw error;
    }
  }

  async scanCodeFiles() {
    log('\n📁 Scanning Code Files', 'bold');
    
    const codeExtensions = ['.js', '.jsx', '.ts', '.tsx'];
    const excludeDirs = ['node_modules', '.git', '.next', 'dist', 'build'];
    
    this.scanDirectory(this.projectRoot, codeExtensions, excludeDirs);
    
    log(`📊 Found ${this.fileMap.size} code files`, 'cyan');
  }

  scanDirectory(dir, extensions, excludeDirs) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(this.projectRoot, fullPath);
        
        if (entry.isDirectory()) {
          if (!excludeDirs.includes(entry.name)) {
            this.scanDirectory(fullPath, extensions, excludeDirs);
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (extensions.includes(ext)) {
            const content = fs.readFileSync(fullPath, 'utf8');
            this.fileMap.set(relativePath, {
              path: fullPath,
              relativePath: relativePath,
              name: entry.name,
              extension: ext,
              directory: path.dirname(relativePath),
              content: content,
              lines: content.split('\n').length,
              size: content.length
            });
          }
        }
      }
    } catch (error) {
      log(`⚠️ Cannot scan directory: ${dir}`, 'yellow');
    }
  }

  async identifyEntryPoints() {
    log('\n🚪 Identifying Entry Points', 'bold');
    
    // Standard entry points
    const standardEntryPoints = [
      'src/api/server.js',
      'src/api/server-simple.js',
      'frontend/src/pages/_app.tsx',
      'frontend/src/pages/index.tsx'
    ];

    // Package.json scripts analysis
    const packageJsonPaths = ['package.json', 'frontend/package.json'];
    
    for (const pkgPath of packageJsonPaths) {
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        if (pkg.scripts) {
          for (const [scriptName, scriptCommand] of Object.entries(pkg.scripts)) {
            const files = this.extractFilesFromScript(scriptCommand);
            files.forEach(file => {
              if (this.fileMap.has(file)) {
                this.entryPoints.add(file);
                log(`  📜 Script "${scriptName}": ${file}`, 'blue');
              }
            });
          }
        }
        
        // Main entry point
        if (pkg.main && this.fileMap.has(pkg.main)) {
          this.entryPoints.add(pkg.main);
          log(`  🎯 Main entry: ${pkg.main}`, 'green');
        }
      }
    }

    // Add standard entry points
    for (const entry of standardEntryPoints) {
      if (this.fileMap.has(entry)) {
        this.entryPoints.add(entry);
        log(`  🚪 Entry point: ${entry}`, 'green');
      }
    }

    // Next.js pages are entry points
    for (const [filePath] of this.fileMap.entries()) {
      if (filePath.includes('frontend/src/pages/') && !filePath.includes('/_')) {
        this.entryPoints.add(filePath);
      }
    }

    log(`✅ Found ${this.entryPoints.size} entry points`, 'green');
  }

  extractFilesFromScript(scriptCommand) {
    const files = [];
    
    // Extract file references from script commands
    const patterns = [
      /node\s+([^\s]+\.js)/g,
      /ts-node\s+([^\s]+\.ts)/g,
      /next\s+([^\s]+)/g,
      /"([^"]*\.[jt]sx?)"/g,
      /'([^']*\.[jt]sx?)'/g
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(scriptCommand)) !== null) {
        files.push(match[1]);
      }
    }

    return files;
  }

  async buildDependencyGraph() {
    log('\n🕸️ Building Dependency Graph', 'bold');
    
    let totalDependencies = 0;
    
    for (const [filePath, fileInfo] of this.fileMap.entries()) {
      const dependencies = this.extractDependencies(fileInfo.content, filePath);
      
      this.dependencyGraph.set(filePath, {
        file: fileInfo,
        imports: dependencies.imports,
        requires: dependencies.requires,
        dynamicImports: dependencies.dynamicImports,
        allDependencies: [...dependencies.imports, ...dependencies.requires, ...dependencies.dynamicImports],
        dependents: []
      });
      
      totalDependencies += dependencies.imports.length + dependencies.requires.length + dependencies.dynamicImports.length;
    }
    
    // Build reverse dependencies (what depends on this file)
    for (const [filePath, graphNode] of this.dependencyGraph.entries()) {
      for (const dep of graphNode.allDependencies) {
        const resolvedDep = this.resolveDependency(dep, filePath);
        if (resolvedDep && this.dependencyGraph.has(resolvedDep)) {
          this.dependencyGraph.get(resolvedDep).dependents.push(filePath);
        }
      }
    }
    
    log(`✅ Built dependency graph with ${totalDependencies} dependencies`, 'green');
  }

  extractDependencies(content, filePath) {
    const imports = [];
    const requires = [];
    const dynamicImports = [];
    
    // ES6 imports
    const importPatterns = [
      /^import\s+.*?from\s+['"]([^'"]+)['"];?$/gm,
      /^import\s+['"]([^'"]+)['"];?$/gm
    ];
    
    for (const pattern of importPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        imports.push(match[1]);
      }
    }
    
    // CommonJS requires
    const requirePattern = /require\(['"]([^'"]+)['"]\)/g;
    let requireMatch;
    while ((requireMatch = requirePattern.exec(content)) !== null) {
      requires.push(requireMatch[1]);
    }
    
    // Dynamic imports
    const dynamicPattern = /import\(['"]([^'"]+)['"]\)/g;
    let dynamicMatch;
    while ((dynamicMatch = dynamicPattern.exec(content)) !== null) {
      dynamicImports.push(dynamicMatch[1]);
    }
    
    return { imports, requires, dynamicImports };
  }

  resolveDependency(depPath, fromFile) {
    // Skip external packages
    if (!depPath.startsWith('.') && !depPath.startsWith('/')) {
      return null;
    }
    
    const fromDir = path.dirname(fromFile);
    let resolvedPath;
    
    if (depPath.startsWith('.')) {
      resolvedPath = path.resolve(fromDir, depPath);
    } else {
      resolvedPath = depPath.substring(1); // Remove leading slash
    }
    
    resolvedPath = path.relative(this.projectRoot, resolvedPath).replace(/\\/g, '/');
    
    // Try different extensions and index files
    const candidates = [
      resolvedPath,
      `${resolvedPath}.js`,
      `${resolvedPath}.jsx`,
      `${resolvedPath}.ts`,
      `${resolvedPath}.tsx`,
      `${resolvedPath}/index.js`,
      `${resolvedPath}/index.jsx`,
      `${resolvedPath}/index.ts`,
      `${resolvedPath}/index.tsx`
    ];
    
    for (const candidate of candidates) {
      if (this.fileMap.has(candidate)) {
        return candidate;
      }
    }
    
    return null;
  }

  async analyzeExportsImports() {
    log('\n📤 Analyzing Exports and Imports', 'bold');
    
    for (const [filePath, fileInfo] of this.fileMap.entries()) {
      const exports = this.extractExports(fileInfo.content);
      const namedImports = this.extractNamedImports(fileInfo.content);
      
      this.exportedSymbols.set(filePath, exports);
      this.importedSymbols.set(filePath, namedImports);
    }
    
    log(`✅ Analyzed exports and imports`, 'green');
  }

  extractExports(content) {
    const exports = {
      default: null,
      named: [],
      all: []
    };
    
    // Default exports
    const defaultPatterns = [
      /export\s+default\s+(?:class|function)\s+(\w+)/g,
      /export\s+default\s+(\w+)/g,
      /module\.exports\s*=\s*(\w+)/g
    ];
    
    for (const pattern of defaultPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        exports.default = match[1];
        exports.all.push(match[1]);
      }
    }
    
    // Named exports
    const namedPatterns = [
      /export\s+(?:const|let|var|function|class)\s+(\w+)/g,
      /export\s*{\s*([^}]+)\s*}/g
    ];
    
    for (const pattern of namedPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (pattern.source.includes('{')) {
          // Extract individual names from export { ... }
          const names = match[1].split(',').map(name => name.trim().split(' ')[0]);
          exports.named.push(...names);
          exports.all.push(...names);
        } else {
          exports.named.push(match[1]);
          exports.all.push(match[1]);
        }
      }
    }
    
    return exports;
  }

  extractNamedImports(content) {
    const imports = [];
    
    const patterns = [
      /import\s+{\s*([^}]+)\s*}\s+from\s+['"]([^'"]+)['"]/g,
      /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g,
      /const\s+{\s*([^}]+)\s*}\s*=\s*require\(['"]([^'"]+)['"]\)/g
    ];
    
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (match[1].includes(',') || match[1].includes('{')) {
          // Multiple named imports
          const names = match[1].split(',').map(name => name.trim());
          imports.push(...names.map(name => ({
            name: name,
            from: match[2],
            type: 'named'
          })));
        } else {
          // Single import
          imports.push({
            name: match[1],
            from: match[2],
            type: pattern.source.includes('from') ? 'default' : 'named'
          });
        }
      }
    }
    
    return imports;
  }

  async findReachableCode() {
    log('\n🎯 Finding Reachable Code', 'bold');
    
    const visited = new Set();
    const queue = [...this.entryPoints];
    
    // BFS to find all reachable files
    while (queue.length > 0) {
      const current = queue.shift();
      
      if (visited.has(current)) continue;
      visited.add(current);
      this.reachableFiles.add(current);
      
      const graphNode = this.dependencyGraph.get(current);
      if (graphNode) {
        for (const dep of graphNode.allDependencies) {
          const resolvedDep = this.resolveDependency(dep, current);
          if (resolvedDep && !visited.has(resolvedDep)) {
            queue.push(resolvedDep);
          }
        }
      }
    }
    
    log(`✅ Found ${this.reachableFiles.size} reachable files from entry points`, 'green');
  }

  async identifyArchitecturalPatterns() {
    log('\n🏛️ Identifying Architectural Patterns', 'bold');
    
    const patterns = {
      'api-routes': { files: [], pattern: 'API route handlers' },
      'react-pages': { files: [], pattern: 'Next.js pages' },
      'react-components': { files: [], pattern: 'React components' },
      'services': { files: [], pattern: 'Business logic services' },
      'utilities': { files: [], pattern: 'Utility functions' },
      'config': { files: [], pattern: 'Configuration files' },
      'hooks': { files: [], pattern: 'React hooks' },
      'middleware': { files: [], pattern: 'Express middleware' },
      'tests': { files: [], pattern: 'Test files' }
    };
    
    for (const [filePath, fileInfo] of this.fileMap.entries()) {
      const content = fileInfo.content;
      const dir = fileInfo.directory;
      
      // Classify by directory structure
      if (filePath.includes('src/api/routes/')) {
        patterns['api-routes'].files.push(filePath);
      } else if (filePath.includes('frontend/src/pages/')) {
        patterns['react-pages'].files.push(filePath);
      } else if (filePath.includes('frontend/src/components/')) {
        patterns['react-components'].files.push(filePath);
      } else if (filePath.includes('src/services/')) {
        patterns['services'].files.push(filePath);
      } else if (filePath.includes('src/utils/') || filePath.includes('frontend/src/hooks/')) {
        if (filePath.includes('hooks')) {
          patterns['hooks'].files.push(filePath);
        } else {
          patterns['utilities'].files.push(filePath);
        }
      } else if (filePath.includes('config/')) {
        patterns['config'].files.push(filePath);
      } else if (content.includes('app.use(') || content.includes('middleware')) {
        patterns['middleware'].files.push(filePath);
      } else if (filePath.includes('test') || filePath.includes('spec')) {
        patterns['tests'].files.push(filePath);
      }
    }
    
    this.architecturalPatterns = patterns;
    
    log('📊 Architectural Patterns Found:', 'cyan');
    for (const [patternName, info] of Object.entries(patterns)) {
      if (info.files.length > 0) {
        log(`  ${patternName}: ${info.files.length} files`, 'blue');
      }
    }
  }

  async findDeadCode() {
    log('\n💀 Identifying Dead Code', 'bold');
    
    const unreachableFiles = [];
    const unusedExports = [];
    const orphanedFiles = [];
    
    // Find unreachable files
    for (const [filePath] of this.fileMap.entries()) {
      if (!this.reachableFiles.has(filePath) && !this.entryPoints.has(filePath)) {
        unreachableFiles.push(filePath);
      }
    }
    
    // Find unused exports
    for (const [filePath, exports] of this.exportedSymbols.entries()) {
      const graphNode = this.dependencyGraph.get(filePath);
      
      if (graphNode && graphNode.dependents.length === 0 && exports.all.length > 0) {
        unusedExports.push({
          file: filePath,
          exports: exports.all
        });
      }
    }
    
    // Find orphaned files (no imports, no dependents)
    for (const [filePath, graphNode] of this.dependencyGraph.entries()) {
      if (graphNode.allDependencies.length === 0 && graphNode.dependents.length === 0) {
        if (!this.entryPoints.has(filePath)) {
          orphanedFiles.push(filePath);
        }
      }
    }
    
    this.deadCodeCandidates = {
      unreachableFiles,
      unusedExports,
      orphanedFiles
    };
    
    log(`⚠️ Found ${unreachableFiles.length} unreachable files`, 'yellow');
    log(`⚠️ Found ${unusedExports.length} files with unused exports`, 'yellow');
    log(`⚠️ Found ${orphanedFiles.length} orphaned files`, 'yellow');
  }

  async analyzeProjectStructure() {
    log('\n🗂️ Analyzing Project Structure', 'bold');
    
    const structure = {
      frontend: { files: 0, components: 0, pages: 0, hooks: 0 },
      backend: { files: 0, api: 0, services: 0, utils: 0 },
      config: { files: 0 },
      scripts: { files: 0 },
      docs: { files: 0 }
    };
    
    for (const [filePath] of this.fileMap.entries()) {
      if (filePath.startsWith('frontend/')) {
        structure.frontend.files++;
        if (filePath.includes('/components/')) structure.frontend.components++;
        if (filePath.includes('/pages/')) structure.frontend.pages++;
        if (filePath.includes('/hooks/')) structure.frontend.hooks++;
      } else if (filePath.startsWith('src/')) {
        structure.backend.files++;
        if (filePath.includes('/api/')) structure.backend.api++;
        if (filePath.includes('/services/')) structure.backend.services++;
        if (filePath.includes('/utils/')) structure.backend.utils++;
      } else if (filePath.startsWith('config/')) {
        structure.config.files++;
      } else if (filePath.startsWith('scripts/')) {
        structure.scripts.files++;
      }
    }
    
    log('📊 Project Structure:', 'cyan');
    log(`  Frontend: ${structure.frontend.files} files (${structure.frontend.pages} pages, ${structure.frontend.components} components)`, 'blue');
    log(`  Backend: ${structure.backend.files} files (${structure.backend.api} API, ${structure.backend.services} services)`, 'blue');
    log(`  Config: ${structure.config.files} files`, 'blue');
    log(`  Scripts: ${structure.scripts.files} files`, 'blue');
    
    return structure;
  }

  async generateArchitectureReport() {
    log('\n📄 Generating Architecture Report', 'bold');
    
    const report = {
      analysis: {
        timestamp: new Date().toISOString(),
        projectRoot: this.projectRoot,
        totalFiles: this.fileMap.size
      },
      
      entryPoints: Array.from(this.entryPoints),
      
      reachability: {
        reachableFiles: this.reachableFiles.size,
        unreachableFiles: this.deadCodeCandidates.unreachableFiles.length,
        reachabilityRatio: this.reachableFiles.size / this.fileMap.size
      },
      
      dependencies: {
        totalDependencies: Array.from(this.dependencyGraph.values())
          .reduce((sum, node) => sum + node.allDependencies.length, 0),
        avgDependenciesPerFile: Array.from(this.dependencyGraph.values())
          .reduce((sum, node) => sum + node.allDependencies.length, 0) / this.dependencyGraph.size,
        maxDependencies: Math.max(...Array.from(this.dependencyGraph.values())
          .map(node => node.allDependencies.length))
      },
      
      architecturalPatterns: Object.fromEntries(
        Object.entries(this.architecturalPatterns).map(([key, value]) => [key, {
          count: value.files.length,
          files: value.files
        }])
      ),
      
      deadCode: this.deadCodeCandidates,
      
      topConnectedFiles: this.getTopConnectedFiles(),
      
      dependencyHotspots: this.getDependencyHotspots(),
      
      recommendations: this.generateRecommendations()
    };
    
    // Save report
    const reportPath = path.join(this.projectRoot, 'logs', `architecture-analysis-${Date.now()}.json`);
    
    const logsDir = path.join(this.projectRoot, 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    log(`📄 Architecture report saved: ${reportPath}`, 'blue');
    
    this.displayArchitectureSummary(report);
    
    return report;
  }

  getTopConnectedFiles() {
    return Array.from(this.dependencyGraph.entries())
      .map(([filePath, node]) => ({
        file: filePath,
        incomingConnections: node.dependents.length,
        outgoingConnections: node.allDependencies.length,
        totalConnections: node.dependents.length + node.allDependencies.length
      }))
      .sort((a, b) => b.totalConnections - a.totalConnections)
      .slice(0, 10);
  }

  getDependencyHotspots() {
    const hotspots = [];
    
    for (const [filePath, node] of this.dependencyGraph.entries()) {
      if (node.dependents.length > 5) { // Files used by many others
        hotspots.push({
          file: filePath,
          type: 'high-dependents',
          count: node.dependents.length,
          risk: 'Changes affect many files'
        });
      }
      
      if (node.allDependencies.length > 10) { // Files that depend on many others
        hotspots.push({
          file: filePath,
          type: 'high-dependencies',
          count: node.allDependencies.length,
          risk: 'Complex file with many dependencies'
        });
      }
    }
    
    return hotspots.sort((a, b) => b.count - a.count).slice(0, 15);
  }

  generateRecommendations() {
    const recommendations = [];
    
    // Dead code recommendations
    if (this.deadCodeCandidates.unreachableFiles.length > 0) {
      recommendations.push({
        type: 'dead-code-removal',
        priority: 'high',
        title: `Remove ${this.deadCodeCandidates.unreachableFiles.length} unreachable files`,
        description: 'These files are not reachable from any entry point',
        action: 'Consider removing these files',
        files: this.deadCodeCandidates.unreachableFiles.slice(0, 10)
      });
    }
    
    // Architecture recommendations
    const hotspots = this.getDependencyHotspots();
    const highDependencyFiles = hotspots.filter(h => h.type === 'high-dependencies');
    
    if (highDependencyFiles.length > 0) {
      recommendations.push({
        type: 'architecture-improvement',
        priority: 'medium',
        title: `Refactor ${highDependencyFiles.length} complex files`,
        description: 'These files have too many dependencies',
        action: 'Consider breaking down complex files',
        files: highDependencyFiles.slice(0, 5).map(h => h.file)
      });
    }
    
    return recommendations;
  }

  displayArchitectureSummary(report) {
    log('\n🏗️ ARCHITECTURE ANALYSIS SUMMARY', 'bold');
    log('=' * 60, 'cyan');
    
    log(`\n📊 Project Overview:`, 'bold');
    log(`  Total Code Files: ${report.analysis.totalFiles}`, 'cyan');
    log(`  Entry Points: ${report.entryPoints.length}`, 'green');
    log(`  Reachable Files: ${report.reachability.reachableFiles}`, 'green');
    log(`  Unreachable Files: ${report.reachability.unreachableFiles}`, 'red');
    log(`  Reachability: ${(report.reachability.reachabilityRatio * 100).toFixed(1)}%`, 'cyan');
    
    log(`\n🏛️ Architectural Patterns:`, 'bold');
    for (const [pattern, info] of Object.entries(report.architecturalPatterns)) {
      if (info.count > 0) {
        log(`  ${pattern}: ${info.count} files`, 'blue');
      }
    }
    
    log(`\n🔗 Dependencies:`, 'bold');
    log(`  Total Dependencies: ${report.dependencies.totalDependencies}`, 'cyan');
    log(`  Avg per File: ${report.dependencies.avgDependenciesPerFile.toFixed(1)}`, 'cyan');
    log(`  Max Dependencies: ${report.dependencies.maxDependencies}`, 'yellow');
    
    log(`\n🔥 Top Connected Files:`, 'bold');
    report.topConnectedFiles.slice(0, 5).forEach(file => {
      log(`  ${file.file} (${file.totalConnections} connections)`, 'magenta');
    });
    
    if (report.deadCode.unreachableFiles.length > 0) {
      log(`\n💀 Dead Code Found:`, 'bold');
      log(`  Unreachable Files: ${report.deadCode.unreachableFiles.length}`, 'red');
      log(`  Top unreachable:`, 'yellow');
      report.deadCode.unreachableFiles.slice(0, 5).forEach(file => {
        log(`    ${file}`, 'red');
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
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log('🏗️ StackPro Code Architecture Analyzer');
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/analyze-code-architecture.js        # Analyze architecture');
    console.log('  node scripts/analyze-code-architecture.js --help # Show this help');
    console.log('');
    console.log('Analyzes:');
    console.log('  • Code dependency graphs');
    console.log('  • Reachable vs unreachable code');
    console.log('  • Architectural patterns');
    console.log('  • Dead code detection');
    console.log('  • Import/export relationships');
    console.log('  • Dependency hotspots');
    return;
  }
  
  const analyzer = new CodeArchitectureAnalyzer();
  await analyzer.analyzeArchitecture();
}

// Execute if run directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Architecture analysis failed:', error.message);
    process.exit(1);
  });
}

module.exports = { CodeArchitectureAnalyzer };
