const { expect } = require('@playwright/test');
const { capture } = require('../utils/screenshotHelper');

// SearchResultsPage models the search results page after searching for a service.
class SearchResultsPage {
  constructor(page) {
    this.page = page;
    // Locate the specific service link for renewing vehicle registration.
    this.renewRegoLink = page.getByRole('link', {
      name: /Renew a vehicle registration online/i
    });
  }

  async clickRenewRego() {
    // Click the service link to open the renewal landing page.
    await this.renewRegoLink.click();
    await capture(this.page, 'SearchResultsPage_Click_Renew_Rego');
  }

  async validateResults() {
    // Ensure the expected link is visible in the search results.
    await expect(this.renewRegoLink).toBeVisible();
    await capture(this.page, 'SearchResultsPage_Validate_Results');
  }
}

module.exports = SearchResultsPage;