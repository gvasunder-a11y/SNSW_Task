const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = path.join(process.cwd(), 'test-results');
const SCREENSHOT_DIR = path.join(ARTIFACT_DIR, 'screenshots');
const MANIFEST_PATH = path.join(ARTIFACT_DIR, 'screenshot-manifest.json');
const REVIEW_DOCUMENT_PATH = path.join(ARTIFACT_DIR, 'screenshot-review.html');
const SCREENSHOT_TIMEOUT_MS = Number(
  process.env.SCREENSHOT_TIMEOUT_MS || 30000
);

const screenshotCounterByTest = new Map();

function ensureDirectoryExists(directory) {
  // Create artifact folders so local runs do not require manual setup.
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

function sanitizeFileName(value) {
  return String(value || 'unnamed')
    .replace(/[^a-zA-Z0-9-_\.]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 100) || 'unnamed';
}

function hashValue(value) {
  let hash = 0;
  const text = String(value || '');

  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) - hash) + text.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash).toString(36);
}

function toPosixPath(value) {
  return value.replace(/\\/g, '/');
}

function toArtifactRelativePath(filePath) {
  return toPosixPath(path.relative(ARTIFACT_DIR, filePath));
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function readManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    return {
      generatedAt: null,
      tests: []
    };
  }

  try {
    return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  } catch (error) {
    return {
      generatedAt: null,
      tests: []
    };
  }
}

function writeManifest(manifest) {
  ensureDirectoryExists(ARTIFACT_DIR);
  fs.writeFileSync(
    MANIFEST_PATH,
    JSON.stringify({
      ...manifest,
      generatedAt: new Date().toISOString()
    }, null, 2),
    'utf8'
  );
}

function getTitlePath(testInfo) {
  if (!testInfo) {
    return [];
  }

  if (typeof testInfo.titlePath === 'function') {
    return testInfo.titlePath();
  }

  if (Array.isArray(testInfo.titlePath)) {
    return testInfo.titlePath;
  }

  return [testInfo.title].filter(Boolean);
}

function getProjectName(testInfo) {
  return testInfo?.project?.name || 'unknown-project';
}

function getSpecPath(testInfo) {
  if (!testInfo?.file) {
    return '';
  }

  return toPosixPath(path.relative(process.cwd(), testInfo.file));
}

function isAccessibilityTest(testInfo) {
  return getSpecPath(testInfo).includes('tests/accessibility/');
}

function getTestTitle(testInfo) {
  return testInfo?.title || 'Ungrouped screenshots';
}

function getTestIdentity(testInfo) {
  const projectName = getProjectName(testInfo);
  const specPath = getSpecPath(testInfo);
  const title = getTestTitle(testInfo);
  const titlePath = getTitlePath(testInfo).join(' > ');
  const id = [
    projectName,
    specPath,
    titlePath || title
  ].filter(Boolean).join(' > ');
  const folder = [
    sanitizeFileName(projectName),
    sanitizeFileName(title),
    hashValue(id)
  ].join('-');

  return {
    id,
    folder,
    projectName,
    specPath,
    title,
    titlePath
  };
}

function upsertTestCase(manifest, testInfo) {
  const identity = getTestIdentity(testInfo);
  let testCase = manifest.tests.find((item) => item.id === identity.id);

  if (!testCase) {
    testCase = {
      id: identity.id,
      folder: identity.folder,
      project: identity.projectName,
      title: identity.title,
      titlePath: identity.titlePath,
      spec: identity.specPath,
      status: 'running',
      expectedStatus: testInfo?.expectedStatus || 'passed',
      duration: 0,
      errors: [],
      screenshots: []
    };
    manifest.tests.push(testCase);
  } else {
    testCase.project = identity.projectName;
    testCase.title = identity.title;
    testCase.titlePath = identity.titlePath;
    testCase.spec = identity.specPath;
    testCase.expectedStatus = testInfo?.expectedStatus || testCase.expectedStatus;
  }

  return testCase;
}

function getNextScreenshotSequence(testInfo, testCase) {
  const identity = getTestIdentity(testInfo);
  const currentCount =
    screenshotCounterByTest.get(identity.id) || testCase.screenshots.length;
  const nextCount = currentCount + 1;
  screenshotCounterByTest.set(identity.id, nextCount);
  return nextCount;
}

function formatDuration(milliseconds) {
  if (!milliseconds) {
    return 'n/a';
  }

  const seconds = milliseconds / 1000;
  return `${seconds.toFixed(seconds >= 10 ? 0 : 1)}s`;
}

function buildStatusClass(status, expectedStatus) {
  if (!status || status === 'running') {
    return 'running';
  }

  return status === expectedStatus ? 'passed' : 'failed';
}

