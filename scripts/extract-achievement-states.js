/**
 * Extracts valid achievement state keys from all game node source files and
 * writes them to a JSON file consumed by the backend's campaign service.
 *
 * Scans all set_state usages (effects, success_effects, failure_effects,
 * payload_rules[].effects) and filters out internal (_-prefixed) and
 * quiz-related (quiz_-prefixed) keys.
 *
 * Source files scanned:
 *   - frontend/src/data/game-nodes.ts          (terminal-core story graph)
 *   - frontend/src/data/campaign-nodes/*.ts     (all campaign-specific node files)
 *
 * Run: node scripts/extract-achievement-states.js
 * npm script: npm run extract-states (from repo root)
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_PATH = path.join(__dirname, '..', 'backend', 'src', 'data', 'valid-achievement-states.json');

// Build the list of source files to scan
const sourceFiles = [];

// 1. Core story graph (terminal-core re-exports this directly)
const coreNodesPath = path.join(__dirname, '..', 'frontend', 'src', 'data', 'game-nodes.ts');
if (fs.existsSync(coreNodesPath)) {
  sourceFiles.push(coreNodesPath);
}

// 2. All TypeScript files in campaign-nodes/ (registry.ts has no set_state; re-export
//    files like terminal-core.nodes.ts add no new states — they're included safely)
const campaignNodesDir = path.join(__dirname, '..', 'frontend', 'src', 'data', 'campaign-nodes');
if (fs.existsSync(campaignNodesDir)) {
  const entries = fs.readdirSync(campaignNodesDir).filter(f => f.endsWith('.ts'));
  for (const entry of entries) {
    sourceFiles.push(path.join(campaignNodesDir, entry));
  }
}

if (sourceFiles.length === 0) {
  console.error('ERROR: No source files found to scan.');
  process.exit(1);
}

// Match all set_state object literals, including multi-line ones
const setStateRegex = /set_state\s*:\s*\{([^}]+)\}/g;
const keys = new Set();

for (const filePath of sourceFiles) {
  const source = fs.readFileSync(filePath, 'utf-8');
  let match;
  while ((match = setStateRegex.exec(source)) !== null) {
    const block = match[1];
    // Extract property names (identifiers before a colon)
    const keyRegex = /(\w+)\s*:/g;
    let keyMatch;
    while ((keyMatch = keyRegex.exec(block)) !== null) {
      const key = keyMatch[1];
      if (key.startsWith('_') || key.startsWith('quiz_')) continue;
      keys.add(key);
    }
  }
}

const sorted = [...keys].sort();

if (sorted.length === 0) {
  console.error('ERROR: No achievement states found in any scanned source files.');
  console.error('Scanned:', sourceFiles.map(f => path.relative(process.cwd(), f)).join(', '));
  process.exit(1);
}

fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(sorted, null, 2) + '\n');

console.log(`Scanned ${sourceFiles.length} file(s):`);
sourceFiles.forEach(f => console.log(`  ${path.relative(process.cwd(), f)}`));
console.log(`\nExtracted ${sorted.length} achievement states → ${path.relative(process.cwd(), OUTPUT_PATH)}`);
sorted.forEach(s => console.log(`  - ${s}`));
