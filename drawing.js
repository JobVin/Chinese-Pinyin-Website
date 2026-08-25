/**
 * HanziDrawing - Shared Hanzi Writer Utility
 * Handles tracing (Learning Hub) and quiz (Practice Hub) modes for single and multi-character words.
 */
(function (window) {
  'use strict';

  function injectStyles() {
    if (document.getElementById('hanzi-drawing-styles')) return;
    const styleEl = document.createElement('style');
    styleEl.id = 'hanzi-drawing-styles';
    styleEl.textContent = `
      .hanzi-drawing-word-container {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
        gap: 16px;
        margin: 12px 0;
      }
      .hanzi-drawing-char-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        position: relative;
      }
      .hanzi-drawing-target {
        background: #ffffff;
        border: 2px solid #cbd5e1;
        border-radius: 12px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
        transition: all 0.25s ease;
        position: relative;
        overflow: hidden;
      }
      .hanzi-drawing-target.char-len-1 {
        width: 140px;
        height: 140px;
      }
      .hanzi-drawing-target.char-len-2 {
        width: 110px;
        height: 110px;
      }
      .hanzi-drawing-target.char-len-3 {
        width: 90px;
        height: 90px;
      }
      .hanzi-drawing-target.active-quiz {
        border-color: #1976d2;
        box-shadow: 0 0 0 4px rgba(25, 118, 210, 0.25);
      }
      .hanzi-drawing-target.completed-quiz {
        border-color: #2e7d32;
        background: #f0fdf4;
      }
      .hanzi-drawing-target.inactive-quiz {
        opacity: 0.5;
        pointer-events: none;
      }
      .hanzi-drawing-controls {
        display: flex;
        justify-content: center;
        gap: 10px;
        margin-top: 12px;
        width: 100%;
      }
      .btn-hanzi-animate {
        background: linear-gradient(135deg, #1976d2 0%, #0d47a1 100%);
        color: #ffffff;
        border: none;
        border-radius: 8px;
        padding: 8px 16px;
        font-family: inherit;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        box-shadow: 0 2px 6px rgba(25, 118, 210, 0.3);
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      }
      .btn-hanzi-animate:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(25, 118, 210, 0.4);
      }
      .btn-hanzi-animate:active {
        transform: translateY(0);
      }
    `;
    document.head.appendChild(styleEl);
  }

  /**
   * Render word drawer in 'trace' or 'quiz' mode.
   *
   * @param {HTMLElement} containerEl - Container element to render into.
   * @param {string} characterString - String of characters (e.g. "爱" or "学校").
   * @param {'trace'|'quiz'} mode - Mode of operation.
   * @param {Object} [options] - HanziWriter customization options.
   * @returns {Object} { writers, charPromises, wordPromise, container }
   */
  function renderWordDrawer(containerEl, characterString, mode = 'trace', options = {}) {
    if (!containerEl) {
      throw new Error('HanziDrawing.renderWordDrawer: containerEl is required.');
    }
    if (typeof HanziWriter === 'undefined') {
      throw new Error('HanziWriter library is not loaded. Please load hanzi-writer.min.js first.');
    }

    injectStyles();
    containerEl.innerHTML = '';

    const characters = [...(characterString || '')];
    if (characters.length === 0) {
      return { writers: [], charPromises: [], wordPromise: Promise.resolve([]), container: containerEl };
    }

    const wordWrapper = document.createElement('div');
    wordWrapper.className = 'hanzi-drawing-word-container';
    containerEl.appendChild(wordWrapper);

    const lenClass = characters.length >= 3 ? 'char-len-3' : (characters.length === 2 ? 'char-len-2' : 'char-len-1');

    let targetSize = 140;
    if (options.width && options.height) {
      targetSize = options.width;
    } else if (characters.length === 2) {
      targetSize = 110;
    } else if (characters.length >= 3) {
      targetSize = 90;
    }

    const leniencyValue = options.leniency !== undefined ? options.leniency : 1.6;
    const showHintAfterMissesValue = options.showHintAfterMisses !== undefined ? options.showHintAfterMisses : 3;

    const writers = [];
    const charResolvers = [];
    const charPromises = characters.map(() => {
      let resolver;
      const promise = new Promise((resolve) => {
        resolver = resolve;
      });
      charResolvers.push(resolver);
      return promise;
    });

    const wordPromise = Promise.all(charPromises);

    const charDivs = characters.map((char, index) => {
      const charWrapper = document.createElement('div');
      charWrapper.className = 'hanzi-drawing-char-wrapper';

      const targetDiv = document.createElement('div');
      targetDiv.className = `hanzi-drawing-target ${lenClass}`;
      if (mode === 'quiz' && index > 0) {
        targetDiv.classList.add('inactive-quiz');
      }

      targetDiv.style.width = `${targetSize}px`;
      targetDiv.style.height = `${targetSize}px`;

      charWrapper.appendChild(targetDiv);
      wordWrapper.appendChild(charWrapper);

      return { char, targetDiv, index };
    });

    if (mode === 'trace') {
      charDivs.forEach(({ char, targetDiv }) => {
        const writerOptions = Object.assign(
          {
            width: targetSize,
            height: targetSize,
            padding: 5,
            showOutline: true,
            showCharacter: false,
            strokeAnimationSpeed: 1,
            delayBetweenStrokes: 200,
            strokeColor: '#1e293b',
            outlineColor: '#cbd5e1'
          },
          options
        );

        const writer = HanziWriter.create(targetDiv, char, writerOptions);
        writers.push(writer);
      });

      const controlsDiv = document.createElement('div');
      controlsDiv.className = 'hanzi-drawing-controls';

      const animateBtn = document.createElement('button');
      animateBtn.className = 'btn-hanzi-animate';
      animateBtn.innerHTML = '<span>▶</span> Animate Stroke Order';

      let isAnimating = false;
      animateBtn.addEventListener('click', async () => {
        if (isAnimating) return;
        isAnimating = true;
        animateBtn.disabled = true;
        animateBtn.style.opacity = '0.7';

        for (const writer of writers) {
          await new Promise((resolve) => writer.animateCharacter({ onComplete: resolve }));
        }

        isAnimating = false;
        animateBtn.disabled = false;
        animateBtn.style.opacity = '1';
      });

      controlsDiv.appendChild(animateBtn);
      containerEl.appendChild(controlsDiv);

    } else if (mode === 'quiz') {
      const runQuizForIndex = (index) => {
        if (index >= characters.length) return;

        const { char, targetDiv } = charDivs[index];

        targetDiv.classList.remove('inactive-quiz');
        targetDiv.classList.add('active-quiz');

        const writerOptions = Object.assign(
          {
            width: targetSize,
            height: targetSize,
            padding: 5,
            showOutline: false,
            showCharacter: false,
            leniency: leniencyValue,
            showHintAfterMisses: showHintAfterMissesValue,
            strokeColor: '#1976d2',
            drawingWidth: 20
          },
          options
        );

        const writer = HanziWriter.create(targetDiv, char, writerOptions);
        writers[index] = writer;

        let mistakeCount = 0;

        const quizConfig = Object.assign(
          {
            leniency: leniencyValue,
            showHintAfterMisses: showHintAfterMissesValue,
            onMistake: (strokeData) => {
              mistakeCount++;
              if (typeof options.onMistake === 'function') {
                options.onMistake(strokeData, char, index);
              }
            },
            onComplete: (summary) => {
              targetDiv.classList.remove('active-quiz');
              targetDiv.classList.add('completed-quiz');

              const totalMistakes = (summary && typeof summary.totalMistakes === 'number')
                ? summary.totalMistakes
                : mistakeCount;
              const strokeCount = (summary && typeof summary.strokeCount === 'number')
                ? summary.strokeCount
                : (writer._char ? writer._char.strokes.length : 0);

              const charResult = {
                character: char,
                strokeCount: strokeCount,
                totalMistakes: totalMistakes
              };

              if (typeof options.onCharacterComplete === 'function') {
                options.onCharacterComplete(charResult, index);
              }

              charResolvers[index](charResult);

              if (index + 1 < characters.length) {
                runQuizForIndex(index + 1);
              }
            }
          },
          options.quizOptions || {}
        );

        writer.quiz(quizConfig);
      };

      runQuizForIndex(0);
    }

    return {
      writers,
      charPromises,
      wordPromise,
      container: containerEl
    };
  }

  /**
   * Run word quiz across all characters in a word and call onWordComplete(wordResult).
   *
   * @param {HTMLElement} containerEl - Container element to render into.
   * @param {string} characterString - String of characters (e.g. "学校").
   * @param {Function} onWordComplete - Callback invoked when all character quizzes complete.
   * @param {Object} [options] - HanziWriter options.
   * @returns {Promise<Object>} Resolves with wordResult object.
   */
  function runWordQuiz(containerEl, characterString, onWordComplete, options = {}) {
    const drawer = renderWordDrawer(containerEl, characterString, 'quiz', options);

    return drawer.wordPromise.then((perCharacterResults) => {
      let totalStrokes = 0;
      let totalMistakes = 0;

      perCharacterResults.forEach((res) => {
        totalStrokes += res.strokeCount || 0;
        totalMistakes += res.totalMistakes || 0;
      });

      const wordResult = {
        characterString: characterString,
        totalStrokes: totalStrokes,
        totalMistakes: totalMistakes,
        perCharacter: perCharacterResults
      };

      if (typeof onWordComplete === 'function') {
        onWordComplete(wordResult);
      }

      return wordResult;
    });
  }

  window.HanziDrawing = {
    renderWordDrawer: renderWordDrawer,
    runWordQuiz: runWordQuiz
  };

})(window);
