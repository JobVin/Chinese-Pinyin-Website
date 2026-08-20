const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('====================================================');
console.log('INVESTIGATION REPORT & RECONCILIATION SCRIPT');
console.log('====================================================\n');

// --- 1. INVESTIGATE QUESTION 3: ARITHMETIC & CHARACTER DIFF FOR HSK3 ---
console.log('--- 1. HSK 3 ARITHMETIC & EXACT CHARACTER DIFF ---');
const hsk3Head = JSON.parse(execSync('git show HEAD:data/hsk3.json', { encoding: 'utf8' }));
const hsk3Current = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/hsk3.json'), 'utf8'));

const head3Chars = hsk3Head.map(e => e.character);
const current3Chars = hsk3Current.map(e => e.character);

const head3Set = new Set(head3Chars);
const current3Set = new Set(current3Chars);

const added3 = current3Chars.filter(c => !head3Set.has(c));
const removed3 = head3Chars.filter(c => !current3Set.has(c));

console.log(`Original HEAD count: ${hsk3Head.length}`);
console.log(`Current count:       ${hsk3Current.length}`);
console.log(`Net Added:           ${hsk3Current.length - hsk3Head.length}`);
console.log(`Characters Added (${added3.length}):`, added3);
console.log(`Characters Removed (${removed3.length}):`, removed3);
console.log('');

// --- 2. INVESTIGATE QUESTION 2: STATUS OF "过" IN HSK2 VS HSK3 ---
console.log('--- 2. STATUS OF "过" IN HSK 1, 2, 3 ---');
const hsk1Current = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/hsk1.json'), 'utf8'));
const hsk2Current = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/hsk2.json'), 'utf8'));

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
