const { MANDARIN_BEAN_HSK1, MANDARIN_BEAN_HSK2, MANDARIN_BEAN_HSK3 } = require('./diff_hsk_sources');
const fs = require('fs');
const path = require('path');

const hsk1 = JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/hsk1.json')));
const hsk2 = JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/hsk2.json')));
const hsk3 = JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/hsk3.json')));

const map = new Map();
[...hsk1, ...hsk2, ...hsk3].forEach(e => map.set(e.character, e));

const candidateRows = [
  ...MANDARIN_BEAN_HSK1.map(i => ({...i, lvl: 'HSK1'})),
  ...MANDARIN_BEAN_HSK2.map(i => ({...i, lvl: 'HSK2'})),
  ...MANDARIN_BEAN_HSK3.map(i => ({...i, lvl: 'HSK3'}))
];

const reportB = [];

candidateRows.forEach(item => {
  // Skip 得 (HSK2 #30) as explicitly instructed
  if (item.lvl === 'HSK2' && item.no === 30) return;

  const cleanChar = item.char.replace(/（[^）]+）|\([^\)]+\)/g, '').trim();
  const existing = map.get(cleanChar) || map.get(item.char);

  if (!existing) return;

  const mbPinyinClean = item.pinyin.replace(/\s+/g, '').toLowerCase();
  const existingDisplayPinyin = (existing.displayPinyin || '').replace(/\s+/g, '').toLowerCase();

  if (mbPinyinClean !== existingDisplayPinyin) {
    reportB.push({
      pdfQuote: `${item.lvl} #${item.no}: ${item.char} | Pinyin: "${item.pinyin}" | English: "${item.meaning}"`,
      cleanChar: cleanChar,
      pdfPinyin: item.pinyin,
      pdfMeaning: item.meaning,
      existingDisplayPinyin: existing.displayPinyin,
      existingMeaning: existing.meaning
    });
  }
});

console.log('=== VERIFIED REPORT B (PINYIN DISCREPANCIES) ===');
console.log(`Total Verified Discrepancies: ${reportB.length}\n`);

reportB.forEach((row, idx) => {
  console.log(`${idx + 1}. PDF CITE: ${row.pdfQuote}`);
  console.log(`   Existing displayPinyin: "${row.existingDisplayPinyin}" | Existing Meaning: "${row.existingMeaning}"`);
  console.log('');
});
