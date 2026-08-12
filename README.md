# Mandarin Hanzi & Pinyin Practice Hub 汉字练习

An interactive, web application designed for active recall practice of Mandarin Chinese characters, basic strokes, essential radicals, and HSK vocabulary levels.

---

## Key Features

- **Decoupled JSON Assets**: All practice datasets (`strokes`, `radicals`, `hsk1`, `hsk2`, `hsk3`) are stored in structured `.json` assets and loaded on demand.
- **Flexible Pinyin Input Support**:
  - **Tone Marks**: `pǔtōnghuà`
  - **Plain Pinyin**: `putonghua`
  - **Numbered Tones**: `pu3tong1hua4`
- **Chinese Polyphone Matching**: Correctly matches characters with multiple pronunciations (e.g. 长 accepts `cháng`, `chang`, `chang2`, `zhǎng`, `zhang`, and `zhang3`).
- **Level Chunking**: HSK vocabulary datasets are divided into 15-word chunks for focused, bite-sized practice without overload.
- **Instant Visual Feedback**: Card input highlighting, correct answer displays, and progress summaries.

---

## Datasets Overview

| Practice Track | Data File | Items / Vocabulary |
| :--- | :--- | :--- |
| **Character Strokes** | [`data/strokes.json`](data/strokes.json) | 10 Basic Strokes |
| **Essential Radicals** | [`data/radicals.json`](data/radicals.json) | 16 Building Block Radicals |
| **HSK Level 1** | [`data/hsk1.json`](data/hsk1.json) | 300 Vocabulary Words (20 Levels) |
| **HSK Level 2** | [`data/hsk2.json`](data/hsk2.json) | 300 Vocabulary Words (20 Levels) |
| **HSK Level 3** | [`data/hsk3.json`](data/hsk3.json) | 300 Vocabulary Words (20 Levels) |

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
├── scripts/               # Maintenance and utility scripts
│   ├── export_hsk.js      # Utility script to re-export datasets to JSON
│   └── test_validation.js # Validation simulation test runner
├── app.js                 # Application router, async fetcher & matching logic
├── index.html             # Main application template
└── styles.css             # Custom application design & layout
```

---

## Getting Started Locally

1. **Clone the repository**:
   ```bash
   git clone https://github.com/JobVin/Chinese-Pinyin-Website.git
   cd Chinese-Pinyin-Website
   ```

2. **Serve the project locally**:
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
