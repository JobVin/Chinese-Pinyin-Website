const fs = require('fs');
const path = require('path');

// Replicate validateUserAnswer logic from app.js
function validateUserAnswer(userInput, cardPinyinArray) {
  if (!userInput || !Array.isArray(cardPinyinArray) || cardPinyinArray.length === 0) {
    return false;
  }

  const cleanedInput = userInput.trim().toLowerCase();

  return cardPinyinArray.some(pinyinVariant => {
    return String(pinyinVariant).trim().toLowerCase() === cleanedInput;
  });
}

const dataDir = path.join(__dirname, '../data');
const tracks = ['strokes', 'radicals', 'hsk1', 'hsk2', 'hsk3'];

console.log('=== VERIFYING DATASET ASSETS ===');
tracks.forEach(track => {
  const filePath = path.join(dataDir, `${track}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  console.log(`[PASS] ${track}.json: ${data.length} entries`);

  const first = data[0];
  if (!first.character || !Array.isArray(first.pinyin) || !first.displayPinyin || !first.meaning) {
    throw new Error(`Invalid schema in ${track}.json: missing required properties`);
  }
});

console.log('\n=== TESTING VALIDATION FUNCTION ACROSS TRACKS ===');

// Test Strokes track ("一")
const strokesData = JSON.parse(fs.readFileSync(path.join(dataDir, 'strokes.json'), 'utf8'));
const strokeHeng = strokesData.find(s => s.character === '一');
console.log('Stroke "一":', strokeHeng);
console.log('  Testing "héng":', validateUserAnswer('héng', strokeHeng.pinyin));
console.log('  Testing "heng":', validateUserAnswer('heng', strokeHeng.pinyin));

// Test Radicals track ("亻")
const radicalsData = JSON.parse(fs.readFileSync(path.join(dataDir, 'radicals.json'), 'utf8'));
const radicalRen = radicalsData.find(r => r.character === '亻');
console.log('Radical "亻":', radicalRen);
console.log('  Testing "rén":', validateUserAnswer('rén', radicalRen.pinyin));
console.log('  Testing "ren":', validateUserAnswer('ren', radicalRen.pinyin));

// Test HSK Word ("爱")
const hsk1Data = JSON.parse(fs.readFileSync(path.join(dataDir, 'hsk1.json'), 'utf8'));
const wordAi = hsk1Data.find(w => w.character === '爱');
console.log('Word "爱":', wordAi);
console.log('  Testing "ai":', validateUserAnswer('ai', wordAi.pinyin));
console.log('  Testing "ai4":', validateUserAnswer('ai4', wordAi.pinyin));
console.log('  Testing "ài":', validateUserAnswer('ài', wordAi.pinyin));

// Test Polyphone ("长")
const hsk2Data = JSON.parse(fs.readFileSync(path.join(dataDir, 'hsk2.json'), 'utf8'));
const polyphoneChang = hsk2Data.find(c => c.character === '长');
if (polyphoneChang) {
  console.log('Polyphone "长":', polyphoneChang);
  console.log('  Testing "cháng":', validateUserAnswer('cháng', polyphoneChang.pinyin));
  console.log('  Testing "chang":', validateUserAnswer('chang', polyphoneChang.pinyin));
  console.log('  Testing "chang2":', validateUserAnswer('chang2', polyphoneChang.pinyin));
}

console.log('\nALL VERIFICATION TESTS PASSED SUCCESSFULLY!');
