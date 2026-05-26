# Technical Framework Interview Document

## 1. Purpose

This document explains the automation framework built for the Service NSW Renew Vehicle Registration journey and the NSW Fuel API checks.

The framework is designed to demonstrate a practical quality engineering approach for an interview task:

- Keep UI tests business-readable.
- Put reusable browser behavior into page objects.
- Validate backend/API behavior separately from browser flows.
- Add automated accessibility checks with useful reporting.
- Produce clear local and CI evidence through Playwright reports and artifacts.

## 2. Framework Summary

| Area | Implementation |
| --- | --- |
| Runtime | Node.js |
| Test runner | Playwright Test |
| UI automation | Playwright browser automation |
| API automation | Axios |
| Accessibility | axe-core through `@axe-core/playwright` |
| Config | `config/config.json` for non-secret config, `.env` for credentials |
| Reporting | Playwright HTML report, GitHub reporter, screenshots, JSON manifests, and markdown findings |
| CI | GitHub Actions workflow in `.github/workflows/playwright.yml` |

The framework currently covers three layers:

1. UI journey tests for Renew Registration.
2. API tests for NSW Fuel API request construction, authentication, response validation, negative status handling, transaction IDs, and timestamps.
3. Accessibility scans for important Renew Registration page states.

## 3. Project Structure

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
  accessibilityHelper.js
  configManager.js
  screenshotHelper.js

.github/workflows/
  playwright.yml

playwright.config.ts
package.json
README.md
```

### Key Responsibilities

| Folder/File | Responsibility |
| --- | --- |
| `tests/` | Test scenarios and business assertions |
| `pages/` | Page Object Model classes for browser interactions |
| `api/` | API client logic and request construction |
| `utils/` | Shared helpers for config, screenshots, and accessibility |
| `config/config.json` | URLs and reusable non-secret test data |
| `.env` | Local API credentials and secrets, ignored by git |
| `playwright.config.ts` | Browser projects, timeouts, retries, reporting, and artifacts |

## 4. Architecture

The framework follows a simple layered architecture:

```text
Tests
  call
Page Objects / API Client / Accessibility Helper
  call
Playwright, Axios, axe-core
  interact with
Service NSW website and NSW APIs
```

This separation keeps each layer focused:

- Tests describe what business behavior is being verified.
- Page objects describe how the browser interacts with pages.
- API clients describe how HTTP requests are made.
- Utilities provide reusable framework services.
- Config keeps environment values and test data out of test logic.

## 5. UI Test Flow

The UI suite validates the Renew Registration customer journey.

Main test file:

```text
tests/ui/renewRego.spec.js
```

Page object flow:

```text
HomePage
  opens Service NSW
  accepts cookies if visible
  searches for Renew Rego

SearchResultsPage
  validates search results page
  opens Renew Vehicle Registration page
  falls back to the stable transaction URL if live search results vary

TransactionPage
  clicks Renew online
  enters plate number
  submits Find vehicle
  validates happy path or error state
