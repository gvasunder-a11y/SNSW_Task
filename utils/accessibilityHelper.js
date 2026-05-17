const { expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const axeCore = require('axe-core');

// Keep the scan broad enough to catch common page issues, but leave ARIA-specific
// rules out because this task is not using the suite as an ARIA standards check.
const ACCESSIBILITY_TAGS = [
  'wcag2a',
  'wcag2aa',
  'wcag21a',
  'wcag21aa',
  'wcag22aa'
];

const EXCLUDED_ARIA_RULES = axeCore
  .getRules()
  .map((rule) => rule.ruleId)
  .filter((ruleId) => ruleId.startsWith('aria-'))
  .sort();

function sanitizeName(value) {
  // Attachment names must be stable and file-system safe for HTML report artifacts.
  return value
    .replace(/[^a-zA-Z0-9-_\.]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function formatTarget(target) {
  // Axe can return target selectors as strings or nested arrays depending on the node.
  if (!Array.isArray(target)) {
    return String(target);
  }

  return target
    .map((item) => Array.isArray(item) ? item.join(' > ') : item)
    .join(' > ');
}

function formatNodeRecommendations(node) {
  // Combine axe check messages into a de-duplicated recommendation list for reviewers.
  return [...node.any, ...node.all, ...node.none]
    .map((check) => check.message)
    .filter(Boolean)
    .filter((message, index, messages) => messages.indexOf(message) === index);
}

function buildMarkdownReport(scanName, results) {
  // Markdown is attached to the Playwright HTML report so interview/review feedback is readable.
  const violations = results.violations || [];
  const incomplete = results.incomplete || [];
  const lines = [
    `# Accessibility Scan: ${scanName}`,
    '',
    `URL: ${results.url}`,
    `Engine: ${results.testEngine.name} ${results.testEngine.version}`,
    `Tags: ${ACCESSIBILITY_TAGS.join(', ')}`,
    'ARIA rules: excluded from this scan',
    `Violations: ${violations.length}`,
    `Needs manual review: ${incomplete.length}`,
    ''
  ];

  if (violations.length === 0) {
    lines.push('No automated violations were detected for the configured non-ARIA rules.', '');
  } else {
    // Limit per-rule node details so reports remain useful instead of overwhelming.
    lines.push('## Violations', '');
    violations.forEach((violation, violationIndex) => {
      lines.push(
        `### ${violationIndex + 1}. ${violation.id}`,
        '',
        `Impact: ${violation.impact || 'unknown'}`,
        `Rule: ${violation.help}`,
        `Recommendation: ${violation.description}`,
        `Help: ${violation.helpUrl}`,
        ''
      );

      violation.nodes.slice(0, 10).forEach((node, nodeIndex) => {
        const recommendations = formatNodeRecommendations(node);
        lines.push(
          `Node ${nodeIndex + 1}: ${formatTarget(node.target)}`,
          '',
          '```html',
          node.html,
          '```',
          ''
        );

        recommendations.forEach((recommendation) => {
          lines.push(`- ${recommendation}`);
        });

        if (recommendations.length > 0) {
          lines.push('');
        }
      });
    });
  }

  if (incomplete.length > 0) {
    // Incomplete axe checks need manual review and should not be hidden.
    lines.push('## Needs Manual Review', '');
    incomplete.forEach((item, index) => {
      lines.push(
        `${index + 1}. ${item.id}: ${item.help}`,
        `   Help: ${item.helpUrl}`
      );
    });
    lines.push('');
  }

  return lines.join('\n');
}

function buildFailureMessage(scanName, violations) {
  // Failure/warning text is intentionally concise for console and GitHub annotations.
  if (!violations || violations.length === 0) {
    return `No accessibility violations detected for ${scanName}.`;
  }

  const summary = violations
    .slice(0, 8)
    .map((violation, index) => {
      const targets = violation.nodes
        .slice(0, 3)
        .map((node) => formatTarget(node.target))
        .join(', ');

      return [
        `${index + 1}. ${violation.id} (${violation.impact || 'unknown'})`,
        `Rule: ${violation.help}`,
        `Recommendation: ${violation.description}`,
        `Targets: ${targets}`,
        `Help: ${violation.helpUrl}`
      ].join('\n');
    })
    .join('\n\n');

  return [
    `Accessibility violations found for ${scanName}.`,
    'The full markdown and JSON reports are attached to the Playwright HTML report.',
    '',
    summary
  ].join('\n');
}

function escapeGithubCommand(value) {
  // GitHub workflow commands require escaping for percent signs and line breaks.
  return value
    .replace(/%/g, '%25')
    .replace(/\r/g, '%0D')
    .replace(/\n/g, '%0A');
}

function emitGithubWarnings(scanName, violations) {
  // Local runs already show console warnings; GitHub Actions also gets warning annotations.
  if (process.env.GITHUB_ACTIONS !== 'true') {
    return;
  }

  violations.slice(0, 10).forEach((violation) => {
    const message = [
      `${scanName}: ${violation.id} (${violation.impact || 'unknown'})`,
      violation.help,
      violation.description,
      violation.helpUrl
    ].join('\n');

    console.log(
      `::warning title=Accessibility recommendation::${escapeGithubCommand(message)}`
    );
  });
}

async function runAccessibilityScan(page, testInfo, options = {}) {
  // Default mode reports accessibility recommendations without failing the build.
  // Set A11Y_FAIL_ON_VIOLATIONS=true when the suite should fail on reported findings.
  const scanName = options.scanName || testInfo.title;
  const failOnViolations =
    options.failOnViolations ?? process.env.A11Y_FAIL_ON_VIOLATIONS === 'true';
  const builder = new AxeBuilder({ page })
    .withTags(ACCESSIBILITY_TAGS)
    .disableRules(EXCLUDED_ARIA_RULES);

  // Include/exclude support allows future transactions to scope scans to specific regions.
  (options.include || []).forEach((selector) => builder.include(selector));
  (options.exclude || []).forEach((selector) => builder.exclude(selector));

  // Run axe in the current browser context and attach both human-readable and raw evidence.
  const results = await builder.analyze();
  const reportName = sanitizeName(scanName);
  const markdownReport = buildMarkdownReport(scanName, results);
  const jsonReport = JSON.stringify(results, null, 2);

  await testInfo.attach(`${reportName}-accessibility.md`, {
    body: markdownReport,
    contentType: 'text/markdown'
  });

  await testInfo.attach(`${reportName}-accessibility.json`, {
    body: jsonReport,
    contentType: 'application/json'
  });

  const violations = results.violations || [];
  const failureMessage = buildFailureMessage(scanName, violations);

  if (violations.length > 0) {
    // Annotations are visible in the HTML report and make findings easier to scan.
    violations.slice(0, 10).forEach((violation) => {
      testInfo.annotations.push({
        type: 'a11y',
        description: `${violation.id} (${violation.impact || 'unknown'}): ${violation.help}`
      });
    });

    console.warn(failureMessage);
    emitGithubWarnings(scanName, violations);
  }

  if (failOnViolations) {
    // Strict mode is useful in CI once known issues are accepted/fixed.
    expect(violations, failureMessage).toEqual([]);
  } else {
    // Report-only mode still asserts that the scan completed and produced a valid page URL.
    expect(results.url).toBeTruthy();
  }

  return results;
}

module.exports = {
  ACCESSIBILITY_TAGS,
  EXCLUDED_ARIA_RULES,
  runAccessibilityScan
};
