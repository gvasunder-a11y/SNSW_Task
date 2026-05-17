const { test, expect } = require('@playwright/test');
const ConfigManager = require('../../utils/configManager');
const HomePage = require('../../pages/HomePage');
const SearchResultsPage = require('../../pages/SearchResultsPage');
const TransactionPage = require('../../pages/TransactionPage');
const { runAccessibilityScan } = require('../../utils/accessibilityHelper');

// Accessibility tests are separated from functional UI tests so page-level findings
// can be reported clearly without hiding functional journey failures.
test.describe('Service NSW Accessibility - Renew Registration', () => {
  let configManager;

  test.beforeEach(() => {
    // Test data is still needed for accessibility coverage of the invalid plate error state.
    configManager = new ConfigManager();
  });

  const searchForRenewRegistration = async (page) => {
    // Reuse the same customer search path as the UI tests before scanning search results.
    const homePage = new HomePage(page);
    const searchResultsPage = new SearchResultsPage(page);

    await homePage.goto();
    await homePage.validatePageLoads();
    await homePage.searchForService('Renew Rego');
    await searchResultsPage.validateResults();

    return searchResultsPage;
  };

  const openRenewRegistration = async (page) => {
    // Opens the content landing page. The SearchResultsPage includes a stable fallback
    // when public search results do not render the expected link.
    const searchResultsPage = await searchForRenewRegistration(page);
    const transactionPage = new TransactionPage(page);

    await searchResultsPage.clickRenewRego();
    await expect(page).toHaveURL(/renew-a-vehicle-registration/i);

    return transactionPage;
  };

  test('Home page automated accessibility report', async ({ page }, testInfo) => {
    // Baseline scan for the public Service NSW home page.
    const homePage = new HomePage(page);

    await homePage.goto();
    await homePage.validatePageLoads();

    await runAccessibilityScan(page, testInfo, {
      scanName: 'Service NSW home page'
    });
  });

  test('Renew registration search results automated accessibility report', async ({ page }, testInfo) => {
    // Scans the search-results state reached by the customer search action.
    await searchForRenewRegistration(page);

    await runAccessibilityScan(page, testInfo, {
      scanName: 'Renew registration search results'
    });
  });

  test('Renew registration landing page automated accessibility report', async ({ page }, testInfo) => {
    // Scans the transaction content page before opening the external renewal app.
    await openRenewRegistration(page);

    await runAccessibilityScan(page, testInfo, {
      scanName: 'Renew registration landing page'
    });
  });

  test('Plate lookup form automated accessibility report', async ({ page }, testInfo) => {
    // Scans the first interactive state in the external renewal app.
    const transactionPage = await openRenewRegistration(page);

    await transactionPage.clickRenewOnline();
    await transactionPage.validatePlateNumberInputVisible();

    await runAccessibilityScan(page, testInfo, {
      scanName: 'Renew registration plate lookup form'
    });
  });

  test('Invalid plate error state automated accessibility report', async ({ page }, testInfo) => {
    // Scans an error state because validation messaging is high-risk for customers.
    const transactionPage = await openRenewRegistration(page);

    await transactionPage.clickRenewOnline();
    await transactionPage.enterPlateNumber(configManager.getNegativePlate());
    await transactionPage.clickFindVehicle();
    await transactionPage.validateErrorMessage();

    await runAccessibilityScan(page, testInfo, {
      scanName: 'Renew registration invalid plate error state'
    });
  });
});
