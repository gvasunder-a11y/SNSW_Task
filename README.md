# Core Automation Framework

A scalable, enterprise-ready automation framework for UI and API testing, designed to be adopted across teams working on digital services.

## Architecture Overview

This framework follows a modular architecture with clear separation of concerns:

- **UI Automation**: Uses Playwright for browser automation with Page Object Model
- **API Automation**: Uses Axios for HTTP requests with dedicated API clients
- **Configuration Management**: Centralized config management with environment variable support
- **Test Organization**: Structured test suites for UI and API scenarios
- **Reporting**: Built-in Playwright reporting with HTML and GitHub workflow integration

### Key Design Decisions

- **Page Object Model**: Encapsulates UI interactions for maintainability
- **API Client Pattern**: Dedicated clients for different APIs with authentication handling
- **Configuration as Code**: JSON configs with environment variable overrides for secrets
- **Modular Structure**: Separate folders for pages, APIs, utils, and tests
- **Cross-Platform**: Node.js based, works on Windows, macOS, Linux

### Technology Choices

- **Playwright**: Chosen for its cross-browser support (Chrome, Firefox, WebKit), auto-waiting, and API testing capabilities
- **Axios**: Reliable HTTP client with interceptors and response handling
- **Node.js**: JavaScript runtime for consistency across UI and API testing
- **dotenv**: Secure environment variable management for secrets
- **Multi-Browser Testing**: Tests execute on Chrome, Firefox, and WebKit to ensure cross-browser compatibility
- **CI Reporting**: GitHub reporter support is enabled for GitHub Actions in addition to HTML report generation
- **Screenshot Capture**: UI test failures capture screenshots automatically for easier debugging

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Install Playwright browsers:
   ```bash
   npm run install-browsers
   ```
4. Set up environment variables:
   - Create a `.env` file with required secrets
   - Required environment variables:
     - `API_KEY`: NSW Fuel API key
     - `API_SECRET`: NSW Fuel API secret
     - `AUTH_HEADER`: Base64 encoded authorization header

> Note: Tests are configured to run across all major browsers: Chrome, Firefox, and WebKit via `playwright.config.ts`.

### Configuration

- `config/config.json`: Contains test data and API configurations
- `.env`: Contains sensitive information (not committed to repo)
- Access tokens are automatically updated in config.json during test execution

## How to Execute Tests

### Run All Tests (All Browsers)
```bash
npm test
```
This runs all tests across Chrome, Firefox, and WebKit browsers in parallel and generates both an HTML report and GitHub workflow report metadata when executed in GitHub Actions.

After the run, view the local HTML report with:
```bash
npx playwright show-report
```

Step-by-step screenshots are now captured across UI interactions and page transitions for both passing and failing scenarios. Find screenshot artifacts in the Playwright test output directory under `test-results/`.

The `test-results/` folder now holds screenshots and other Playwright artifacts, while the HTML report is generated under `playwright-report/`.

### Run Tests on Specific Browser
```bash
npx playwright test --project=chrome
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Run UI Tests Only
```bash
npm run test:ui
```

### Run API Tests Only
```bash
npm run test:api
```

### Run Specific Test File
```bash
npx playwright test tests/ui/renewRego.spec.js
npx playwright test tests/api/fuelApi.spec.js
```

## Assumptions Made

- Service NSW website structure remains consistent
- NSW Fuel API endpoints and response formats are stable
- Node.js and npm are available in the execution environment
- Internet connectivity for API calls and website access

## Trade-offs Considered

- **Playwright for API Testing**: While primarily a browser automation tool, Playwright's test runner provides consistent reporting and execution for both UI and API tests
- **JSON Config Files**: Simple and readable, but requires file I/O for updates
- **Environment Variables for Secrets**: Secure but requires manual setup
- **No Database Layer**: Kept simple for initial implementation; can be added for complex data management

## Framework Scalability

### For Enterprise Use

- **Modular Design**: Easy to add new page objects, API clients, and test suites
- **Configuration Management**: Supports multiple environments (dev, staging, prod)
- **Reporting Integration**: Can integrate with CI/CD pipelines and test management tools
- **Parallel Execution**: Playwright supports parallel test execution
- **Cross-Browser Testing**: Built-in support for multiple browsers
- **API Mocking**: Can be extended with tools like WireMock for API simulation

### Extending the Framework

1. **Add New UI Tests**:
   - Create new page objects in `pages/`
   - Add test files in `tests/ui/`

2. **Add New API Tests**:
   - Create new API clients in `api/`
   - Add test files in `tests/api/`

3. **Add New Environments**:
   - Update `config/config.json` with environment-specific settings
   - Use environment variables for secrets

4. **CI/CD Integration**:
   - Add GitHub Actions or Jenkins pipelines
   - Configure parallel execution
   - Set up automated reporting

## Project Structure

```
├── api/                    # API client classes
│   └── fuelApi.js         # NSW Fuel API client
├── config/                # Configuration files
│   └── config.json       # Test data and settings
├── pages/                 # Page object classes
│   ├── HomePage.js       # Service NSW home page
│   ├── SearchResultsPage.js
│   └── TransactionPage.js
├── tests/                 # Test suites
│   ├── ui/               # UI automation tests
│   │   └── renewRego.spec.js
│   └── api/              # API automation tests
│       └── fuelApi.spec.js
├── utils/                 # Utility classes
│   └── configManager.js  # Configuration management
├── .env                   # Environment variables (gitignored)
├── .gitignore            # Git ignore rules
├── package.json          # Dependencies and scripts
├── playwright.config.ts  # Playwright configuration
└── README.md             # This documentation
```

## Test Scenarios

### UI Automation - Service NSW

1. **Homepage Load Validation**: Verifies the homepage loads successfully and cookie consent is handled
2. **Service Search**: Searches for "Renew Rego" and opens the Renew Registration landing page
3. **Happy Path**: Valid plate number (YGW98K) is entered and the form is submitted
4. **Negative Scenario**: Invalid plate number (XYX123) is entered and an error/validation state is expected

### API Automation - NSW Fuel API

1. **Access Token Retrieval**: Validates OAuth token acquisition
2. **Reference Data Fetch**: Tests GET request with authentication and headers
3. **Response Validation**: Verifies response structure and data integrity
4. **Error Handling**: Tests behavior with invalid tokens

## Security Considerations

- API keys and secrets stored in environment variables
- `.env` file excluded from version control
- Access tokens cached in config but refreshed on each test run
- No hardcoded credentials in source code

## Troubleshooting

### Common Issues

1. **Browser Installation**: Run `npm run install-browsers` if tests fail to launch browsers
2. **Environment Variables**: Ensure `.env` file exists with correct values
3. **Network Issues**: Check internet connectivity for API calls and website access
4. **Node Version**: Ensure Node.js v16+ is installed

### Debug Mode

Run tests with debug flags:
```bash
npx playwright test --debug
```

## Contributing

1. Follow the established folder structure
2. Use Page Object Model for UI tests
3. Implement API clients for new APIs
4. Update configuration for new test data
5. Add comprehensive documentation for new features