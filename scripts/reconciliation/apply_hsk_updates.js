/**
 * Script: apply_hsk_updates.js
 * Applies Report A (missing entries), Report B (re-verified polyphone fixes),
 * and 地 (HSK3 #46) definition to data/hsk1.json, data/hsk2.json, data/hsk3.json.
 */

const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../../data');

// Helper to convert tone-marked pinyin into pinyin array [toned, plain, numeric]
function buildPinyinArray(tonedPinyin) {
  const variants = new Set();
  const toned = tonedPinyin.trim().toLowerCase();
  variants.add(toned);
  variants.add(toned.replace(/\s+/g, ''));

  // Plain (strip diacritics)
  const plain = toned.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ü/g, 'u').replace(/v/g, 'u');
  variants.add(plain);
  variants.add(plain.replace(/\s+/g, ''));

  // Simple diacritic to numeric converter for single/multi word
  const toneMap = {
    'ā': ['a', '1'], 'á': ['a', '2'], 'ǎ': ['a', '3'], 'à': ['a', '4'],
    'ē': ['e', '1'], 'é': ['e', '2'], 'ě': ['e', '3'], 'è': ['e', '4'],
    'ī': ['i', '1'], 'í': ['i', '2'], 'ǐ': ['i', '3'], 'ì': ['i', '4'],
    'ō': ['o', '1'], 'ó': ['o', '2'], 'ǒ': ['o', '3'], 'ò': ['o', '4'],
    'ū': ['u', '1'], 'ú': ['u', '2'], 'ǔ': ['u', '3'], 'ù': ['u', '4'],
    'ǖ': ['v', '1'], 'ǘ': ['v', '2'], 'ǚ': ['v', '3'], 'ǜ': ['v', '4']
  };

  const syllables = toned.split(/\s+/);
  const numSyllables = syllables.map(s => {
    let toneNum = '';
    let cleanS = s.normalize('NFD').replace(/[\u0300-\u036f]/g, (match) => {
      return '';
    }).replace(/ü/g, 'u').replace(/v/g, 'u');

    for (let char of s) {
      if (toneMap[char]) {
        toneNum = toneMap[char][1];
        break;
      }
    }
    return toneNum ? `${cleanS}${toneNum}` : cleanS;
  });

  const numericStr = numSyllables.join(' ');
  variants.add(numericStr);
  variants.add(numericStr.replace(/\s+/g, ''));

  return Array.from(variants);
}

// 1. Missing Entries (Report A)
const MISSING_HSK1 = [
  { character: "哪儿", pinyinStr: "nǎr", meaning: "where / wherever" },
  { character: "一点儿", pinyinStr: "yīdiǎnr", meaning: "a little bit / a bit" },
  { character: "饭店", pinyinStr: "fàndiàn", meaning: "restaurant / hotel" },
  { character: "说", pinyinStr: "shuō", meaning: "to speak / to say / to talk" }
];

const MISSING_HSK2 = [
  { character: "往", pinyinStr: "wǎng", meaning: "towards / to / in the direction of" },
  { character: "过", pinyinStr: "guò", meaning: "aspect particle (indicating past experience)" },
  { character: "一下", pinyinStr: "yīxià", meaning: "in a short while / a bit / once" },
  { character: "等", pinyinStr: "děng", meaning: "to wait / to wait for" },
  { character: "踢足球", pinyinStr: "tīzúqiú", meaning: "to play football / soccer" },
  { character: "对", pinyinStr: "duì", meaning: "towards / for / facing" } // Note: "对" (right/correct) already exists
];

const MISSING_HSK3 = [
  { character: "笔记本", pinyinStr: "bǐjìběn", meaning: "notebook / laptop" },
  { character: "词典", pinyinStr: "cídiǎn", meaning: "dictionary" },
  { character: "电子邮件", pinyinStr: "diànzǐyóujiàn", meaning: "email / electronic mail" },
  { character: "发", pinyinStr: "fā", meaning: "to send out / to issue / to dispatch" },
  { character: "感兴趣", pinyinStr: "gǎnxìngqù", meaning: "to be interested in" },
  { character: "个子", pinyinStr: "gèzi", meaning: "height / stature / build" },
  { character: "刮风", pinyinStr: "guāfēng", meaning: "to blow (of wind) / windy" },
  { character: "过 (verb)", pinyinStr: "guò", meaning: "to pass / to cross / to spend time" },
  { character: "后来", pinyinStr: "hòulái", meaning: "afterwards / later" },
  { character: "黄河", pinyinStr: "huánghé", meaning: "Yellow River" },
  { character: "聊天", pinyinStr: "liáotiān", meaning: "to chat / to gossip" },
  { character: "留学", pinyinStr: "liúxué", meaning: "to study abroad" },
  { character: "皮鞋", pinyinStr: "píxié", meaning: "leather shoes" },
  { character: "瓶子", pinyinStr: "píngzi", meaning: "bottle / vase" },
  { character: "起来", pinyinStr: "qǐlái", meaning: "to stand up / to get up" },
  { character: "起飞", pinyinStr: "qǐfēi", meaning: "to take off (airplane)" },
  { character: "请假", pinyinStr: "qǐngjià", meaning: "to ask for leave" },
  { character: "试", pinyinStr: "shì", meaning: "to try / to test" },
  { character: "刷牙", pinyinStr: "shuāyá", meaning: "to brush one's teeth" },
  { character: "信用卡", pinyinStr: "xìnyòngkǎ", meaning: "credit card" },
  { character: "饮料", pinyinStr: "yǐnliào", meaning: "drink / beverage" },
  { character: "中文", pinyinStr: "zhōngwén", meaning: "Chinese language" },
  { character: "嘴", pinyinStr: "zuǐ", meaning: "mouth / beak" },
  { character: "最后", pinyinStr: "zuìhòu", meaning: "final / last / finally" }
];

