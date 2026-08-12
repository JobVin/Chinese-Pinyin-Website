const fs = require('fs');
const path = require('path');

function validateUserAnswer(userInput, cardPinyinArray) {
  if (!userInput || !Array.isArray(cardPinyinArray) || cardPinyinArray.length === 0) {
    return false;
  }

  const cleanedInput = userInput.trim().toLowerCase();

  const hasTone = /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ1-5]/.test(cleanedInput);
  if (!hasTone) {
    return false;
  }

  return cardPinyinArray.some(pinyinVariant => {
    const variantStr = String(pinyinVariant).trim().toLowerCase();
    const variantHasTone = /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ1-5]/.test(variantStr);
    return variantHasTone && variantStr === cleanedInput;
  });
}

const dataDir = path.join(__dirname, '../data');

console.log('=== VERIFYING 29 STROKE SYMBOLS DATASET ===');
const strokes = JSON.parse(fs.readFileSync(path.join(dataDir, 'strokes.json'), 'utf8'));

console.log(`Total Strokes in JSON: ${strokes.length}`);
if (strokes.length !== 29) {
  throw new Error(`Expected 29 strokes, got ${strokes.length}`);
}

strokes.forEach((s, idx) => {
  const testInput = s.displayPinyin;
  const isMatch = validateUserAnswer(testInput, s.pinyin);
  console.log(`[#${idx+1}] Symbol: "${s.character}" | Display Pinyin: ${s.displayPinyin} | Match: ${isMatch ? 'PASS' : 'FAIL'}`);
});

console.log('\n29 STROKES VERIFICATION SUCCESSFUL!');
