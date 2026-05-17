const { expect } = require('@playwright/test');
const { capture } = require('../utils/screenshotHelper');

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
    await capture(this.page, 'HomePage_GoTo_Home_Loaded');
  }

  async acceptCookiesIfVisible() {
    // Identify the cookie acceptance button by role and visible text.
    const acceptCookiesButton = this.page.getByRole('button', { name: /accept/i });
    if (await acceptCookiesButton.isVisible().catch(() => false)) {
      // Click the button only when it is visible.
      await acceptCookiesButton.click();
      await capture(this.page, 'HomePage_Accept_Cookies');
    } else {
      await capture(this.page, 'HomePage_Cookies_Not_Present');
    }
  }

  async searchForService(serviceName) {
    // Locate the search input using the input placeholder text.
    const searchInput = this.page.locator('input[placeholder*="Search"]');
    await expect(searchInput.first()).toBeVisible({ timeout: 20000 });
    await capture(this.page, 'HomePage_Search_Input_Visible');

    // Click into the search field before typing.
    await searchInput.first().fill(serviceName);
    await capture(this.page, `HomePage_Search_Filled_${serviceName}`);

    // Submit the search by pressing Enter.
    await searchInput.first().press('Enter');
    await capture(this.page, 'HomePage_Search_Submitted');
  }

  async validatePageLoads() {
    // Confirm that the Service NSW page has loaded by checking the title.
    await expect(this.page).toHaveTitle(/Service NSW/i);
    await capture(this.page, 'HomePage_Validate_Page_Load');
  }
}

module.exports = HomePage;