function buildReviewHtml(manifest) {
  const tests = [...(manifest.tests || [])].sort((left, right) => {
    const leftKey = `${left.project} ${left.spec} ${left.title}`;
    const rightKey = `${right.project} ${right.spec} ${right.title}`;
    return leftKey.localeCompare(rightKey);
  });
  const screenshotCount = tests.reduce(
    (count, testCase) => count + testCase.screenshots.length,
    0
  );
  const generatedAt = manifest.generatedAt
    ? new Date(manifest.generatedAt).toLocaleString()
    : new Date().toLocaleString();

  const navItems = tests.map((testCase, index) => {
    const anchor = `test-${index + 1}`;
    return [
      '<li>',
      `<a href="#${anchor}">${escapeHtml(testCase.project)}: ${escapeHtml(testCase.title)}</a>`,
      `<span>${testCase.screenshots.length} screenshots</span>`,
      '</li>'
    ].join('');
  }).join('\n');

  const sections = tests.map((testCase, index) => {
    const anchor = `test-${index + 1}`;
    const statusClass = buildStatusClass(
      testCase.status,
      testCase.expectedStatus
    );
    const screenshots = testCase.screenshots.map((screenshot) => [
      '<figure>',
      '<figcaption>',
      `<span>${String(screenshot.sequence).padStart(2, '0')}</span>`,
      `<strong>${escapeHtml(screenshot.step)}</strong>`,
      `<small>${escapeHtml(screenshot.url || '')}</small>`,
      '</figcaption>',
      `<a href="${escapeHtml(screenshot.path)}" target="_blank" rel="noreferrer">`,
      `<img src="${escapeHtml(screenshot.path)}" alt="${escapeHtml(`${testCase.title} - ${screenshot.step}`)}" loading="lazy">`,
      '</a>',
      '</figure>'
    ].join('')).join('\n');
    const errorBlock = (testCase.errors || []).length > 0
      ? [
        '<details class="errors">',
        '<summary>Errors</summary>',
        '<pre>',
        escapeHtml(testCase.errors.join('\n\n')),
        '</pre>',
        '</details>'
      ].join('')
      : '';

    return [
      `<section id="${anchor}">`,
      '<header>',
      `<h2>${escapeHtml(testCase.title)}</h2>`,
      '<div class="meta">',
      `<span class="badge ${statusClass}">${escapeHtml(testCase.status || 'running')}</span>`,
      `<span>${escapeHtml(testCase.project)}</span>`,
      `<span>${escapeHtml(testCase.spec || 'spec unavailable')}</span>`,
      `<span>${formatDuration(testCase.duration)}</span>`,
      '</div>',
      '</header>',
      errorBlock,
      screenshots || '<p class="empty">No screenshots were captured for this test.</p>',
      '</section>'
    ].join('\n');
  }).join('\n');

  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<title>Service NSW Test Screenshot Review</title>',
    '<style>',
    ':root { color-scheme: light; --text: #1b1f24; --muted: #5b6470; --line: #d9dee7; --page: #f6f8fb; --panel: #ffffff; --accent: #146c94; --pass: #137333; --fail: #b3261e; --run: #8a5a00; }',
    '* { box-sizing: border-box; }',
    'body { margin: 0; font-family: Arial, Helvetica, sans-serif; background: var(--page); color: var(--text); }',
    'main { width: min(1440px, calc(100% - 32px)); margin: 0 auto; padding: 24px 0 48px; }',
    'h1 { margin: 0 0 8px; font-size: 28px; line-height: 1.2; letter-spacing: 0; }',
    'h2 { margin: 0; font-size: 22px; line-height: 1.25; letter-spacing: 0; }',
    'p { margin: 0; color: var(--muted); }',
    '.summary { display: flex; flex-wrap: wrap; gap: 8px; margin: 16px 0 24px; }',
    '.summary span, .meta span { border: 1px solid var(--line); border-radius: 6px; background: var(--panel); padding: 6px 9px; font-size: 13px; color: var(--muted); }',
    'nav { margin: 0 0 24px; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); }',
    'nav h2 { padding: 14px 16px 0; font-size: 16px; }',
    'nav ol { margin: 0; padding: 8px 16px 14px 34px; }',
    'nav li { margin: 8px 0; padding-right: 8px; }',
    'nav a { color: var(--accent); font-weight: 700; text-decoration: none; }',
    'nav a:hover { text-decoration: underline; }',
    'nav span { margin-left: 8px; color: var(--muted); font-size: 13px; }',
    'section { margin: 0 0 28px; padding: 18px; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); }',
    'section header { display: grid; gap: 10px; margin-bottom: 16px; }',
    '.meta { display: flex; flex-wrap: wrap; gap: 8px; }',
    '.meta .badge { color: #fff; border-color: transparent; font-weight: 700; text-transform: uppercase; }',
    '.badge.passed { background: var(--pass); }',
    '.badge.failed { background: var(--fail); }',
    '.badge.running { background: var(--run); }',
    'figure { margin: 0 0 22px; border: 1px solid var(--line); border-radius: 8px; overflow: hidden; background: #fff; }',
    'figcaption { display: grid; grid-template-columns: auto 1fr; gap: 4px 10px; align-items: start; padding: 10px 12px; border-bottom: 1px solid var(--line); background: #fbfcfe; }',
    'figcaption span { grid-row: span 2; min-width: 32px; text-align: center; font-weight: 700; color: var(--accent); }',
    'figcaption strong { font-size: 15px; }',
    'figcaption small { color: var(--muted); overflow-wrap: anywhere; }',
    'img { display: block; width: 100%; height: auto; }',
    '.errors { margin: 0 0 16px; }',
    '.errors pre { white-space: pre-wrap; overflow: auto; padding: 12px; background: #fff7f7; border: 1px solid #f0b8b8; border-radius: 6px; }',
    '.empty { padding: 12px; border: 1px dashed var(--line); border-radius: 6px; }',
    '@media (max-width: 720px) { main { width: min(100% - 20px, 1440px); padding-top: 16px; } section { padding: 12px; } h1 { font-size: 24px; } h2 { font-size: 19px; } }',
    '</style>',
    '</head>',
    '<body>',
    '<main>',
    '<h1>Service NSW Test Screenshot Review</h1>',
    `<p>Generated ${escapeHtml(generatedAt)}. Screenshots are grouped by Playwright test case and captured as full-page images.</p>`,
    '<div class="summary">',
    `<span>${tests.length} test cases</span>`,
    `<span>${screenshotCount} screenshots</span>`,
    `<span>Source: ${escapeHtml(toPosixPath(path.relative(process.cwd(), MANIFEST_PATH)))}</span>`,
    '</div>',
    '<nav>',
    '<h2>Test Cases</h2>',
    `<ol>${navItems}</ol>`,
    '</nav>',
    sections,
    '</main>',
    '</body>',
    '</html>'
  ].join('\n');
}

