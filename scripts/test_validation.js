const fs = require('fs');
const path = require('path');

const toneCharMap = {
  'ā': ['a', '1'], 'á': ['a', '2'], 'ǎ': ['a', '3'], 'à': ['a', '4'],
  'ē': ['e', '1'], 'é': ['e', '2'], 'ě': ['e', '3'], 'è': ['e', '4'],
  'ī': ['i', '1'], 'í': ['i', '2'], 'ǐ': ['i', '3'], 'ì': ['i', '4'],
  'ō': ['o', '1'], 'ó': ['o', '2'], 'ǒ': ['o', '3'], 'ò': ['o', '4'],
  'ū': ['u', '1'], 'ú': ['u', '2'], 'ǔ': ['u', '3'], 'ù': ['u', '4'],
  'ǖ': ['v', '1'], 'ǘ': ['v', '2'], 'ǚ': ['v', '3'], 'ǜ': ['v', '4'], 'ü': ['v', '5']
};

function getCanonicalPinyinToken(str) {
  if (!str || typeof str !== 'string') return '';
  const trimmed = str.trim().toLowerCase();
  
  let result = '';
  for (let char of trimmed) {
    if (toneCharMap[char]) {
      result += toneCharMap[char][0] + toneCharMap[char][1];
    } else if (/[a-zv0-9]/i.test(char)) {
      const norm = char.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ü/g, 'v');
      result += norm;
    }
  }
  return result;
}

function validateUserAnswer(userInput, cardPinyinArray) {
  if (!userInput || !Array.isArray(cardPinyinArray) || cardPinyinArray.length === 0) {
    return false;
  }
  const cleanedInput = userInput.trim().toLowerCase();
  const userToken = getCanonicalPinyinToken(cleanedInput);
  if (!userToken) return false;

  return cardPinyinArray.some(pinyinVariant => {
    const variantStr = String(pinyinVariant).trim().toLowerCase();
    const variantToken = getCanonicalPinyinToken(variantStr);
    return variantToken === userToken;
  });
}

const dataDir = path.join(__dirname, '../data');
const datasets = ['strokes.json', 'radicals.json', 'hsk1.json', 'hsk2.json', 'hsk3.json'];

console.log('=== VERIFYING DATASETS DATA INTEGRITY ===\n');

const hskCharSets = {};

datasets.forEach(filename => {
  const filePath = path.join(dataDir, filename);
  console.log(`--- Validating ${filename} ---`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  console.log(`Items count: ${data.length}`);
  const seenCharsInFile = new Set();

  data.forEach((item, idx) => {
    // 1. Verify displayPinyin matches pinyin array
    const testInput = item.displayPinyin;
    const isMatch = validateUserAnswer(testInput, item.pinyin);
    if (!isMatch) {
      throw new Error(`Validation failed in ${filename} [#${idx+1}] for "${item.character}" (${item.displayPinyin})`);
    }

    // 2. Verify no duplicates within file
    if (seenCharsInFile.has(item.character)) {
      throw new Error(`Duplicate character "${item.character}" found within ${filename}`);
    }
    seenCharsInFile.add(item.character);
  });

  if (filename.startsWith('hsk')) {
    hskCharSets[filename] = seenCharsInFile;
  }

  console.log(`[PASS] ${filename} verified successfully with 0 errors.\n`);
});

// 3. Verify zero overlap between hsk1, hsk2, and hsk3
console.log('--- Verifying Cross-HSK Level Uniqueness ---');
const hskFiles = Object.keys(hskCharSets);
for (let i = 0; i < hskFiles.length; i++) {
  for (let j = i + 1; j < hskFiles.length; j++) {
    const fileA = hskFiles[i];
    const fileB = hskFiles[j];
    const setA = hskCharSets[fileA];
    const setB = hskCharSets[fileB];

    const overlaps = [...setA].filter(char => setB.has(char));
    if (overlaps.length > 0) {
      throw new Error(`Character overlap found between ${fileA} and ${fileB}: ${overlaps.join(', ')}`);
    }
    console.log(`[PASS] Zero character overlap between ${fileA} and ${fileB}.`);
  }
}

console.log('\nALL DATASETS VALIDATION SUCCESSFUL!');
