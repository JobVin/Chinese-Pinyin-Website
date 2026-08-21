const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

['hsk1.json', 'hsk2.json', 'hsk3.json'].forEach(file => {
  const head = JSON.parse(execSync(`git show HEAD:data/${file}`, { encoding: 'utf8' }));
  const curr = JSON.parse(fs.readFileSync(path.join(__dirname, `../../data/${file}`), 'utf8'));

  const headMap = new Map(head.map(e => [e.character, e]));
  const currMap = new Map(curr.map(e => [e.character, e]));

  console.log(`\n========================================`);
  console.log(`=== FULL DIFF REPORT FOR data/${file} ===`);
  console.log(`HEAD count: ${head.length} | Current count: ${curr.length} | Net change: +${curr.length - head.length}`);
  console.log(`========================================\n`);

  const added = [];
  const modified = [];

  curr.forEach(entry => {
    const headEntry = headMap.get(entry.character);
    if (!headEntry) {
      added.push(entry);
    } else {
      const pinyinChanged = headEntry.displayPinyin !== entry.displayPinyin;
      const meaningChanged = headEntry.meaning !== entry.meaning;
      if (pinyinChanged || meaningChanged) {
        modified.push({
          character: entry.character,
          oldDisplayPinyin: headEntry.displayPinyin,
          newDisplayPinyin: entry.displayPinyin,
          oldMeaning: headEntry.meaning,
          newMeaning: entry.meaning
        });
      }
    }
  });

  console.log(`--- ADDED CHARACTERS (${added.length}) ---`);
  added.forEach((e, i) => console.log(`${i+1}. [${e.character}] displayPinyin: "${e.displayPinyin}" | meaning: "${e.meaning}"`));

  console.log(`\n--- MODIFIED CHARACTERS (${modified.length}) ---`);
  modified.forEach((m, i) => {
    console.log(`${i+1}. [${m.character}]`);
    console.log(`   OLD: displayPinyin: "${m.oldDisplayPinyin}" | meaning: "${m.oldMeaning}"`);
    console.log(`   NEW: displayPinyin: "${m.newDisplayPinyin}" | meaning: "${m.newMeaning}"`);
  });
});