function writeScreenshotReviewDocument(manifest = readManifest()) {
  ensureDirectoryExists(ARTIFACT_DIR);
  fs.writeFileSync(REVIEW_DOCUMENT_PATH, buildReviewHtml(manifest), 'utf8');
  return REVIEW_DOCUMENT_PATH;
}

function recordTestResult(testInfo) {
  if (isAccessibilityTest(testInfo)) {
    return null;
  }

  const manifest = readManifest();
  const testCase = upsertTestCase(manifest, testInfo);
  testCase.status = testInfo?.status || testCase.status || 'unknown';
  testCase.expectedStatus =
    testInfo?.expectedStatus || testCase.expectedStatus || 'passed';
  testCase.duration = testInfo?.duration || testCase.duration || 0;
  testCase.errors = (testInfo?.errors || [])
    .map((error) => error.message || String(error))
    .filter(Boolean);

  writeManifest(manifest);
  return writeScreenshotReviewDocument(manifest);
}

async function capture(page, stepName, testInfo) {
  // UI step screenshots are captured for every run; accessibility scans keep
  // their separate markdown evidence so the screenshot review stays focused.
  if (isAccessibilityTest(testInfo)) {
    return null;
  }

  try {
    ensureDirectoryExists(SCREENSHOT_DIR);

    const manifest = readManifest();
    const testCase = upsertTestCase(manifest, testInfo);
    const sequence = getNextScreenshotSequence(testInfo, testCase);
    const filename = [
      String(sequence).padStart(2, '0'),
      sanitizeFileName(stepName)
    ].join('-') + '.png';
    const testScreenshotDir = path.join(SCREENSHOT_DIR, testCase.folder);
    const filePath = path.join(testScreenshotDir, filename);

    ensureDirectoryExists(testScreenshotDir);

    await page.screenshot({
      path: filePath,
      fullPage: true,
      animations: 'disabled',
      timeout: SCREENSHOT_TIMEOUT_MS
    });

    testCase.screenshots.push({
      sequence,
      step: stepName,
      path: toArtifactRelativePath(filePath),
      capturedAt: new Date().toISOString(),
      url: page.url()
    });

    writeManifest(manifest);
    writeScreenshotReviewDocument(manifest);

    return filePath;
  } catch (error) {
    // Screenshot failure is diagnostic-only and should not fail business assertions.
    console.warn(`Screenshot capture failed for "${stepName}": ${error.message}`);
    return null;
  }
}

module.exports = {
  capture,
  recordTestResult,
  writeScreenshotReviewDocument
};
