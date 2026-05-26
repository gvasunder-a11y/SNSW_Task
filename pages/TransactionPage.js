const { expect } = require('@playwright/test');
const { capture } = require('../utils/screenshotHelper');

// TransactionPage encapsulates the external renewal journey after the customer
// selects "Renew online" from the Service NSW content page.
class TransactionPage {
  constructor(page, testInfo) {
    this.page = page;
    this.testInfo = testInfo;

    // The exact accessible name avoids matching the "How to renew online" table-of-contents link.
    this.renewOnlineButton = page
      .getByRole('button', { name: /^Renew online$/i })
      .or(page.getByRole('link', { name: /^Renew online$/i }))
      .first();

    // The renewal app exposes a field label and a test id.
    // Prefer the customer-facing label, with test id retained as a stable fallback.
    this.plateNumberInput = page
      .getByLabel(/number plate|plate number|billing number/i)
      .or(page.getByTestId('input'))
      .first();

    // Stable automation id from the transaction app for submitting the lookup.
    this.findVehicleButton = page.getByTestId('find-vehicle-button');

    // Error region displayed for invalid, cancelled, or unavailable registration lookups.
    this.errorMessage = page.getByTestId('error');

    // Heading displayed when a valid lookup reaches the renewal terms step.
    this.renewalTermsHeading = page.getByRole('heading', {
      name: /Check your registration renewal/i
    });
  }

  async clickRenewOnline() {
    // Start from the content page CTA and wait for the external renewal app route.
    await expect(this.renewOnlineButton).toBeVisible({ timeout: 15000 });

    await Promise.all([
      this.page.waitForURL(/registration-renewal\.service\.nsw\.gov\.au\/find-vehicle/i, {
        timeout: 45000,
        waitUntil: 'commit'
      }),
      this.renewOnlineButton.click()
    ]);

    // The plate input is the first usable state of the transaction app.
    await expect(this.plateNumberInput).toBeVisible({ timeout: 20000 });

    await capture(this.page, 'TransactionPage_Click_Renew_Online', this.testInfo);
  }

  async enterPlateNumber(plateNumber) {
    // Fill the configured plate number. Test data controls happy and negative scenarios.
    await expect(this.plateNumberInput).toBeVisible({ timeout: 20000 });
    await this.plateNumberInput.fill(plateNumber);

    await capture(
      this.page,
      `TransactionPage_Plate_Number_Filled_${plateNumber}`,
      this.testInfo
    );
  }

  async clickFindVehicle() {
    // Submit the lookup. Downstream assertions decide whether the result is success or error.
    await expect(this.findVehicleButton).toBeVisible({ timeout: 15000 });
    await this.findVehicleButton.click();

    await capture(this.page, 'TransactionPage_Click_Find_Vehicle', this.testInfo);
  }

  async validateRenewalTermsPage() {
    // Happy path assertion: a valid plate should progress to the renewal terms page.
    await expect(this.renewalTermsHeading).toBeVisible({ timeout: 20000 });

    await capture(
      this.page,
      'TransactionPage_Validate_Renewal_Terms_Page',
      this.testInfo
    );
  }

  async validateErrorMessage() {
    // Negative path assertion: invalid data should produce an in-page error alert.
    await expect(this.errorMessage).toBeVisible({ timeout: 15000 });

    // Confirm the specific business error currently returned for the configured negative plate.
    await expect(
      this.errorMessage.getByText(/Cancelled registration/i)
    ).toBeVisible();

    await capture(this.page, 'TransactionPage_Validate_Error_Message', this.testInfo);
  }

  async validatePlateNumberInputVisible() {
    // Lightweight assertion used by smoke and accessibility flows after entering the transaction app.
    await expect(this.plateNumberInput).toBeVisible({ timeout: 20000 });
  }
}

module.exports = TransactionPage;
