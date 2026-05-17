const { expect } = require('@playwright/test');

// HomePage encapsulates navigation and search interactions on the Service NSW homepage.
class HomePage {
  constructor(page) {
    // Store the Playwright page object to reuse in helper methods.
    this.page = page;
  }

  async goto() {
    // Navigate to the Service NSW homepage and wait until DOM content is loaded.
    await this.page.goto('https://www.service.nsw.gov.au/', {
      waitUntil: 'domcontentloaded'
    });
    // Accept cookies if the consent banner appears.
    await this.acceptCookiesIfVisible();
  }

  async acceptCookiesIfVisible() {
    // Identify the cookie acceptance button by role and visible text.
    const acceptCookiesButton = this.page.getByRole('button', { name: /accept/i });
    if (await acceptCookiesButton.isVisible().catch(() => false)) {
      // Click the button only when it is visible.
      await acceptCookiesButton.click();
    }
  }

  async searchForService(serviceName) {
    // Locate the search input using the input placeholder text.
    const searchInput = this.page.locator('input[placeholder*="Search"]');
    await expect(searchInput.first()).toBeVisible({ timeout: 20000 });
    // Click into the search field before typing.
    await searchInput.first().fill(serviceName);
    // Submit the search by pressing Enter.
    await searchInput.first().press('Enter');
  }

  async validatePageLoads() {
    // Confirm that the Service NSW page has loaded by checking the title.
    await expect(this.page).toHaveTitle(/Service NSW/i);
  }
}

module.exports = HomePage;