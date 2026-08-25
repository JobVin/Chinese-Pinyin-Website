const fs = require('fs');
const path = require('path');

const DATA_FILES = ['hsk1.json', 'hsk2.json', 'hsk3.json', 'radicals.json'];
const DATA_DIR = path.resolve(__dirname, '../../data');
const CDN_BASE_URL = 'https://cdn.jsdelivr.net/npm/hanzi-writer-data@latest';
const CONCURRENCY_LIMIT = 25;

/**
 * Helper to run async mapper functions concurrently with a concurrency limit.
 */
async function mapConcurrent(items, limit, fn) {
  const results = new Array(items.length);
  let index = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const currentIndex = index++;
      results[currentIndex] = await fn(items[currentIndex], currentIndex);
    }
  });
  await Promise.all(workers);
  return results;
}

async function runAudit() {
  console.log('=== HANZI WRITER STROKE DATA COVERAGE AUDIT ===\n');

  const singleCharMap = new Map();

  for (const filename of DATA_FILES) {
    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) {
      console.error(`Error: File not found - ${filePath}`);
      process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    for (const entry of data) {
      if (!entry.character) continue;

      // Use spread operator [...entry.character] to safely split into Unicode code points without breaking surrogate pairs
      const codePoints = [...entry.character];

      for (const char of codePoints) {
        if (!singleCharMap.has(char)) {
          singleCharMap.set(char, {
            char,
            parentEntries: [],
            hasStrokeData: false
          });
        }

        const record = singleCharMap.get(char);
        const isDuplicate = record.parentEntries.some(
          p => p.file === filename && p.parentWord === entry.character
        );

        if (!isDuplicate) {
          record.parentEntries.push({
            file: filename,
            parentWord: entry.character,
            displayPinyin: entry.displayPinyin || (entry.pinyin ? entry.pinyin.join(', ') : ''),
            meaning: entry.meaning || ''
          });
        }
      }
    }
  }

  const records = Array.from(singleCharMap.values());
  console.log(`Checking CDN stroke data for ${records.length} unique single characters...\n`);

  await mapConcurrent(records, CONCURRENCY_LIMIT, async (record) => {
    const encodedChar = encodeURIComponent(record.char);
    const url = `${CDN_BASE_URL}/${encodedChar}.json`;

    try {
      const response = await fetch(url);
      if (response.status === 200) {
        const json = await response.json();
        if (json && Array.isArray(json.strokes)) {
          record.hasStrokeData = true;
          return;
        }
      }
    } catch (err) {
      // Network error or JSON parse error
    }
    record.hasStrokeData = false;
  });

  const foundList = records.filter(r => r.hasStrokeData);
  const missingList = records.filter(r => !r.hasStrokeData);

  console.log('--- SUMMARY ---');
  console.log(`Total unique single characters checked: ${records.length}`);
  console.log(`Count found:                             ${foundList.length}`);
  console.log(`Count missing:                           ${missingList.length}\n`);

  if (missingList.length > 0) {
    console.log('--- MISSING SINGLE CHARACTERS ---');
    missingList.forEach((m, idx) => {
      console.log(`\n${idx + 1}. Missing Character: "${m.char}"`);
      console.log('   Affected Word(s):');
      m.parentEntries.forEach(p => {
        console.log(`   - "${p.parentWord}" [${p.file}] | Pinyin: ${p.displayPinyin} | Meaning: ${p.meaning}`);
      });
    });
  } else {
    console.log('All 100% unique single characters have valid Hanzi Writer stroke data!');
  }
}

runAudit().catch(err => {
  console.error('Audit script failed:', err);
  process.exit(1);
});
