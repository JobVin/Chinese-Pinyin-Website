const fs = require('fs');
const path = require('path');

const hsk3Path = path.join(__dirname, '../data/hsk3.json');
let hsk3 = JSON.parse(fs.readFileSync(hsk3Path, 'utf8'));

// 1. Update 啊 in hsk3.json to match MandarinBean PDF (displayPinyin: "a", meaning: "ah")
hsk3.forEach(entry => {
  if (entry.character === '啊') {
    entry.displayPinyin = 'a';
    entry.meaning = 'ah / interjection of surprise';
    if (!entry.pinyin.includes('a')) {
      entry.pinyin.unshift('a');
    }
  }
});

// 2. Remove "过 (verb)" from hsk3.json
hsk3 = hsk3.filter(entry => entry.character !== '过 (verb)' && entry.character !== '过');

fs.writeFileSync(hsk3Path, JSON.stringify(hsk3, null, 2), 'utf8');

console.log('=== FIXES APPLIED SUCCESSFULLY ===');
console.log(`hsk3.json final count: ${hsk3.length}`);
