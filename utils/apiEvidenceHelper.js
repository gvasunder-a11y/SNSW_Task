const fs = require('fs');
const path = require('path');

const API_EVIDENCE_DIR = path.join(process.cwd(), 'test-results', 'api');

const SENSITIVE_KEY_PATTERN = /(authorization|apikey|api[-_]?key|client[-_]?id|application[-_.]?name|cookie|email|secret|access[-_]?token|refresh[-_]?token|bearer|password)/i;

function ensureDirectoryExists(directoryPath) {
  fs.mkdirSync(directoryPath, { recursive: true });
}

function toPlainObject(value) {
  if (!value) {
    return {};
  }

  if (typeof value.toJSON === 'function') {
    return value.toJSON();
  }

  return { ...value };
}

function parseRequestData(data) {
  if (data === undefined || data === null || data === '') {
    return null;
  }

  if (typeof data !== 'string') {
    return data;
  }

  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
}

function sanitizeJson(value, key = '') {
  if (SENSITIVE_KEY_PATTERN.test(key)) {
    return '[REDACTED]';
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeJson(item));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [
        entryKey,
        sanitizeJson(entryValue, entryKey)
      ])
    );
  }

  return value;
}

function safeFileName(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'api-evidence';
}

function buildApiExchangeEvidence(label, response) {
  const requestConfig = response.config || {};

  return {
    label,
    capturedAt: new Date().toISOString(),
    request: sanitizeJson({
      method: requestConfig.method ? requestConfig.method.toUpperCase() : undefined,
      url: requestConfig.url,
      params: requestConfig.params || null,
      headers: toPlainObject(requestConfig.headers),
      body: parseRequestData(requestConfig.data)
    }),
    response: sanitizeJson({
      status: response.status,
      statusText: response.statusText,
      headers: toPlainObject(response.headers),
      body: response.data
    })
  };
}

async function attachApiExchange(testInfo, label, response) {
  const evidence = buildApiExchangeEvidence(label, response);
  const fileName = [
    safeFileName(testInfo.project.name),
    safeFileName(testInfo.title),
    safeFileName(label)
  ].join('__');
  const evidencePath = path.join(API_EVIDENCE_DIR, `${fileName}.json`);

  ensureDirectoryExists(API_EVIDENCE_DIR);
  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2), 'utf8');

  await testInfo.attach(`API JSON - ${label}`, {
    path: evidencePath,
    contentType: 'application/json'
  });

  return evidencePath;
}

module.exports = {
  attachApiExchange,
  buildApiExchangeEvidence,
  sanitizeJson
};
