const { expect } = require('@playwright/test');

// TransactionPage encapsulates actions on the renewal transaction page.
class TransactionPage {
  constructor(page) {
    this.page = page;
    // Locator for the Renew Online button that starts the flow.
    this.renewOnlineButton = page.locator('a:has-text("Renew online")');
    // Locator for the plate number input field.
    this.plateNumberInput = page.locator('input[name="plateNumber"]');
    // Locator for the billing number input field.
    this.billingNumberInput = page.locator('input[name="billingNumber"]');
    // Locator for the Next button to submit registration details.
    this.nextButton = page.locator('button:has-text("Next")');
    // Locator for any error message shown after invalid input.
    this.errorMessage = page.locator('.error-message');
    // Locator for the page heading shown after successful renewal lookup.
    this.renewalTermsHeading = page.locator('h1:has-text("Check your registration renewal")');
  }

  async clickRenewOnline() {
    // Start the online renewal flow.
    await this.renewOnlineButton.click();
  }

  async enterPlateNumber(plateNumber) {
    // Fill the plate number input.
    await this.plateNumberInput.fill(plateNumber);
  }

  async enterBillingNumber(billingNumber) {
    // Fill the billing number input.
    await this.billingNumberInput.fill(billingNumber);
  }

  async clickNext() {
    // Continue to the next step in the transaction flow.
    await this.nextButton.click();
  }

  async validatePageLoads() {
    // Validate that the transaction page has loaded.
    await expect(this.page).toHaveURL(/transaction/);
    await expect(this.renewOnlineButton).toBeVisible();
  }

  async validateRenewalTermsPage() {
    // Verify that the renewal terms page is visible.
    await expect(this.renewalTermsHeading).toBeVisible();
  }

  async validateErrorMessage() {
    // Verify that an error message appears for invalid input.
    await expect(this.errorMessage).toBeVisible();
  }
}

module.exports = TransactionPage;