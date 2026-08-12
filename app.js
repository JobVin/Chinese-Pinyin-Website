/**
 * Mandarin Practice Hub - Main Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // APP STATE
  const state = {
    currentTrack: 'hsk1',
    batchSize: '50',
    currentCards: [],
    missedCards: [],
    submitted: false,
    filledCount: 0
  };

  // DOM ELEMENTS
  const hubView = document.getElementById('hub-view');
  const quizView = document.getElementById('quiz-view');
  const btnHome = document.getElementById('btn-home');
  const brandLink = document.getElementById('brand-link');
  
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
   * Fail-proof validation of user input against a card's pinyin array.
   * Uses Array.prototype.some() to check exact tone, plain pinyin, or numbered pinyin variants.
   * 
   * @param {string} userInput - Text entered by the user.
   * @param {string[]} cardPinyinArray - Array of valid pinyin variants for the card.
   * @returns {boolean} True if user input matches any variant in the array.
   */
  function validateUserAnswer(userInput, cardPinyinArray) {
    if (!userInput || !Array.isArray(cardPinyinArray) || cardPinyinArray.length === 0) {
      return false;
    }

    const cleanedInput = userInput.trim().toLowerCase();

    return cardPinyinArray.some(pinyinVariant => {
      return String(pinyinVariant).trim().toLowerCase() === cleanedInput;
    });
  }

  // Expose globally for module/component access and terminal testing
  window.validateUserAnswer = validateUserAnswer;

  function removeToneMarks(str) {
    if (!str) return '';
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ü/g, 'v')
      .replace(/v3/g, 'v')
      .toLowerCase();
  }

  function cleanString(str) {
    if (!str) return '';
    return str
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '')
      .replace(/[1-5]/g, '');
  }

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

  function getTrackTitle(trackName) {
    switch (trackName) {
      case 'strokes': return 'Character Strokes Quiz';
      case 'radicals': return 'Essential Radicals Quiz';
      case 'hsk1': return 'HSK 1 Character Quiz';
      case 'hsk2': return 'HSK 2 Character Quiz';
      case 'hsk3': return 'HSK 3 Character Quiz';
      default: return 'Character Quiz';
    }
  }

  // NAVIGATION ROUTER
  function showView(viewName) {
    if (viewName === 'hub') {
      hubView.classList.add('active');
      quizView.classList.remove('active');
      btnHome.style.display = 'none';
      resultsBanner.style.display = 'none';
      stageModal.classList.remove('show');
      quitModal.classList.remove('show');
    } else if (viewName === 'quiz') {
      hubView.classList.remove('active');
      quizView.classList.add('active');
      btnHome.style.display = 'flex';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // START QUIZ / STAGE SELECTION FROM HUB
  trackCards.forEach(card => {
    card.addEventListener('click', async () => {
      const track = card.dataset.track;
      const fullData = await loadDataset(track);
      const stages = getDatasetStagesFromData(fullData, track, 15);
      if (stages.length === 1) {
        startQuiz(track, stages[0].data, getTrackTitle(track));
      } else {
        openStageModal(track, stages);
      }
    });
  });

  function openStageModal(trackName, stages) {
    stageModalTitle.textContent = `${getTrackTitle(trackName)} - Select Level`;
    stageGrid.innerHTML = '';

    stages.forEach(stage => {
      const btn = document.createElement('button');
      btn.className = 'stage-card-btn';
      btn.innerHTML = `
        <div class="stage-card-title">${stage.title}</div>
        <div class="stage-card-sub">${stage.subTitle}</div>
      `;
      btn.addEventListener('click', () => {
        stageModal.classList.remove('show');
        startQuiz(trackName, stage.data, `${getTrackTitle(trackName)} (${stage.title})`);
      });
      stageGrid.appendChild(btn);
    });

    stageModal.classList.add('show');
  }

  btnCloseStageModal.addEventListener('click', () => {
    stageModal.classList.remove('show');
  });

  btnHome.addEventListener('click', () => showView('hub'));
  brandLink.addEventListener('click', (e) => {
    e.preventDefault();
    showView('hub');
  });

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

    // Update Banner Titles
    quizHeaderTitle.textContent = customTitle ? customTitle : getTrackTitle(trackName);
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

      cardEl.innerHTML = `
        <div class="card-hanzi">${item.character}</div>
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

      if (isCorrect) {
        correctCount++;
        cardEl.classList.add('correct');
      } else {
        cardEl.classList.add('incorrect');
        state.missedCards.push(item);

        // Add correct answer feedback box
        const displayPinyin = item.displayPinyin || (Array.isArray(item.pinyin) ? item.pinyin[0] : item.pinyin);
        const feedbackEl = document.createElement('div');
        feedbackEl.className = 'card-feedback';
        feedbackEl.innerHTML = `
          <div class="feedback-pinyin">${displayPinyin || ''}</div>
          <div class="feedback-meaning">${item.meaning || ''}</div>
        `;
        cardEl.appendChild(feedbackEl);
      }
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
      startQuiz(state.currentTrack, state.missedCards);
    }
  });

  btnRestartQuiz.addEventListener('click', () => {
    resultsBanner.style.display = 'none';
    startQuiz(state.currentTrack);
  });

  btnResultsHub.addEventListener('click', () => {
    resultsBanner.style.display = 'none';
    showView('hub');
  });

  btnQuit.addEventListener('click', () => {
    quitModal.classList.add('show');
  });

  btnCancelQuit.addEventListener('click', () => {
    quitModal.classList.remove('show');
  });

  btnConfirmQuit.addEventListener('click', () => {
    quitModal.classList.remove('show');
    showView('hub');
  });

});
