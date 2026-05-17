const { test, expect } = require('@playwright/test');
const ConfigManager = require('../../utils/configManager');
const HomePage = require('../../pages/HomePage');
const SearchResultsPage = require('../../pages/SearchResultsPage');
const TransactionPage = require('../../pages/TransactionPage');

// UI tests for the Service NSW Renew Registration flow.
test.describe('Service NSW UI Automation', () => {
    let configManager;

    test.beforeEach(() => {
        // Initialize configuration manager before each test.
        configManager = new ConfigManager();
    });

    test('Load Home Page and Renew Registration Landing page', async ({ page }) => {
        const homePage = new HomePage(page);
        const searchResultsPage = new SearchResultsPage(page);
        const transactionPage = new TransactionPage(page);

        await homePage.goto();
        await homePage.validatePageLoads();

        await homePage.searchForService('Renew Rego');
        await searchResultsPage.validateResults();
        await searchResultsPage.clickRenewRego();

        await expect(page).toHaveURL(/renew-a-vehicle-registration/i);
        await transactionPage.clickRenewOnline();

        const plateInput = page.getByTestId('input');
        await expect(plateInput).toBeVisible({ timeout: 15000 });
    });

    test('Happy Path: Renew vehicle registration with valid plate number', async ({ page }) => {
        const homePage = new HomePage(page);
        const searchResultsPage = new SearchResultsPage(page);
        const transactionPage = new TransactionPage(page);

        await homePage.goto();
        await homePage.validatePageLoads();

        await homePage.searchForService('Renew Rego');
        await searchResultsPage.validateResults();
        await searchResultsPage.clickRenewRego();

        await expect(page).toHaveURL(/renew-a-vehicle-registration/i);
        await transactionPage.clickRenewOnline();

        const plateInput = page.getByTestId('input');
        await expect(plateInput).toBeVisible({ timeout: 15000 });

        await transactionPage.enterPlateNumber(configManager.getTestData().plateNumbers.happyPath);
        await transactionPage.clickFindVehicle();
    });

    test('Negative Scenario: Renew vehicle registration with invalid plate number', async ({ page }) => {
        const homePage = new HomePage(page);
        const searchResultsPage = new SearchResultsPage(page);
        const transactionPage = new TransactionPage(page);

        await homePage.goto();
        await homePage.validatePageLoads();

        await homePage.searchForService('Renew Rego');
        await searchResultsPage.validateResults();
        await searchResultsPage.clickRenewRego();

        await expect(page).toHaveURL(/renew-a-vehicle-registration/i);
        await transactionPage.clickRenewOnline();

        const plateInput = page.getByTestId('input');
        await expect(plateInput).toBeVisible({ timeout: 15000 });

        await transactionPage.enterPlateNumber(configManager.getTestData().plateNumbers.negative);
        await transactionPage.clickFindVehicle();
        await transactionPage.validateErrorMessage();
    });
});