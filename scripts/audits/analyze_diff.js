const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('====================================================');
console.log('INVESTIGATION REPORT & RECONCILIATION SCRIPT');
console.log('====================================================\n');

// --- 1. INVESTIGATE QUESTION 3: ARITHMETIC & CHARACTER DIFF FOR HSK3 ---
console.log('--- 1. HSK 3 ARITHMETIC & EXACT CHARACTER DIFF ---');
const hsk3Head = JSON.parse(execSync('git show HEAD:data/hsk3.json', { encoding: 'utf8' }));
const hsk3Current = JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/hsk3.json'), 'utf8'));
const headHsk3 = JSON.parse(execSync('git show HEAD:data/hsk3.json', { encoding: 'utf8' }));

const hsk3CurrentMap = new Map(hsk3Current.map(i => [i.character, i]));
const headHsk3Map = new Map(headHsk3.map(i => [i.character, i]));

console.log('=== ANALYZING HSK3 MODIFICATIONS & REMOVALS ===\n');

const removedFromHsk3 = [];
const modifiedInHsk3 = [];

headHsk3.forEach(item => {
  const char = item.character;
  if (!hsk3CurrentMap.has(char)) {
    removedFromHsk3.push(item);
  } else {
    const currentItem = hsk3CurrentMap.get(char);
    if (JSON.stringify(currentItem) !== JSON.stringify(item)) {
      modifiedInHsk3.push({ before: item, after: currentItem });
    }
  }
});

console.log(`Removed from HSK3 (${removedFromHsk3.length} items):`);
removedFromHsk3.forEach(i => console.log(`  - [${i.character}] ${i.displayPinyin} (${i.meaning})`));

console.log(`\nModified in HSK3 (${modifiedInHsk3.length} items):`);
modifiedInHsk3.forEach(m => {
  console.log(`  - [${m.before.character}]:`);
  console.log(`      BEFORE: pinyin=[${m.before.pinyin.join(', ')}], displayPinyin="${m.before.displayPinyin}", meaning="${m.before.meaning}"`);
  console.log(`      AFTER:  pinyin=[${m.after.pinyin.join(', ')}], displayPinyin="${m.after.displayPinyin}", meaning="${m.after.meaning}"`);
});

// Check where removed HSK3 items went
const hsk1Current = JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/hsk1.json'), 'utf8'));
const hsk2Current = JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/hsk2.json'), 'utf8'));

const guo1 = hsk1Current.filter(e => e.character.includes('过'));
const guo2 = hsk2Current.filter(e => e.character.includes('过'));
const guo3 = hsk3Current.filter(e => e.character.includes('过'));

console.log('HSK 1 "过" entries:', guo1);
console.log('HSK 2 "过" entries:', guo2);
console.log('HSK 3 "过" entries:', guo3);
console.log('');

// --- 3. INVESTIGATE QUESTION 4: STATUS OF "对" IN HSK2 ---
console.log('--- 3. STATUS OF "对" IN HSK 1, 2, 3 ---');
const dui1 = hsk1Current.filter(e => e.character.includes('对'));
const dui2 = hsk2Current.filter(e => e.character.includes('对'));
const dui3 = hsk3Current.filter(e => e.character.includes('对'));

console.log('HSK 1 "对" entries:', dui1);
console.log('HSK 2 "对" entries:', dui2);
console.log('HSK 3 "对" entries:', dui3);
console.log('');

// --- 4. INVESTIGATE QUESTION 1: REPORT B LOGIC & MISSING ITEMS ---
console.log('--- 4. REPORT B COMPARISON LOGIC ANALYSIS ---');
const { MANDARIN_BEAN_HSK1, MANDARIN_BEAN_HSK2, MANDARIN_BEAN_HSK3 } = require('./diff_hsk_sources');

const allHeadEntries = [
  ...JSON.parse(execSync('git show HEAD:data/hsk1.json', { encoding: 'utf8' })),
  ...JSON.parse(execSync('git show HEAD:data/hsk2.json', { encoding: 'utf8' })),
  ...JSON.parse(execSync('git show HEAD:data/hsk3.json', { encoding: 'utf8' }))
];

const headMap = new Map();
allHeadEntries.forEach(e => headMap.set(e.character, e));

const checkChars = ['累', '便宜', '啊', '差', '更', '看', '听', '读', '还', '鸟', '得'];
checkChars.forEach(char => {
  const headEntry = headMap.get(char);
  console.log(`Character "${char}":`);
  if (headEntry) {
    console.log(`   HEAD displayPinyin: "${headEntry.displayPinyin}", pinyin: [${headEntry.pinyin.join(', ')}], meaning: "${headEntry.meaning}"`);
  } else {
    console.log('   HEAD entry not found!');
  }
});
