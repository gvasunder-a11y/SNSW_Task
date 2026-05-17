const { expect } = require('@playwright/test');

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
  }

  async validateResults() {
    // Ensure the expected link is visible in the search results.
    await expect(this.renewRegoLink).toBeVisible();
  }
}

module.exports = SearchResultsPage;