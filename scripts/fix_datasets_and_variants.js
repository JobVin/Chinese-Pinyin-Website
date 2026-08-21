const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data');

const toneCharsRegex = /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/i;

function hasToneMark(str) {
  return toneCharsRegex.test(str);
}

function cleanPinyinVariants(rawVariants, displayPinyin) {
  const result = new Set();

  if (displayPinyin && typeof displayPinyin === 'string' && displayPinyin.trim()) {
    const disp = displayPinyin.trim();
    result.add(disp);
    if (disp.includes(' ')) {
      result.add(disp.replace(/\s+/g, ''));
    }
  }

  // First pass: collect all non-numeric variants
  const validStrings = [];
  rawVariants.forEach(v => {
    if (!v || typeof v !== 'string') return;
    const trimmed = v.trim();
    if (!trimmed) return;

    // Reject numeric tone variants (e.g. heng1, shu4, ni3hao3)
    if (/\d/.test(trimmed)) return;

    validStrings.push(trimmed);
  });

  // Check if any variant has a tone mark
  const anyToned = validStrings.some(s => hasToneMark(s));

  validStrings.forEach(s => {
    if (anyToned && !hasToneMark(s) && s !== displayPinyin) {
      // If there are tone-marked variants available, filter out un-toned plain strings (e.g. "heng" when "héng" exists)
      return;
    }

    result.add(s);
    if (s.includes(' ')) {
      result.add(s.replace(/\s+/g, ''));
    }
  });

  return Array.from(result);
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

    const rawVariants = new Set();

    if (Array.isArray(entry.pinyin)) {
      entry.pinyin.forEach(p => rawVariants.add(p));
    }

    if (entry.displayPinyin) {
      rawVariants.add(entry.displayPinyin);
    }

    entry.pinyin = cleanPinyinVariants(Array.from(rawVariants), entry.displayPinyin);
  });

  fs.writeFileSync(filePath, JSON.stringify(dataset, null, 2), 'utf8');
  console.log(`Updated ${filename} successfully (${dataset.length} items).`);
}

// Polyphone Corrections
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

console.log('=== CLEANING DATASETS TO SOLELY TONE-MARKED PINYIN VARIANTS ===\n');
processDataset('hsk1.json', HSK1_FIXES);
processDataset('hsk2.json', HSK2_FIXES);
processDataset('hsk3.json', HSK3_FIXES);
processDataset('strokes.json', {});
processDataset('radicals.json', {});

console.log('\nAll datasets cleaned successfully.');
