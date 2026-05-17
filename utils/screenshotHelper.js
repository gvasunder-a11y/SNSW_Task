const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(
  process.cwd(),
  'test-results',
  'screenshots'
);

function ensureDirectoryExists(directory) {
  // Create artifact folders lazily so local runs do not require manual setup.
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

function sanitizeFileName(value) {
  // Step names can contain spaces or test data; convert them into safe file names.
  return value
    .replace(/[^a-zA-Z0-9-_\.]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 100);
}

async function capture(page, stepName) {
  // Step screenshots are opt-in because live browser/font loading can slow Firefox/WebKit.
  // Playwright still captures failure screenshots through the main config.
  if (process.env.CAPTURE_STEP_SCREENSHOTS !== 'true') {
    return null;
  }

  try {
    ensureDirectoryExists(SCREENSHOT_DIR);

    // Timestamp and process id keep screenshot names unique across repeated test runs.
    const filename =
      `${Date.now()}-${process.pid}-${sanitizeFileName(stepName)}.png`;

    const filePath = path.join(SCREENSHOT_DIR, filename);

    // Use a viewport screenshot to keep artifacts small and reduce timeout risk.
    await page.screenshot({
      path: filePath,
      fullPage: false,
      animations: 'disabled',
      timeout: 5000
    });

    return filePath;
  } catch (error) {
    // Screenshot failure is diagnostic-only and should not fail business assertions.
    console.warn(`Screenshot capture failed for "${stepName}": ${error.message}`);
    return null;
  }
}

module.exports = {
  capture,
};
