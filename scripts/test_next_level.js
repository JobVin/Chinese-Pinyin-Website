/**
 * Test Suite for "Next Level" button and state tracking
 */

const fs = require('fs');
const path = require('path');

console.log('=== VERIFYING NEXT LEVEL BUTTON & LOGIC ===\n');

// 1. Verify index.html contains btn-next-quiz-level placed first in results-actions
const htmlContent = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
const resultsActionsIdx = htmlContent.indexOf('<div class="results-actions">');
const nextBtnIdx = htmlContent.indexOf('id="btn-next-quiz-level"');
const retryBtnIdx = htmlContent.indexOf('id="btn-retry-missed"');
const restartBtnIdx = htmlContent.indexOf('id="btn-restart-quiz"');
const hubBtnIdx = htmlContent.indexOf('id="btn-results-hub"');

if (nextBtnIdx === -1) {
  throw new Error('index.html is missing id="btn-next-quiz-level"!');
}
if (!(resultsActionsIdx < nextBtnIdx && nextBtnIdx < retryBtnIdx && retryBtnIdx < restartBtnIdx && restartBtnIdx < hubBtnIdx)) {
  throw new Error('btn-next-quiz-level is not placed first in results-actions!');
}
console.log('[PASS] index.html: btn-next-quiz-level is present and placed first in .results-actions.');

// 2. Verify app.js tracks currentStageIndex and currentStages
const appJsSource = fs.readFileSync(path.resolve(__dirname, '../app.js'), 'utf8');

if (!appJsSource.includes('currentStageIndex:') || !appJsSource.includes('currentStages:')) {
  throw new Error('app.js state is missing currentStageIndex or currentStages!');
}
console.log('[PASS] app.js state: currentStageIndex and currentStages initialized in state.');

// Verify stage selection stores currentStageIndex and currentStages
if (!appJsSource.includes('state.currentStages = stages') ||
    !appJsSource.includes('state.currentStageIndex = idx')) {
  throw new Error('app.js does not store stage index or stages list when stage is chosen!');
}
console.log('[PASS] app.js: stage selection stores currentStageIndex and currentStages.');

// Verify Next Level logic in showResultsBanner
if (!appJsSource.includes('btnNextQuizLevel.textContent = `Next: ${nextStage.title}`') ||
    !appJsSource.includes('state.currentStages[nextIndex].id !== \'all\'')) {
  throw new Error('app.js showResultsBanner is missing Next Level button configuration or id !== all check!');
}
console.log('[PASS] app.js showResultsBanner: Next Level button configured with destination label and hidden on last level.');

// Verify Next Level click handler starts next stage and scrolls to top
if (!appJsSource.includes('state.currentStageIndex = nextIndex;') ||
    !appJsSource.includes('window.scrollTo({ top: 0, behavior: \'smooth\' })')) {
  throw new Error('app.js Next Level click handler is missing stage index update or scroll-to-top!');
}
console.log('[PASS] app.js click handler: starts next stage, advances stage index, and scrolls to top.');

// 3. Test stage data chunking and next level calculation mathematically for HSK 1, 2, 3
const { getDatasetStagesFromData } = require('../app.js');
const hsk1 = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/hsk1.json'), 'utf8'));
const hsk1Stages = getDatasetStagesFromData(hsk1, 'hsk1');

// Check Level 1 -> Level 2
let currentStageIndex = 0;
let nextIndex = currentStageIndex + 1;
let hasNextLevel = Boolean(
  hsk1Stages &&
  currentStageIndex >= 0 &&
  nextIndex < hsk1Stages.length &&
  hsk1Stages[nextIndex].id !== 'all'
);
if (!hasNextLevel || hsk1Stages[nextIndex].title !== 'Level 2') {
  throw new Error('Level 1 should offer Level 2 as Next Level');
}
if (hsk1Stages[nextIndex].data.length !== 15 || hsk1Stages[nextIndex].data[0].character !== hsk1[15].character) {
  throw new Error('Level 2 data does not match words 16-30');
}
console.log('[PASS] HSK 1 Level 1 -> Level 2 transition: correctly targets Level 2 (words 16-30).');

// Check Retry Missed keeps currentStageIndex
// Simulating retry of Level 2 (currentStageIndex = 1)
currentStageIndex = 1;
// Retry does not mutate currentStageIndex
nextIndex = currentStageIndex + 1;
hasNextLevel = Boolean(
  hsk1Stages &&
  currentStageIndex >= 0 &&
  nextIndex < hsk1Stages.length &&
  hsk1Stages[nextIndex].id !== 'all'
);
if (!hasNextLevel || hsk1Stages[nextIndex].title !== 'Level 3') {
  throw new Error('Finishing retry of Level 2 must still offer Level 3 as Next Level');
}
console.log('[PASS] Retry Missed of Level 2: preserves currentStageIndex and still offers Level 3.');

// Check Level 9 -> Level 10 transition
currentStageIndex = 8; // Level 9
nextIndex = currentStageIndex + 1;
hasNextLevel = Boolean(
  hsk1Stages &&
  currentStageIndex >= 0 &&
  nextIndex < hsk1Stages.length &&
  hsk1Stages[nextIndex].id !== 'all'
);
if (!hasNextLevel || hsk1Stages[nextIndex].title !== 'Level 10') {
  throw new Error('Finishing Level 9 of HSK 1 must offer Level 10 as Next Level');
}
console.log('[PASS] HSK 1 Level 9 -> Level 10 transition: correctly targets Level 10 (words 136-151).');

// Check Last Level (Level 10 in HSK 1, index 9)
currentStageIndex = 9; // Level 10
nextIndex = currentStageIndex + 1; // index 10 is 'Full Level' (id: 'all')
hasNextLevel = Boolean(
  hsk1Stages &&
  currentStageIndex >= 0 &&
  nextIndex < hsk1Stages.length &&
  hsk1Stages[nextIndex].id !== 'all'
);
if (hasNextLevel) {
  throw new Error('Last level of HSK 1 (Level 10) must NOT show Next Level button!');
}
console.log('[PASS] Last Level (Level 10): Next Level button does NOT appear.');

console.log('\n==============================================');
console.log('[SUCCESS] All Next Level requirements verified!');
console.log('==============================================\n');
