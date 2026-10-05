/**
 * Test Suite for Multiple Choice Options Generator
 * Exercises the actual buildMcOptions and normalizeMcPinyin exported from app.js.
 */

const fs = require('fs');
const path = require('path');
const { buildMcOptions, normalizeMcPinyin } = require('../app.js');

const datasetsToTest = [
  { name: 'strokes', path: '../data/strokes.json' },
  { name: 'radicals', path: '../data/radicals.json' },
  { name: 'hsk1', path: '../data/hsk1.json' },
  { name: 'hsk2', path: '../data/hsk2.json' },
  { name: 'hsk3', path: '../data/hsk3.json' }
];

console.log('=== MULTIPLE CHOICE OPTIONS GENERATOR TEST ===\n');

let totalTested = 0;
let totalFallbackCount = 0;
const fallbackReport = [];

// Temporarily suppress console.warn from app.js during the test run so output is clean
const originalWarn = console.warn;
let warningLog = [];
console.warn = (...args) => {
  warningLog.push(args.join(' '));
};

try {
  for (const track of datasetsToTest) {
    const filePath = path.resolve(__dirname, track.path);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    let trackFallbackCount = 0;

    for (const item of data) {
      totalTested++;
      const targetLen = [...(item.character || '')].length;
      const rawCorrect = item.displayPinyin || (Array.isArray(item.pinyin) ? item.pinyin[0] : item.pinyin) || '';
      const normCorrect = normalizeMcPinyin(rawCorrect);

      // Count unique same-length distractor candidates available in the full track
      const sameLenSet = new Set();
      for (const cand of data) {
        if (!cand || !cand.character) continue;
        const candLen = [...cand.character].length;
        if (candLen !== targetLen) continue;
        const candPinyin = cand.displayPinyin || (Array.isArray(cand.pinyin) ? cand.pinyin[0] : cand.pinyin) || '';
        const normCand = normalizeMcPinyin(candPinyin);
        if (normCand && normCand !== normCorrect) {
          sameLenSet.add(normCand);
        }
      }
      const hasEnoughSameLen = sameLenSet.size >= 3;

      // Call the actual buildMcOptions from app.js
      const options = buildMcOptions(item, data);

      // Check 1: exactly 4 options
      if (!Array.isArray(options) || options.length !== 4) {
        throw new Error(`[${track.name}] Item "${item.character}" did not return 4 options (got ${options?.length})`);
      }

      // Check 2: exactly 1 correct option
      const correctOpts = options.filter(o => o.isCorrect === true);
      if (correctOpts.length !== 1) {
        throw new Error(`[${track.name}] Item "${item.character}" does not have exactly 1 correct option (got ${correctOpts.length})`);
      }

      // Check 3: correct option matches item's displayPinyin
      if (normalizeMcPinyin(correctOpts[0].pinyin) !== normCorrect) {
        throw new Error(`[${track.name}] Item "${item.character}" correct option mismatch: expected "${rawCorrect}", got "${correctOpts[0].pinyin}"`);
      }

      // Check 4: no duplicate normalized pinyin
      const normalizedPinyins = options.map(o => normalizeMcPinyin(o.pinyin));
      if (new Set(normalizedPinyins).size !== 4) {
        throw new Error(`[${track.name}] Item "${item.character}" has duplicate pinyin options: ${normalizedPinyins.join(', ')}`);
      }

      // Check 5: Syllable / character count matching
      if (hasEnoughSameLen) {
        // If enough same-length candidates exist, all distractors must have candidate characters matching targetLen
        // Verify by checking that distractors correspond to items of same length in data
        // (Any distractor chosen must have targetLen character count)
        const distractors = options.filter(o => !o.isCorrect);
        for (const dist of distractors) {
          const matchingCand = data.find(c => normalizeMcPinyin(c.displayPinyin || (Array.isArray(c.pinyin) ? c.pinyin[0] : c.pinyin)) === normalizeMcPinyin(dist.pinyin));
          if (matchingCand) {
            const candLen = [...matchingCand.character].length;
            if (candLen !== targetLen) {
              throw new Error(`[${track.name}] Item "${item.character}" (length ${targetLen}) received distractor "${matchingCand.character}" with length ${candLen} even though ${sameLenSet.size} same-length candidates exist.`);
            }
          }
        }
      } else {
        trackFallbackCount++;
        totalFallbackCount++;
        fallbackReport.push({
          track: track.name,
          character: item.character,
          length: targetLen,
          availableSameLen: sameLenSet.size
        });
      }
    }

    console.log(`[PASS] ${track.name.padEnd(9)}: All ${data.length} items verified (Fallback used: ${trackFallbackCount})`);
  }
} finally {
  console.warn = originalWarn;
}

console.log(`\n==============================================`);
console.log(`Total items tested across all tracks: ${totalTested}`);
console.log(`Total items requiring length fallback: ${totalFallbackCount}`);
if (fallbackReport.length > 0) {
  console.log('\nDetails of items that required fallback:');
  fallbackReport.forEach(fb => {
    console.log(` - [${fb.track}] "${fb.character}" (length: ${fb.length}, available same-length distractors: ${fb.availableSameLen})`);
  });
}
console.log(`==============================================\n`);
console.log('[SUCCESS] All MC options and syllable-count constraints verified!');
