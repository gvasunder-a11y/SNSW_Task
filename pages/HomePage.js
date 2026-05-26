const { expect } = require('@playwright/test');
const { capture } = require('../utils/screenshotHelper');
const ConfigManager = require('../utils/configManager');

// HomePage owns Service NSW home-page navigation and search behavior.
// Tests should call these methods instead of directly locating home-page elements.
class HomePage {
  constructor(page, testInfo) {
    this.page = page;
    this.testInfo = testInfo;
    this.configManager = new ConfigManager();
    this.baseUrl = this.configManager.getUiConfig().baseUrl;

    // Scope search to the main content area to avoid matching header/mobile search variants.
    // Prefer user-facing locators first, with placeholder text as a practical fallback.
    this.mainContent = page.locator('main');
    this.searchInput = this.mainContent
      .getByRole('searchbox', { name: /search/i })
      .or(this.mainContent.getByPlaceholder(/search/i))
      .first();

    this.acceptCookiesButton = page.getByRole('button', {
      name: /accept/i
    }).first();
  }

  async goto() {
    // Navigate from config so the same page object can run against another environment.
    await this.page.goto(this.baseUrl, {
      waitUntil: 'domcontentloaded'
    });

    // Cookie banners are optional, so they are handled defensively and never block the journey.
    await this.acceptCookiesIfVisible();
    await capture(this.page, 'HomePage_Loaded', this.testInfo);
  }

  async acceptCookiesIfVisible() {
    try {
      // Use a short timeout because the banner is not guaranteed to be displayed on every run.
      if (await this.acceptCookiesButton.isVisible({ timeout: 3000 })) {
        await this.acceptCookiesButton.click();
        await capture(this.page, 'HomePage_Cookies_Accepted', this.testInfo);
      }
    } catch (e) {
      await capture(this.page, 'HomePage_No_Cookies', this.testInfo);
    }
  }

  async searchForService(serviceName) {
    // Search input visibility confirms the home page is ready for the customer action.
    await expect(this.searchInput).toBeVisible({ timeout: 20000 });

    await this.searchInput.click();
    await this.searchInput.fill(serviceName);

    await capture(this.page, `HomePage_Search_${serviceName}`, this.testInfo);

    // Submit the search and wait for the browser route change in the same Promise.all block.
    // This avoids a race where navigation starts before the wait is registered.
    await Promise.all([
      this.page.waitForURL(/search|service/i, {
        waitUntil: 'domcontentloaded'
      }),
      this.searchInput.press('Enter')
    ]);
  }

  async validatePageLoads() {
    // A title assertion gives a low-cost smoke check that the expected public site loaded.
    await expect(this.page).toHaveTitle(/Service NSW/i);
  }
}

module.exports = HomePage;
