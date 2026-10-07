// Verifies the HSK word groups used by the Learning Hub and both quizzes:
// every word is in exactly one group, every quiz level is one Learning Hub
// page, page sizes stay reasonable, and card shuffling keeps the same cards.
const fs = require('fs');
const path = require('path');
const { getCategoryStages, splitIntoEvenParts, shuffleCopy, STAGE_CHUNK_SIZE, MIN_FINAL_STAGE_CHUNK_SIZE } = require('../app.js');

const dataDir = path.join(__dirname, '..', 'data');
let failures = 0;
const fail = (msg) => { failures++; console.error('[FAIL] ' + msg); };
const pass = (msg) => console.log('[PASS] ' + msg);
const SMALL_MIN = 3; // smallest allowed quiz level

console.log('\n=== VERIFYING HSK WORD GROUPS & QUIZ LEVELS ===\n');

for (const track of ['hsk1', 'hsk2', 'hsk3']) {
  const data = JSON.parse(fs.readFileSync(path.join(dataDir, `${track}.json`), 'utf8'));
  const cats = JSON.parse(fs.readFileSync(path.join(dataDir, `${track}-categories.json`), 'utf8'));
  const words = data.map(d => d.character);

  // 1. Category file covers every word exactly once
  const counts = new Map();
  Object.values(cats).flat().forEach(w => counts.set(w, (counts.get(w) || 0) + 1));
  const missing = words.filter(w => !counts.has(w));
  const duplicated = [...counts].filter(([, n]) => n > 1).map(([w]) => w);
  const unknown = [...counts.keys()].filter(w => !words.includes(w));
  if (missing.length || duplicated.length || unknown.length) {
    fail(`${track}: missing [${missing}] duplicated [${duplicated}] unknown [${unknown}]`);
  } else {
    pass(`${track}: all ${words.length} words in exactly one of ${Object.keys(cats).length} groups`);
  }

  // 2. Quiz levels (no Full Level) cover every word once, sizes 3 to 19
  const levels = getCategoryStages(data, cats, false);
  const levelWords = levels.flatMap(st => st.data.map(d => d.character));
  const sizes = levels.map(st => st.data.length);
  if (levelWords.length !== words.length || new Set(levelWords).size !== words.length) {
    fail(`${track}: quiz levels do not cover each word exactly once`);
  } else if (Math.min(...sizes) < SMALL_MIN || Math.max(...sizes) > STAGE_CHUNK_SIZE + MIN_FINAL_STAGE_CHUNK_SIZE - 1) {
    fail(`${track}: level sizes out of range (${Math.min(...sizes)} to ${Math.max(...sizes)})`);
  } else {
    pass(`${track}: ${levels.length} quiz levels, ${Math.min(...sizes)} to ${Math.max(...sizes)} words each`);
  }

  // 3. Learning Hub pages are the same levels plus "Full Level" at the end
  const pages = getCategoryStages(data, cats, true);
  const sameOrder = levels.every((st, i) => pages[i].id === st.id && pages[i].data.length === st.data.length);
  if (!sameOrder || pages.length !== levels.length + 1 || pages[pages.length - 1].id !== 'all') {
    fail(`${track}: Learning Hub pages do not match quiz levels`);
  } else {
    pass(`${track}: Learning Hub pages match quiz levels in the same order, plus Full Level`);
  }
}

// 4. Even splitting of large groups
const sizesOf = n => splitIntoEvenParts(Array.from({ length: n }, (_, i) => i)).map(p => p.length).join('+');
const expected = { 15: '15', 17: '17', 20: '10+10', 22: '11+11', 24: '12+12', 31: '16+15' };
for (const [n, want] of Object.entries(expected)) {
  const got = sizesOf(Number(n));
  if (got !== want) fail(`split ${n} words: expected ${want}, got ${got}`);
}
if (!failures) pass('large groups split into even parts (22 -> 11+11, 17 stays 17)');

// 5. Shuffle keeps the same cards and never changes the original order
const original = Array.from({ length: 15 }, (_, i) => ({ character: String(i) }));
const before = original.map(o => o.character).join(',');
let changedOrder = false;
for (let i = 0; i < 20; i++) {
  const shuffled = shuffleCopy(original);
  if (shuffled.length !== original.length || new Set(shuffled).size !== original.length || !shuffled.every(x => original.includes(x))) {
    fail('shuffle changed which cards are in the level');
    break;
  }
  if (shuffled.map(o => o.character).join(',') !== before) changedOrder = true;
}
if (original.map(o => o.character).join(',') !== before) fail('shuffle mutated the original level order');
else if (!changedOrder) fail('shuffle never changed the order in 20 tries');
else pass('shuffle mixes cards within the level without changing the level itself');

if (failures) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log('\n[SUCCESS] Word groups, quiz levels and shuffling verified!\n');
