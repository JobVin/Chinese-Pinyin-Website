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
    pendingNavTarget: 'hub',
    quizType: 'pinyin', // 'pinyin' | 'drawing'
    currentDrawingCards: [],
    drawingCanvasInstances: new Map(),
    drawingSubmitted: false
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
  const btnStudyDrawMode = document.getElementById('btn-study-draw-mode');
  const studyListView = document.getElementById('study-list-view');
  const studyFlashcardView = document.getElementById('study-flashcard-view');
  const studyDrawView = document.getElementById('study-draw-view');
  let drawViewRendered = false;
  const btnStartQuizFromStudy = document.getElementById('btn-start-quiz-from-study');
  const btnBackToLearningHub = document.getElementById('btn-back-to-learning-hub');
  const btnPrevStudyLevel = document.getElementById('btn-prev-study-level');
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

  // PINYIN NORMALIZATION, CONVERSION & MATCHING UTILITIES

  const toneCharToPlain = {
    'ā': 'a', 'á': 'a', 'ǎ': 'a', 'à': 'a',
    'ō': 'o', 'ó': 'o', 'ē': 'e', 'é': 'e',
    'ě': 'e', 'è': 'e', 'ī': 'i', 'í': 'i',
    'ǐ': 'i', 'ì': 'i', 'ū': 'u', 'ú': 'u',
    'ǔ': 'u', 'ù': 'u', 'ǖ': 'ü', 'ǘ': 'ü',
    'ǚ': 'ü', 'ǜ': 'ü', 'Ā': 'A', 'Á': 'A',
    'Ǎ': 'A', 'À': 'A', 'Ō': 'O', 'Ó': 'O',
    'Ǒ': 'O', 'Ò': 'O', 'Ē': 'E', 'É': 'E',
    'Ě': 'E', 'È': 'E', 'Ī': 'I', 'Í': 'I',
    'Ǐ': 'I', 'Ì': 'I', 'Ū': 'U', 'Ú': 'U',
    'Ǔ': 'U', 'Ù': 'U', 'Ǖ': 'Ü', 'Ǘ': 'Ü',
    'Ǚ': 'Ü', 'Ǜ': 'Ü'
  };

  const pinyinToneMap = {
    'a': ['ā', 'á', 'ǎ', 'à', 'a'],
    'o': ['ō', 'ó', 'ǒ', 'ò', 'o'],
    'e': ['ē', 'é', 'ě', 'è', 'e'],
    'i': ['ī', 'í', 'ǐ', 'ì', 'i'],
    'u': ['ū', 'ú', 'ǔ', 'ù', 'u'],
    'ü': ['ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü'],
    'v': ['ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü'],
    'A': ['Ā', 'Á', 'Ǎ', 'À', 'A'],
    'O': ['Ō', 'Ó', 'Ǒ', 'Ò', 'O'],
    'E': ['Ē', 'É', 'Ě', 'È', 'E'],
    'I': ['Ī', 'Í', 'Ǐ', 'Ì', 'I'],
    'U': ['Ū', 'Ú', 'Ǔ', 'Ù', 'U'],
    'Ü': ['Ǖ', 'Ǘ', 'Ǚ', 'Ǜ', 'Ü'],
    'V': ['Ǖ', 'Ǘ', 'Ǚ', 'Ǜ', 'Ü']
  };

  function stripDiacritics(str) {
    return str.replace(/[āáǎàōóǒòēéěèīíǐìūúǔùǖǘǚǜĀÁǍÀŌÓǑÒĒÉĚÈĪÍǏÌŪÚǓÙǕǗǙǛ]/g, m => toneCharToPlain[m] || m);
  }

  function applyToneToSyllable(rawSyllable, toneNum) {
    const syllable = stripDiacritics(rawSyllable).replace(/u:/gi, 'ü');
    const tone = parseInt(toneNum, 10);
    if (tone === 0 || tone === 5) {
      return syllable.replace(/v/gi, 'ü');
    }
    const toneIdx = tone - 1;

    if (/[aeAE]/.test(syllable)) {
      return syllable
        .replace(/v/gi, 'ü')
        .replace(/([aeAE])/, v => pinyinToneMap[v] ? pinyinToneMap[v][toneIdx] : v);
    }
    if (/ou|OU|oU|Ou/.test(syllable)) {
      return syllable
        .replace(/v/gi, 'ü')
        .replace(/([oO])/, v => pinyinToneMap[v] ? pinyinToneMap[v][toneIdx] : v);
    }
    if (/ui|UI|uI|Ui/.test(syllable)) {
      return syllable
        .replace(/v/gi, 'ü')
        .replace(/([iI])/, v => pinyinToneMap[v] ? pinyinToneMap[v][toneIdx] : v);
    }
    if (/iu|IU|iU|Iu/.test(syllable)) {
      return syllable
        .replace(/v/gi, 'ü')
        .replace(/([uU])/, v => pinyinToneMap[v] ? pinyinToneMap[v][toneIdx] : v);
    }

    let replaced = false;
    const sylChars = syllable.split('');
    for (let i = sylChars.length - 1; i >= 0; i--) {
      const char = sylChars[i];
      if (pinyinToneMap[char]) {
        sylChars[i] = pinyinToneMap[char][toneIdx];
        replaced = true;
        break;
      }
    }
    if (replaced) {
      return sylChars.join('').replace(/v/gi, 'ü');
    }
    return syllable;
  }

  function splitChunkIntoPrefixAndSyllable(chunk) {
    if (!chunk) return { prefix: '', syllable: '' };

    const initialsWithVowelRegex = /(?:zh|ch|sh|[bpmfdtnlgkhjqxzcsryw])(?=[aeiouüvāáǎàōóǒòēéěèīíǐìūúǔùǖǘǚǜ])/gi;
    const initialMatches = [...chunk.matchAll(initialsWithVowelRegex)];

    if (initialMatches.length > 1) {
      const lastInitial = initialMatches[initialMatches.length - 1];
      return {
        prefix: chunk.slice(0, lastInitial.index),
        syllable: chunk.slice(lastInitial.index)
      };
    } else if (initialMatches.length === 1 && initialMatches[0].index > 0) {
      const init = initialMatches[0];
      return {
        prefix: chunk.slice(0, init.index),
        syllable: chunk.slice(init.index)
      };
    }

    return {
      prefix: '',
      syllable: chunk
    };
  }

  /**
   * Converts numeric Pinyin input (e.g. ni3hao3, lv4, de5) into tone-marked Pinyin (e.g. nǐhǎo, lǜ, de).
   * Also supports live tone swapping on already toned syllables (e.g. nǐ2 -> ní, nǐhǎo4 -> nǐhào).
   */
  function convertPinyinNumberToTone(text) {
    if (!text || typeof text !== 'string') return text;

    let result = text.replace(/u:/gi, match => match[0] === 'U' ? 'Ü' : 'ü');

    result = result.replace(/([a-zA-ZüÜvVāáǎàōóǒòēéěèīíǐìūúǔùǖǘǚǜĀÁǍÀŌÓǑÒĒÉĚÈĪÍǏÌŪÚǓÙǕǗǙǛ]+)([0-5])/g, (match, chunk, toneStr) => {
      const { prefix, syllable } = splitChunkIntoPrefixAndSyllable(chunk);
      const convertedSyllable = applyToneToSyllable(syllable, toneStr);
      return prefix + convertedSyllable;
    });

    return result;
  }

  function getActiveSyllableInfo(fullText, cursorPosition) {
    if (!fullText) return null;
    const pos = typeof cursorPosition === 'number' ? cursorPosition : fullText.length;
    const beforeCursor = fullText.slice(0, pos);
    const match = beforeCursor.match(/([a-zA-ZüÜvVāáǎàōóǒòēéěèīíǐìūúǔùǖǘǚǜĀÁǍÀŌÓǑÒĒÉĚÈĪÍǏÌŪÚǓÙǕǗǙǛ:]+)$/);
    if (!match) return null;

    const rawChunk = match[1];
    const chunkStart = pos - rawChunk.length;
    const { prefix, syllable } = splitChunkIntoPrefixAndSyllable(rawChunk);

    const isInitialUpper = syllable.length > 0 && syllable[0] === syllable[0].toUpperCase() && syllable[0] !== syllable[0].toLowerCase();
    const cleanSyllable = stripDiacritics(syllable).replace(/u:/gi, 'ü');
    if (!cleanSyllable || !/[aeiouüAEIOUÜvV]/.test(cleanSyllable)) {
      return null;
    }

    const syllableStart = chunkStart + prefix.length;
    const syllableEnd = pos;

    let currentTone = 5;
    const variants = [1, 2, 3, 4, 5].map(t => {
      let text = applyToneToSyllable(cleanSyllable.toLowerCase(), t);
      if (isInitialUpper && text.length > 0) {
        text = text[0].toUpperCase() + text.slice(1);
      }
      if (text === syllable || text.toLowerCase() === syllable.toLowerCase()) {
        currentTone = t;
      }
      return { tone: t, text };
    });

    return {
      prefix,
      syllable,
      cleanSyllable,
      syllableStart,
      syllableEnd,
      currentTone,
      variants
    };
  }

  // Expose globally for testing/modules
  window.convertPinyinNumberToTone = convertPinyinNumberToTone;
  window.getActiveSyllableInfo = getActiveSyllableInfo;

  function normalizePinyinToken(str) {
    if (!str || typeof str !== 'string') return '';
    return str.trim().toLowerCase().replace(/['’\s]/g, '').replace(/u:/g, 'ü').replace(/v/g, 'ü');
  }

  function validateUserAnswer(userInput, cardPinyinArray) {
    if (!userInput || typeof userInput !== 'string' || !Array.isArray(cardPinyinArray) || cardPinyinArray.length === 0) {
      return false;
    }
    const trimmedInput = userInput.trim();
    if (!trimmedInput) return false;

    // Convert any remaining numeric tones (e.g. pasted values)
    const convertedInput = convertPinyinNumberToTone(trimmedInput);

    const userToken = normalizePinyinToken(convertedInput);
    if (!userToken) return false;

    return cardPinyinArray.some(pinyinVariant => {
      const variantToken = normalizePinyinToken(String(pinyinVariant));
      return variantToken === userToken;
    });
  }

  // Expose globally for module/component access and testing
  window.validateUserAnswer = validateUserAnswer;

  function checkPinyinMatch(userInput, cardData) {
    if (!userInput || !cardData) return false;

    if (Array.isArray(cardData.pinyin)) {
      return validateUserAnswer(userInput, cardData.pinyin);
    }

    const pinyinList = [
      cardData.pinyin,
      cardData.displayPinyin
    ].filter(Boolean);

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

  // TRACK SELECTION FROM PRACTICE HUB (PINYIN QUIZ)
  const practiceTrackCards = document.querySelectorAll('#hub-view .stacked-track-card:not([data-mode="drawing"]), #hub-view .track-card');
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

  // TRACK SELECTION FROM PRACTICE HUB (DRAWING QUIZ)
  const drawingTrackCards = document.querySelectorAll('#hub-view .stacked-track-card[data-mode="drawing"]');
  drawingTrackCards.forEach(card => {
    card.addEventListener('click', async () => {
      const track = card.dataset.track;
      const fullData = await loadDataset(track);
      const stages = getDatasetStagesFromData(fullData, track, 15);
      const baseTitle = getTrackTitle(track, false) + ' Drawing';
      if (stages.length === 1) {
        startDrawingQuiz(track, stages[0].data, baseTitle);
      } else {
        openStageModal(track, stages, (stage) => {
          startDrawingQuiz(track, stage.data, `${baseTitle} (${stage.title})`);
        }, false);
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
    drawViewRendered = false;

    if (studyHeaderTitle) studyHeaderTitle.textContent = title;
    if (studyHeaderCount) studyHeaderCount.textContent = `${data.length} Words`;

    renderStudyListView(data);
    renderStudyFlashcardView(data);

    if (btnStudyListMode && btnStudyFlashcardMode && btnStudyDrawMode) {
      btnStudyListMode.classList.add('active');
      btnStudyFlashcardMode.classList.remove('active');
      btnStudyDrawMode.classList.remove('active');
    }
    if (studyListView && studyFlashcardView && studyDrawView) {
      studyListView.style.display = 'block';
      studyFlashcardView.style.display = 'none';
      studyDrawView.style.display = 'none';
    }

    // Configure "Previous Level" and "Next Level" Buttons
    if (btnPrevStudyLevel) {
      if (stages && stages.length > 1 && stageIndex > 0) {
        btnPrevStudyLevel.style.display = 'inline-flex';
      } else {
        btnPrevStudyLevel.style.display = 'none';
      }
    }

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

  function renderStudyDrawView(data) {
    if (!studyDrawView) return;
    studyDrawView.innerHTML = '';
    const gridEl = document.createElement('div');
    gridEl.className = 'study-draw-grid';

    data.forEach(item => {
      const displayPinyin = item.displayPinyin || (Array.isArray(item.pinyin) ? item.pinyin[0] : item.pinyin);
      const cardEl = document.createElement('div');
      cardEl.className = 'study-card study-draw-card';

      // Caption Header
      const captionEl = document.createElement('div');
      captionEl.className = 'study-draw-caption';
      captionEl.innerHTML = `
        <div class="study-reveal-pinyin">${item.character} — ${displayPinyin || ''}</div>
        <div class="study-reveal-meaning">${item.meaning || ''}</div>
      `;
      cardEl.appendChild(captionEl);

      // Dual Container
      const dualContainer = document.createElement('div');
      dualContainer.className = 'study-draw-dual-container';

      const characters = [...(item.character || '')];

      // --- SPACE 1: ANIMATION & GUIDE SPACE ---
      const animBox = document.createElement('div');
      animBox.className = 'study-draw-box animation-box';
      animBox.innerHTML = `<div class="box-label">1. Animation Guide</div>`;

      const animTargetsWrapper = document.createElement('div');
      animTargetsWrapper.className = 'draw-targets-wrapper';

      const writers = [];
      const loadedWriterFlags = [];

      characters.forEach((char, charIdx) => {
        const targetDiv = document.createElement('div');
        targetDiv.className = 'animation-target-div';
        animTargetsWrapper.appendChild(targetDiv);

        if (typeof HanziWriter !== 'undefined') {
          const writerOptions = {
            width: 130,
            height: 130,
            padding: 5,
            showOutline: true,
            showCharacter: false,
            strokeColor: '#1e293b',
            outlineColor: '#cbd5e1',
            onLoadCharDataSuccess: () => {
              loadedWriterFlags[charIdx] = true;
            },
            onLoadCharDataError: () => {
              targetDiv.innerHTML = `<div class="fallback-stroke-char">${char}</div>`;
              loadedWriterFlags[charIdx] = false;
            }
          };

          if (typeof HanziDrawing !== 'undefined' && typeof HanziDrawing.defaultCharDataLoader === 'function') {
            writerOptions.charDataLoader = HanziDrawing.defaultCharDataLoader;
          }

          const writer = HanziWriter.create(targetDiv, char, writerOptions);
          writers.push(writer);
        } else {
          targetDiv.innerHTML = `<div class="fallback-stroke-char">${char}</div>`;
        }
      });

      animBox.appendChild(animTargetsWrapper);

      const animBtn = document.createElement('button');
      animBtn.className = 'btn-hanzi-animate';
      animBtn.style.marginTop = '10px';
      animBtn.innerHTML = '<span>▶</span> Animate';
      animBox.appendChild(animBtn);

      let isAnimating = false;
      animBtn.addEventListener('click', async () => {
        if (isAnimating) return;
        isAnimating = true;
        animBtn.disabled = true;
        animBtn.style.opacity = '0.7';

        for (let i = 0; i < writers.length; i++) {
          if (writers[i]) {
            await new Promise((resolve) => writers[i].animateCharacter({ onComplete: resolve }));
          }
        }

        isAnimating = false;
        animBtn.disabled = false;
        animBtn.style.opacity = '1';
      });

      dualContainer.appendChild(animBox);

      // --- SPACE 2: FREEHAND PRACTICE & GRADING SPACE ---
      const practiceBox = document.createElement('div');
      practiceBox.className = 'study-draw-box practice-box';
      practiceBox.innerHTML = `<div class="box-label">2. Freehand Practice</div>`;

      const practiceTargetsWrapper = document.createElement('div');
      practiceTargetsWrapper.className = 'draw-targets-wrapper';

      const practiceCanvases = [];

      characters.forEach((char) => {
        const practiceCanvasContainer = document.createElement('div');
        practiceCanvasContainer.className = 'practice-target-div';
        practiceTargetsWrapper.appendChild(practiceCanvasContainer);

        if (typeof HanziDrawing !== 'undefined' && typeof HanziDrawing.createDrawableCanvas === 'function') {
          const pCanvas = HanziDrawing.createDrawableCanvas(practiceCanvasContainer, {
            width: 130,
            height: 130,
            showClearButton: false, // Rendered in practice-controls below
            strokeColor: '#1976d2'
          });
          practiceCanvases.push({ canvas: pCanvas, char, container: practiceCanvasContainer });
        }
      });

      practiceBox.appendChild(practiceTargetsWrapper);

      // Practice Controls: Clear & Grade Buttons
      const practiceControls = document.createElement('div');
      practiceControls.className = 'practice-controls';

      const btnClear = document.createElement('button');
      btnClear.className = 'btn-clear-practice';
      btnClear.textContent = 'Clear';
      practiceControls.appendChild(btnClear);

      const btnGrade = document.createElement('button');
      btnGrade.className = 'btn-grade-practice';
      btnGrade.textContent = 'Grade Practice';
      practiceControls.appendChild(btnGrade);

      practiceBox.appendChild(practiceControls);

      const resultBadge = document.createElement('div');
      resultBadge.className = 'practice-result-badge';
      resultBadge.style.display = 'none';
      practiceBox.appendChild(resultBadge);

      btnClear.addEventListener('click', () => {
        practiceCanvases.forEach(itemObj => itemObj.canvas.clear());
        resultBadge.style.display = 'none';
      });

      btnGrade.addEventListener('click', async () => {
        const hasStrokes = practiceCanvases.some(itemObj => itemObj.canvas.getStrokes().length > 0);
        if (!hasStrokes) {
          resultBadge.style.display = 'block';
          resultBadge.className = 'practice-result-badge info';
          resultBadge.textContent = 'Draw on canvas before grading!';
          return;
        }

        btnGrade.disabled = true;
        btnGrade.textContent = 'Grading...';

        try {
          const charResults = [];
          for (const itemObj of practiceCanvases) {
            const strokes = itemObj.canvas.getStrokes();
            const res = await HanziDrawing.gradeCharacterDrawing(strokes, itemObj.char, { width: 130, height: 130, container: itemObj.container });
            charResults.push(res);
          }

          resultBadge.style.display = 'block';

          let totalScore = 0;
          let allCorrect = true;
          let hasReason = false;

          charResults.forEach(r => {
            totalScore += r.score;
            if (!r.correct) allCorrect = false;
            if (r.reason) hasReason = true;
          });

          const avgScore = totalScore / charResults.length;
          const pct = Math.round(avgScore * 100);

          if (hasReason) {
            resultBadge.className = 'practice-result-badge info';
            resultBadge.textContent = 'Practice Recorded ✅\n(Stroke shape guided)';
          } else if (allCorrect) {
            resultBadge.className = 'practice-result-badge pass';
            resultBadge.textContent = `Score: ${pct}% ✅ PASSED`;
          } else {
            resultBadge.className = 'practice-result-badge fail';
            resultBadge.textContent = `Score: ${pct}% ❌ NEEDS PRACTICE`;
          }
        } catch (err) {
          resultBadge.style.display = 'block';
          resultBadge.className = 'practice-result-badge info';
          resultBadge.textContent = 'Practice Recorded ✅';
        } finally {
          btnGrade.disabled = false;
          btnGrade.textContent = 'Grade Practice';
        }
      });

      dualContainer.appendChild(practiceBox);
      cardEl.appendChild(dualContainer);
      gridEl.appendChild(cardEl);
    });

    studyDrawView.appendChild(gridEl);
  }

  if (btnStudyListMode && btnStudyFlashcardMode && btnStudyDrawMode) {
    btnStudyListMode.addEventListener('click', () => {
      btnStudyListMode.classList.add('active');
      btnStudyFlashcardMode.classList.remove('active');
      btnStudyDrawMode.classList.remove('active');
      studyListView.style.display = 'block';
      studyFlashcardView.style.display = 'none';
      studyDrawView.style.display = 'none';
    });

    btnStudyFlashcardMode.addEventListener('click', () => {
      btnStudyFlashcardMode.classList.add('active');
      btnStudyListMode.classList.remove('active');
      btnStudyDrawMode.classList.remove('active');
      studyListView.style.display = 'none';
      studyFlashcardView.style.display = 'block';
      studyDrawView.style.display = 'none';
    });

    btnStudyDrawMode.addEventListener('click', () => {
      btnStudyDrawMode.classList.add('active');
      btnStudyListMode.classList.remove('active');
      btnStudyFlashcardMode.classList.remove('active');
      studyListView.style.display = 'none';
      studyFlashcardView.style.display = 'none';
      studyDrawView.style.display = 'block';

      if (!drawViewRendered && state.currentStudyData) {
        renderStudyDrawView(state.currentStudyData.data);
        drawViewRendered = true;
      }
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

  if (btnPrevStudyLevel) {
    btnPrevStudyLevel.addEventListener('click', () => {
      const stages = state.currentStudyStages;
      const prevIndex = state.currentStudyStageIndex - 1;
      if (stages && prevIndex >= 0 && prevIndex < stages.length) {
        const prevStage = stages[prevIndex];
        const trackTitle = getTrackTitle(state.currentStudyData.trackName, true);
        openStudyView(
          state.currentStudyData.trackName,
          prevStage.data,
          `${trackTitle} (${prevStage.title})`,
          stages,
          prevIndex
        );
      }
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

  // START QUIZ LOGIC (PINYIN)
  async function startQuiz(trackName, customDataSet = null, customTitle = null) {
    state.quizType = 'pinyin';
    state.currentTrack = trackName;
    state.submitted = false;
    state.drawingSubmitted = false;
    state.filledCount = 0;
    imeAlert.classList.remove('show');
    resultsBanner.style.display = 'none';
    quizActionBar.style.display = 'flex';
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'Submit Quiz';

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

  // START DRAWING QUIZ LOGIC
  async function startDrawingQuiz(trackName, customDataSet = null, customTitle = null) {
    state.quizType = 'drawing';
    state.currentTrack = trackName;
    state.drawingSubmitted = false;
    state.submitted = false;
    state.filledCount = 0;
    state.missedCards = [];
    state.drawingCanvasInstances = new Map();

    imeAlert.classList.remove('show');
    resultsBanner.style.display = 'none';
    quizActionBar.style.display = 'flex';
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'Submit Quiz';

    const cardData = customDataSet ? customDataSet : await loadDataset(trackName);
    state.currentCards = cardData;
    state.currentDrawingCards = cardData;
    state.currentQuizDataSet = cardData;
    state.currentQuizTitle = customTitle || (getTrackTitle(trackName, false) + ' Drawing');

    quizHeaderTitle.textContent = state.currentQuizTitle;
    quizHeaderCount.textContent = `0 / ${state.currentCards.length} Words`;
    quizProgressSummary.textContent = `Completed: 0 / ${state.currentCards.length} Cards`;

    renderDrawingCardGrid(cardData);
    showView('quiz');
  }

  // RENDER DRAWING CARD GRID
  function renderDrawingCardGrid(data) {
    cardGrid.innerHTML = '';
    state.drawingCanvasInstances.clear();

    data.forEach((item, index) => {
      const cardEl = document.createElement('div');
      cardEl.className = 'tofugu-card tofugu-drawing-card';
      cardEl.dataset.index = index;

      const displayPinyin = item.displayPinyin || (Array.isArray(item.pinyin) ? item.pinyin[0] : item.pinyin);

      const promptHeader = document.createElement('div');
      promptHeader.className = 'drawing-prompt-header';
      promptHeader.innerHTML = `
        <div class="drawing-prompt-pinyin">${displayPinyin || ''}</div>
        <div class="drawing-prompt-meaning">${item.meaning || ''}</div>
      `;
      cardEl.appendChild(promptHeader);

      const canvasesRow = document.createElement('div');
      canvasesRow.className = 'drawing-canvases-row';

      const characters = [...(item.character || '')];

      characters.forEach((char, charIdx) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'drawing-canvas-wrapper';

        const canvasBox = document.createElement('div');
        canvasBox.className = 'drawing-canvas-box';
        wrapper.appendChild(canvasBox);

        let canvasInst = null;
        if (typeof HanziDrawing !== 'undefined' && typeof HanziDrawing.createDrawableCanvas === 'function') {
          canvasInst = HanziDrawing.createDrawableCanvas(canvasBox, {
            width: 130,
            height: 130,
            showClearButton: false, // Dedicated Clear button rendered below in wrapper
            strokeColor: '#1976d2'
          });

          const key = `${index}-${charIdx}`;
          state.drawingCanvasInstances.set(key, {
            canvasInstance: canvasInst,
            character: char,
            cardIndex: index,
            charIndex: charIdx,
            container: canvasBox,
            canvasSize: 130
          });
        }

        const clearBtn = document.createElement('button');
        clearBtn.className = 'btn-clear-single-canvas';
        clearBtn.textContent = 'Clear';
        clearBtn.addEventListener('click', () => {
          if (canvasInst) canvasInst.clear();
        });
        wrapper.appendChild(clearBtn);

        canvasesRow.appendChild(wrapper);
      });

      cardEl.appendChild(canvasesRow);
      cardGrid.appendChild(cardEl);
    });
  }

  // RENDER CARD GRID (TOFUGU STYLE - PINYIN)
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
          <input type="text" class="card-input" data-index="${index}" placeholder="" autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false">
        </div>
      `;

      cardGrid.appendChild(cardEl);
    });

    attachCardInputListeners();
  }

  // TONE CANDIDATE BAR & INPUT HELPERS
  function commitActiveTone(input) {
    input.dataset.composing = 'false';
    input.classList.remove('composing');
    hideToneCandidateBar(input);
  }

  function applyToneToInput(input, targetTone) {
    const cursorPos = input.selectionStart ?? input.value.length;
    const info = getActiveSyllableInfo(input.value, cursorPos);
    if (!info) return;

    const targetVariant = info.variants.find(v => v.tone === targetTone);
    if (!targetVariant) return;

    const before = input.value.slice(0, info.syllableStart);
    const after = input.value.slice(info.syllableEnd);
    const newValue = before + targetVariant.text + after;
    const newCursor = info.syllableStart + targetVariant.text.length;

    input.value = newValue;
    input.setSelectionRange(newCursor, newCursor);

    renderToneCandidateBar(input);
    updateProgressCount();
  }

  function adjustToneBarPosition(input, bar) {
    if (!bar || !input) return;
    bar.style.left = '50%';
    bar.style.transform = 'translateX(-50%)';

    requestAnimationFrame(() => {
      if (bar.style.display === 'none') return;
      const rect = bar.getBoundingClientRect();
      const screenWidth = window.innerWidth || document.documentElement.clientWidth;
      const padding = 10; // Margin from screen boundaries

      let shiftX = 0;
      if (rect.left < padding) {
        // Cut off on the left -> shift right towards center
        shiftX = padding - rect.left;
      } else if (rect.right > screenWidth - padding) {
        // Cut off on the right -> shift left towards center
        shiftX = (screenWidth - padding) - rect.right;
      }

      if (shiftX !== 0) {
        bar.style.transform = `translateX(calc(-50% + ${Math.round(shiftX)}px))`;
      }
    });
  }

  function renderToneCandidateBar(input) {
    const wrapper = input.closest('.card-input-wrapper');
    if (!wrapper) return;

    let bar = wrapper.querySelector('.tone-candidate-bar');
    const cursorPos = input.selectionStart ?? input.value.length;
    const info = getActiveSyllableInfo(input.value, cursorPos);

    if (!info || !info.variants || info.variants.length === 0) {
      commitActiveTone(input);
      return;
    }

    // Active composing state with visual underline
    input.dataset.composing = 'true';
    input.classList.add('composing');

    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'tone-candidate-bar';
      wrapper.appendChild(bar);
    }

    bar.innerHTML = info.variants.map(v => `
      <button type="button" class="tone-pill ${v.tone === info.currentTone ? 'active' : ''}" data-tone="${v.tone}">
        <span class="tone-num">${v.tone}</span>
        <span class="tone-char">${v.text}</span>
      </button>
    `).join('') + `
      <button type="button" class="tone-pill tone-pill-confirm" data-action="confirm" title="Confirm tone">
        <span>✓ Done</span>
      </button>
    `;

    bar.style.display = 'flex';
    adjustToneBarPosition(input, bar);

    bar.querySelectorAll('.tone-pill').forEach(btn => {
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        const action = btn.getAttribute('data-action');
        if (action === 'confirm') {
          commitActiveTone(input);
          input.focus();
          return;
        }

        const toneNum = parseInt(btn.getAttribute('data-tone'), 10);
        applyToneToInput(input, toneNum);
        input.focus();
      });
    });
  }

  function hideToneCandidateBar(input) {
    const wrapper = input.closest('.card-input-wrapper');
    if (!wrapper) return;
    const bar = wrapper.querySelector('.tone-candidate-bar');
    if (bar) bar.style.display = 'none';
  }

  window.addEventListener('resize', () => {
    const activeInput = document.querySelector('.card-input.composing');
    if (activeInput) {
      const wrapper = activeInput.closest('.card-input-wrapper');
      const bar = wrapper ? wrapper.querySelector('.tone-candidate-bar') : null;
      if (bar) adjustToneBarPosition(activeInput, bar);
    }
  });

  // INPUT LISTENERS & AUTO ADVANCE FOCUS
  function attachCardInputListeners() {
    const inputs = cardGrid.querySelectorAll('.card-input');

    inputs.forEach((input, idx) => {
      // Live Pinyin tone number conversion & Hanzi detection
      input.addEventListener('input', (e) => {
        const rawVal = e.target.value;
        const converted = convertPinyinNumberToTone(rawVal);
        if (converted !== rawVal) {
          const start = input.selectionStart;
          const end = input.selectionEnd;
          const diff = converted.length - rawVal.length;
          input.value = converted;
          if (start !== null && end !== null) {
            const newCursor = Math.max(0, start + diff);
            input.setSelectionRange(newCursor, newCursor);
          }
        }

        const val = input.value;
        if (hasHanziInput(val)) {
          imeAlert.classList.add('show');
        } else {
          // Hide alert if no Hanzi in any input
          const anyHanzi = Array.from(inputs).some(inp => hasHanziInput(inp.value));
          if (!anyHanzi) imeAlert.classList.remove('show');
        }

        renderToneCandidateBar(input);
        updateProgressCount();
      });

      // Keydown Enter / Tab / Tone cycling navigation
      input.addEventListener('keydown', (e) => {
        // ArrowUp / ArrowDown to cycle through candidate tones while in composing mode
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          const cursorPos = input.selectionStart ?? input.value.length;
          const info = getActiveSyllableInfo(input.value, cursorPos);
          if (info) {
            e.preventDefault();
            let nextTone;
            if (e.key === 'ArrowUp') {
              nextTone = info.currentTone > 1 ? info.currentTone - 1 : 5;
            } else {
              nextTone = info.currentTone < 5 ? info.currentTone + 1 : 1;
            }
            applyToneToInput(input, nextTone);
            return;
          }
        }

        // Enter key handling
        if (e.key === 'Enter') {
          e.preventDefault();

          // If currently in composing mode: confirm and lock the current syllable tone!
          if (input.dataset.composing === 'true') {
            commitActiveTone(input);
            // Remains on current card so user can type the next syllable!
            return;
          }

          // If already confirmed (not composing): advance to next card
          commitActiveTone(input);
          const nextInput = inputs[idx + 1];
          if (nextInput) {
            nextInput.focus();
          } else {
            // Last card -> submit prompt or wrap focus
            btnSubmit.focus();
          }
        }
      });

      input.addEventListener('focus', () => {
        const card = input.closest('.tofugu-card');
        if (card) card.classList.add('is-active-card');
        renderToneCandidateBar(input);
      });

      input.addEventListener('blur', () => {
        const card = input.closest('.tofugu-card');
        if (card) card.classList.remove('is-active-card');
        setTimeout(() => {
          commitActiveTone(input);
        }, 150);
      });

      input.addEventListener('click', () => {
        renderToneCandidateBar(input);
      });

      input.addEventListener('keyup', (e) => {
        if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
          renderToneCandidateBar(input);
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
    if (state.submitted || state.drawingSubmitted) return;
    if (state.quizType === 'drawing') {
      gradeDrawingQuiz();
    } else {
      gradeQuiz();
    }
  });

  // GRADE DRAWING QUIZ ON SUBMIT
  async function gradeDrawingQuiz() {
    state.drawingSubmitted = true;
    state.submitted = true;
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Grading...';

    // Note: HanziDrawing.loadCharData caches character stroke data (checking CUSTOM_STROKE_DATABASE first,
    // then caching Promises/objects) so repeated characters across the batch don't re-fetch over the network.

    let totalCharsCount = 0;
    let totalCorrectCharsCount = 0;
    state.missedCards = [];

    for (let index = 0; index < state.currentCards.length; index++) {
      const item = state.currentCards[index];
      const characters = [...(item.character || '')];
      let isWordCorrect = true;

      for (let charIdx = 0; charIdx < characters.length; charIdx++) {
        const char = characters[charIdx];
        totalCharsCount++;

        const key = `${index}-${charIdx}`;
        const entry = state.drawingCanvasInstances.get(key);
        const strokes = entry ? entry.canvasInstance.getStrokes() : [];

        let res = { correct: false, score: 0 };
        const canvasSize = (entry && entry.canvasSize) ? entry.canvasSize : 130;
        try {
          res = await HanziDrawing.gradeCharacterDrawing(strokes, char, {
            width: canvasSize,
            height: canvasSize,
            container: entry ? entry.container : null
          });
        } catch (err) {
          console.error(`Grading error for char '${char}':`, err);
        }

        if (entry && entry.container) {
          const badge = document.createElement('div');
          badge.className = 'drawing-char-feedback';

          if (res.correct) {
            entry.container.classList.add('correct-drawing-canvas');
            badge.classList.add('correct');
            badge.textContent = `✓ ${Math.round(res.score * 100)}%`;
            totalCorrectCharsCount++;
          } else {
            entry.container.classList.add('incorrect-drawing-canvas');
            badge.classList.add('incorrect');
            badge.textContent = `✗ ${Math.round(res.score * 100)}%`;
            isWordCorrect = false;
          }
          entry.container.appendChild(badge);
        } else {
          if (res.correct) totalCorrectCharsCount++;
          else isWordCorrect = false;
        }
      }

      if (!isWordCorrect) {
        state.missedCards.push(item);
      }
    }

    const percentage = totalCharsCount > 0 ? Math.round((totalCorrectCharsCount / totalCharsCount) * 100) : 0;

    btnSubmit.disabled = false;
    btnSubmit.textContent = 'Submit Quiz';
    quizActionBar.style.display = 'none';

    showDrawingResultsBanner(totalCorrectCharsCount, totalCharsCount, percentage);
  }

  function showDrawingResultsBanner(correctChars, totalChars, percentage) {
    resultsScore.textContent = `${percentage}%`;
    resultsDetails.textContent = `${correctChars} of ${totalChars} characters drawn correctly across ${state.currentCards.length} words!`;

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

    setTimeout(() => {
      resultsBanner.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);
  }

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
      if (state.quizType === 'drawing') {
        startDrawingQuiz(state.currentTrack, state.missedCards, retryTitle);
      } else {
        startQuiz(state.currentTrack, state.missedCards, retryTitle);
      }
    }
  });

  btnRestartQuiz.addEventListener('click', () => {
    resultsBanner.style.display = 'none';
    if (state.quizType === 'drawing') {
      startDrawingQuiz(state.currentTrack, state.currentQuizDataSet, state.currentQuizTitle);
    } else {
      startQuiz(state.currentTrack, state.currentQuizDataSet, state.currentQuizTitle);
    }
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