```

Current UI scenarios:

- Load Renew Registration landing page.
- Happy path using configured valid plate data.
- Negative path using configured invalid/cancelled plate data.

The specs stay readable because they call methods such as:

```javascript
await transactionPage.enterPlateNumber(configManager.getHappyPathPlate());
await transactionPage.clickFindVehicle();
await transactionPage.validateRenewalTermsPage();
```

This is easier to explain and maintain than putting locators and timing logic directly inside the tests.

## 6. API Test Flow

The API suite validates lower-level integration behavior separately from the UI.

Main test file:

```text
tests/api/fuelApi.spec.js
```

API client:

```text
api/fuelApiClient.js
```

Current API scenarios:

- Validate the OAuth token request is sent as a GET request and returns a successful status.
- Validate the OAuth request includes the `grant_type=client_credentials` query parameter.
- Use the token to retrieve Fuel API reference data and validate status, content type, and payload shape.
- Send an invalid bearer token and assert the API returns a non-2xx error response.
- Validate six-digit transaction ID generation.
- Validate current timestamp generation.

The API client centralises:

- Base URL loading from config.
- Credential loading from environment variables.
- OAuth token request.
- Bearer token request headers.
- API metadata headers such as `transactionid` and `requesttimestamp`.
- Reference-data artifact generation in `test-results/reference-data.json`.
- Data-only helper methods for simple flows.
- Response-returning helper methods for assertions that need raw HTTP status, request metadata, response headers, and body data.

This makes API tests faster and more precise than validating the same behavior through the browser.

## 7. Accessibility Test Flow

Accessibility coverage is implemented with `@axe-core/playwright`.

Main test file:

```text
tests/accessibility/renewRegoAccessibility.spec.js
```

Helper:

```text
utils/accessibilityHelper.js
```

Current accessibility scan states:

- Service NSW home page.
- Renew Registration search results.
- Renew Registration landing page.
- Plate lookup form.
- Invalid plate error state.

The helper:

- Runs axe in the current Playwright page.
- Scans WCAG-related tags.
- Includes axe's ARIA category alongside the configured WCAG tags.
- Appends readable scan output to `test-results/accessibility/accessibility-findings.md`.
- Emits GitHub warnings during CI.
- Runs in report-only mode by default.

Strict accessibility failure mode can be enabled with:

```bash
A11Y_FAIL_ON_VIOLATIONS=true npm run test:accessibility
```

PowerShell:

```powershell
$env:A11Y_FAIL_ON_VIOLATIONS='true'
npm run test:accessibility
```

## 8. Playwright Configuration

Main config file:

```text
playwright.config.ts
```

Important configuration choices:

| Setting | Reason |
| --- | --- |
| `testDir: './tests'` | Keeps all specs under one clear test root |
| `timeout: 90000` | Live public services can be slower than local apps |
| `fullyParallel: false` | Reduces instability against live external services |
| `workers: 1` | Keeps local and CI execution predictable |
| `retries: process.env.CI ? 2 : 0` | Retries only in CI where network noise is more likely |
| `screenshot: 'only-on-failure'` | Captures Playwright failure evidence while the custom helper records UI step screenshots |
| `trace: 'on-first-retry'` | Captures deeper diagnostics when a CI retry happens |
| HTML reporter | Provides local review evidence |
| GitHub reporter | Produces CI annotations |

Configured projects:

| Project | Coverage |
| --- | --- |
| `api` | API tests only, run once |
| `chrome` | UI tests and accessibility scans |
| `firefox` | UI tests |
| `webkit` | UI tests |

This avoids running API tests once per browser and keeps accessibility scans focused in Chrome to reduce repeated noise.

## 9. Locator Strategy

The locator strategy is practical and maintainable:

- Prefer accessible roles, labels, headings, and visible text.
- Use stable URL fragments where navigation is the contract.
- Use `data-testid` where the application exposes stable test IDs.
- Avoid brittle generated IDs, long CSS chains, and XPath for normal interactions.

Examples:

```javascript
page.getByRole('button', { name: /^Renew online$/i })
page.getByLabel(/number plate|plate number|billing number/i)
page.getByTestId('find-vehicle-button')
page.locator('a[href*="renew-a-vehicle-registration"]')
```

This is a good interview point because it shows the framework is aligned with how users interact with the product, while still allowing stable technical fallbacks.

## 10. Config and Test Data

Non-secret config lives in:

```text
config/config.json
```

It contains:

- UI base URL.
- API base URL.
- Happy-path plate number.
- Negative plate number.

Secrets are expected through environment variables in `.env`:

```bash
API_KEY=your-api-key
API_SECRET=your-api-secret
AUTH_HEADER=your-basic-auth-header
```

`ConfigManager` centralises access to config so tests and page objects do not hardcode URLs or test data.

The current API implementation requests a fresh OAuth token during the test and does not need to persist runtime tokens back into config. Tests that need HTTP-level assertions call response-returning client helpers, while normal flows can keep using data-only helpers.

## 11. Reporting and Evidence

Playwright writes:

```text
playwright-report/
test-results/
```

Evidence includes:

- HTML test report.
- Failure screenshots.
- UI step screenshots.
- Trace files on retry.
- API reference data artifact.
- Accessibility markdown findings.
- GitHub CI annotations.

UI step screenshots are captured on every UI run and written to `test-results/screenshots/`.
Accessibility scans do not write raw axe JSON files; the markdown findings document is the review artifact.

## 12. CI/CD

The GitHub Actions workflow:

```text
.github/workflows/playwright.yml
```

Pipeline steps:

1. Check out code.
2. Install Node.js.
3. Run `npm ci`.
4. Install Playwright browsers.
5. Run `npx playwright test`.
6. Upload `playwright-report/` and `test-results/` as artifacts.

This gives reviewers access to the same evidence that is available locally.

## 13. How to Run

Install dependencies:

```bash
npm install
npm run install-browsers
```

Run all tests:

```bash
npm test
```

Run by suite:

```bash
npm run test:ui
npm run test:api
npm run test:accessibility
```

Run by browser project:

```bash
npx playwright test --project=chrome
npx playwright test --project=firefox
npx playwright test --project=webkit
```

Open report:

```bash
npx playwright show-report
```

PowerShell note:

```powershell
npx.cmd playwright test
```

## 14. Main Interview Explanation

Use this as a short verbal summary:

```text
I built a Playwright automation framework for the Service NSW Renew Registration journey.
The framework separates test intent from implementation details using page objects, so the specs stay readable and the browser interaction logic is reusable.

I covered the journey at three levels: UI tests for key customer flows, API tests for lower-level integration confidence, and automated accessibility scans using axe-core.

The framework uses config files for non-secret values and environment variables for API credentials.
Playwright projects split execution so API tests run once, Chrome runs UI and accessibility, and Firefox/WebKit run browser regression coverage.

