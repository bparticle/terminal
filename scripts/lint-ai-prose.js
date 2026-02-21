#!/usr/bin/env node

/**
 * lint-ai-prose.js — Flags AI-sounding words and phrases in game-nodes.ts
 *
 * Usage:
 *   pnpm lint:prose                    # lint game-nodes.ts
 *   node scripts/lint-ai-prose.js      # same thing
 *   node scripts/lint-ai-prose.js path/to/file.ts  # lint a specific file
 *
 * Zero dependencies. Just a word list and string matching.
 */

const fs = require('fs');
const path = require('path');

// ─── AI-ism word list ───────────────────────────────────────────────
// Single words that are heavily over-represented in AI-generated prose.
// Context-dependent: some are fine in moderation, flagged so you can decide.
const AI_WORDS = [
  'delve', 'delved', 'delving',
  'tapestry',
  'resonate', 'resonated', 'resonates', 'resonating',
  'nuanced', 'nuance',
  'multifaceted',
  'intricate', 'intricacies',
  'profound', 'profoundly',
  'meticulous', 'meticulously',
  'comprehensive',
  'pivotal',
  'robust',
  'holistic',
  'unprecedented',
  'embark', 'embarked', 'embarking',
  'foster', 'fostering',
  'leverage', 'leveraging',
  'utilize', 'utilizing', 'utilization',
  'illuminate', 'illuminating',
  'underscore', 'underscores', 'underscoring',
  'unravel', 'unraveling',
  'elucidate',
  'discern', 'discerning',
  'captivate', 'captivating',
  'orchestrate', 'orchestrating',
  'permeate', 'permeating',
  'cultivate', 'cultivating',
  'paramount',
  'pertinent',
  'invaluable',
  'commendable',
  'groundbreaking',
  'bustling',
  'harnessing',
  'supercharge',
  'elevate', 'elevating',
  'dazzle', 'dazzling',
  'realm',
  'beacon',
  'landscape',
  'tapestry',
  'testament',
  'journey',
  'endeavor', 'endeavors',
  'poised',
  'seamless', 'seamlessly',
  'moreover',
  'furthermore',
  'consequently',
  'nevertheless',
  'notwithstanding',
  'aforementioned',
  'spearhead', 'spearheading',
  'unwavering',
  'interplay',
  'synergy',
  'paradigm',
  'underpin', 'underpinning',
  'myriad',
  'plethora',
  'enigmatic',
  'ineffable',
  'ephemeral',
  'juxtaposition',
  'visceral',
  'palpable',
  'tangible',
  'ethereal',
  'liminal',
];

// Multi-word phrases that are AI writing signatures.
const AI_PHRASES = [
  "it's worth noting",
  "it's important to note",
  "worth noting that",
  "in today's",
  "in the realm of",
  "navigate the",
  "at the end of the day",
  "a testament to",
  "a beacon of",
  "i hope this helps",
  "as previously mentioned",
  "when it comes to",
  "in the world of",
  "designed to enhance",
  "serves as a",
  "plays a crucial",
  "it is important to",
  "this is not just",
  "more than just",
  "not just a",
  "the very fabric",
  "the fabric of",
  "sends a shiver",
  "a sense of wonder",
  "fills the air",
  "a world where",
  "but what truly",
  "what truly sets",
  "let's explore",
  "dive into",
  "there's something",
  "can't help but",
  "you can't help",
  "a testament to the",
  "a sense of",
  "couldn't help but",
  "it dawned on",
];

// ─── Prose-quality flags ────────────────────────────────────────────
// Not AI-specific, but patterns that weaken game writing.
const WEAK_PATTERNS = [
  { pattern: 'very ', label: 'weak intensifier "very"' },
  { pattern: 'really ', label: 'weak intensifier "really"' },
  { pattern: 'actually ', label: 'filler word "actually"' },
  { pattern: 'basically ', label: 'filler word "basically"' },
  { pattern: 'essentially ', label: 'filler word "essentially"' },
  { pattern: 'quite ', label: 'hedge word "quite"' },
];

// ─── Main ───────────────────────────────────────────────────────────

const target = process.argv[2]
  || path.join(__dirname, '..', 'frontend', 'src', 'data', 'game-nodes.ts');

if (!fs.existsSync(target)) {
  console.error(`File not found: ${target}`);
  process.exit(1);
}

const source = fs.readFileSync(target, 'utf8');
const lines = source.split('\n');

const flags = [];

// Only scan inside string content (lines containing quotes with prose)
const STRING_LINE = /['"`]/;

lines.forEach((line, i) => {
  if (!STRING_LINE.test(line)) return;

  const lower = line.toLowerCase();
  const lineNum = i + 1;
  const preview = line.trim().slice(0, 90);

  // Check single words (whole-word match)
  for (const word of AI_WORDS) {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(lower)) {
      flags.push({ line: lineNum, type: 'ai-word', term: word, preview });
    }
  }

  // Check phrases
  for (const phrase of AI_PHRASES) {
    if (lower.includes(phrase)) {
      flags.push({ line: lineNum, type: 'ai-phrase', term: phrase, preview });
    }
  }

  // Check weak patterns (word-boundary match to avoid "every" → "very" etc.)
  for (const { pattern, label } of WEAK_PATTERNS) {
    const regex = new RegExp(`\\b${pattern.trim()}\\b`, 'i');
    if (regex.test(lower)) {
      flags.push({ line: lineNum, type: 'weak', term: label, preview });
    }
  }
});

// ─── Output ─────────────────────────────────────────────────────────

if (flags.length === 0) {
  console.log(`\x1b[32m✓\x1b[0m No AI-isms found in ${path.basename(target)}`);
  process.exit(0);
}

// Group by type
const aiWords = flags.filter(f => f.type === 'ai-word');
const aiPhrases = flags.filter(f => f.type === 'ai-phrase');
const weak = flags.filter(f => f.type === 'weak');

console.log(`\n\x1b[1m${path.basename(target)} — AI prose lint\x1b[0m\n`);

if (aiWords.length) {
  console.log(`\x1b[33m⚠ AI words (${aiWords.length}):\x1b[0m`);
  for (const f of aiWords) {
    console.log(`  L${f.line}: \x1b[33m${f.term}\x1b[0m — ${f.preview}`);
  }
  console.log();
}

if (aiPhrases.length) {
  console.log(`\x1b[31m✗ AI phrases (${aiPhrases.length}):\x1b[0m`);
  for (const f of aiPhrases) {
    console.log(`  L${f.line}: \x1b[31m${f.term}\x1b[0m — ${f.preview}`);
  }
  console.log();
}

if (weak.length) {
  console.log(`\x1b[36m○ Weak writing (${weak.length}):\x1b[0m`);
  for (const f of weak) {
    console.log(`  L${f.line}: \x1b[36m${f.term}\x1b[0m — ${f.preview}`);
  }
  console.log();
}

console.log(`Total: ${flags.length} flag(s)`);
process.exit(1);
