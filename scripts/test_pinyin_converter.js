const fs = require('fs');

const appContent = fs.readFileSync('./app.js', 'utf8');

// Extract functions
const fnConvert = /function convertPinyinNumberToTone\(text\) \{[\s\S]*?\n  \}/.exec(appContent)[0];
const fnNorm = /function normalizePinyinToken\(str\) \{[\s\S]*?\n  \}/.exec(appContent)[0];
const fnVal = /function validateUserAnswer\(userInput, cardPinyinArray\) \{[\s\S]*?\n  \}/.exec(appContent)[0];
const fnSplit = /function splitChunkIntoPrefixAndSyllable\(chunk\) \{[\s\S]*?\n  \}/.exec(appContent)[0];
const fnApply = /function applyToneToSyllable\(rawSyllable, toneNum\) \{[\s\S]*?\n  \}/.exec(appContent)[0];
const fnStrip = /function stripDiacritics\(str\) \{[\s\S]*?\n  \}/.exec(appContent)[0];
const fnGetActive = /function getActiveSyllableInfo\(fullText, cursorPosition\) \{[\s\S]*?\n  \}/.exec(appContent)[0];

const fn = new Function(`
  const toneCharToPlain = {
    'ā': 'a', 'á': 'a', 'ǎ': 'a', 'à': 'a',
    'ō': 'o', 'ó': 'o', 'ē': 'e', 'é': 'e',
    'ī': 'i', 'í': 'i', 'ǐ': 'i', 'ì': 'i',
    'ū': 'u', 'ú': 'u', 'ǔ': 'u', 'ù': 'u',
    'ǖ': 'ü', 'ǘ': 'ü', 'ǚ': 'ü', 'ǜ': 'ü',
    'Ā': 'A', 'Á': 'A', 'Ǎ': 'A', 'À': 'A',
    'Ō': 'O', 'Ó': 'O', 'Ǒ': 'O', 'Ò': 'O',
    'Ē': 'E', 'É': 'E', 'Ě': 'E', 'È': 'E',
    'Ī': 'I', 'Í': 'I', 'Ǐ': 'I', 'Ì': 'I',
    'Ū': 'U', 'Ú': 'U', 'Ǔ': 'U', 'Ù': 'U',
    'Ǖ': 'Ü', 'Ǘ': 'Ü', 'Ǚ': 'Ü', 'Ǜ': 'Ü'
  };
  const pinyinToneMap = {
    'a': ['ā', 'á', 'ǎ', 'à', 'a'],
    'o': ['ō', 'ó', 'ǒ', 'ò', 'o'],
    'e': ['ē', 'é', 'ě', 'è', 'e'],
    'i': ['ī', 'í', 'ǐ', 'ì', 'i'],
    'u': ['ū', 'ú', 'ǔ', 'ù', 'u'],
    'ü': ['ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü'],
    'v': ['ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü'],
    'A': ['Ā', 'Á', 'Ǎ', 'À', 'A'],
    'O': ['Ō', 'Ó', 'Ǒ', 'Ò', 'O'],
    'E': ['Ē', 'É', 'Ě', 'È', 'E'],
    'I': ['Ī', 'Í', 'Ǐ', 'Ì', 'I'],
    'U': ['Ū', 'Ú', 'Ǔ', 'Ù', 'U'],
    'Ü': ['Ǖ', 'Ǘ', 'Ǚ', 'Ǜ', 'Ü'],
    'V': ['Ǖ', 'Ǘ', 'Ǚ', 'Ǜ', 'Ü']
  };

  ${fnStrip}
  ${fnApply}
  ${fnSplit}
  ${fnConvert}
  ${fnGetActive}
  ${fnNorm}
  ${fnVal}

  return { convertPinyinNumberToTone, getActiveSyllableInfo, normalizePinyinToken, validateUserAnswer };
`);

const { convertPinyinNumberToTone, getActiveSyllableInfo, normalizePinyinToken, validateUserAnswer } = fn();

const testCases = [
  // Live conversions lowercase
  { input: 'ni3hao3', pinyin: ['nǐhǎo'], expected: true },
  { input: 'shi4', pinyin: ['shì'], expected: true },
  // Uppercase initial
  { input: 'Shi4', pinyin: ['shì'], expected: true },
  { input: 'Shu4', pinyin: ['shù'], expected: true },
  { input: 'Zhe2', pinyin: ['zhé'], expected: true },
  { input: 'Chu1', pinyin: ['chū'], expected: true },
  { input: 'Ni3Hao3', pinyin: ['nǐhǎo'], expected: true }
];

for (const tc of testCases) {
  const converted = convertPinyinNumberToTone(tc.input);
  const info = getActiveSyllableInfo(tc.input);
  const res = validateUserAnswer(tc.input, tc.pinyin);
  console.log(`"${tc.input}" => converted: "${converted}", syllable: "${info ? info.syllable : ''}", valid: ${res}`);
  if (res !== tc.expected) {
    console.error('FAIL on', tc);
    process.exit(1);
  }
}

console.log('\nALL CONVERSION AND UPPERCASE TESTS PASSED 100%!');
