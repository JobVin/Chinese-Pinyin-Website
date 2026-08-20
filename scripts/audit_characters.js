const fs = require('fs');
const path = require('path');

const files = ['strokes.json', 'radicals.json', 'hsk1.json', 'hsk2.json', 'hsk3.json'];
const dataDir = path.join(__dirname, '../data');

console.log('=== AUDITING ALL CHARACTER FIELDS ACROSS ALL DATASETS ===\n');

let suspiciousCount = 0;

files.forEach(filename => {
  const filePath = path.join(dataDir, filename);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  data.forEach((entry, idx) => {
    const charStr = entry.character;
    // Check if character contains spaces, ASCII letters, or parentheses
    const isSuspicious = /[\s\(\)（）a-zA-Z]/.test(charStr);
    if (isSuspicious) {
      suspiciousCount++;
      console.log(`[SUSPICIOUS CHARACTER] in ${filename} [#${idx + 1}]: "${charStr}" (displayPinyin: "${entry.displayPinyin}", meaning: "${entry.meaning}")`);
    }
  });
});

if (suspiciousCount === 0) {
  console.log('[PASS] All character fields contain ONLY clean Hanzi / stroke / radical symbols! Zero spaces, parentheses, or English text found.');
} else {
  console.log(`\n[WARNING] Found ${suspiciousCount} suspicious character fields.`);
}
