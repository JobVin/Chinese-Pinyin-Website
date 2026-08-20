/**
 * Build Script: Old HSK 2.0 Datasets (Levels 1, 2, 3)
 *
 * Dataset Source: https://github.com/drkameleon/complete-hsk-vocabulary (MIT Licensed)
 * Selected Split: Old HSK 2.0 (exclusive, non-cumulative)
 *
 * This script fetches vocabulary for Old HSK 2.0 levels 1, 2, and 3,
 * deduplicates entries by character within each level and across all three files,
 * maps them to the project schema, and writes data/hsk1.json, data/hsk2.json, and data/hsk3.json.
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');

// Explicit primary form preferences for polyphones where CC-CEDICT lists an obscure reading/surname as form[0]
const HSK_PRIMARY_FORM_PREFERENCES = {
  '吗': f => f.transcriptions.numeric === 'ma5' || f.transcriptions.pinyin === 'ma',
  '吧': f => f.transcriptions.numeric === 'ba5' || f.transcriptions.pinyin === 'ba',
  '得': f => f.transcriptions.numeric === 'de5' || f.transcriptions.pinyin === 'de',
  '着': f => f.transcriptions.numeric === 'zhe5' || f.transcriptions.pinyin === 'zhe',
  '别': f => f.transcriptions.pinyin === 'bié' || f.transcriptions.numeric === 'bie2',
  '门': f => f.transcriptions.pinyin === 'mén' || f.transcriptions.numeric === 'men2',
  '向': f => f.transcriptions.pinyin === 'xiàng' || f.transcriptions.numeric === 'xiang4',
  '也': f => f.transcriptions.pinyin === 'yě' || f.transcriptions.numeric === 'ye3',
  '号': f => f.transcriptions.pinyin === 'hào' || f.transcriptions.numeric === 'hao4',
  '上': f => f.transcriptions.pinyin === 'shàng' || f.transcriptions.numeric === 'shang4',
  '家': f => f.transcriptions.pinyin === 'jiā' && f.meanings.some(m => m.includes('home'))
};

async function fetchLevelData(level) {
  const url = `https://raw.githubusercontent.com/drkameleon/complete-hsk-vocabulary/main/wordlists/exclusive/old/${level}.json`;
  console.log(`Fetching HSK level ${level} from ${url}...`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch level ${level}: ${response.statusText}`);
  }
  return await response.json();
}

async function buildHskDatasets() {
  console.log('=== BUILDING HSK 1, 2, 3 DATASETS (Old HSK 2.0 Exclusive Split) ===\n');

  const seenCharacters = new Set();
  const spotCheckList = [];
  const datasetSummary = {};

  for (const level of [1, 2, 3]) {
    const rawData = await fetchLevelData(level);
    const finalEntries = [];

    for (const item of rawData) {
      const char = item.simplified;

      // Skip duplicate character across levels or within the same level
      if (seenCharacters.has(char)) {
        console.log(`[HSK ${level}] Skipping duplicate character: "${char}"`);
        continue;
      }
      seenCharacters.add(char);

      const pinyinVariants = new Set();
      let displayPinyin = '';
      const meanings = [];

      if (item.forms && item.forms.length > 0) {
        // Find preferred primary form for polyphones if defined, otherwise use forms[0]
        const prefPredicate = HSK_PRIMARY_FORM_PREFERENCES[char];
        const primaryForm = prefPredicate ? (item.forms.find(prefPredicate) || item.forms[0]) : item.forms[0];

        // Use primary form pinyin for displayPinyin
        displayPinyin = primaryForm.transcriptions && primaryForm.transcriptions.pinyin ? primaryForm.transcriptions.pinyin.toLowerCase() : '';

        // Meaning is sourced ONLY from the preferred primaryForm's own meanings
        if (primaryForm.meanings && Array.isArray(primaryForm.meanings)) {
          meanings.push(...primaryForm.meanings);
        }

        // Collect all form pinyin variants across all polyphone readings
        item.forms.forEach(form => {
          const p = form.transcriptions && form.transcriptions.pinyin ? form.transcriptions.pinyin.toLowerCase() : '';
          const num = form.transcriptions && form.transcriptions.numeric ? form.transcriptions.numeric.toLowerCase() : '';

          if (p) {
            // Tone-marked form (e.g. "ài" or neutral "de")
            pinyinVariants.add(p);
            pinyinVariants.add(p.replace(/\s+/g, ''));
          }

          if (num) {
            // Numeric form (e.g. "ai4" or neutral "de5" -> "de")
            pinyinVariants.add(num);
            pinyinVariants.add(num.replace(/\s+/g, ''));

            // If numeric form has tone 5 (e.g. "de5"), also add untoned "de"
            if (num.includes('5')) {
              const numWithout5 = num.replace(/5/g, '');
              pinyinVariants.add(numWithout5);
              pinyinVariants.add(numWithout5.replace(/\s+/g, ''));
            }
          }
        });

        // Filter out non-standard dialect/onomatopoeic readings (e.g. 'biā' / 'bia' for '吧')
        if (char === '吧') {
          ['biā', 'bia', 'bia1'].forEach(badVariant => pinyinVariants.delete(badVariant));
        }
      }

      // Deduplicate meanings & combine up to 3 definitions from primaryForm
      const uniqueMeanings = Array.from(new Set(meanings))
        .map(m => m.trim())
        .filter(Boolean)
        .slice(0, 3)
        .join(' / ');

      const entry = {
        character: char,
        pinyin: Array.from(pinyinVariants).filter(Boolean),
        displayPinyin: displayPinyin,
        meaning: uniqueMeanings
      };

      finalEntries.push(entry);

      // Check if entry has multi-word or apostrophe for spot-checking
      const hasSpaceOrApostrophe = entry.pinyin.some(pv => pv.includes(' ') || pv.includes("'"));
      if (hasSpaceOrApostrophe || char.length > 1) {
        spotCheckList.push({
          level: `hsk${level}`,
          character: char,
          displayPinyin: displayPinyin,
          pinyinVariants: entry.pinyin
        });
      }
    }

    const outputFile = path.join(DATA_DIR, `hsk${level}.json`);
    fs.writeFileSync(outputFile, JSON.stringify(finalEntries, null, 2), 'utf8');
    console.log(`Saved ${finalEntries.length} entries to data/hsk${level}.json`);

    datasetSummary[`hsk${level}`] = {
      count: finalEntries.length,
      levelsCount: Math.ceil(finalEntries.length / 15)
    };
  }

  console.log('\n=== DATASET SUMMARY ===');
  console.table(datasetSummary);

  return datasetSummary;
}

if (require.main === module) {
  buildHskDatasets().catch(err => {
    console.error('Build failed:', err);
    process.exit(1);
  });
}

module.exports = { buildHskDatasets };
