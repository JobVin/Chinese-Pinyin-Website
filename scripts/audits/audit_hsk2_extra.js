const fs = require('fs');
const path = require('path');
const { MANDARIN_BEAN_HSK1, MANDARIN_BEAN_HSK2, MANDARIN_BEAN_HSK3 } = require('./diff_hsk_sources');

const hsk2 = JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/hsk2.json'), 'utf8'));

// Build sets of characters in MandarinBean PDFs
const mbHsk1Set = new Set(MANDARIN_BEAN_HSK1.map(i => i.char.replace(/（[^）]+）|\([^\)]+\)/g, '').trim()));
const mbHsk2Set = new Set(MANDARIN_BEAN_HSK2.map(i => i.char.replace(/（[^）]+）|\([^\)]+\)/g, '').trim()));
const mbHsk3Set = new Set(MANDARIN_BEAN_HSK3.map(i => i.char.replace(/（[^）]+）|\([^\)]+\)/g, '').trim()));

console.log('=== AUDITING HSK2.JSON AGAINST MANDARINBEAN PDF WORDLISTS ===\n');
console.log(`Current hsk2.json total words: ${hsk2.length}`);
console.log(`MandarinBean HSK 2 PDF target: ${mbHsk2Set.size}\n`);

const extraInHsk2 = [];

hsk2.forEach((entry, idx) => {
  const char = entry.character;
  if (!mbHsk2Set.has(char)) {
    let sourceNote = 'Not in MandarinBean HSK1, HSK2, or HSK3 PDFs';
    if (mbHsk1Set.has(char)) {
      sourceNote = 'Appears in MandarinBean HSK1 PDF';
    } else if (mbHsk3Set.has(char)) {
      sourceNote = 'Appears in MandarinBean HSK3 PDF';
    }

    extraInHsk2.push({
      index: idx + 1,
      character: entry.character,
      displayPinyin: entry.displayPinyin,
      meaning: entry.meaning,
      sourceNote: sourceNote
    });
  }
});

console.log(`Found ${extraInHsk2.length} words in hsk2.json that are NOT in the MandarinBean HSK2 PDF list:\n`);

extraInHsk2.forEach((item, i) => {
  console.log(`${i + 1}. [${item.character}] displayPinyin: "${item.displayPinyin}" | meaning: "${item.meaning}"`);
  console.log(`   Source context: ${item.sourceNote}`);
  console.log('');
});
