const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../../data');
const hsk1Path = path.join(dataDir, 'hsk1.json');
const hsk2Path = path.join(dataDir, 'hsk2.json');
const hsk3Path = path.join(dataDir, 'hsk3.json');
const categoriesPath = path.join(dataDir, 'hsk1-categories.json');

let hsk1 = JSON.parse(fs.readFileSync(hsk1Path, 'utf8'));
let hsk2 = JSON.parse(fs.readFileSync(hsk2Path, 'utf8'));
let hsk3 = JSON.parse(fs.readFileSync(hsk3Path, 'utf8'));
let categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));

console.log('=== RECONCILING HSK2 11 ITEMS ===\n');

// 1. Move 号 to hsk1.json & add to Noun category
const haoIdx = hsk2.findIndex(e => e.character === '号');
if (haoIdx !== -1) {
  const [haoItem] = hsk2.splice(haoIdx, 1);
  if (!hsk1.some(e => e.character === '号')) {
    hsk1.push(haoItem);
    console.log('[MOVED] "号" from hsk2.json to hsk1.json');
  }
}
if (!categories['Noun'].includes('号')) {
  categories['Noun'].push('号');
  console.log('[UPDATED] Added "号" to Noun category in hsk1-categories.json');
}

// 2. Move 9 items from hsk2.json to hsk3.json (船, 公斤, 欢迎, 回答, 为, 向, 元, 张, 自行车)
const hsk3Moves = ['船', '公斤', '欢迎', '回答', '为', '向', '元', '张', '自行车'];
hsk3Moves.forEach(char => {
  const idx = hsk2.findIndex(e => e.character === char);
  if (idx !== -1) {
    const [item] = hsk2.splice(idx, 1);
    if (!hsk3.some(e => e.character === char)) {
      hsk3.push(item);
      console.log(`[MOVED] "${char}" from hsk2.json to hsk3.json`);
    }
  }
});

// 3. Delete fragment 踢 from hsk2.json (confirming 踢足球 is present)
const tiZuqiu = hsk2.find(e => e.character === '踢足球');
if (tiZuqiu) {
  console.log('[CONFIRMED] "踢足球" is intact in hsk2.json:', tiZuqiu.displayPinyin);
}
const tiIdx = hsk2.findIndex(e => e.character === '踢');
if (tiIdx !== -1) {
  hsk2.splice(tiIdx, 1);
  console.log('[DELETED] Standalone verb fragment "踢" from hsk2.json');
}

// 4. Delete grammar debris 但是 from hsk2.json
const danshiIdx = hsk2.findIndex(e => e.character === '但是');
if (danshiIdx !== -1) {
  hsk2.splice(danshiIdx, 1);
  console.log('[DELETED] Grammar pattern debris "但是" from hsk2.json');
}

fs.writeFileSync(hsk1Path, JSON.stringify(hsk1, null, 2), 'utf8');
fs.writeFileSync(hsk2Path, JSON.stringify(hsk2, null, 2), 'utf8');
fs.writeFileSync(hsk3Path, JSON.stringify(hsk3, null, 2), 'utf8');
fs.writeFileSync(categoriesPath, JSON.stringify(categories, null, 2), 'utf8');

console.log(`\nFinal hsk1.json count: ${hsk1.length}`);
console.log(`Final hsk2.json count: ${hsk2.length}`);
console.log(`Final hsk3.json count: ${hsk3.length}`);
