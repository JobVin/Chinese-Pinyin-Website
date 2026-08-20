const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data');

// Tone mark mapping
const toneMap = {
  'ā': ['a', '1'], 'á': ['a', '2'], 'ǎ': ['a', '3'], 'à': ['a', '4'],
  'ē': ['e', '1'], 'é': ['e', '2'], 'ě': ['e', '3'], 'è': ['e', '4'],
  'ī': ['i', '1'], 'í': ['i', '2'], 'ǐ': ['i', '3'], 'ì': ['i', '4'],
  'ō': ['o', '1'], 'ó': ['o', '2'], 'ǒ': ['o', '3'], 'ò': ['o', '4'],
  'ū': ['u', '1'], 'ú': ['u', '2'], 'ǔ': ['u', '3'], 'ù': ['u', '4'],
  'ǖ': ['v', '1'], 'ǘ': ['v', '2'], 'ǚ': ['v', '3'], 'ǜ': ['v', '4'], 'ü': ['v', '0']
};

function generatePinyinVariants(inputStr) {
  if (!inputStr || typeof inputStr !== 'string') return [];
  const results = new Set();
  const trimmed = inputStr.trim().toLowerCase();
  if (!trimmed) return [];

  // 1. Original trimmed
  results.add(trimmed);
  results.add(trimmed.replace(/\s+/g, ''));

  // 2. Strip tones for plain representation
  const plain = trimmed
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ü/g, 'v')
    .replace(/u:/g, 'v');

  results.add(plain);
  results.add(plain.replace(/\s+/g, ''));

  // 3. Convert toned to numbered pinyin
  const syllables = trimmed.split(/\s+/);
  const numSyllables = syllables.map(s => {
    let toneNum = '';
    let cleanS = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ü/g, 'v');

    for (let char of s) {
      if (toneMap[char]) {
        toneNum = toneMap[char][1];
        break;
      }
    }
    return toneNum ? `${cleanS}${toneNum}` : cleanS;
  });

  const numWithSpaces = numSyllables.join(' ');
  results.add(numWithSpaces);
  results.add(numWithSpaces.replace(/\s+/g, ''));

  return Array.from(results);
}

function processDataset(filename, polyphoneFixes = {}) {
  const filePath = path.join(dataDir, filename);
  if (!fs.existsSync(filePath)) return;

  const dataset = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  dataset.forEach(entry => {
    // Apply polyphone fix if specified
    if (polyphoneFixes[entry.character]) {
      const fix = polyphoneFixes[entry.character];
      if (fix.displayPinyin) entry.displayPinyin = fix.displayPinyin;
      if (fix.meaning) entry.meaning = fix.meaning;
    }

    const allVariants = new Set();

    // Process existing pinyin array elements
    if (Array.isArray(entry.pinyin)) {
      entry.pinyin.forEach(p => {
        generatePinyinVariants(p).forEach(v => allVariants.add(v));
      });
    }

    // Process displayPinyin
    if (entry.displayPinyin) {
      generatePinyinVariants(entry.displayPinyin).forEach(v => allVariants.add(v));
    }

    entry.pinyin = Array.from(allVariants);
  });

  fs.writeFileSync(filePath, JSON.stringify(dataset, null, 2), 'utf8');
  console.log(`Updated ${filename} successfully (${dataset.length} items).`);
}

// 1. Polyphone Corrections
const HSK1_FIXES = {
  "那": { displayPinyin: "nà", meaning: "that / those" },
  "几": { displayPinyin: "jǐ", meaning: "how many / a few / several" },
  "个": { displayPinyin: "gè", meaning: "individual / classifier for general objects" },
  "都": { displayPinyin: "dōu", meaning: "all / both / entirely" },
  "喂": { displayPinyin: "wèi", meaning: "hello (on phone) / hey" }
};

const HSK2_FIXES = {
  "离": { displayPinyin: "lí", meaning: "from / away from / distance from" },
  "要": { displayPinyin: "yào", meaning: "to want / to need / will / must" },
  "长": { displayPinyin: "cháng", meaning: "long" }
};

const HSK3_FIXES = {
  "还": { displayPinyin: "hái", meaning: "still / also / in addition" },
  "只": { displayPinyin: "zhǐ", meaning: "only" }
};

console.log('=== FIXING POLYPHONES & GENERATING FULL PINYIN VARIANTS ===\n');
processDataset('hsk1.json', HSK1_FIXES);
processDataset('hsk2.json', HSK2_FIXES);
processDataset('hsk3.json', HSK3_FIXES);
processDataset('strokes.json', {});
processDataset('radicals.json', {});

console.log('\nAll datasets processed successfully.');