// 2. Report B Polyphone Fixes (Primary HSK readings to prioritize)
const POLYPHONE_FIXES = {
  "看": { displayPinyin: "kàn", meaning: "to see / to look at / to read / to watch" },
  "听": { displayPinyin: "tīng", meaning: "to listen / to hear / to obey" },
  "读": { displayPinyin: "dú", meaning: "to read / to study / to attend school" },
  "还": { displayPinyin: "hái", meaning: "still / still in progress / also / in addition" },
  "累": { displayPinyin: "lèi", meaning: "tired / weary / to tire out" },
  "便宜": { displayPinyin: "piányi", meaning: "cheap / inexpensive" },
  "差": { displayPinyin: "chà", meaning: "differ from / short of / lacking / poor" },
  "教": { displayPinyin: "jiāo", meaning: "to teach / to instruct" },
  "角": { displayPinyin: "jiǎo", meaning: "horn / corner / unit of money (0.1 yuan)" },
  "鸟": { displayPinyin: "niǎo", meaning: "bird" },
  "胖": { displayPinyin: "pàng", meaning: "fat / plump" },
  "骑": { displayPinyin: "qí", meaning: "to ride (horse, bicycle, etc.)" },
  "万": { displayPinyin: "wàn", meaning: "ten thousand / 10000" },
  "为": { displayPinyin: "wèi", meaning: "for / because of / to serve" },
  "长": { displayPinyin: "zhǎng", meaning: "to grow / to develop / chief / head" },
  "只": { displayPinyin: "zhī", meaning: "classifier for birds, animals, boats, or one of a pair" }
};

function applyUpdates() {
  const hsk1Path = path.join(dataDir, 'hsk1.json');
  const hsk2Path = path.join(dataDir, 'hsk2.json');
  const hsk3Path = path.join(dataDir, 'hsk3.json');

  let hsk1 = JSON.parse(fs.readFileSync(hsk1Path, 'utf8'));
  let hsk2 = JSON.parse(fs.readFileSync(hsk2Path, 'utf8'));
  let hsk3 = JSON.parse(fs.readFileSync(hsk3Path, 'utf8'));

  // Apply polyphone fixes across all files
  [hsk1, hsk2, hsk3].forEach(dataset => {
    dataset.forEach(entry => {
      const fix = POLYPHONE_FIXES[entry.character];
      if (fix) {
        entry.displayPinyin = fix.displayPinyin;
        entry.meaning = fix.meaning;

        // Ensure displayPinyin & variants exist in entry.pinyin
        const newVariants = buildPinyinArray(fix.displayPinyin);
        entry.pinyin = Array.from(new Set([...newVariants, ...entry.pinyin]));
      }

      // Explicit fix for 地 in HSK3
      if (entry.character === '地') {
        entry.displayPinyin = 'de';
        entry.meaning = 'structural particle: attached after an adjective/adverb to form an adverbial modifier before a verb (e.g. 慢慢地 slowly)';
        const deVariants = buildPinyinArray('de');
        entry.pinyin = Array.from(new Set([...deVariants, ...entry.pinyin]));
      }
    });
  });

  // Add missing entries to HSK 1
  MISSING_HSK1.forEach(item => {
    if (!hsk1.some(e => e.character === item.character)) {
      hsk1.push({
        character: item.character,
        pinyin: buildPinyinArray(item.pinyinStr),
        displayPinyin: item.pinyinStr,
        meaning: item.meaning
      });
    }
  });

  // Add missing entries to HSK 2
  MISSING_HSK2.forEach(item => {
    if (!hsk2.some(e => e.character === item.character)) {
      hsk2.push({
        character: item.character,
        pinyin: buildPinyinArray(item.pinyinStr),
        displayPinyin: item.pinyinStr,
        meaning: item.meaning
      });
    }
  });

  // Add missing entries to HSK 3
  MISSING_HSK3.forEach(item => {
    if (!hsk3.some(e => e.character === item.character)) {
      hsk3.push({
        character: item.character,
        pinyin: buildPinyinArray(item.pinyinStr),
        displayPinyin: item.pinyinStr,
        meaning: item.meaning
      });
    }
  });

  fs.writeFileSync(hsk1Path, JSON.stringify(hsk1, null, 2), 'utf8');
  fs.writeFileSync(hsk2Path, JSON.stringify(hsk2, null, 2), 'utf8');
  fs.writeFileSync(hsk3Path, JSON.stringify(hsk3, null, 2), 'utf8');

  console.log('=== UPDATES APPLIED SUCCESSFULLY ===');
  console.log(`hsk1.json entries count: ${hsk1.length}`);
  console.log(`hsk2.json entries count: ${hsk2.length}`);
  console.log(`hsk3.json entries count: ${hsk3.length}`);
}

if (require.main === module) {
  applyUpdates();
}

module.exports = { applyUpdates };
