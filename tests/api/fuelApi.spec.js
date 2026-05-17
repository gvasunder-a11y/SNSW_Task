const { test, expect } = require('@playwright/test');
const FuelApiClient = require('../../api/fuelApiClient');

// API tests validate the lower-level NSW Fuel API integration separately from UI flows.
// Keeping this coverage outside UI tests gives faster feedback and clearer failure causes.
test.describe('NSW Fuel API Automation', () => {
  let fuelApiClient;

  test.beforeEach(() => {
    // Create a fresh client so each test owns its request headers and generated metadata.
    fuelApiClient = new FuelApiClient();
  });

  test('GET request validation - Get Access Token', async () => {
    // Confirms OAuth client credential setup is valid and returns a usable bearer token.
    const accessToken = await fuelApiClient.getAccessToken();

    expect(accessToken).toBeTruthy();
    expect(typeof accessToken).toBe('string');
    expect(accessToken.length).toBeGreaterThan(10);
  });

  test('Request with query parameters - Get Reference Data', async () => {
    // Uses the token from the auth API to call the reference-data endpoint.
    // The response is persisted by the client as an execution artifact for review.
    const accessToken = await fuelApiClient.getAccessToken();
    const response = await fuelApiClient.getReferenceData(accessToken);

    console.log(JSON.stringify(response, null, 2));

    expect(response).toBeTruthy();
    expect(typeof response).toBe('object');
    expect(Object.keys(response).length).toBeGreaterThan(0);
  });

  test('Validate transaction ID generation', async () => {
    // Header metadata check: NSW API requests require a six-digit transaction identifier.
    const transactionId = fuelApiClient.generateTransactionId();

    expect(transactionId).toBeTruthy();
    expect(transactionId).toHaveLength(6);
    expect(Number.isNaN(Number(transactionId))).toBe(false);
  });

  test('Validate current timestamp generation', async () => {
    // Header metadata check: timestamp should be produced in the expected date/time shape.
    const timestamp = fuelApiClient.getCurrentTimestamp();

    expect(timestamp).toBeTruthy();
    expect(typeof timestamp).toBe('string');
    expect(timestamp).toContain('/');
    expect(timestamp).toContain(':');
  });
});
