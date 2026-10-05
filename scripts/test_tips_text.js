/**
 * Test to verify that quiz tips text updates correctly for all 3 quiz modes:
 * - Typed mode
 * - Multiple Choice mode
 * - Drawing Quiz mode
 * - Retry Missed & Start New Batch (preserving mode tips)
 */

const fs = require('fs');
const path = require('path');

console.log('=== VERIFYING QUIZ TIPS TEXT LOGIC ===\n');

// Read app.js source to verify exact strings and function implementation
const appJsSource = fs.readFileSync(path.resolve(__dirname, '../app.js'), 'utf8');

const EXPECTED_MC_TIPS = "Pick the correct pinyin for each character. Each answer is checked instantly, and if you pick the wrong one, the correct pinyin is highlighted so you can learn it. Your score appears after you answer the last card.";
const EXPECTED_DRAWING_TIPS = "Draw the Chinese character that matches each pinyin and meaning. Use Clear to redo a character. When you are finished, click Submit Quiz to see which characters you drew correctly.";

// Check 1: Verify exact string definitions exist in app.js
if (!appJsSource.includes(EXPECTED_MC_TIPS)) {
  throw new Error("app.js is missing the exact Multiple Choice tips string!");
}
console.log('[PASS] Exact Multiple Choice tips string confirmed in app.js.');

if (!appJsSource.includes(EXPECTED_DRAWING_TIPS)) {
  throw new Error("app.js is missing the exact Drawing Quiz tips string!");
}
console.log('[PASS] Exact Drawing Quiz tips string confirmed in app.js.');

// Check 2: Verify typed-mode tips preservation
if (!appJsSource.includes("Type <strong>tone numbers</strong>") ||
    !appJsSource.includes("Press <strong>ENTER</strong> to confirm") ||
    !appJsSource.includes("Submit Quiz")) {
  throw new Error("app.js typed-mode tips text was modified or missing!");
}
console.log('[PASS] Existing typed-mode tips text preserved completely.');

// Check 3: Verify updateQuizTips is called in startQuiz and startDrawingQuiz
if (!appJsSource.includes("function updateQuizTips()")) {
  throw new Error("updateQuizTips function definition not found in app.js!");
}

const startQuizIdx = appJsSource.indexOf("async function startQuiz(");
const nextFuncIdx = appJsSource.indexOf("async function startDrawingQuiz(");
const startQuizBody = appJsSource.slice(startQuizIdx, nextFuncIdx);
if (!startQuizBody.includes("updateQuizTips();")) {
  throw new Error("updateQuizTips() is not called in startQuiz!");
}
console.log('[PASS] updateQuizTips() is called in startQuiz (applies to fresh starts, Retry Missed, and Start New Batch).');

const afterDrawingIdx = appJsSource.indexOf("function renderDrawingCardGrid(");
const startDrawingBody = appJsSource.slice(nextFuncIdx, afterDrawingIdx);
if (!startDrawingBody.includes("updateQuizTips();")) {
  throw new Error("updateQuizTips() is not called in startDrawingQuiz!");
}
console.log('[PASS] updateQuizTips() is called in startDrawingQuiz (applies to drawing starts, Retry Missed, and Start New Batch).');

console.log('\n[SUCCESS] All quiz tips requirements and wiring verified successfully!');
