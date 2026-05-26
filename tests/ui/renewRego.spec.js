const { test, expect } = require('@playwright/test');
const ConfigManager = require('../../utils/configManager');
const HomePage = require('../../pages/HomePage');
const SearchResultsPage = require('../../pages/SearchResultsPage');
const TransactionPage = require('../../pages/TransactionPage');
const { recordTestResult } = require('../../utils/screenshotHelper');

// UI regression tests for the Service NSW Renew Registration journey.
// The tests stay business-readable by delegating browser details to page objects.
test.describe('Service NSW UI Automation - Renew Registration', () => {
  let configManager;

  test.beforeEach(() => {
    // Load fresh config per test so each scenario can read the latest configured test data.
    configManager = new ConfigManager();
  });

  test.afterEach(async ({}, testInfo) => {
    recordTestResult(testInfo);
  });

  // Shared journey setup:
  // 1. Open Service NSW home page.
  // 2. Search for the Renew Rego service.
  // 3. Open the Renew Registration landing page.
  // This keeps each test focused on the behavior it is proving after navigation.
  const navigateToRenewRegistration = async (page, testInfo) => {
    const homePage = new HomePage(page, testInfo);
    const searchResultsPage = new SearchResultsPage(page, testInfo);
    const transactionPage = new TransactionPage(page, testInfo);

    await homePage.goto();
    await homePage.validatePageLoads();

    await homePage.searchForService('Renew Rego');

    await searchResultsPage.validateResults();
    await searchResultsPage.clickRenewRego();

    await expect(page).toHaveURL(/renew-a-vehicle-registration/i);

    return transactionPage;
  };

  test('Load Renew Registration Landing page', async ({ page }, testInfo) => {
    // Smoke test: prove the customer can reach the renewal app and see the plate entry form.
    const transactionPage = await navigateToRenewRegistration(page, testInfo);

    await transactionPage.clickRenewOnline();
    await transactionPage.validatePlateNumberInputVisible();
  });

  test('Happy Path: Renew vehicle registration', async ({ page }, testInfo) => {
    // Happy path: use a configured valid plate and confirm the flow reaches renewal terms.
    const transactionPage = await navigateToRenewRegistration(page, testInfo);

    await transactionPage.clickRenewOnline();

    await transactionPage.enterPlateNumber(
      configManager.getHappyPathPlate()
    );

    await transactionPage.clickFindVehicle();

    await transactionPage.validateRenewalTermsPage();
  });

  test('Negative Scenario: Invalid plate number', async ({ page }, testInfo) => {
    // Negative path: use configured invalid/cancelled plate data and validate user-facing error.
    const transactionPage = await navigateToRenewRegistration(page, testInfo);

    await transactionPage.clickRenewOnline();

    await transactionPage.enterPlateNumber(
      configManager.getNegativePlate()
    );

    await transactionPage.clickFindVehicle();

    await transactionPage.validateErrorMessage();
  });
});
