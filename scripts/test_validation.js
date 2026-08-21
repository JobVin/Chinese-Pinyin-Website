const fs = require('fs');
const path = require('path');

function normalizePinyinToken(str) {
  if (!str || typeof str !== 'string') return '';
  return str.trim().toLowerCase().replace(/['’\s]/g, '');
}

function validateUserAnswer(userInput, cardPinyinArray) {
  if (!userInput || typeof userInput !== 'string' || !Array.isArray(cardPinyinArray) || cardPinyinArray.length === 0) {
    return false;
  }
  const trimmedInput = userInput.trim();
  if (!trimmedInput) return false;

  // Reject inputs containing digits (e.g. heng1, shu4, ni3hao3)
  if (/\d/.test(trimmedInput)) {
    return false;
  }

  const userToken = normalizePinyinToken(trimmedInput);
  if (!userToken) return false;

  return cardPinyinArray.some(pinyinVariant => {
    const variantToken = normalizePinyinToken(String(pinyinVariant));
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
