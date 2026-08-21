# Mandarin Hanzi & Pinyin Practice Hub 汉字练习

An interactive web application designed for active recall practice of Mandarin Chinese characters, basic strokes, essential radicals, and HSK vocabulary levels.

---

## Key Features

- **Decoupled JSON Assets**: All practice datasets (`strokes`, `radicals`, `hsk1`, `hsk2`, `hsk3`) are stored in structured `.json` assets and loaded asynchronously on demand.
- **Strict Active Recall Pinyin Input**:
  - **Tone Marks**: `pǔtōnghuà`
  - **Numbered Tones**: `pu3tong1hua4`
  - **Neutral Tones**: Syllables with a neutral tone require no tone mark or number (e.g. `de`, `le`).
- **Chinese Polyphone Matching**: Correctly matches characters with multiple pronunciations (e.g. 长 accepts `cháng`, `chang2`, `zhǎng`, `zhang3`).
- **Level Chunking**: HSK vocabulary datasets are divided into bite-sized 15-word chunks for focused practice without overload.
- **Learning Hub & Practice Hub**: Study mode (List & Flashcards with answer reveals) and Practice mode (active recall quizzes with instant scoring & retry for missed cards).
- **Instant Visual Feedback**: Card input highlighting, correct answer displays, IME input detection alerts, and score summaries.

---

## Datasets Overview

| Practice Track | Data File | Items / Vocabulary |
| :--- | :--- | :--- |
| **Character Strokes** | [`data/strokes.json`](data/strokes.json) | 29 Standard Stroke Symbols |
| **Essential Radicals** | [`data/radicals.json`](data/radicals.json) | 16 Building Block Radicals |
| **HSK Level 1** | [`data/hsk1.json`](data/hsk1.json) | 151 Vocabulary Words (11 Levels / 13 Categories) |
| **HSK Level 2** | [`data/hsk2.json`](data/hsk2.json) | 144 Vocabulary Words (10 Levels) |
| **HSK Level 3** | [`data/hsk3.json`](data/hsk3.json) | 330 Vocabulary Words (22 Levels) |

> *HSK vocabulary data is sourced from official HSK 2.0 wordlists and CC-CEDICT.*

---

## Known Grammar Pattern Gaps (Future Feature)

The following multi-part grammatical structure rows from official MandarinBean lists are excluded from single-word vocabulary datasets and documented here for a potential future "Grammar Patterns" practice module:

- **HSK 2 #24**: `因为……所以……` (`yīnwèi...suǒyǐ…` - because…so…)
- **HSK 2 #25**: `虽然……但是……` (`suīrán…dànshì…` - although…but…)
- **HSK 3 #61**: `不但……而且……` (`búdàn...érqiě…` - not only…but also…)
- **HSK 3 #285**: `只有……才……` (`zhǐyǒu…cái…` - only if)

---

## Project Structure

```
.
├── data/                  # Asynchronously loaded dataset assets
│   ├── strokes.json
│   ├── radicals.json
│   ├── hsk1.json
│   ├── hsk2.json
│   └── hsk3.json
├── docs/                  # Reference documents & vocabulary PDFs
│   └── pdf/               # HSK vocabulary PDFs (HSK 1, 2, and 3)
├── scripts/               # Core maintenance, auditing, and builder scripts
│   ├── audit_characters.js       # Character field cleanliness auditor
│   ├── build_hsk_datasets.js     # Dataset builder for HSK 1, 2 & 3
│   ├── fix_datasets_and_variants.js # Pinyin polyphone variant generator
│   ├── test_validation.js        # Validation test runner for all datasets
│   ├── audits/                   # Source auditing & diff report scripts
│   └── reconciliation/           # One-off data reconciliation & patch scripts
├── app.js                 # Application router, study renderers & Pinyin matching engine
├── index.html             # Main application template & modal UI
├── package.json           # NPM package manifest & script runners
├── styles.css             # Glassmorphism design system & dynamic layout styles
└── README.md              # Project documentation
```

---

## Getting Started & Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/JobVin/Chinese-Pinyin-Website.git
   cd Chinese-Pinyin-Website
   ```

2. **Run Validation & Auditing Tests**:
   ```bash
   npm test          # Validates dataset integrity and Pinyin match logic
   npm run audit     # Audits character field data integrity
   ```

3. **Serve the project locally**:
   You can use any static server, for example Node's `serve`:
   ```bash
   npx serve .
   ```
   Open `http://localhost:3000` in your web browser.

---

## Deployment (GitHub Pages)

This project is built with vanilla HTML, CSS, and JS using static JSON assets, making it 100% compatible with GitHub Pages:

1. Go to your GitHub Repository -> **Settings** -> **Pages**.
2. Under **Branch**, select `main` and `/ (root)`.
3. Click **Save**.
