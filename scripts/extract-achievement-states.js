/**
 * Extracts valid achievement state keys from game-nodes.ts and writes them
 * to a JSON file consumed by the backend's campaign service.
 *
 * Scans all set_state usages (effects, success_effects, failure_effects,
 * payload_rules[].effects) and filters out internal (_-prefixed) and
 * quiz-related (quiz_-prefixed) keys.
 *
 * Usage: node scripts/extract-achievement-states.js
 */

const fs = require('fs');
const path = require('path');

const GAME_NODES_PATH = path.join(__dirname, '..', 'frontend', 'src', 'data', 'game-nodes.ts');
const OUTPUT_PATH = path.join(__dirname, '..', 'backend', 'src', 'data', 'valid-achievement-states.json');

const source = fs.readFileSync(GAME_NODES_PATH, 'utf-8');

// Match all set_state object literals, including multi-line ones
const setStateRegex = /set_state\s*:\s*\{([^}]+)\}/g;
const keys = new Set();

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

const sorted = [...keys].sort();

if (sorted.length === 0) {
  console.error('ERROR: No achievement states found in', GAME_NODES_PATH);
  console.error('Make sure game-nodes.ts contains set_state effects.');
  process.exit(1);
}

fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(sorted, null, 2) + '\n');

console.log(`Extracted ${sorted.length} achievement states → ${path.relative(process.cwd(), OUTPUT_PATH)}`);
sorted.forEach(s => console.log(`  - ${s}`));
