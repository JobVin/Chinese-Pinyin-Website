const fs = require('fs');
const path = require('path');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Read and evaluate vocab.js to extract datasets
const vocabPath = path.join(__dirname, '..', 'vocab.js');
const vocabCode = fs.readFileSync(vocabPath, 'utf8');

// Safely extract all 5 datasets from vocab.js
const fn = new Function(vocabCode + '; return { STROKES_DATA, RADICALS_DATA, HSK1_DATA, HSK2_DATA, HSK3_DATA };');
const { STROKES_DATA, RADICALS_DATA, HSK1_DATA, HSK2_DATA, HSK3_DATA } = fn();

/**
 * Helper to split potential delimited pinyin strings and trim entries.
 */
function parsePinyinVariants(val) {
  if (!val) return [];
  if (typeof val === 'string') {
    return val.split(/[\/,;]+/).map(s => s.trim()).filter(Boolean);
  }
  if (Array.isArray(val)) {
    return val.map(s => String(s).trim()).filter(Boolean);
  }
  return [String(val).trim()];
}

/**
 * Transforms datasets into optimized JSON schema:
 * {
 *   character: string,
 *   pinyin: string[], // Tone marks, plain, numbered, polyphones
 *   displayPinyin: string, // Primary tone mark display string
 *   meaning: string // Definition
 * }
 */
function processDataset(data) {
  const map = new Map();

  for (const item of data) {
    const char = item.character;
    if (!char) continue;

    const variants = [
      ...parsePinyinVariants(item.pinyin),
      ...parsePinyinVariants(item.pinyinPlain),
      ...parsePinyinVariants(item.pinyinNumbered)
    ];

    const displayPinyin = item.pinyin ? String(item.pinyin).trim() : (variants[0] || '');
    const meaning = item.meaning ? String(item.meaning).trim() : '';

    if (!map.has(char)) {
      map.set(char, {
        pinyins: [],
        displayPinyin: displayPinyin,
        meaning: meaning
      });
    }

    const entry = map.get(char);
    for (const v of variants) {
      if (!entry.pinyins.includes(v)) {
        entry.pinyins.push(v);
      }
    }
  }

  const result = [];
  for (const [character, entry] of map.entries()) {
    result.push({
      character,
      pinyin: entry.pinyins,
      displayPinyin: entry.displayPinyin,
      meaning: entry.meaning
    });
  }

  return result;
}

const datasets = [
  { name: 'strokes.json', data: STROKES_DATA },
  { name: 'radicals.json', data: RADICALS_DATA },
  { name: 'hsk1.json', data: HSK1_DATA },
  { name: 'hsk2.json', data: HSK2_DATA },
  { name: 'hsk3.json', data: HSK3_DATA }
];

datasets.forEach(({ name, data }) => {
  const processed = processDataset(data);
  const filePath = path.join(dataDir, name);
  fs.writeFileSync(filePath, JSON.stringify(processed, null, 2), 'utf8');
  console.log(`Successfully generated ${name} (${processed.length} entries)`);
});
