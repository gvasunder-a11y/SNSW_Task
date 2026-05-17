const { test, expect } = require('@playwright/test');
const ConfigManager = require('../../utils/configManager');

// UI tests for the Service NSW Renew Registration flow.
test.describe('Service NSW UI Automation', () => {
    let configManager;

    test.beforeEach(() => {
        // Initialize configuration manager before each test.
        configManager = new ConfigManager();
    });

    test('Load Home Page and Renew Registration Landing page', async ({ page }) => {
        // Navigate to Service NSW homepage.
        await page.goto('https://www.service.nsw.gov.au/', {
            waitUntil: 'domcontentloaded'
        });

        // Accept cookies if the banner is displayed.
        const acceptCookiesButton = page.getByRole('button', { name: /accept/i });
        if (await acceptCookiesButton.isVisible().catch(() => false)) {
            await acceptCookiesButton.click();
        }

        // Search for "Renew Rego" using the search input locator.
        const searchInput = page
            .locator('#block-content')
            .getByRole('combobox', { name: 'Search' });

        await expect(searchInput).toBeVisible({ timeout: 20000 });
        await searchInput.click();
        await searchInput.fill('Renew Rego');

        // Click the Search button to submit the query.
        await page
            .locator('#block-content')
            .getByRole('button', { name: 'Search' })
            .click();

        // Open the service page for renewing vehicle registration online.
        await page
            .getByRole('link', { name: /Renew a vehicle registration online/i })
            .click();

        // Verify the service page is loaded by checking the URL.
        await expect(page).toHaveURL(/renew-a-vehicle-registration/i);

        // Click "Renew online" to begin the renewal journey.
        await page.getByRole('button', { name: 'Renew online' }).click();

        // Verify the registration input field is visible on the next page.
        const plateInput = page.getByTestId('input');
        await expect(plateInput).toBeVisible({ timeout: 15000 });
    });

    test('Happy Path: Renew vehicle registration with valid plate number', async ({ page }) => {
        // Navigate to Service NSW homepage.
        await page.goto('https://www.service.nsw.gov.au/', {
            waitUntil: 'domcontentloaded'
        });

        // Accept cookies if the banner is displayed.
        const acceptCookiesButton = page.getByRole('button', { name: /accept/i });
        if (await acceptCookiesButton.isVisible().catch(() => false)) {
            await acceptCookiesButton.click();
        }

        // Search for "Renew Rego" using the search input locator.
        const searchInput = page
            .locator('#block-content')
            .getByRole('combobox', { name: 'Search' });
        await expect(searchInput).toBeVisible({ timeout: 20000 });
        await searchInput.click();
        await searchInput.fill('Renew Rego');

        // Click the Search button to submit the query.
        await page
            .locator('#block-content')
            .getByRole('button', { name: 'Search' })
            .click();

        // Open the service page for renewing vehicle registration online.
        await page
            .getByRole('link', { name: /Renew a vehicle registration online/i })
            .click();

        // Verify the service page is loaded by checking the URL.
        await expect(page).toHaveURL(/renew-a-vehicle-registration/i);

        // Click "Renew online" to begin the renewal journey.
        await page.getByRole('button', { name: 'Renew online' }).click();

        // Verify the registration input field is visible on the next page.
        const plateInput = page.getByTestId('input');
        await expect(plateInput).toBeVisible({ timeout: 15000 });

        // Enter valid registration plate for the happy path.
        await plateInput.fill(configManager.getTestData().plateNumbers.happyPath);

        // Click Find Vehicle to continue with the valid registration.
        await page.getByTestId('find-vehicle-button').click();
    });

    test('Negative Scenario: Renew vehicle registration with invalid plate number', async ({ page }) => {
        // Navigate to Service NSW homepage.
        await page.goto('https://www.service.nsw.gov.au/', {
            waitUntil: 'domcontentloaded'
        });

        // Accept cookies if the banner is displayed.
        const acceptCookiesButton = page.getByRole('button', { name: /accept/i });
        if (await acceptCookiesButton.isVisible().catch(() => false)) {
            await acceptCookiesButton.click();
        }

        // Search for "Renew Rego" using the search input locator.
        const searchInput = page
            .locator('#block-content')
            .getByRole('combobox', { name: 'Search' });
        await expect(searchInput).toBeVisible({ timeout: 20000 });
        await searchInput.click();
        await searchInput.fill('Renew Rego');

        // Click the Search button to submit the query.
        await page
            .locator('#block-content')
            .getByRole('button', { name: 'Search' })
            .click();

        // Open the service page for renewing vehicle registration online.
        await page
            .getByRole('link', { name: /Renew a vehicle registration online/i })
            .click();

        // Verify the service page is loaded by checking the URL.
        await expect(page).toHaveURL(/renew-a-vehicle-registration/i);

        // Click "Renew online" to begin the renewal journey.
        await page.getByRole('button', { name: 'Renew online' }).click();

        // Verify the registration input field is visible on the next page.
        const plateInput = page.getByTestId('input');
        await expect(plateInput).toBeVisible({ timeout: 15000 });

        // Enter invalid registration plate for the negative scenario.
        await plateInput.fill(configManager.getTestData().plateNumbers.negative);

        // Click Find Vehicle to submit the invalid registration.
        await page.getByTestId('find-vehicle-button').click();
    });
});