const fs = require('fs');
const path = require('path');
const {
  STAGE_CHUNK_SIZE,
  MIN_FINAL_STAGE_CHUNK_SIZE,
  getDatasetStagesFromData
} = require('../app.js');

console.log('=== VERIFYING DATASET STAGE CHUNKING & MERGING LOGIC ===\n');

// 1. Verify named constants
if (STAGE_CHUNK_SIZE !== 15) {
  throw new Error(`Expected STAGE_CHUNK_SIZE === 15, got ${STAGE_CHUNK_SIZE}`);
}
if (MIN_FINAL_STAGE_CHUNK_SIZE !== 5) {
  throw new Error(`Expected MIN_FINAL_STAGE_CHUNK_SIZE === 5, got ${MIN_FINAL_STAGE_CHUNK_SIZE}`);
}
console.log(`[PASS] Constants verified: STAGE_CHUNK_SIZE = ${STAGE_CHUNK_SIZE}, MIN_FINAL_STAGE_CHUNK_SIZE = ${MIN_FINAL_STAGE_CHUNK_SIZE}`);

// 2. Load datasets
const hsk1 = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/hsk1.json'), 'utf8'));
const hsk2 = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/hsk2.json'), 'utf8'));
const hsk3 = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/hsk3.json'), 'utf8'));

// 3. Test HSK 1 (151 words)
const hsk1Stages = getDatasetStagesFromData(hsk1, 'hsk1');
const hsk1NumberedLevels = hsk1Stages.filter(s => s.id !== 'all');
console.log(`HSK 1: total items = ${hsk1.length}, numbered levels = ${hsk1NumberedLevels.length}`);

if (hsk1NumberedLevels.length !== 10) {
  throw new Error(`Expected HSK 1 to produce 10 levels, got ${hsk1NumberedLevels.length}`);
}
const hsk1L10 = hsk1NumberedLevels[9];
if (hsk1L10.title !== 'Level 10') {
  throw new Error(`Expected 10th level title "Level 10", got "${hsk1L10.title}"`);
}
if (hsk1L10.data.length !== 16) {
  throw new Error(`Expected Level 10 to have 16 words, got ${hsk1L10.data.length}`);
}
if (hsk1L10.subTitle !== 'Words 136 – 151 (16 words)') {
  throw new Error(`Expected subTitle "Words 136 – 151 (16 words)", got "${hsk1L10.subTitle}"`);
}
if (hsk1L10.data[0].character !== hsk1[135].character || hsk1L10.data[15].character !== hsk1[150].character) {
  throw new Error('Level 10 data range does not match words 136 to 151');
}
console.log('[PASS] HSK 1 produces 10 levels, with Level 10 covering words 136 to 151 (16 words).');

// 4. Test HSK 2 (144 words)
const hsk2Stages = getDatasetStagesFromData(hsk2, 'hsk2');
const hsk2NumberedLevels = hsk2Stages.filter(s => s.id !== 'all');
console.log(`HSK 2: total items = ${hsk2.length}, numbered levels = ${hsk2NumberedLevels.length}`);

if (hsk2NumberedLevels.length !== 10) {
  throw new Error(`Expected HSK 2 to produce 10 levels, got ${hsk2NumberedLevels.length}`);
}
const hsk2L10 = hsk2NumberedLevels[9];
if (hsk2L10.data.length !== 9) {
  throw new Error(`Expected HSK 2 Level 10 to have 9 words, got ${hsk2L10.data.length}`);
}
if (hsk2L10.subTitle !== 'Words 136 – 144 (9 words)') {
  throw new Error(`Expected subTitle "Words 136 – 144 (9 words)", got "${hsk2L10.subTitle}"`);
}
console.log('[PASS] HSK 2 keeps its 10 levels, with Level 10 covering words 136 to 144 (9 words).');

// 5. Test HSK 3 (330 words)
const hsk3Stages = getDatasetStagesFromData(hsk3, 'hsk3');
const hsk3NumberedLevels = hsk3Stages.filter(s => s.id !== 'all');
console.log(`HSK 3: total items = ${hsk3.length}, numbered levels = ${hsk3NumberedLevels.length}`);

if (hsk3NumberedLevels.length !== 22) {
  throw new Error(`Expected HSK 3 to produce 22 levels, got ${hsk3NumberedLevels.length}`);
}
if (hsk3NumberedLevels.some(lvl => lvl.data.length !== 15)) {
  throw new Error('Expected all 22 HSK 3 levels to have exactly 15 words');
}
console.log('[PASS] HSK 3 is unchanged with 22 levels of 15 words.');

// 6. Test Grammar for 1 word
const singleItemDataset = [{ character: '一', pinyin: 'yī', meaning: 'one' }];
const singleStages = getDatasetStagesFromData(singleItemDataset, 'test');
if (singleStages.length !== 1) {
  throw new Error(`Expected 1 stage for 1 item, got ${singleStages.length}`);
}
if (singleStages[0].subTitle !== 'Words 1 – 1 (1 word)') {
  throw new Error(`Expected "Words 1 – 1 (1 word)", got "${singleStages[0].subTitle}"`);
}
if (singleStages[0].subTitle.includes('1 words')) {
  throw new Error('Stage label grammar error: contains "1 words" instead of "1 word"!');
}
console.log('[PASS] Singular grammar verified: 1-word stage produces "1 word", not "1 words".');

// 7. Edge Cases: 16 words, 19 words, 20 words
const mock16 = Array.from({ length: 16 }, (_, i) => ({ character: `字${i + 1}` }));
const stages16 = getDatasetStagesFromData(mock16, 'test').filter(s => s.id !== 'all');
if (stages16.length !== 1 || stages16[0].data.length !== 16 || stages16[0].subTitle !== 'Words 1 – 16 (16 words)') {
  throw new Error('16 words should merge remainder (1 < 5) into Level 1 (16 words)');
}
console.log('[PASS] 16 words dataset correctly merged into 1 level of 16 words.');

const mock19 = Array.from({ length: 19 }, (_, i) => ({ character: `字${i + 1}` }));
const stages19 = getDatasetStagesFromData(mock19, 'test').filter(s => s.id !== 'all');
if (stages19.length !== 1 || stages19[0].data.length !== 19 || stages19[0].subTitle !== 'Words 1 – 19 (19 words)') {
  throw new Error('19 words should merge remainder (4 < 5) into Level 1 (19 words)');
}
console.log('[PASS] 19 words dataset correctly merged into 1 level of 19 words.');

const mock20 = Array.from({ length: 20 }, (_, i) => ({ character: `字${i + 1}` }));
const stages20 = getDatasetStagesFromData(mock20, 'test').filter(s => s.id !== 'all');
if (stages20.length !== 2 || stages20[0].data.length !== 15 || stages20[1].data.length !== 5) {
  throw new Error('20 words should keep 2 levels (15 and 5)');
}
console.log('[PASS] 20 words dataset correctly produces 2 levels (15 words and 5 words).');

console.log('\n======================================================');
console.log('ALL STAGE CHUNKING & MERGING TESTS PASSED!');
console.log('======================================================\n');
