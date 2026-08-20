/**
 * Mandarin Practice Hub - Main Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // APP STATE
  const state = {
    currentTrack: 'hsk1',
    batchSize: '50',
    currentCards: [],
    currentQuizDataSet: null,
    currentQuizTitle: null,
    missedCards: [],
    submitted: false,
    filledCount: 0,
    currentStudyData: null,
    pendingNavTarget: 'hub'
  };

  // DOM ELEMENTS
  const navbar = document.getElementById('navbar');
  const navbarPeekHandle = document.querySelector('.navbar-peek-handle');
  const hubView = document.getElementById('hub-view');
  const learningHubView = document.getElementById('learning-hub-view');
  const studyView = document.getElementById('study-view');
  const quizView = document.getElementById('quiz-view');
  const btnHome = document.getElementById('btn-home');
  const btnBackLearningHubNav = document.getElementById('btn-back-learning-hub-nav');
  const brandLink = document.getElementById('brand-link');

  // HUB SWITCHER TABS
  const tabPracticeHub1 = document.getElementById('tab-practice-hub-1');
  const tabLearningHub1 = document.getElementById('tab-learning-hub-1');
  const tabPracticeHub2 = document.getElementById('tab-practice-hub-2');
  const tabLearningHub2 = document.getElementById('tab-learning-hub-2');

  // MOBILE NAVBAR TAP TOGGLE
  if (navbarPeekHandle && navbar) {
    navbarPeekHandle.addEventListener('click', (e) => {
      e.stopPropagation();
      navbar.classList.toggle('nav-open');
    });

    document.addEventListener('click', (e) => {
      if (!navbar.contains(e.target)) {
        navbar.classList.remove('nav-open');
      }
    });
  }
  
  const batchButtons = document.querySelectorAll('#batch-options .btn-pill');
  const trackCards = document.querySelectorAll('.track-card, .stacked-track-card');
  
  const quizHeaderTitle = document.getElementById('quiz-header-title');
  const quizHeaderCount = document.getElementById('quiz-header-count');
  const quizProgressSummary = document.getElementById('quiz-progress-summary');
  const cardGrid = document.getElementById('card-grid');
  const imeAlert = document.getElementById('ime-alert');
  
  const quizActionBar = document.getElementById('quiz-action-bar');
  const btnSubmit = document.getElementById('btn-submit');
  const btnQuit = document.getElementById('btn-quit');
  
  // STAGE MODAL ELEMENTS
  const stageModal = document.getElementById('stage-modal');
  const stageModalTitle = document.getElementById('stage-modal-title');
  const stageGrid = document.getElementById('stage-grid');
  const btnCloseStageModal = document.getElementById('btn-close-stage-modal');

  // QUIT MODAL ELEMENTS
  const quitModal = document.getElementById('quit-modal');
  const btnCancelQuit = document.getElementById('btn-cancel-quit');
  const btnConfirmQuit = document.getElementById('btn-confirm-quit');

  // RESULTS BANNER ELEMENTS
  const resultsBanner = document.getElementById('results-banner');
  const resultsHeading = document.getElementById('results-heading');
  const resultsScore = document.getElementById('results-score');
  const resultsDetails = document.getElementById('results-details');
  const btnRetryMissed = document.getElementById('btn-retry-missed');
  const btnRestartQuiz = document.getElementById('btn-restart-quiz');
  const btnResultsHub = document.getElementById('btn-results-hub');

  // STUDY VIEW ELEMENTS
  const studyHeaderTitle = document.getElementById('study-header-title');
  const studyHeaderCount = document.getElementById('study-header-count');
  const btnStudyListMode = document.getElementById('btn-study-list-mode');
  const btnStudyFlashcardMode = document.getElementById('btn-study-flashcard-mode');
  const studyListView = document.getElementById('study-list-view');
  const studyFlashcardView = document.getElementById('study-flashcard-view');
  const btnStartQuizFromStudy = document.getElementById('btn-start-quiz-from-study');
  const btnBackToLearningHub = document.getElementById('btn-back-to-learning-hub');
  const btnNextStudyLevel = document.getElementById('btn-next-study-level');

  // BANNER COLLAPSE TOGGLE
  const btnToggleInstructions = document.getElementById('btn-toggle-instructions');
  const instructionsList = document.getElementById('instructions-list');
  const instructionToggleLabel = document.getElementById('instruction-toggle-label');

  if (btnToggleInstructions) {
    btnToggleInstructions.addEventListener('click', () => {
      instructionsList.classList.toggle('collapsed');
      const isCollapsed = instructionsList.classList.contains('collapsed');
      instructionToggleLabel.textContent = isCollapsed ? 'Show Tips ▼' : 'Hide Tips ▲';
    });
  }

  // PINYIN NORMALIZATION & MATCHING UTILITIES

  /**
   * Strict validation of user input against a card's pinyin array.
   * Requires tone marks (e.g. pǔtōnghuà) or tone numbers (e.g. pu3tong1hua4).
   * Plain pinyin without tones is rejected.
   * 
   * @param {string} userInput - Text entered by the user.
   * @param {string[]} cardPinyinArray - Array of valid pinyin variants for the card.
   * @returns {boolean} True if user input contains tones and matches a valid variant.
   */
  const toneCharMap = {
    'ā': ['a', '1'], 'á': ['a', '2'], 'ǎ': ['a', '3'], 'à': ['a', '4'],
    'ē': ['e', '1'], 'é': ['e', '2'], 'ě': ['e', '3'], 'è': ['e', '4'],
    'ī': ['i', '1'], 'í': ['i', '2'], 'ǐ': ['i', '3'], 'ì': ['i', '4'],
    'ō': ['o', '1'], 'ó': ['o', '2'], 'ǒ': ['o', '3'], 'ò': ['o', '4'],
    'ū': ['u', '1'], 'ú': ['u', '2'], 'ǔ': ['u', '3'], 'ù': ['u', '4'],
    'ǖ': ['v', '1'], 'ǘ': ['v', '2'], 'ǚ': ['v', '3'], 'ǜ': ['v', '4'], 'ü': ['v', '5']
  };

  function getCanonicalPinyinToken(str) {
    if (!str || typeof str !== 'string') return '';
    const trimmed = str.trim().toLowerCase();
    
    let result = '';
    for (let char of trimmed) {
      if (toneCharMap[char]) {
        result += toneCharMap[char][0] + toneCharMap[char][1];
      } else if (/[a-zv0-9]/i.test(char)) {
        const norm = char.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ü/g, 'v');
        result += norm;
      }
    }
    return result;
  }

  function validateUserAnswer(userInput, cardPinyinArray) {
    if (!userInput || !Array.isArray(cardPinyinArray) || cardPinyinArray.length === 0) {
      return false;
    }
    const cleanedInput = userInput.trim().toLowerCase();
    const userToken = getCanonicalPinyinToken(cleanedInput);
    if (!userToken) return false;

    return cardPinyinArray.some(pinyinVariant => {
      const variantStr = String(pinyinVariant).trim().toLowerCase();
      const variantToken = getCanonicalPinyinToken(variantStr);
      return variantToken === userToken;
    });
  }

  // Expose globally for module/component access and terminal testing
  window.validateUserAnswer = validateUserAnswer;

  function checkPinyinMatch(userInput, cardData) {
    if (!userInput || !cardData) return false;

    // Handle array pinyin (from new JSON structure)
    if (Array.isArray(cardData.pinyin)) {
      return validateUserAnswer(userInput, cardData.pinyin);
    }

    // Fallback for legacy items where cardData.pinyin is a single string
    const pinyinList = [
      cardData.pinyin,
      cardData.pinyinPlain,
      cardData.pinyinNumbered
    ].filter(Boolean);

    if (cardData.pinyinAlternates && Array.isArray(cardData.pinyinAlternates)) {
      pinyinList.push(...cardData.pinyinAlternates);
    }

    return validateUserAnswer(userInput, pinyinList);
  }

  function hasHanziInput(str) {
    return /[\u4e00-\u9fa5]/.test(str);
  }

  // ASYNC DATASET LOADER & CACHING
  const datasetCache = {};

  async function loadDataset(trackName) {
    if (datasetCache[trackName]) {
      return datasetCache[trackName];
    }
    try {
      const response = await fetch(`./data/${trackName}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load dataset: ${trackName}`);
      }
      const data = await response.json();
      datasetCache[trackName] = data;
      return data;
    } catch (err) {
      console.error(`Error loading dataset for track ${trackName}:`, err);
      return [];
    }
  }

  function getDatasetStagesFromData(fullData, trackName, chunkSize = 15) {
    if (trackName === 'strokes') {
      return [{ id: 'all', title: 'Full Set', subTitle: '10 Basic Strokes', data: fullData }];
    }
    if (trackName === 'radicals') {
      return [{ id: 'all', title: 'Full Set', subTitle: '16 Essential Radicals', data: fullData }];
    }

    const stages = [];
    const total = fullData.length;
    const numStages = Math.ceil(total / chunkSize);

    for (let i = 0; i < numStages; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, total);
      const chunk = fullData.slice(start, end);
      stages.push({
        id: `level_${i + 1}`,
        title: `Level ${i + 1}`,
        subTitle: `Words ${start + 1} – ${end} (${chunk.length} words)`,
        data: chunk
      });
    }

    if (total > chunkSize) {
      stages.push({
        id: 'all',
        title: 'Full Level',
        subTitle: `All ${total} Words`,
        data: fullData
      });
    }

    return stages;
  }

  function getTrackTitle(trackName, isStudyMode = false) {
    const quizSuffix = isStudyMode ? '' : ' Quiz';
    switch (trackName) {
      case 'strokes': return isStudyMode ? 'Character Strokes' : 'Character Strokes Quiz';
      case 'radicals': return isStudyMode ? 'Essential Radicals' : 'Essential Radicals Quiz';
      case 'hsk1': return `HSK 1 Characters${quizSuffix}`;
      case 'hsk2': return `HSK 2 Characters${quizSuffix}`;
      case 'hsk3': return `HSK 3 Characters${quizSuffix}`;
      default: return `Character${quizSuffix}`;
    }
  }

  // NAVIGATION ROUTER
  function showView(viewName, pushState = true) {
    hubView.classList.remove('active');
    if (learningHubView) learningHubView.classList.remove('active');
    if (studyView) studyView.classList.remove('active');
    quizView.classList.remove('active');

    if (viewName === 'hub') {
      hubView.classList.add('active');
      btnHome.style.display = 'none';
      if (btnBackLearningHubNav) btnBackLearningHubNav.style.display = 'none';
      resultsBanner.style.display = 'none';
      stageModal.classList.remove('show');
      quitModal.classList.remove('show');
      state.currentCards = [];
      state.submitted = false;
    } else if (viewName === 'learning-hub') {
      if (learningHubView) learningHubView.classList.add('active');
      btnHome.style.display = 'none';
      if (btnBackLearningHubNav) btnBackLearningHubNav.style.display = 'none';
      resultsBanner.style.display = 'none';
      stageModal.classList.remove('show');
      quitModal.classList.remove('show');
      state.currentCards = [];
      state.submitted = false;
    } else if (viewName === 'study') {
      if (studyView) studyView.classList.add('active');
      btnHome.style.display = 'none';
      if (btnBackLearningHubNav) btnBackLearningHubNav.style.display = 'flex';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (viewName === 'quiz') {
      quizView.classList.add('active');
      btnHome.style.display = 'flex';
      if (btnBackLearningHubNav) btnBackLearningHubNav.style.display = 'none';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (pushState && history.pushState) {
      history.pushState({ view: viewName }, '', `#${viewName}`);
    }
  }

  async function loadHsk1Categories() {
    try {
      const res = await fetch('data/hsk1-categories.json');
      return await res.json();
    } catch (e) {
      console.error('Failed to load HSK 1 categories:', e);
      return null;
    }
  }

  function getHsk1StagesByCategory(fullData, categoryMap) {
    if (!categoryMap) {
      return getDatasetStagesFromData(fullData, 'hsk1', 15);
    }

    const stages = [];
    const matchedChars = new Set();
    const dataMap = new Map();
    fullData.forEach(item => dataMap.set(item.character, item));

    Object.entries(categoryMap).forEach(([catName, charList]) => {
      const filteredItems = [];
      charList.forEach(char => {
        if (dataMap.has(char)) {
          filteredItems.push(dataMap.get(char));
          matchedChars.add(char);
        }
      });

      if (filteredItems.length > 0) {
        stages.push({
          id: catName.toLowerCase().replace(/\s+/g, '_'),
          title: catName,
          subTitle: `${filteredItems.length} Words`,
          data: filteredItems
        });
      }
    });

    const leftoverItems = fullData.filter(item => !matchedChars.has(item.character));
    if (leftoverItems.length > 0) {
      stages.push({
        id: 'uncategorized',
        title: 'Uncategorized',
        subTitle: `${leftoverItems.length} Words`,
        data: leftoverItems
      });
    }

    stages.push({
      id: 'all',
      title: 'Full Level',
      subTitle: `All ${fullData.length} Words`,
      data: fullData
    });

    return stages;
  }

  // TRACK SELECTION FROM PRACTICE HUB
  const practiceTrackCards = document.querySelectorAll('#hub-view .stacked-track-card, #hub-view .track-card');
  practiceTrackCards.forEach(card => {
    card.addEventListener('click', async () => {
      const track = card.dataset.track;
      const fullData = await loadDataset(track);
      const stages = getDatasetStagesFromData(fullData, track, 15);
      if (stages.length === 1) {
        startQuiz(track, stages[0].data, getTrackTitle(track, false));
      } else {
        openStageModal(track, stages, (stage) => startQuiz(track, stage.data, `${getTrackTitle(track, false)} (${stage.title})`), false);
      }
    });
  });

  // TRACK SELECTION FROM LEARNING HUB
  const learningTrackCards = document.querySelectorAll('#learning-hub-view .stacked-track-card');
  learningTrackCards.forEach(card => {
    card.addEventListener('click', async () => {
      const track = card.dataset.track;
      const fullData = await loadDataset(track);
      let stages = [];

      if (track === 'hsk1') {
        const catMap = await loadHsk1Categories();
        stages = getHsk1StagesByCategory(fullData, catMap);
      } else {
        stages = getDatasetStagesFromData(fullData, track, 15);
      }

      if (stages.length === 1) {
        openStudyView(track, stages[0].data, getTrackTitle(track, true), stages, 0);
      } else {
        openStageModal(track, stages, (stage, idx) => openStudyView(track, stage.data, `${getTrackTitle(track, true)} (${stage.title})`, stages, idx), true);
      }
    });
  });

  function openStageModal(trackName, stages, onSelectStage, isTealTheme = false) {
    if (isTealTheme) {
      stageModal.classList.add('teal-modal');
    } else {
      stageModal.classList.remove('teal-modal');
    }

    const titlePrefix = getTrackTitle(trackName, isTealTheme);
    stageModalTitle.textContent = `${titlePrefix} - Select Level`;
    stageGrid.innerHTML = '';

    stages.forEach((stage, idx) => {
      const btn = document.createElement('button');
      btn.className = 'stage-card-btn';
      btn.innerHTML = `
        <div class="stage-card-title">${stage.title}</div>
        <div class="stage-card-sub">${stage.subTitle}</div>
      `;
      btn.addEventListener('click', () => {
        stageModal.classList.remove('show');
        if (typeof onSelectStage === 'function') {
          onSelectStage(stage, idx);
        } else {
          startQuiz(trackName, stage.data, `${getTrackTitle(trackName, false)} (${stage.title})`);
        }
      });
      stageGrid.appendChild(btn);
    });

    stageModal.classList.add('show');
  }

  btnCloseStageModal.addEventListener('click', () => {
    stageModal.classList.remove('show');
  });

  function handleHomeNavigation(targetView = 'hub', e = null) {
    if (e) e.preventDefault();
    const isQuizActive = quizView.classList.contains('active') && state.currentCards.length > 0 && !state.submitted;
    if (isQuizActive) {
      state.pendingNavTarget = targetView;
      quitModal.classList.add('show');
    } else {
      showView(targetView);
    }
  }

  btnHome.addEventListener('click', () => handleHomeNavigation('hub'));
  if (btnBackLearningHubNav) btnBackLearningHubNav.addEventListener('click', () => handleHomeNavigation('learning-hub'));
  brandLink.addEventListener('click', (e) => handleHomeNavigation('hub', e));

  // HUB SWITCHER TABS LISTENERS
  if (tabPracticeHub1) tabPracticeHub1.addEventListener('click', () => handleHomeNavigation('hub'));
  if (tabLearningHub1) tabLearningHub1.addEventListener('click', () => handleHomeNavigation('learning-hub'));
  if (tabPracticeHub2) tabPracticeHub2.addEventListener('click', () => handleHomeNavigation('hub'));
  if (tabLearningHub2) tabLearningHub2.addEventListener('click', () => handleHomeNavigation('learning-hub'));

  // STUDY VIEW RENDERERS & HANDLERS
  function openStudyView(trackName, data, title, stages = [], stageIndex = -1) {
    state.currentStudyData = { trackName, data, title };
    state.currentStudyStages = stages;
    state.currentStudyStageIndex = stageIndex;

    if (studyHeaderTitle) studyHeaderTitle.textContent = title;
    if (studyHeaderCount) studyHeaderCount.textContent = `${data.length} Words`;

    renderStudyListView(data);
    renderStudyFlashcardView(data);

    if (btnStudyListMode && btnStudyFlashcardMode) {
      btnStudyListMode.classList.add('active');
      btnStudyFlashcardMode.classList.remove('active');
    }
    if (studyListView && studyFlashcardView) {
      studyListView.style.display = 'block';
      studyFlashcardView.style.display = 'none';
    }

    // Configure "Next Level ->" Button
    if (btnNextStudyLevel) {
      if (stages && stages.length > 1 && stageIndex >= 0 && stageIndex < stages.length - 1) {
        btnNextStudyLevel.style.display = 'inline-flex';
      } else {
        btnNextStudyLevel.style.display = 'none';
      }
    }

    showView('study');
  }

  function renderStudyListView(data) {
    if (!studyListView) return;
    studyListView.innerHTML = '';
    const listGroup = document.createElement('div');
    listGroup.className = 'study-list-group';

    data.forEach(item => {
      const displayPinyin = item.displayPinyin || (Array.isArray(item.pinyin) ? item.pinyin[0] : item.pinyin);
      const rowEl = document.createElement('div');
      rowEl.className = 'study-list-row';
      rowEl.innerHTML = `
        <div class="study-row-left">
          <div class="study-row-hanzi">${item.character}</div>
          <div class="study-row-pinyin">${displayPinyin || ''}</div>
        </div>
        <div class="study-row-meaning">${item.meaning || ''}</div>
      `;
      listGroup.appendChild(rowEl);
    });

    studyListView.appendChild(listGroup);
  }

  function getCharLenClass(char) {
    if (!char) return 'char-len-1';
    const len = String(char).length;
    if (len >= 3) return 'char-len-3';
    if (len === 2) return 'char-len-2';
    return 'char-len-1';
  }

  function renderStudyFlashcardView(data) {
    if (!studyFlashcardView) return;
    studyFlashcardView.innerHTML = '';
    const gridEl = document.createElement('div');
    gridEl.className = 'study-flashcard-grid';

    data.forEach(item => {
      const displayPinyin = item.displayPinyin || (Array.isArray(item.pinyin) ? item.pinyin[0] : item.pinyin);
      const cardEl = document.createElement('div');
      cardEl.className = 'study-card';
      const lenClass = getCharLenClass(item.character);
      cardEl.innerHTML = `
        <div class="card-hanzi ${lenClass}">${item.character}</div>
        <div class="study-card-reveal-box">
          <div class="study-reveal-pinyin">${displayPinyin || ''}</div>
          <div class="study-reveal-meaning">${item.meaning || ''}</div>
        </div>
        <button class="btn-study-reveal">Reveal Answer</button>
      `;

      const revealBtn = cardEl.querySelector('.btn-study-reveal');
      const revealBox = cardEl.querySelector('.study-card-reveal-box');

      revealBtn.addEventListener('click', () => {
        revealBox.classList.toggle('show');
        const isRevealed = revealBox.classList.contains('show');
        revealBtn.textContent = isRevealed ? 'Hide Answer' : 'Reveal Answer';
      });

      gridEl.appendChild(cardEl);
    });

    studyFlashcardView.appendChild(gridEl);
  }

  if (btnStudyListMode && btnStudyFlashcardMode) {
    btnStudyListMode.addEventListener('click', () => {
      btnStudyListMode.classList.add('active');
      btnStudyFlashcardMode.classList.remove('active');
      studyListView.style.display = 'block';
      studyFlashcardView.style.display = 'none';
    });

    btnStudyFlashcardMode.addEventListener('click', () => {
      btnStudyFlashcardMode.classList.add('active');
      btnStudyListMode.classList.remove('active');
      studyListView.style.display = 'none';
      studyFlashcardView.style.display = 'block';
    });
  }

  if (btnStartQuizFromStudy) {
    btnStartQuizFromStudy.addEventListener('click', () => {
      if (state.currentStudyData) {
        startQuiz(state.currentStudyData.trackName, state.currentStudyData.data, state.currentStudyData.title);
      }
    });
  }

  if (btnBackToLearningHub) {
    btnBackToLearningHub.addEventListener('click', () => {
      showView('learning-hub');
    });
  }

  if (btnNextStudyLevel) {
    btnNextStudyLevel.addEventListener('click', () => {
      const stages = state.currentStudyStages;
      const nextIndex = state.currentStudyStageIndex + 1;
      if (stages && nextIndex >= 0 && nextIndex < stages.length) {
        const nextStage = stages[nextIndex];
        const trackTitle = getTrackTitle(state.currentStudyData.trackName, true);
        openStudyView(
          state.currentStudyData.trackName,
          nextStage.data,
          `${trackTitle} (${nextStage.title})`,
          stages,
          nextIndex
        );
      }
    });
  }

  // START QUIZ LOGIC
  async function startQuiz(trackName, customDataSet = null, customTitle = null) {
    state.currentTrack = trackName;
    state.submitted = false;
    state.filledCount = 0;
    imeAlert.classList.remove('show');
    resultsBanner.style.display = 'none';
    quizActionBar.style.display = 'flex';

    let cardData = customDataSet ? customDataSet : await loadDataset(trackName);

    state.currentCards = cardData;
    state.currentQuizDataSet = cardData;
    state.currentQuizTitle = customTitle || getTrackTitle(trackName, false);

    // Update Banner Titles
    quizHeaderTitle.textContent = state.currentQuizTitle;
    quizHeaderCount.textContent = `0 / ${state.currentCards.length} Cards`;
    quizProgressSummary.textContent = `Filled: 0 / ${state.currentCards.length}`;

    // Render Cards
    renderCardGrid();
    showView('quiz');

    // Auto Focus first card input
    setTimeout(() => {
      const firstInput = cardGrid.querySelector('.card-input');
      if (firstInput) firstInput.focus();
    }, 100);
  }

  // RENDER CARD GRID (TOFUGU STYLE)
  function renderCardGrid() {
    cardGrid.innerHTML = '';

    state.currentCards.forEach((item, index) => {
      const cardEl = document.createElement('div');
      cardEl.className = 'tofugu-card';
      cardEl.dataset.index = index;

      const lenClass = getCharLenClass(item.character);

      cardEl.innerHTML = `
        <div class="card-hanzi ${lenClass}">${item.character}</div>
        <div class="card-input-wrapper">
          <input type="text" class="card-input" data-index="${index}" placeholder="" autocomplete="off" spellcheck="false">
        </div>
      `;

      cardGrid.appendChild(cardEl);
    });

    attachCardInputListeners();
  }

  // INPUT LISTENERS & AUTO ADVANCE FOCUS
  function attachCardInputListeners() {
    const inputs = cardGrid.querySelectorAll('.card-input');

    inputs.forEach((input, idx) => {
      // Check for IME Hanzi input
      input.addEventListener('input', (e) => {
        const val = e.target.value;
        if (hasHanziInput(val)) {
          imeAlert.classList.add('show');
        } else {
          // Hide alert if no Hanzi in any input
          const anyHanzi = Array.from(inputs).some(inp => hasHanziInput(inp.value));
          if (!anyHanzi) imeAlert.classList.remove('show');
        }

        updateProgressCount();
      });

      // Keydown Enter / Tab navigation
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const nextInput = inputs[idx + 1];
          if (nextInput) {
            nextInput.focus();
          } else {
            // Last card -> submit prompt or wrap focus
            btnSubmit.focus();
          }
        }
      });
    });
  }

  function updateProgressCount() {
    const inputs = cardGrid.querySelectorAll('.card-input');
    let filled = 0;
    inputs.forEach(inp => {
      if (inp.value.trim() !== '') filled++;
    });

    state.filledCount = filled;
    quizProgressSummary.textContent = `Filled: ${filled} / ${state.currentCards.length}`;
  }

  // QUIZ SUBMISSION & GRADING
  btnSubmit.addEventListener('click', () => {
    if (state.submitted) return;
    gradeQuiz();
  });

  function gradeQuiz() {
    state.submitted = true;
    let correctCount = 0;
    state.missedCards = [];

    const cardElements = cardGrid.querySelectorAll('.tofugu-card');
    const inputs = cardGrid.querySelectorAll('.card-input');

    // Keep inputs ENABLED so users can click & type into them to practice copying the Pinyin!
    inputs.forEach(inp => inp.disabled = false);

    state.currentCards.forEach((item, index) => {
      const cardEl = cardElements[index];
      const userInput = inputs[index].value;

      const isCorrect = checkPinyinMatch(userInput, item);

      const displayPinyin = item.displayPinyin || (Array.isArray(item.pinyin) ? item.pinyin[0] : item.pinyin);
      const feedbackEl = document.createElement('div');
      feedbackEl.className = 'card-feedback';

      if (isCorrect) {
        correctCount++;
        cardEl.classList.add('correct');
        feedbackEl.classList.add('correct-feedback');
        feedbackEl.innerHTML = `
          <div class="feedback-pinyin">✓ ${displayPinyin || ''}</div>
          <div class="feedback-meaning">${item.meaning || ''}</div>
        `;
      } else {
        cardEl.classList.add('incorrect');
        state.missedCards.push(item);
        feedbackEl.innerHTML = `
          <div class="feedback-pinyin">${displayPinyin || ''}</div>
          <div class="feedback-meaning">${item.meaning || ''}</div>
        `;
      }
      cardEl.appendChild(feedbackEl);
    });

    // Calculate score percentage
    const total = state.currentCards.length;
    const percentage = Math.round((correctCount / total) * 100);

    // Hide standard action bar and show inline bottom results banner
    quizActionBar.style.display = 'none';
    showResultsBanner(correctCount, total, percentage);
  }

  function showResultsBanner(correct, total, percentage) {
    resultsScore.textContent = `${percentage}%`;
    resultsDetails.textContent = `You scored ${correct} out of ${total} cards correctly!`;

    if (percentage === 100) {
      resultsHeading.textContent = 'Perfect Score!';
    } else if (percentage >= 80) {
      resultsHeading.textContent = 'Great Job!';
    } else if (percentage >= 50) {
      resultsHeading.textContent = 'Good Effort!';
    } else {
      resultsHeading.textContent = 'Keep Practicing!';
    }

    if (state.missedCards.length > 0) {
      btnRetryMissed.style.display = 'inline-flex';
    } else {
      btnRetryMissed.style.display = 'none';
    }

    resultsBanner.style.display = 'block';
    
    // Smoothly scroll down to results banner
    setTimeout(() => {
      resultsBanner.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);
  }

  // RESULTS BANNER ACTIONS
  btnRetryMissed.addEventListener('click', () => {
    resultsBanner.style.display = 'none';
    if (state.missedCards.length > 0) {
      const retryTitle = `${state.currentQuizTitle || getTrackTitle(state.currentTrack, false)} (Retry Missed)`;
      startQuiz(state.currentTrack, state.missedCards, retryTitle);
    }
  });

  btnRestartQuiz.addEventListener('click', () => {
    resultsBanner.style.display = 'none';
    startQuiz(state.currentTrack, state.currentQuizDataSet, state.currentQuizTitle);
  });

  btnResultsHub.addEventListener('click', () => {
    resultsBanner.style.display = 'none';
    showView('hub');
  });

  btnQuit.addEventListener('click', () => {
    handleHomeNavigation('hub');
  });

  btnCancelQuit.addEventListener('click', () => {
    quitModal.classList.remove('show');
  });

  btnConfirmQuit.addEventListener('click', () => {
    quitModal.classList.remove('show');
    showView(state.pendingNavTarget || 'hub');
  });

  // BROWSER & MOBILE PHONE BACK BUTTON ROUTING (POPSTATE HANDLER)
  window.addEventListener('popstate', (e) => {
    const isQuizActive = quizView.classList.contains('active') && state.currentCards.length > 0 && !state.submitted;

    if (isQuizActive) {
      // Re-push quiz state so mobile back button doesn't exit browser window, and show quit confirmation
      history.pushState({ view: 'quiz' }, '', '#quiz');
      state.pendingNavTarget = e.state?.view || 'hub';
      quitModal.classList.add('show');
      return;
    }

    const targetView = e.state?.view || (location.hash ? location.hash.replace('#', '') : 'hub');
    if (['hub', 'learning-hub', 'study', 'quiz'].includes(targetView)) {
      showView(targetView, false);
    } else {
      showView('hub', false);
    }
  });

  // INITIAL ROUTE SETUP ON PAGE LOAD
  const initialHash = location.hash ? location.hash.replace('#', '') : 'hub';
  const initialView = ['hub', 'learning-hub', 'study', 'quiz'].includes(initialHash) ? initialHash : 'hub';
  if (history.replaceState) {
    history.replaceState({ view: initialView }, '', `#${initialView}`);
  }
  showView(initialView, false);

});
