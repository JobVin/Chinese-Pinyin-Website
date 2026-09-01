const fs = require('fs');

const appContent = fs.readFileSync('./app.js', 'utf8');

// Extract functions
const fnConvert = /function convertPinyinNumberToTone\(text\) \{[\s\S]*?\n  \}/.exec(appContent)[0];
const fnNorm = /function normalizePinyinToken\(str\) \{[\s\S]*?\n  \}/.exec(appContent)[0];
const fnVal = /function validateUserAnswer\(userInput, cardPinyinArray\) \{[\s\S]*?\n  \}/.exec(appContent)[0];

const fn = new Function(`${fnConvert}\n${fnNorm}\n${fnVal}\nreturn { convertPinyinNumberToTone, normalizePinyinToken, validateUserAnswer };`);
const { convertPinyinNumberToTone, normalizePinyinToken, validateUserAnswer } = fn();

const testCases = [
  // Live conversions
  { input: 'ni3hao3', pinyin: ['nǐhǎo'], expected: true },
  { input: 'ni3 hao3', pinyin: ['nǐhǎo', 'nǐ hǎo'], expected: true },
  { input: 'lv4', pinyin: ['lǜ'], expected: true },
  { input: 'lu:4', pinyin: ['lǜ'], expected: true },
  { input: 'nv3', pinyin: ['nǚ'], expected: true },
  { input: 'er2', pinyin: ['ér'], expected: true },
  { input: 'de5', pinyin: ['de'], expected: true },
  { input: 'ma0', pinyin: ['ma'], expected: true },
  { input: 'heng2', pinyin: ['héng'], expected: true },
  { input: 'shu4', pinyin: ['shù'], expected: true },
  { input: 'xue2xiao4', pinyin: ['xuéxiào'], expected: true },
  // Direct tone mark inputs
  { input: 'nǐhǎo', pinyin: ['nǐhǎo'], expected: true },
  { input: 'lǜ', pinyin: ['lǜ'], expected: true },
  { input: 'héng', pinyin: ['héng'], expected: true },
  { input: 'de', pinyin: ['de'], expected: true },
  // Incorrect / wrong tones
  { input: 'ni2hao3', pinyin: ['nǐhǎo'], expected: false },
  { input: 'nihao', pinyin: ['nǐhǎo'], expected: false }
];

let failed = 0;
for (const tc of testCases) {
  const converted = convertPinyinNumberToTone(tc.input);
  const res = validateUserAnswer(tc.input, tc.pinyin);
  if (res !== tc.expected) {
    console.error('FAILED:', tc, 'converted:', converted, 'got:', res);
    failed++;
  } else {
    console.log('PASSED:', tc.input, '=>', converted, 'matches', tc.pinyin, '->', res);
  }
}

if (failed === 0) {
  console.log('\nALL 17 TEST CASES PASSED SUCCESSFULLY!');
} else {
  process.exit(1);
}
