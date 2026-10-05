const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const hsk1Data = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/hsk1.json'), 'utf8'));

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message || JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
    };
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = this.id++;
      this.callbacks.set(msgId, { resolve, reject });
      this.ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval error: ${JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result?.value;
  }

  close() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

async function runBrowserTests() {
  console.log('=== REAL BROWSER VERIFICATION: STAGE MERGING & NEXT LEVEL ===\n');

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browserBinary = fs.existsSync(edgePath) ? edgePath : chromePath;

  const tempProfileDir = path.resolve(__dirname, '../.tmp_browser_profile');
  if (!fs.existsSync(tempProfileDir)) {
    fs.mkdirSync(tempProfileDir, { recursive: true });
  }

  const port = 9222;
  console.log(`Starting headless browser: ${browserBinary} on port ${port}...`);
  const browserProcess = spawn(browserBinary, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tempProfileDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ], { stdio: 'ignore' });

  const cleanup = () => {
    try {
      browserProcess.kill('SIGKILL');
    } catch (e) {}
  };
  process.on('exit', cleanup);
  process.on('SIGINT', cleanup);

  let targets = null;
  for (let i = 0; i < 20; i++) {
    await sleep(500);
    try {
      targets = await fetchJson(`http://127.0.0.1:${port}/json`);
      if (targets && targets.length > 0) break;
    } catch (e) {}
  }

  if (!targets || targets.length === 0) {
    cleanup();
    throw new Error('Failed to connect to browser CDP port!');
  }

  const pageTarget = targets.find(t => t.type === 'page') || targets[0];
  console.log(`Connected to page target: ${pageTarget.title || pageTarget.url}`);

  const client = new CDPClient(pageTarget.webSocketDebuggerUrl);
  await client.connect();

  await client.send('Page.enable');
  await client.send('Runtime.enable');

  console.log('Navigating to http://localhost:3000 ...');
  await client.send('Page.navigate', { url: 'http://localhost:3000' });
  await sleep(1500);

  async function waitFor(fnExpr, timeoutMs = 5000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const val = await client.evaluate(fnExpr);
      if (val) return val;
      await sleep(100);
    }
    throw new Error(`Timeout waiting for condition: ${fnExpr}`);
  }

  // --- CHECK 1: HSK 1 Picker shows 10 levels with Level 10 labeled words 136 to 151 (16 words) ---
  console.log('\n--- Check 1: HSK 1 Picker Verification ---');
  await client.evaluate(`{
    const hsk1Card = document.querySelector('#hub-view .stacked-track-card[data-track="hsk1"]:not([data-mode="drawing"])');
    hsk1Card.click();
  }`);
  await waitFor(`document.querySelectorAll('.stage-card-btn').length > 0`);

  const hsk1StagesInfo = await client.evaluate(`{
    const buttons = Array.from(document.querySelectorAll('.stage-card-btn'));
    buttons.map(b => ({
      title: b.querySelector('.stage-card-title')?.textContent?.trim(),
      subTitle: b.querySelector('.stage-card-sub')?.textContent?.trim()
    }));
  }`);
  console.log('HSK 1 stage buttons count:', hsk1StagesInfo.length);
  const hsk1Numbered = hsk1StagesInfo.filter(s => s.title.startsWith('Level'));
  console.log(`HSK 1 numbered levels count: ${hsk1Numbered.length}`);
  console.log('HSK 1 last level info:', hsk1Numbered[hsk1Numbered.length - 1]);

  if (hsk1Numbered.length !== 10) {
    throw new Error(`Expected HSK 1 picker to show 10 levels, got ${hsk1Numbered.length}`);
  }
  const hsk1L10 = hsk1Numbered[9];
  if (hsk1L10.title !== 'Level 10' || hsk1L10.subTitle !== 'Words 136 – 151 (16 words)') {
    throw new Error(`Expected HSK 1 Level 10 labeled "Words 136 – 151 (16 words)", got "${hsk1L10.title}" / "${hsk1L10.subTitle}"`);
  }
  console.log('[PASS] HSK 1 picker shows 10 levels with Level 10 labeled words 136 to 151 (16 words).');

  // Close modal
  await client.evaluate(`document.getElementById('btn-close-stage-modal').click();`);
  await sleep(300);

  // --- CHECK 2: HSK 2 Picker still shows 10 levels ending with 9 words ---
  console.log('\n--- Check 2: HSK 2 Picker Verification ---');
  await client.evaluate(`{
    const hsk2Card = document.querySelector('#hub-view .stacked-track-card[data-track="hsk2"]:not([data-mode="drawing"])');
    hsk2Card.click();
  }`);
  await waitFor(`document.getElementById('stage-modal-title').textContent.includes('HSK 2')`);

  const hsk2StagesInfo = await client.evaluate(`{
    const buttons = Array.from(document.querySelectorAll('.stage-card-btn'));
    buttons.map(b => ({
      title: b.querySelector('.stage-card-title')?.textContent?.trim(),
      subTitle: b.querySelector('.stage-card-sub')?.textContent?.trim()
    }));
  }`);
  const hsk2Numbered = hsk2StagesInfo.filter(s => s.title.startsWith('Level'));
  console.log(`HSK 2 numbered levels count: ${hsk2Numbered.length}`);
  console.log('HSK 2 last level info:', hsk2Numbered[hsk2Numbered.length - 1]);

  if (hsk2Numbered.length !== 10) {
    throw new Error(`Expected HSK 2 picker to show 10 levels, got ${hsk2Numbered.length}`);
  }
  const hsk2L10 = hsk2Numbered[9];
  if (hsk2L10.title !== 'Level 10' || hsk2L10.subTitle !== 'Words 136 – 144 (9 words)') {
    throw new Error(`Expected HSK 2 Level 10 labeled "Words 136 – 144 (9 words)", got "${hsk2L10.title}" / "${hsk2L10.subTitle}"`);
  }
  console.log('[PASS] HSK 2 picker still shows 10 levels ending with 9 words.');

  // Close modal
  await client.evaluate(`document.getElementById('btn-close-stage-modal').click();`);
  await sleep(300);

  // --- CHECK 3: Finishing HSK 1 Level 10 shows NO Next Level button ---
  console.log('\n--- Check 3: Finishing HSK 1 Level 10 shows NO Next Level button ---');

  // Ensure MC mode
  await client.evaluate(`document.getElementById('btn-mode-mc').click();`);

  // Open HSK 1 picker
  await client.evaluate(`{
    const hsk1Card = document.querySelector('#hub-view .stacked-track-card[data-track="hsk1"]:not([data-mode="drawing"])');
    hsk1Card.click();
  }`);
  await waitFor(`document.getElementById('stage-modal-title').textContent.includes('HSK 1')`);

  // Select Level 10 (index 9)
  await client.evaluate(`{
    const stageItems = document.querySelectorAll('.stage-card-btn');
    stageItems[9].click();
  }`);
  await waitFor(`document.getElementById('quiz-view').classList.contains('active')`);

  const hsk1L10QuizState = await client.evaluate(`({
    title: document.getElementById('quiz-header-title').textContent,
    cardsCount: document.querySelectorAll('#card-grid .tofugu-mc-card').length
  })`);
  console.log('HSK 1 Level 10 quiz state:', hsk1L10QuizState);

  if (!hsk1L10QuizState.title.includes('Level 10') || hsk1L10QuizState.cardsCount !== 16) {
    throw new Error(`Expected Level 10 quiz with 16 cards, got title="${hsk1L10QuizState.title}", count=${hsk1L10QuizState.cardsCount}`);
  }

  // Answer all 16 cards in MC mode
  console.log('Answering all 16 cards of Level 10...');
  await client.evaluate(`{
    const cards = document.querySelectorAll('#card-grid .tofugu-mc-card');
    cards.forEach(card => {
      const opt = card.querySelector('.mc-option-btn');
      if (opt) opt.click();
    });
  }`);
  await waitFor(`document.getElementById('results-banner').style.display !== 'none'`);
  console.log('Results banner displayed for Level 10.');

  const nextBtnDisplay = await client.evaluate(`document.getElementById('btn-next-quiz-level').style.display`);
  console.log(`On HSK 1 Level 10 results banner, Next Level button display style: "${nextBtnDisplay}"`);

  if (nextBtnDisplay !== 'none') {
    throw new Error(`Expected Next Level button to be hidden (display: "none"), got "${nextBtnDisplay}"`);
  }
  console.log('[PASS] Finishing HSK 1 Level 10 shows no Next Level button!');

  // --- CHECK 4: Level 1 -> Level 2 transition still works ---
  console.log('\n--- Check 4: Level 1 -> Level 2 transition ---');
  await client.evaluate(`document.getElementById('btn-results-hub').click();`);
  await waitFor(`document.getElementById('hub-view').classList.contains('active')`);

  await client.evaluate(`{
    const hsk1Card = document.querySelector('#hub-view .stacked-track-card[data-track="hsk1"]:not([data-mode="drawing"])');
    hsk1Card.click();
  }`);
  await waitFor(`document.getElementById('stage-modal-title').textContent.includes('HSK 1')`);
  await client.evaluate(`{
    const stageItems = document.querySelectorAll('.stage-card-btn');
    stageItems[0].click(); // Level 1
  }`);
  await waitFor(`document.getElementById('quiz-view').classList.contains('active')`);

  // Answer 15 cards
  await client.evaluate(`{
    const cards = document.querySelectorAll('#card-grid .tofugu-mc-card');
    cards.forEach(card => {
      const opt = card.querySelector('.mc-option-btn');
      if (opt) opt.click();
    });
  }`);
  await waitFor(`document.getElementById('results-banner').style.display !== 'none'`);

  const nextBtnL1Text = await client.evaluate(`document.getElementById('btn-next-quiz-level').textContent`);
  console.log(`Level 1 results button text: "${nextBtnL1Text}"`);
  if (nextBtnL1Text !== 'Next: Level 2') {
    throw new Error(`Expected "Next: Level 2", got "${nextBtnL1Text}"`);
  }

  // Click Next Level
  await client.evaluate(`document.getElementById('btn-next-quiz-level').click();`);
  await sleep(500);

  const level2LoadedTitle = await client.evaluate(`document.getElementById('quiz-header-title').textContent`);
  console.log(`Loaded from Next button: "${level2LoadedTitle}"`);
  if (!level2LoadedTitle.includes('Level 2')) {
    throw new Error(`Expected Level 2 loaded, got "${level2LoadedTitle}"`);
  }
  console.log('[PASS] Level 1 -> Level 2 transition verified!');

  console.log('\n======================================================');
  console.log('ALL REAL BROWSER VERIFICATION TESTS PASSED PERFECTLY!');
  console.log('======================================================\n');

  client.close();
  cleanup();
  process.exit(0);
}

runBrowserTests().catch(err => {
  console.error('\n[TEST FAILURE]:', err);
  process.exit(1);
});
