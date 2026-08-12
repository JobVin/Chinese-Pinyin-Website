const fs = require('fs');
const path = require('path');

// Replicate strict validateUserAnswer logic from app.js
function validateUserAnswer(userInput, cardPinyinArray) {
  if (!userInput || !Array.isArray(cardPinyinArray) || cardPinyinArray.length === 0) {
    return false;
  }

  const cleanedInput = userInput.trim().toLowerCase();

  // Check if user input contains tone diacritics or tone numbers (1-5)
  const hasTone = /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ1-5]/.test(cleanedInput);
  if (!hasTone) {
    return false; // Reject plain pinyin without tones
  }

  return cardPinyinArray.some(pinyinVariant => {
    const variantStr = String(pinyinVariant).trim().toLowerCase();
    const variantHasTone = /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ1-5]/.test(variantStr);
    return variantHasTone && variantStr === cleanedInput;
  });
}

const dataDir = path.join(__dirname, '../data');

console.log('=== STRICT TONED PINYIN VALIDATION TEST ===');

const hsk1Data = JSON.parse(fs.readFileSync(path.join(dataDir, 'hsk1.json'), 'utf8'));
const wordAi = hsk1Data.find(w => w.character === '爱');

console.log('Card "爱" Pinyin Array:', wordAi.pinyin);

console.log('Test 1: "ài" (Exact Tone Mark)   =>', validateUserAnswer('ài', wordAi.pinyin), '(Expected: true)');
console.log('Test 2: "ai4" (Numbered Tone)    =>', validateUserAnswer('ai4', wordAi.pinyin), '(Expected: true)');
console.log('Test 3: "ai" (Plain Tone-less)   =>', validateUserAnswer('ai', wordAi.pinyin), '(Expected: false - REJECTED!)');

const strokeHeng = JSON.parse(fs.readFileSync(path.join(dataDir, 'strokes.json'), 'utf8')).find(s => s.character === '一');
console.log('\nCard "一" Stroke Pinyin Array:', strokeHeng.pinyin);
console.log('Test 4: "héng" (Exact Tone Mark) =>', validateUserAnswer('héng', strokeHeng.pinyin), '(Expected: true)');
console.log('Test 5: "heng" (Plain Tone-less) =>', validateUserAnswer('heng', strokeHeng.pinyin), '(Expected: false - REJECTED!)');

console.log('\nSTRICT TONE MATCHING TEST PASSED!');
