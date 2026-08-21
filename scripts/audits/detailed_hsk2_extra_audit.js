const fs = require('fs');
const path = require('path');
const { MANDARIN_BEAN_HSK2 } = require('./diff_hsk_sources');

const hsk2 = JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/hsk2.json'), 'utf8'));

// MandarinBean HSK2 raw 150 entries
const mbHsk2Raw = MANDARIN_BEAN_HSK2.map(i => ({
  no: i.no,
  char: i.char,
  cleanChar: i.char.replace(/（[^）]+）|\([^\)]+\)/g, '').trim(),
  pinyin: i.pinyin,
  meaning: i.meaning
}));

const mbSet = new Set(mbHsk2Raw.map(i => i.cleanChar));
// Also add individual parts of multi-character patterns like 因为……所以……
mbHsk2Raw.forEach(i => {
  if (i.cleanChar.includes('……')) {
    i.cleanChar.split('……').forEach(part => {
      if (part.trim()) mbSet.add(part.trim());
    });
  }
});

const extras = hsk2.filter(e => !mbSet.has(e.character));

console.log('=== EXACT AUDIT OF HSK2.JSON EXTRA WORDS ===\n');
console.log(`hsk2.json length: ${hsk2.length}`);
console.log(`MandarinBean HSK2 raw PDF list length: ${mbHsk2Raw.length}`);
console.log(`Extra items in hsk2.json not in MandarinBean HSK2 PDF (${extras.length}):\n`);

extras.forEach((item, idx) => {
  console.log(`${idx + 1}. [${item.character}] displayPinyin: "${item.displayPinyin}" | meaning: "${item.meaning}"`);
});
