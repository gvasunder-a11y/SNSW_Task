const { expect } = require('@playwright/test');
const { capture } = require('../utils/screenshotHelper');

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
    this.findVehicleButton = page.getByTestId('find-vehicle-button');
    // Locator for any error message shown after invalid input.
    this.errorMessage = page.locator('.error-message');
    // Locator for the page heading shown after successful renewal lookup.
    this.renewalTermsHeading = page.locator('h1:has-text("Check your registration renewal")');
  }

  async clickRenewOnline() {
    // Start the online renewal flow.
    await this.renewOnlineButton.click();
    await capture(this.page, 'TransactionPage_Click_Renew_Online');
  }

  async enterPlateNumber(plateNumber) {
    // Fill the plate number input.
    await this.plateNumberInput.fill(plateNumber);
    await capture(this.page, `TransactionPage_Plate_Number_Filled_${plateNumber}`);
  }

  async enterBillingNumber(billingNumber) {
    // Fill the billing number input.
    await this.billingNumberInput.fill(billingNumber);
    await capture(this.page, `TransactionPage_Billing_Number_Filled_${billingNumber}`);
  }

  async clickNext() {
    // Continue to the next step in the transaction flow.
    await this.nextButton.click();
    await capture(this.page, 'TransactionPage_Click_Next');
  }

  async clickFindVehicle() {
    await this.findVehicleButton.click();
    await capture(this.page, 'TransactionPage_Click_Find_Vehicle');
  }

  async validatePageLoads() {
    // Validate that the transaction page has loaded.
    await expect(this.page).toHaveURL(/transaction/);
    await expect(this.renewOnlineButton).toBeVisible();
    await capture(this.page, 'TransactionPage_Validate_Page_Load');
  }

  async validateRenewalTermsPage() {
    // Verify that the renewal terms page is visible.
    await expect(this.renewalTermsHeading).toBeVisible();
    await capture(this.page, 'TransactionPage_Validate_Renewal_Terms_Page');
  }

  async validateErrorMessage() {
    // Verify that an error message appears for invalid input.
    await expect(this.errorMessage).toBeVisible();
    await capture(this.page, 'TransactionPage_Validate_Error_Message');
  }
}

module.exports = TransactionPage;