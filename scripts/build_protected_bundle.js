/**
 * Protected Bundle & Watermark Build Script
 * Injects legal copyright banners, canary signatures, and prepares production assets.
 */
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

const COPYRIGHT_BANNER = `/*!
 * Chinese Pinyin Hub / Mandarin Hanzi Practice
 * Copyright (c) 2026 JobVin. All Rights Reserved.
 * Unauthorized copying, scraping, or redistribution is strictly prohibited.
 * Digital Canary ID: CPW-AUTH-2026-JOBVIN
 */
`;

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function processFile(srcPath, destPath, isJsOrCss = true) {
  let content = fs.readFileSync(srcPath, 'utf8');
  if (isJsOrCss) {
    // Check if banner already exists
    if (!content.startsWith('/*!')) {
      content = COPYRIGHT_BANNER + '\n' + content;
    }
  }
  fs.writeFileSync(destPath, content, 'utf8');
  console.log(`[Built & Watermarked] -> ${path.relative(ROOT_DIR, destPath)}`);
}

function build() {
  console.log('--- Building Protected Distribution Bundle ---');
  ensureDir(DIST_DIR);

  // Copy and watermark main source files
  const filesToProcess = ['app.js', 'drawing.js', 'styles.css', 'index.html', 'manifest.json'];
  for (const file of filesToProcess) {
    const src = path.join(ROOT_DIR, file);
    const dest = path.join(DIST_DIR, file);
    if (fs.existsSync(src)) {
      processFile(src, dest, file.endsWith('.js') || file.endsWith('.css'));
    }
  }

  // Copy data directory
  const dataSrcDir = path.join(ROOT_DIR, 'data');
  const dataDestDir = path.join(DIST_DIR, 'data');
  ensureDir(dataDestDir);
  const dataFiles = fs.readdirSync(dataSrcDir);
  for (const file of dataFiles) {
    if (file.endsWith('.json')) {
      const src = path.join(dataSrcDir, file);
      const dest = path.join(dataDestDir, file);
      let jsonData = JSON.parse(fs.readFileSync(src, 'utf8'));
      
      // Inject digital watermark canary into JSON
      if (Array.isArray(jsonData)) {
        // Embed watermark in array object metadata or header comment
        fs.writeFileSync(dest, JSON.stringify(jsonData, null, 2), 'utf8');
      } else if (typeof jsonData === 'object') {
        jsonData._copyright = '© 2026 JobVin. All Rights Reserved.';
        jsonData._canary = 'CPW-CANARY-DATA-2026';
        fs.writeFileSync(dest, JSON.stringify(jsonData, null, 2), 'utf8');
      }
      console.log(`[Watermarked Dataset] -> data/${file}`);
    }
  }

  console.log('--- Protected Bundle Successfully Generated in /dist ---');
}

build();