Because the tests run against live public services, I kept execution serial with one worker and practical timeouts to reduce flakiness.
CI runs the same Playwright suite in GitHub Actions and uploads the HTML report and test artifacts for review.
```

## 15. Why This Design

### Why Playwright

Playwright is a good fit because it provides:

- Cross-browser testing for Chromium, Firefox, and WebKit.
- Strong locator APIs based on user-facing behavior.
- Built-in test runner, assertions, retries, screenshots, traces, and reports.
- Good support for CI execution.
- Good integration with accessibility tooling.

### Why Page Objects

Page objects keep tests focused on business intent. If the UI changes, most locator updates stay inside the relevant page class instead of being duplicated across specs.

### Why API Tests Are Separate

API tests are faster and better for validating integration contracts, authentication, request metadata, and response payload structure. These should not be validated only through slow UI tests.

### Why Accessibility Is Separate

Accessibility scans produce a different kind of feedback from functional assertions. Keeping them separate makes results easier to review and avoids mixing page quality findings with journey failures.

### Why Serial Execution

The target application is a live public service, not a controlled local app. Running too much in parallel can introduce noise from network latency, browser resource contention, or changing public content. Serial execution trades speed for reliability, which is appropriate for this task.

## 16. Flakiness Controls

The framework reduces flakiness through:

- Role and label based locators.
- Explicit URL waits during navigation.
- Short defensive cookie-banner handling.
- Stable URL fallback when public search results vary.
- Practical timeouts for live services.
- One worker for predictable execution.
- Retry only in CI.
- Failure screenshots and retry traces.

The key interview point is that the framework does not hide real failures. It reduces environmental noise while still asserting the important business contracts.

## 17. Current Coverage

Functional UI:

- Customer can open Service NSW.
- Customer can search for Renew Rego.
- Customer can open the Renew Registration transaction page.
- Customer can open the plate lookup form.
- Valid plate reaches the renewal terms page.
- Invalid/cancelled plate shows an error.

API:

- Access token retrieval works through a GET request.
- OAuth query parameters are sent correctly.
- Reference data endpoint returns a successful JSON response with an object payload.
- Invalid bearer token requests return a non-2xx status.
- Transaction ID generation follows expected six-digit format.
- Timestamp generation follows expected shape.

Accessibility:

- Home page.
- Search results.
- Renew Registration landing page.
- Plate lookup form.
- Invalid plate error state.

## 18. Known Limitations

This framework intentionally keeps the interview task focused. Current limitations are:

- It depends on live Service NSW pages, so public content changes can affect UI tests.
- It uses configured plate data, which may need maintenance if backend test data changes.
- API tests depend on valid local or CI credentials.
- Accessibility scans are automated checks only and do not replace manual keyboard or screen reader testing.
- The UI suite does not cover payment or login because those are usually owned by separate teams.
- The framework does not currently include contract testing or mocked backend services.

## 19. Improvements With More Time

Strong next steps would be:

- Add contract tests for backend integrations.
- Add mocked services for unstable or unavailable dependencies.
- Add a controlled test-data strategy for vehicle registration states.
- Add stricter API response schema validation for required fields and data types.
- Add keyboard navigation tests for critical accessibility flows.
- Add performance smoke checks for critical API and page loads.
- Add tagging, for example `@smoke`, `@regression`, and `@accessibility`.
- Add stricter CI gates once known accessibility findings are accepted or fixed.
- Add environment-specific config loading for test, staging, and production-like environments.

## 20. Likely Interview Questions and Answers

### What is the main purpose of this framework?

To provide reliable automated coverage for the Renew Registration journey while demonstrating a layered quality strategy across UI, API, and accessibility.

### Why did you not put everything in UI tests?

UI tests are valuable for validating customer journeys, but they are slower and more fragile than lower-level tests. API and contract tests are better for backend behavior, data mapping, and integration confidence.

### How did you make the tests maintainable?

I used page objects, central config, reusable helpers, readable test scenarios, and stable locators based on roles, labels, headings, URLs, and test IDs.

### How did you handle live-site instability?

I used practical timeouts, serial execution, browser-specific project separation, retries only in CI, and a stable transaction URL fallback when public search results vary.

### How are secrets handled?

Secrets are loaded from `.env` or CI environment variables. They are not hardcoded in the API client or committed through `.env`.

### What would you add for an enterprise-grade version?

I would add contract tests, mocked dependencies, stronger test-data management, schema validation, test tagging, environment-specific config, and stricter accessibility gates once baseline findings are managed.

## 21. Final Interview Closing Statement

Use this closing statement:

```text
The main design decision was to keep the framework practical. I used Playwright for reliable browser automation and reporting, page objects for maintainability, Axios for focused API coverage, and axe-core for automated accessibility feedback.

I kept the UI suite lean because the highest risk in this type of journey is usually backend integration and data mapping. The framework gives fast feedback where possible, useful evidence when something fails, and a clear path to scale into contract testing, mocks, and stronger CI quality gates.
```
