# SNSW Automation Task

This repo contains a Playwright test framework for the Service NSW renew registration journey, plus a small NSW Fuel API test suite. I kept the structure simple: page objects own browser interactions, tests stay close to the business flow, and shared setup lives in utilities.

The framework currently covers:

- UI checks for the renew registration flow.
- API checks for GET request validation, OAuth query parameters, reference data response validation, non-2xx error handling, transaction id generation, and timestamp generation.
- Lightweight accessibility scans with axe-core, including axe's ARIA category.
- Playwright HTML reporting, API request/response JSON evidence, grouped UI screenshot evidence, markdown accessibility findings, and CI artifact upload.

## Stack

- Node.js
- Playwright
- @axe-core/playwright
- Axios
- dotenv

## Setup

Install dependencies and browsers:

```bash
npm install
npm run install-browsers
```

Create a local `.env` file for API credentials:

```bash
API_KEY=your-api-key
API_SECRET=your-api-secret
AUTH_HEADER=your-basic-auth-header
```

The `.env` file is ignored by git.

## Project Layout

```text
api/
  fuelApiClient.js
config/
  config.json
pages/
  HomePage.js
  SearchResultsPage.js
  TransactionPage.js
tests/
  accessibility/
    renewRegoAccessibility.spec.js
  api/
    fuelApi.spec.js
  ui/
    renewRego.spec.js
utils/
  apiEvidenceHelper.js
  accessibilityHelper.js
  configManager.js
  screenshotHelper.js
.github/workflows/
  playwright.yml
playwright.config.ts
package.json
```

## Running Tests

Run everything:

```bash
npm test
```

Run one suite:

```bash
npm run test:ui
npm run test:api
npm run test:accessibility
```

Run one browser project:

```bash
npx playwright test --project=chrome
npx playwright test --project=firefox
npx playwright test --project=webkit
```

Run one spec file:

```bash
npx playwright test tests/ui/renewRego.spec.js
npx playwright test tests/api/fuelApi.spec.js
npx playwright test tests/accessibility/renewRegoAccessibility.spec.js
```

Run UI and accessibility evidence together:

```bash
npx playwright test tests/ui tests/accessibility
```

PowerShell:

```powershell
npx.cmd playwright test tests/ui tests/accessibility
```

Open the report:

```bash
npx playwright show-report
```

On PowerShell, use `npx.cmd` if script execution policy blocks `npx`:

```powershell
npx.cmd playwright test
```

## Test Coverage

UI tests cover:

- Opening Service NSW.
- Searching for Renew Rego.
- Opening the renew registration page.
- Entering a valid plate number.
- Entering an invalid plate number and checking the error message.

API tests cover:

- OAuth access token retrieval using a GET request.
- OAuth `grant_type=client_credentials` query parameter validation.
- Reference data response status, content type, and payload validation.
- Negative API behavior when an invalid bearer token returns a non-2xx status.
- Six-digit transaction id generation.
- Current timestamp generation.

Accessibility tests cover these page states:

- Service NSW home page.
- Renew registration search results.
- Renew registration landing page.
- Plate lookup form.
- Invalid plate error state.

The default Playwright config discovers 20 tests:

- `api`: API specs only.
- `chrome`: UI and accessibility specs.
- `firefox`: UI specs only.
- `webkit`: UI specs only.

## Accessibility Scope

The accessibility suite uses axe-core to catch general page issues and ARIA-related findings through the configured WCAG tags plus axe's ARIA category. It writes evidence to a markdown findings file.

By default, accessibility findings are reported but do not fail the build. To make reported findings fail the run:

```bash
A11Y_FAIL_ON_VIOLATIONS=true npm run test:accessibility
```

PowerShell:

```powershell
$env:A11Y_FAIL_ON_VIOLATIONS='true'
npm run test:accessibility
```

Accessibility scans write one markdown-only findings file:

```text
test-results/accessibility/accessibility-findings.md
```

The accessibility suite does not capture step screenshots and does not write raw axe JSON files. The markdown report includes each scanned state, URL, axe engine version, violation count, and manual-review items.

## Framework Notes

The page object classes are:

- `HomePage`: opens Service NSW, handles cookies, and runs the search.
- `SearchResultsPage`: validates search results and opens the renew registration page.
- `TransactionPage`: handles the external renew registration form.

The locator approach is practical rather than over-engineered:

- Prefer customer-facing locators such as button text, labels, and headings.
- Use stable URL fragments where navigation is the contract.
- Use `data-testid` when the app exposes one.
- Avoid generated ids, long CSS chains, and XPath for normal interactions.

`ConfigManager` reads non-secret config from `config/config.json`. API secrets come from `.env` or CI secrets. Runtime access tokens are kept in memory and are not written back into config.

`FuelApiClient` exposes data-only helpers for normal flows and response-returning helpers for API assertions that need raw HTTP status, request metadata, headers, and body validation.

## Reports And Artifacts

Playwright writes:

- HTML report: `playwright-report/`
- Test artifacts: `test-results/`
- API request/response JSON evidence: `test-results/api/`
- API reference-data artifact: `test-results/reference-data.json`
- Accessibility findings: `test-results/accessibility/accessibility-findings.md`

UI tests capture full-page step screenshots on every run and write:

- Grouped review document: `test-results/screenshot-review.html`
- Screenshot manifest: `test-results/screenshot-manifest.json`
- Full-page screenshots grouped by test case: `test-results/screenshots/`

Accessibility tests are excluded from screenshot capture, so the review document stays focused on UI regression evidence.

## CI

The GitHub Actions workflow is in `.github/workflows/playwright.yml`.

It installs dependencies, installs Playwright browsers, runs `npx playwright test`, and uploads the Playwright report and test results as artifacts.

## Troubleshooting

If browsers are missing:

```bash
npm run install-browsers
```

If API tests fail:

- Check that `.env` exists.
- Check that the API credentials are still valid.
- Check network access to `https://api.onegov.nsw.gov.au`.

If UI tests fail intermittently:

- Rerun the failed browser project.
- Check network access to Service NSW.
- Open `playwright-report/` and review the failed step.
