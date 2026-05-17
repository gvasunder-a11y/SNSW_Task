const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(process.cwd(), 'test-results', 'screenshots');

function ensureDirectoryExists(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

function sanitizeFileName(value) {
  return value
    .replace(/[^a-zA-Z0-9-_\.]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 100);
}

async function capture(page, stepName) {
  ensureDirectoryExists(SCREENSHOT_DIR);
  const filename = `${Date.now()}-${process.pid}-${sanitizeFileName(stepName)}.png`;
  const filePath = path.join(SCREENSHOT_DIR, filename);
  await page.screenshot({ path: filePath, fullPage: true });
  return filePath;
}

module.exports = {
  capture,
};
