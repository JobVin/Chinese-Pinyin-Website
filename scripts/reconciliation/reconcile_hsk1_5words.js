const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../../data');
const hsk1Path = path.join(dataDir, 'hsk1.json');
const hsk2Path = path.join(dataDir, 'hsk2.json');
const categoriesPath = path.join(dataDir, 'hsk1-categories.json');

let hsk1 = JSON.parse(fs.readFileSync(hsk1Path, 'utf8'));
let hsk2 = JSON.parse(fs.readFileSync(hsk2Path, 'utf8'));
let categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));

console.log('=== RECONCILING 5 WORDS IN HSK1 / HSK2 ===\n');

// 1. Move 火车站, 日, 说话 from hsk1 to hsk2
const moveChars = ['火车站', '日', '说话'];
moveChars.forEach(char => {
  const itemIndex = hsk1.findIndex(e => e.character === char);
  if (itemIndex !== -1) {
    const [item] = hsk1.splice(itemIndex, 1);
    if (!hsk2.some(e => e.character === char)) {
      hsk2.push(item);
      console.log(`[MOVED] "${char}" from hsk1.json to hsk2.json`);
    }
  }
});

// 2. Remove 饭馆 from hsk1.json (redundant entry, 饭店 is canonical HSK1 #46)
const fanguanIndex = hsk1.findIndex(e => e.character === '饭馆');
if (fanguanIndex !== -1) {
  hsk1.splice(fanguanIndex, 1);
  console.log('[REMOVED] "饭馆" from hsk1.json (redundant entry; "饭店" is canonical HSK1 #46)');
}

// 3. Add 零 to "Numeral" category in hsk1-categories.json if not present
if (!categories['Numeral'].includes('零')) {
  categories['Numeral'].push('零');
  console.log('[UPDATED] Added "零" to Numeral category in hsk1-categories.json');
}

fs.writeFileSync(hsk1Path, JSON.stringify(hsk1, null, 2), 'utf8');
fs.writeFileSync(hsk2Path, JSON.stringify(hsk2, null, 2), 'utf8');
fs.writeFileSync(categoriesPath, JSON.stringify(categories, null, 2), 'utf8');

console.log(`\nUpdated hsk1.json count: ${hsk1.length}`);
console.log(`Updated hsk2.json count: ${hsk2.length}`);

// Audit hsk1 against categories
const catChars = new Set();
Object.values(categories).forEach(list => list.forEach(c => catChars.add(c)));
const hsk1Chars = hsk1.map(e => e.character);
const uncategorizedInHsk1 = hsk1Chars.filter(c => !catChars.has(c));

console.log(`\nUncategorized HSK1 words remaining: ${uncategorizedInHsk1.length}`, uncategorizedInHsk1);
